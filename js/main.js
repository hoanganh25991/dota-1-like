/**
 * Main Game Entry Point
 * Crimson Lane - DotA 1 style MOBA
 * 
 * This module contains:
 * - Game loop with requestAnimationFrame
 * - State machine: waiting → playing → end
 * - Menu flow: showScreen() helper
 * - Entry point wiring
 * - _appReady() function to hide loading screen
 */

import { G, initGameState, getState } from './state.js';
import { WORLD_WIDTH, WORLD_HEIGHT, TEAM_NAMES } from './constants.js';

// ============================================================================
// Module References (will be imported dynamically)
// ============================================================================

let sceneManager = null;
let hudManager = null;
let inputManager = null;
let audioManager = null;
let heroManager = null;
let creepManager = null;
let towerManager = null;
let gameManager = null;

// ============================================================================
// Screen Management
// ============================================================================

/**
 * Show a specific screen by ID
 * @param {string} screenId
 */
export function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show requested screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
    
    console.log(`[Screen] Showing: ${screenId}`);
}

/**
 * Show the main menu
 */
export function showMainMenu() {
    showScreen('main-menu');
    G.matchState = 'lobby';
}

/**
 * Show the play flow (side selection)
 */
export function showPlayFlow() {
    showScreen('play-flow');
    document.getElementById('play-step-1').style.display = 'block';
    document.getElementById('play-step-2').style.display = 'none';
    document.getElementById('play-lobby').style.display = 'none';
    
    // Reset selection
    document.querySelectorAll('.opt-btn[data-side]').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    G.matchState = 'hero_select';
}

/**
 * Show settings screen
 */
export function showSettings() {
    showScreen('settings-screen');
    
    // Switch to Hero Viewer tab by default
    switchSettingsTab('hero-viewer');
    
    G.matchState = 'settings';
}

/**
 * Show game HUD
 */
export function showGameHUD() {
    showScreen('game-hud');
    G.matchState = 'playing';
}

/**
 * Show end screen
 * @param {boolean} isVictory
 */
export function showEndScreen(isVictory) {
    showScreen('end-screen');
    G.matchState = 'ended';
    G.phase = 'end';
    
    const titleEl = document.getElementById('end-title');
    titleEl.className = `end-title ${isVictory ? 'end-victory' : 'end-defeat'}`;
    titleEl.textContent = isVictory ? 'VICTORY' : 'DEFEAT';
    
    const scoreEl = document.getElementById('end-score');
    scoreEl.textContent = `Score: ${G.stats.kills}-${G.stats.deaths} | Duration: ${formatTime(G.matchTime)}`;
    
    console.log(`[End Screen] ${isVictory ? 'Victory' : 'Defeat'}!`);
}

/**
 * Format time as mm:ss
 * @param {number} seconds
 * @returns {string}
 */
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ============================================================================
// Settings Tab Management
// ============================================================================

/**
 * Switch settings tab
 * @param {string} tabId
 */
export function switchSettingsTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.settings-tabs .tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    
    // Update content panes
    document.querySelectorAll('.settings-pane').forEach(pane => {
        pane.style.display = 'none';
    });
    
    // Show requested pane
    if (tabId === 'hero-viewer') {
        document.getElementById('hero-viewer-panel').style.display = 'block';
        
        // Load hero viewer if not already loaded
        if (!window.heroViewerLoaded) {
            window.heroViewerLoaded = true;
            import('./hero-viewer.js').then(module => {
                if (module.initHeroViewer) {
                    module.initHeroViewer();
                }
            });
        }
    } else if (tabId === 'general') {
        document.getElementById('general-panel').style.display = 'block';
    } else if (tabId === 'audio') {
        document.getElementById('audio-panel').style.display = 'block';
    }
}

// ============================================================================
// Game Flow Functions
// ============================================================================

/**
 * Start the game with given configuration
 * @param {Object} config
 */
export function startGame(config = {}) {
    console.log('[Game] Starting new match...');
    
    // Initialize game state
    initGameState({
        playerSide: config.playerSide || G.playerSide,
        teamSize: config.teamSize || G.teamSize
    });
    
    // Start the game loop
    requestAnimationFrame(gameLoop);
    
    // Show game screen
    showGameHUD();
    
    // Initialize managers
    initManagers();
    
    // Spawn initial entities
    spawnInitialEntities();
    
    // Start match timer
    G.lastTick = G.now();
}

/**
 * Initialize game managers
 */
function initManagers() {
    // Import and initialize managers
    import('./scene.js').then(module => {
        sceneManager = module;
        if (module.initScene) module.initScene();
        console.log('[Game] Scene manager initialized');
    });
    
    import('./hud.js').then(module => {
        hudManager = module;
        if (module.initHUD) module.initHUD();
        console.log('[Game] HUD manager initialized');
    });
    
    import('./controls.js').then(module => {
        inputManager = module;
        if (module.initControls) module.initControls();
        console.log('[Game] Controls initialized');
    });
    
    import('./audio.js').then(module => {
        audioManager = module;
        if (module.initAudio) module.initAudio();
        console.log('[Game] Audio manager initialized');
    });
    
    import('./heroes.js').then(module => {
        heroManager = module;
        if (module.initHeroes) module.initHeroes();
        console.log('[Game] Hero manager initialized');
    });
    
    import('./creeps.js').then(module => {
        creepManager = module;
        if (module.initCreeps) module.initCreeps();
        console.log('[Game] Creep manager initialized');
    });
    
    import('./towers.js').then(module => {
        towerManager = module;
        if (module.initTowers) module.initTowers();
        console.log('[Game] Tower manager initialized');
    });
    
    import('./game.js').then(module => {
        gameManager = module;
        if (module.initGame) module.initGame();
        console.log('[Game] Game manager initialized');
    });
}

/**
 * Spawn initial game entities
 */
function spawnInitialEntities() {
    console.log('[Game] Spawning initial entities...');
    
    // Spawn player hero
    const playerTeam = G.playerSide;
    const enemyTeam = playerTeam === 'sentinel' ? 'scourge' : 'sentinel';
    
    // Get player hero ID (default: Lich)
    const playerHeroId = 'lich';
    spawnHero(playerHeroId, playerTeam, true);
    
    // Spawn AI heroes
    const aiHeroId = enemyTeam === 'sentinel' ? 'lich' : 'sniper';
    spawnHero(aiHeroId, enemyTeam, false);
    
    // Spawn creeps
    spawnLaneCreeps();
    
    // Spawn towers
    spawnTowers();
    
    // Spawn barracks
    spawnBarracks();
    
    // Spawn ancients
    spawnAncients();
    
    console.log('[Game] Entities spawned');
}

/**
 * Spawn a hero at base
 * @param {string} heroId
 * @param {string} team
 * @param {boolean} isPlayer
 */
function spawnHero(heroId, team, isPlayer) {
    const basePos = G.playerSide === 'sentinel' 
        ? { x: 85, z: 85 } 
        : { x: 15, z: 15 };
    
    if (team === 'sentinel') {
        basePos.x = 85;
        basePos.z = 85;
    } else {
        basePos.x = 15;
        basePos.z = 15;
    }
    
    const heroData = {
        id: `${team}_${heroId}`,
        type: 'hero',
        team: team,
        heroId: heroId,
        position: { x: basePos.x, y: 0, z: basePos.z },
        hp: 500,
        maxHp: 500,
        mana: 200,
        maxMana: 200,
        level: 1,
        xp: 0,
        xpToNextLevel: 200,
        gold: 500,
        isPlayer: isPlayer,
        isDead: false,
        respawnTime: 0,
        currentAnim: 'idle'
    };
    
    G.heroes.set(heroData.id, heroData);
    G.heroesSpawned.push(heroData.id);
    
    if (isPlayer) {
        G.cameraTarget = heroData.id;
    }
    
    console.log(`[Game] Spawned hero: ${heroData.id} (${team})`);
}

/**
 * Spawn lane creeps
 */
function spawnLaneCreeps() {
    ['top', 'mid', 'bot'].forEach(lane => {
        const laneCreeps = [
            { type: 'melee', position: { x: 80, z: lane === 'top' ? 40 : lane === 'mid' ? 50 : 60 } },
            { type: 'melee', position: { x: 80, z: lane === 'top' ? 40 : lane === 'mid' ? 50 : 60 } },
            { type: 'melee', position: { x: 80, z: lane === 'top' ? 40 : lane === 'mid' ? 50 : 60 } },
            { type: 'ranged', position: { x: 80, z: lane === 'top' ? 40 : lane === 'mid' ? 50 : 60 } }
        ];
        
        laneCreeps.forEach((creepData, index) => {
            const creepId = `sent_${lane}_${index}`;
            const creepDataFull = {
                id: creepId,
                type: 'creep',
                team: 'sentinel',
                lane: lane,
                waveIndex: 1,
                position: { ...creepData.position, y: 0 },
                hp: 500,
                maxHp: 500,
                isMelee: creepData.type === 'melee',
                attackCooldown: 0,
                targetId: null
            };
            G.creeps.set(creepId, creepDataFull);
        });
        
        // Enemy creeps
        laneCreeps.forEach((creepData, index) => {
            const creepId = `scourge_${lane}_${index}`;
            const creepDataFull = {
                id: creepId,
                type: 'creep',
                team: 'scourge',
                lane: lane,
                waveIndex: 1,
                position: { 
                    x: 15 + (70 * (index / 4)), 
                    y: 0, 
                    z: lane === 'top' ? 60 : lane === 'mid' ? 50 : 40 
                },
                hp: 500,
                maxHp: 500,
                isMelee: creepData.type === 'melee',
                attackCooldown: 0,
                targetId: null
            };
            G.creeps.set(creepId, creepDataFull);
        });
    });
    
    console.log('[Game] Lane creeps spawned');
}

/**
 * Spawn towers
 */
function spawnTowers() {
    ['top', 'mid', 'bot'].forEach(lane => {
        // Sentinel towers
        for (let tier = 1; tier <= 3; tier++) {
            const towerId = `sent_${lane}_t${tier}`;
            const towerData = {
                id: towerId,
                type: 'tower',
                team: 'sentinel',
                lane: lane,
                tier: tier,
                hp: 1800 + (tier - 1) * 400,
                maxHp: 1800 + (tier - 1) * 400,
                attackRange: 500 + (tier - 1) * 100,
                damage: 130 + (tier - 1) * 30,
                isActive: true,
                position: { x: 75 - (tier - 1) * 10, y: 0, z: lane === 'top' ? 40 : lane === 'mid' ? 50 : 60 }
            };
            G.towers.set(towerId, towerData);
        }
        
        // Scourge towers
        for (let tier = 1; tier <= 3; tier++) {
            const towerId = `scourge_${lane}_t${tier}`;
            const towerData = {
                id: towerId,
                type: 'tower',
                team: 'scourge',
                lane: lane,
                tier: tier,
                hp: 1800 + (tier - 1) * 400,
                maxHp: 1800 + (tier - 1) * 400,
                attackRange: 500 + (tier - 1) * 100,
                damage: 130 + (tier - 1) * 30,
                isActive: true,
                position: { x: 25 + (tier - 1) * 10, y: 0, z: lane === 'top' ? 60 : lane === 'mid' ? 50 : 40 }
            };
            G.towers.set(towerId, towerData);
        }
    });
    
    console.log('[Game] Towers spawned');
}

/**
 * Spawn barracks
 */
function spawnBarracks() {
    ['top', 'mid', 'bot'].forEach(lane => {
        // Sentinel barracks
        const barracksId = `sent_${lane}_barracks`;
        const barracksData = {
            id: barracksId,
            type: 'barracks',
            team: 'sentinel',
            lane: lane,
            hp: 1500,
            maxHp: 1500,
            isDestroyed: false,
            position: { x: 65, y: 0, z: lane === 'top' ? 40 : lane === 'mid' ? 50 : 60 }
        };
        G.barracks.set(barracksId, barracksData);
        
        // Scourge barracks
        const barracksId2 = `scourge_${lane}_barracks`;
        const barracksData2 = {
            id: barracksId2,
            type: 'barracks',
            team: 'scourge',
            lane: lane,
            hp: 1500,
            maxHp: 1500,
            isDestroyed: false,
            position: { x: 35, y: 0, z: lane === 'top' ? 60 : lane === 'mid' ? 50 : 40 }
        };
        G.barracks.set(barracksId2, barracksData2);
    });
    
    console.log('[Game] Barracks spawned');
}

/**
 * Spawn ancients
 */
function spawnAncients() {
    // Sentinel ancient
    const sentinelAncient = {
        id: 'sentinel_ancient',
        type: 'ancient',
        team: 'sentinel',
        hp: 2500,
        maxHp: 2500,
        isDestroyed: false,
        position: { x: 82, y: 0, z: 82 }
    };
    G.ancients.set(sentinelAncient.id, sentinelAncient);
    
    // Scourge ancient
    const scourgeAncient = {
        id: 'scourge_ancient',
        type: 'ancient',
        team: 'scourge',
        hp: 2500,
        maxHp: 2500,
        isDestroyed: false,
        position: { x: 18, y: 0, z: 18 }
    };
    G.ancients.set(scourgeAncient.id, scourgeAncient);
    
    console.log('[Game] Ancients spawned');
}

// ============================================================================
// Game Loop
// ============================================================================

/**
 * Game loop - runs every frame
 * @param {number} timestamp - Current timestamp
 */
function gameLoop(timestamp) {
    if (!G.hasStarted) {
        G.hasStarted = true;
    }
    
    // Calculate delta time
    const now = G.now();
    G.deltaTime = now - G.lastTick;
    G.lastTick = now;
    
    // Update match time
    G.matchTime += G.deltaTime;
    
    // Update day/night cycle
    updateDayNightCycle();
    
    // Update entities
    updateEntities();
    
    // Update HUD
    if (hudManager && hudManager.updateHUD) {
        hudManager.updateHUD();
    }
    
    // Check match end
    checkMatchEnd();
    
    // Request next frame
    if (G.phase === 'playing') {
        requestAnimationFrame(gameLoop);
    }
}

/**
 * Update day/night cycle
 */
function updateDayNightCycle() {
    const cycleProgress = (G.matchTime % (DAY_NIGHT_CYCLE * 2)) / (DAY_NIGHT_CYCLE * 2);
    G.dayNightProgress = cycleProgress;
    
    G.isDay = cycleProgress < 0.5;
    G.currentVision = G.isDay ? VISION.day : VISION.night;
}

/**
 * Update all entities
 */
function updateEntities() {
    // Update heroes
    G.heroes.forEach(hero => {
        if (!hero.isDead) {
            // TODO: Update hero position, animation, etc.
        }
    });
    
    // Update creeps
    G.creeps.forEach(creep => {
        // TODO: Update creep movement, combat, etc.
    });
    
    // Update towers
    G.towers.forEach(tower => {
        if (tower.isActive && !tower.isDead) {
            // TODO: Tower auto-attack logic
        }
    });
    
    // Update projectiles
    G.projectiles.forEach(projectile => {
        // TODO: Update projectile movement
    });
}

/**
 * Check if match has ended
 */
function checkMatchEnd() {
    const sentinelAncient = G.ancients.get('sentinel_ancient');
    const scourgeAncient = G.ancients.get('scourge_ancient');
    
    if (sentinelAncient && sentinelAncient.isDestroyed) {
        endMatch(false);
    } else if (scourgeAncient && scourgeAncient.isDestroyed) {
        endMatch(true);
    }
}

/**
 * End the match
 * @param {boolean} isVictory
 */
function endMatch(isVictory) {
    G.phase = 'end';
    showEndScreen(isVictory);
    
    if (isVictory) {
        console.log('[Game] Match ended - Victory!');
    } else {
        console.log('[Game] Match ended - Defeat!');
    }
}

// ============================================================================
// Menu Event Handlers
// ============================================================================

/**
 * Initialize menu event handlers
 */
export function initMenuHandlers() {
    // Main menu buttons
    document.getElementById('menu-play-btn').addEventListener('click', () => {
        showPlayFlow();
    });
    
    document.getElementById('menu-settings-btn').addEventListener('click', () => {
        showSettings();
    });
    
    // Play flow buttons
    document.getElementById('play-back-btn').addEventListener('click', () => {
        showMainMenu();
    });
    
    document.getElementById('play-2-back-btn').addEventListener('click', () => {
        showPlayFlow();
    });
    
    document.getElementById('lobby-back-btn').addEventListener('click', () => {
        showPlayFlow();
    });
    
    document.getElementById('lobby-start-btn').addEventListener('click', () => {
        const playerSide = document.querySelector('.opt-btn[data-side].selected')?.dataset.side || 'sentinel';
        const teamSize = parseInt(document.querySelector('.opt-btn[data-mode].selected')?.dataset.mode || '5');
        
        startGame({ playerSide, teamSize });
    });
    
    // Side selection
    document.querySelectorAll('.opt-btn[data-side]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.opt-btn[data-side]').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            document.getElementById('play-continue-btn').disabled = false;
            G.playerSide = btn.dataset.side;
        });
    });
    
    // Team size selection
    document.querySelectorAll('.opt-btn[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.opt-btn[data-mode]').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            document.getElementById('play-2-continue-btn').disabled = false;
            G.teamSize = parseInt(btn.dataset.mode);
        });
    });
    
    // Continue buttons
    document.getElementById('play-continue-btn').addEventListener('click', () => {
        if (G.playerSide) {
            document.getElementById('play-step-1').style.display = 'none';
            document.getElementById('play-step-2').style.display = 'block';
        }
    });
    
    document.getElementById('play-2-continue-btn').addEventListener('click', () => {
        if (G.teamSize) {
            document.getElementById('play-step-2').style.display = 'none';
            document.getElementById('play-lobby').style.display = 'block';
            
            // Update lobby info
            document.getElementById('lobby-side').textContent = TEAM_NAMES[G.playerSide];
            document.getElementById('lobby-size').textContent = `${G.teamSize} vs ${G.teamSize}`;
            
            // Populate heroes
            const heroes = ['Lich', 'Sniper', 'Dragon Knight', 'Shadow Fiend', 'Windrunner'];
            document.getElementById('lobby-heroes').textContent = heroes.slice(0, G.teamSize).join(', ');
        }
    });
    
    // Settings buttons
    document.getElementById('settings-back-btn').addEventListener('click', () => {
        showMainMenu();
    });
    
    // Settings tabs
    document.querySelectorAll('.settings-tabs .tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchSettingsTab(tab.dataset.tab);
        });
    });
    
    // Hero viewer back button
    const hvBackBtn = document.getElementById('hv-back-btn');
    if (hvBackBtn) {
        hvBackBtn.addEventListener('click', () => {
            document.getElementById('hero-viewer-panel').style.display = 'none';
            document.getElementById('general-panel').style.display = 'block';
            document.querySelectorAll('.settings-tabs .tab').forEach(t => {
                t.classList.remove('active');
            });
            document.getElementById('general-panel').previousElementSibling.querySelector('.tab[data-tab="general"]').classList.add('active');
        });
    }
    
    // End screen buttons
    document.getElementById('end-restart-btn').addEventListener('click', () => {
        showMainMenu();
    });
}

// ============================================================================
// App Ready Function
// ============================================================================

/**
 * Called when app is fully ready
 * Hides loading screen and shows main menu
 */
export function _appReady() {
    console.log('[App] App ready - loading screen hidden');
    
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
    
    // Initialize menu handlers
    initMenuHandlers();
    
    // Show main menu
    showMainMenu();
}

// ============================================================================
// Export
// ============================================================================

export default {
    showScreen,
    showMainMenu,
    showPlayFlow,
    showSettings,
    showGameHUD,
    showEndScreen,
    switchSettingsTab,
    startGame,
    gameLoop,
    initMenuHandlers,
    _appReady,
    G
};
