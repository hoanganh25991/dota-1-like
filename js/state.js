/**
 * Game State Management
 * Crimson Lane - DotA 1 style MOBA
 * 
 * This module provides the global state object G and entity registries.
 * All game data is stored in G and accessed through this module.
 */

import { HERO_BASE_STATS, ATTR_MULTIPLIERS, TEAM_NAMES } from './constants.js';

// ============================================================================
// Entity Types & Interfaces
// ============================================================================

/**
 * @typedef {Object} Entity
 * @property {string} id - Unique entity identifier
 * @property {string} type - Entity type (hero, creep, tower, item, etc.)
 * @property {string} team - Team affiliation ('sentinel' | 'scourge')
 * @property {Vector3} position - World position
 * @property {number} hp - Current health points
 * @property {number} maxHp - Maximum health points
 * @property {boolean} isDead - Whether entity is dead
 */

/**
 * @typedef {Object} Hero
 * @property {string} id - Unique identifier
 * @property {string} type - 'hero'
 * @property {string} team - Team affiliation
 * @property {Vector3} position - Current position
 * @property {number} hp - Current HP
 * @property {number} maxHp - Max HP
 * @property {number} mana - Current mana
 * @property {number} maxMana - Max mana
 * @property {number} level - Hero level (1-25)
 * @property {number} xp - Current XP
 * @property {number} xpToNextLevel - XP needed for next level
 * @property {number} gold - Current gold
 * @property {number} strength - Strength attribute
 * @property {number} agility - Agility attribute
 * @property {number} intelligence - Intelligence attribute
 * @property {number} moveSpeed - Movement speed
 * @property {number} attackSpeed - Attack speed
 * @property {number} armor - Armor value
 * @property {number} magicResist - Magic resistance percentage
 * @property {Object} inventory - 6-slot inventory
 * @property {Object} skills - Q/W/E/R skills with levels
 * @property {string} currentAnim - Current animation state
 * @property {number} respawnTime - Time until respawn (0 if alive)
 * @property {Object} statusEffects - Active status effects
 */

/**
 * @typedef {Object} Creep
 * @property {string} id - Unique identifier
 * @property {string} type - 'creep'
 * @property {string} team - Team affiliation
 * @property {Vector3} position - Current position
 * @property {number} hp - Current HP
 * @property {number} maxHp - Max HP
 * @property {boolean} isMelee - Whether this is a melee creep
 * @property {Object} stats - Creep stats object
 * @property {string} lane - Lane assignment (top/mid/bot)
 * @property {number} waveIndex - Wave number (1-3)
 * @property {number} targetIndex - Target waypoint index
 * @property {number} attackCooldown - Attack cooldown timer
 * @property {string} targetId - Current target entity ID
 */

/**
 * @typedef {Object} Tower
 * @property {string} id - Unique identifier
 * @property {string} type - 'tower'
 * @property {string} team - Team affiliation
 * @property {Vector3} position - Position
 * @property {number} hp - Current HP
 * @property {number} maxHp - Max HP
 * @property {number} tier - Tower tier (1-4)
 * @property {string} lane - Lane assignment
 * @property {number} attackRange - Attack range
 * @property {number} damage - Damage per attack
 * @property {boolean} isActive - Whether tower is active
 */

/**
 * @typedef {Object} Barracks
 * @property {string} id - Unique identifier
 * @property {string} type - 'barracks'
 * @property {string} team - Team affiliation
 * @property {Vector3} position - Position
 * @property {number} hp - Current HP
 * @property {number} maxHp - Max HP
 * @property {string} lane - Lane assignment
 * @property {boolean} isDestroyed - Whether barracks is destroyed
 */

/**
 * @typedef {Object} Ancient
 * @property {string} id - Unique identifier
 * @property {string} type - 'ancient'
 * @property {string} team - Team affiliation
 * @property {Vector3} position - Position
 * @property {number} hp - Current HP
 * @property {number} maxHp - Max HP
 * @property {boolean} isDestroyed - Whether ancient is destroyed
 */

/**
 * @typedef {Object} Item
 * @property {string} id - Unique identifier
 * @property {string} type - 'item'
 * @property {string} team - Team affiliation
 * @property {Vector3} position - Ground position (for dropped items)
 * @property {string} itemId - Item definition ID
 * @property {number} stackSize - Stack size (for consumables)
 */

// ============================================================================
// Global State Object G
// ============================================================================

/**
 * Global Game State
 * This is the single source of truth for all game data.
 */
export const G = {
    // ============================================================================
    // Game Session State
    // ============================================================================
    
    /**
     * Current game phase
     * @type {'waiting' | 'playing' | 'end'}
     */
    phase: 'waiting',
    
    /**
     * Match state
     * @type {'lobby' | 'hero_select' | 'playing' | 'ended'}
     */
    matchState: 'lobby',
    
    /**
     * Is game initialized
     * @type {boolean}
     */
    initialized: false,
    
    /**
     * Has game started
     * @type {boolean}
     */
    hasStarted: false,
    
    /**
     * Is game paused
     * @type {boolean}
     */
    isPaused: false,
    
    // ============================================================================
    // Player Configuration
    // ============================================================================
    
    /**
     * Player's team side
     * @type {'sentinel' | 'scourge'}
     */
    playerSide: 'sentinel',
    
    /**
     * Team size configuration
     * @type {1 | 3 | 5}
     */
    teamSize: 5,
    
    /**
     * Is player online (for multiplayer)
     * @type {boolean}
     */
    playerOnline: false,
    
    // ============================================================================
    // Time & Match Data
    // ============================================================================
    
    /**
     * Match time in seconds
     * @type {number}
     */
    matchTime: 0,
    
    /**
     * Last update timestamp
     * @type {number}
     */
    lastTick: 0,
    
    /**
     * Game tick counter
     * @type {number}
     */
    tickCount: 0,
    
    /**
     * Time since last state update
     * @type {number}
     */
    deltaTime: 0,
    
    /**
     * Day/Night cycle progress (0 to 1)
     * @type {number}
     */
    dayNightProgress: 0,
    
    /**
     * Is currently day
     * @type {boolean}
     */
    isDay: true,
    
    /**
     * Current vision range based on time
     * @type {number}
     */
    currentVision: 1800,
    
    // ============================================================================
    // Entity Registries
    // ============================================================================
    
    /**
     * All heroes registered in the game
     * @type {Map<string, Hero>}
     */
    heroes: new Map(),
    
    /**
     * All creeps registered in the game
     * @type {Map<string, Creep>}
     */
    creeps: new Map(),
    
    /**
     * All towers registered in the game
     * @type {Map<string, Tower>}
     */
    towers: new Map(),
    
    /**
     * All barracks registered in the game
     * @type {Map<string, Barracks>}
     */
    barracks: new Map(),
    
    /**
     * All ancients registered in the game
     * @type {Map<string, Ancient>}
     */
    ancients: new Map(),
    
    /**
     * All items on the ground
     * @type {Map<string, Item>}
     */
    items: new Map(),
    
    /**
     * All projectiles in flight
     * @type {Map<string, Object>}
     */
    projectiles: new Map(),
    
    // ============================================================================
    // Game-Specific Lists
    // ============================================================================
    
    /**
     * Heroes that have spawned
     * @type {string[]}
     */
    heroesSpawned: [],
    
    /**
     * Heroes that have died (for respawn tracking)
     * @type {Map<string, number>}
     */
    deadHeroes: new Map(),
    
    /**
     * Lane creep spawn timers
     * @type {Map<string, number>}
     */
    laneSpawnTimers: new Map(),
    
    /**
     * Active status effects on entities
     * @type {Map<string, Object[]>}
     */
    statusEffects: new Map(),
    
    // ============================================================================
    // Teams & Roster
    // ============================================================================
    
    /**
     * Sentinel team roster
     * @type {string[]}
     */
    sentinelRoster: [],
    
    /**
     * Scourge team roster
     * @type {string[]}
     */
    scourgeRoster: [],
    
    /**
     * Team hero counts
     * @type {Object}
     */
    teamCounts: {
        sentinel: 0,
        scourge: 0
    },
    
    // ============================================================================
    // Match Statistics
    // ============================================================================
    
    /**
     * Match stats
     * @type {Object}
     */
    stats: {
        kills: 0,
        deaths: 0,
        assists: 0,
        gold: 0,
        xp: 0,
        lastHitGold: 0,
        denyGold: 0,
        towerKills: 0,
        barrackKills: 0,
        ancientKills: 0
    },
    
    /**
     * Kill tracking (for streaks)
     * @type {Object}
     */
    killTracking: {
        playerKills: 0,
        playerDeaths: 0,
        killStreak: 0,
        lastKillTime: 0
    },
    
    // ============================================================================
    // UI & HUD State
    // ============================================================================
    
    /**
     * Selected target for attack/cast
     * @type {string | null}
     */
    selectedTarget: null,
    
    /**
     * Target position for ground skills
     * @type {Vector3 | null}
     */
    targetPosition: null,
    
    /**
     * Is in targeting mode
     * @type {boolean}
     */
    isTargeting: false,
    
    /**
     * Shop state
     * @type {Object}
     */
    shopState: {
        isOpen: false,
        selectedCategory: null,
        selectedItemId: null
    },
    
    // ============================================================================
    // AI & Bot State
    // ============================================================================
    
    /**
     * Bot difficulty preset
     * @type {'easy' | 'normal' | 'hard'}
     */
    botDifficulty: 'normal',
    
    /**
     * AI bot roster
     * @type {string[]}
     */
    aiBots: [],
    
    // ============================================================================
    // Multiplayer (future)
    // ============================================================================
    
    /**
     * Is multiplayer game
     * @type {boolean}
     */
    isMultiplayer: false,
    
    /**
     * Network peer ID
     * @type {string | null}
     */
    peerId: null,
    
    /**
     * Host peer ID (for multiplayer)
     * @type {string | null}
     */
    hostPeerId: null,
    
    // ============================================================================
    // Camera State
    // ============================================================================
    
    /**
     * Camera target entity ID
     * @type {string | null}
     */
    cameraTarget: null,
    
    /**
     * Is camera following player
     * @type {boolean}
     */
    cameraFollowPlayer: true,
    
    /**
     * Camera offset
     * @type {Vector3}
     */
    cameraOffset: { x: 0, y: 0, z: 0 },
    
    // ============================================================================
    // Event Queue
    // ============================================================================
    
    /**
     * Game events to process
     * @type {Object[]}
     */
    eventQueue: [],
    
    /**
     * Last processed event ID
     * @type {number}
     */
    lastEventId: 0,
    
    // ============================================================================
    // Input State
    // ============================================================================
    
    /**
     * Input commands buffer
     * @type {Object[]}
     */
    inputBuffer: [],
    
    /**
     * Is joystick active
     * @type {boolean}
     */
    joystickActive: false,
    
    /**
     * Joystick vector
     * @type {Object}
     */
    joystickVector: { x: 0, y: 0 },
    
    // ============================================================================
    // Game Settings
    // ============================================================================
    
    /**
     * Settings
     * @type {Object}
     */
    settings: {
        masterVolume: 80,
        musicVolume: 50,
        sfxVolume: 100,
        fullscreen: true,
        language: 'en',
        mouseSensitivity: 1.0,
        cameraDistance: 15,
        cameraHeight: 10
    },
    
    // ============================================================================
    // Utility Methods
    // ============================================================================
    
    /**
     * Get current time in seconds
     * @returns {number}
     */
    now: function() {
        return Date.now() / 1000;
    },
    
    /**
     * Get elapsed time since last tick
     * @returns {number}
     */
    getElapsed: function() {
        const now = this.now();
        if (this.lastTick === 0) {
            this.lastTick = now;
            return 0;
        }
        const elapsed = now - this.lastTick;
        this.lastTick = now;
        return elapsed;
    },
    
    /**
     * Check if a team is Sentinel
     * @param {string} team
     * @returns {boolean}
     */
    isSentinel: function(team) {
        return team === 'sentinel';
    },
    
    /**
     * Check if a team is Scourge
     * @param {string} team
     * @returns {boolean}
     */
    isScourge: function(team) {
        return team === 'scourge';
    },
    
    /**
     * Get team color
     * @param {string} team
     * @returns {number}
     */
    getTeamColor: function(team) {
        return team === 'sentinel' ? 0x1a8a1a : 0x8a1a1a;
    },
    
    /**
     * Get team name
     * @param {string} team
     * @returns {string}
     */
    getTeamName: function(team) {
        return TEAM_NAMES[team] || 'Unknown';
    },
    
    /**
     * Add entity to registry
     * @param {string} type
     * @param {Entity} entity
     */
    addEntity: function(type, entity) {
        const registry = this[type];
        if (registry && registry.set) {
            registry.set(entity.id, entity);
        }
    },
    
    /**
     * Remove entity from registry
     * @param {string} type
     * @param {string} entityId
     */
    removeEntity: function(type, entityId) {
        const registry = this[type];
        if (registry && registry.delete) {
            registry.delete(entityId);
        }
    },
    
    /**
     * Get entity by ID
     * @param {string} type
     * @param {string} entityId
     * @returns {Entity | undefined}
     */
    getEntity: function(type, entityId) {
        const registry = this[type];
        if (registry && registry.get) {
            return registry.get(entityId);
        }
        return undefined;
    },
    
    /**
     * Check if game is in progress
     * @returns {boolean}
     */
    isPlaying: function() {
        return this.phase === 'playing' && this.matchState === 'playing';
    },
    
    /**
     * Check if game has ended
     * @returns {boolean}
     */
    isEnded: function() {
        return this.phase === 'end' || this.matchState === 'ended';
    },
    
    /**
     * Calculate derived hero stats
     * @param {Object} baseStats
     * @param {number} level
     * @returns {Object}
     */
    calculateHeroStats: function(baseStats, level) {
        // Base stats + level progression
        const hp = HERO_BASE_STATS.hp + (level - 1) * 100;
        const mana = HERO_BASE_STATS.mana + (level - 1) * 50;
        const hpRegen = HERO_BASE_STATS.hpRegen + (level - 1) * 0.1;
        const manaRegen = HERO_BASE_STATS.manaRegen + (level - 1) * 0.05;
        const damageMin = HERO_BASE_STATS.damageMin + (level - 1) * 3;
        const damageMax = HERO_BASE_STATS.damageMax + (level - 1) * 3;
        const armor = HERO_BASE_STATS.armor + (level - 1) * 0.3;
        const moveSpeed = HERO_BASE_STATS.moveSpeed;
        
        return {
            hp,
            maxHp: hp,
            mana,
            maxMana: mana,
            hpRegen,
            manaRegen,
            damageMin,
            damageMax,
            armor,
            moveSpeed,
            attackSpeed: HERO_BASE_STATS.attackSpeed,
            attackRange: HERO_BASE_STATS.attackRange,
            viewDistance: VISION.day,
            magicResist: HERO_BASE_STATS.magicResist,
            statusResist: HERO_BASE_STATS.statusResist
        };
    }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get global state reference
 * @returns {Object} Global state object
 */
export function getState() {
    return G;
}

/**
 * Reset game state
 */
export function resetState() {
    G.phase = 'waiting';
    G.matchState = 'lobby';
    G.initialized = false;
    G.hasStarted = false;
    G.isPaused = false;
    G.matchTime = 0;
    G.lastTick = 0;
    G.tickCount = 0;
    G.heroesSpawned = [];
    G.deadHeroes.clear();
    G.laneSpawnTimers.clear();
    G.statusEffects.clear();
    G.heroes.clear();
    G.creeps.clear();
    G.towers.clear();
    G.barracks.clear();
    G.ancients.clear();
    G.items.clear();
    G.projectiles.clear();
    G.sentinelRoster = [];
    G.scourgeRoster = [];
    G.teamCounts = { sentinel: 0, scourge: 0 };
    G.stats = {
        kills: 0,
        deaths: 0,
        assists: 0,
        gold: 0,
        xp: 0,
        lastHitGold: 0,
        denyGold: 0,
        towerKills: 0,
        barrackKills: 0,
        ancientKills: 0
    };
    G.killTracking = {
        playerKills: 0,
        playerDeaths: 0,
        killStreak: 0,
        lastKillTime: 0
    };
    G.selectedTarget = null;
    G.targetPosition = null;
    G.isTargeting = false;
    G.shopState = { isOpen: false, selectedCategory: null, selectedItemId: null };
    G.eventQueue = [];
    G.lastEventId = 0;
    G.inputBuffer = [];
    G.joystickActive = false;
    G.joystickVector = { x: 0, y: 0 };
}

/**
 * Initialize state for a new match
 * @param {Object} options
 */
export function initGameState(options = {}) {
    resetState();
    
    // Apply options
    if (options.playerSide) G.playerSide = options.playerSide;
    if (options.teamSize) G.teamSize = options.teamSize;
    if (options.botDifficulty) G.botDifficulty = options.botDifficulty;
    
    // Set initial time
    G.matchTime = 0;
    G.dayNightProgress = 0;
    G.isDay = true;
    G.currentVision = VISION.day;
    
    // Initialize lane spawn timers
    ['top', 'mid', 'bot'].forEach(lane => {
        G.laneSpawnTimers.set(lane, 0);
    });
    
    G.initialized = true;
    G.matchState = 'hero_select';
}

// ============================================================================
// Export
// ============================================================================

export default G;
