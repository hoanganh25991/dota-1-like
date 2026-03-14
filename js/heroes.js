/**
 * Hero Registry System
 * Crimson Lane - DotA 1 style MOBA
 * 
 * This module provides:
 * - HERO_REGISTRY array with all 20 heroes
 * - buildHero(heroId, team, position) function
 * - spawnHero(heroId, team, position) with default lane positions
 * - getHeroTemplate(heroId) to retrieve hero definition
 * - createHeroEntity(heroTemplate, team, position) for entity creation
 */

import { Hero, ANIMATION_STATES, HERO_STATES } from './_template.js';
import { G } from './state.js';
import { BASE_POSITIONS, TEAM_NAMES, TEAM_PREFIXES } from './constants.js';

// ============================================================================
// Hero Data Registry - All 20 Heroes
// ============================================================================

/**
 * Registry of all hero definitions
 * Each hero has: id, name, type (STR/AGI/INT), team, role
 */
export const HERO_REGISTRY = [
    // Original 5 heroes (MVP)
    {
        id: 'lich',
        name: 'Lich',
        type: 'INT',
        team: 'scourge',
        role: 'Ranged Physical',
        baseStats: {
            hp: 454,
            hpPerLevel: 19,
            mana: 403,
            manaPerLevel: 26,
            armor: 1.1,
            attackRange: 600,
            moveSpeed: 295,
            attackSpeed: 100,
            str: 15,
            agi: 15,
            int: 22,
            strPerLevel: 1.75,
            agiPerLevel: 1.5,
            intPerLevel: 3.0,
            damageMin: 49,
            damageMax: 55
        }
    },
    {
        id: 'sniper',
        name: 'Sniper',
        type: 'AGI',
        team: 'sentinel',
        role: 'Ranged Physical',
        baseStats: {
            hp: 492,
            hpPerLevel: 19,
            mana: 195,
            manaPerLevel: 13,
            armor: 2.08,
            attackRange: 550,
            moveSpeed: 290,
            attackSpeed: 100,
            str: 15,
            agi: 21,
            int: 16,
            strPerLevel: 1.7,
            agiPerLevel: 2.9,
            intPerLevel: 1.5,
            damageMin: 38,
            damageMax: 44
        }
    },
    {
        id: 'dragonKnight',
        name: 'Dragon Knight',
        type: 'STR',
        team: 'sentinel',
        role: 'Melee Physical',
        baseStats: {
            hp: 520,
            hpPerLevel: 25,
            mana: 250,
            manaPerLevel: 20,
            armor: 4.0,
            attackRange: 150,
            moveSpeed: 300,
            attackSpeed: 100,
            str: 22,
            agi: 14,
            int: 16,
            strPerLevel: 2.5,
            agiPerLevel: 1.5,
            intPerLevel: 1.5,
            damageMin: 50,
            damageMax: 60
        }
    },
    {
        id: 'shadowFiend',
        name: 'Shadow Fiend',
        type: 'AGI',
        team: 'scourge',
        role: 'Ranged Physical',
        baseStats: {
            hp: 480,
            hpPerLevel: 18,
            mana: 240,
            manaPerLevel: 18,
            armor: 1.5,
            attackRange: 150,
            moveSpeed: 305,
            attackSpeed: 100,
            str: 16,
            agi: 24,
            int: 15,
            strPerLevel: 1.8,
            agiPerLevel: 2.7,
            intPerLevel: 1.3,
            damageMin: 45,
            damageMax: 55
        }
    },
    {
        id: 'windrunner',
        name: 'Windrunner',
        type: 'AGI',
        team: 'sentinel',
        role: 'Ranged Physical',
        baseStats: {
            hp: 485,
            hpPerLevel: 18,
            mana: 320,
            manaPerLevel: 18,
            armor: 1.0,
            attackRange: 600,
            moveSpeed: 310,
            attackSpeed: 100,
            str: 15,
            agi: 20,
            int: 17,
            strPerLevel: 1.6,
            agiPerLevel: 2.8,
            intPerLevel: 1.6,
            damageMin: 42,
            damageMax: 52
        }
    },
    
    // Heroes 6-20 (Expandable)
    {
        id: 'axe',
        name: 'Axe',
        type: 'STR',
        team: 'scourge',
        role: 'Melee Physical',
        baseStats: {
            hp: 520,
            hpPerLevel: 25,
            mana: 275,
            manaPerLevel: 18,
            armor: 4.5,
            attackRange: 150,
            moveSpeed: 290,
            attackSpeed: 100,
            str: 21,
            agi: 16,
            int: 14,
            strPerLevel: 2.6,
            agiPerLevel: 1.6,
            intPerLevel: 1.3,
            damageMin: 52,
            damageMax: 62
        }
    },
    {
        id: 'pudge',
        name: 'Pudge',
        type: 'STR',
        team: 'scourge',
        role: 'Melee Disabler',
        baseStats: {
            hp: 530,
            hpPerLevel: 25,
            mana: 275,
            manaPerLevel: 18,
            armor: 4.0,
            attackRange: 150,
            moveSpeed: 285,
            attackSpeed: 100,
            str: 22,
            agi: 10,
            int: 16,
            strPerLevel: 2.6,
            agiPerLevel: 1.1,
            intPerLevel: 1.7,
            damageMin: 53,
            damageMax: 63
        }
    },
    {
        id: 'sven',
        name: 'Sven',
        type: 'STR',
        team: 'sentinel',
        role: 'Melee Physical',
        baseStats: {
            hp: 520,
            hpPerLevel: 25,
            mana: 300,
            manaPerLevel: 18,
            armor: 3.0,
            attackRange: 150,
            moveSpeed: 300,
            attackSpeed: 100,
            str: 22,
            agi: 16,
            int: 15,
            strPerLevel: 2.6,
            agiPerLevel: 1.6,
            intPerLevel: 1.3,
            damageMin: 52,
            damageMax: 62
        }
    },
    {
        id: 'tidehunter',
        name: 'Tidehunter',
        type: 'STR',
        team: 'scourge',
        role: 'Melee Initiator',
        baseStats: {
            hp: 530,
            hpPerLevel: 25,
            mana: 350,
            manaPerLevel: 18,
            armor: 5.0,
            attackRange: 150,
            moveSpeed: 285,
            attackSpeed: 100,
            str: 22,
            agi: 10,
            int: 16,
            strPerLevel: 2.6,
            agiPerLevel: 1.1,
            intPerLevel: 1.7,
            damageMin: 53,
            damageMax: 63
        }
    },
    {
        id: 'earthshaker',
        name: 'Earthshaker',
        type: 'STR',
        team: 'sentinel',
        role: 'Melee Initiator',
        baseStats: {
            hp: 520,
            hpPerLevel: 25,
            mana: 350,
            manaPerLevel: 18,
            armor: 4.0,
            attackRange: 150,
            moveSpeed: 290,
            attackSpeed: 100,
            str: 22,
            agi: 10,
            int: 16,
            strPerLevel: 2.6,
            agiPerLevel: 1.1,
            intPerLevel: 1.7,
            damageMin: 53,
            damageMax: 63
        }
    },
    {
        id: 'phantomAssassin',
        name: 'Phantom Assassin',
        type: 'AGI',
        team: 'scourge',
        role: 'Melee Physical',
        baseStats: {
            hp: 500,
            hpPerLevel: 18,
            mana: 240,
            manaPerLevel: 18,
            armor: 2.0,
            attackRange: 150,
            moveSpeed: 300,
            attackSpeed: 100,
            str: 16,
            agi: 22,
            int: 15,
            strPerLevel: 1.8,
            agiPerLevel: 2.7,
            intPerLevel: 1.3,
            damageMin: 45,
            damageMax: 55
        }
    },
    {
        id: 'juggernaut',
        name: 'Juggernaut',
        type: 'AGI',
        team: 'sentinel',
        role: 'Melee Physical',
        baseStats: {
            hp: 520,
            hpPerLevel: 25,
            mana: 240,
            manaPerLevel: 18,
            armor: 2.0,
            attackRange: 150,
            moveSpeed: 295,
            attackSpeed: 100,
            str: 18,
            agi: 18,
            int: 14,
            strPerLevel: 2.0,
            agiPerLevel: 2.2,
            intPerLevel: 1.3,
            damageMin: 48,
            damageMax: 58
        }
    },
    {
        id: 'drowRanger',
        name: 'Drow Ranger',
        type: 'AGI',
        team: 'sentinel',
        role: 'Ranged Physical',
        baseStats: {
            hp: 460,
            hpPerLevel: 18,
            mana: 240,
            manaPerLevel: 18,
            armor: 2.0,
            attackRange: 600,
            moveSpeed: 305,
            attackSpeed: 100,
            str: 15,
            agi: 20,
            int: 15,
            strPerLevel: 1.6,
            agiPerLevel: 2.8,
            intPerLevel: 1.3,
            damageMin: 42,
            damageMax: 52
        }
    },
    {
        id: 'bountyHunter',
        name: 'Bounty Hunter',
        type: 'AGI',
        team: 'scourge',
        role: 'Melee Physical',
        baseStats: {
            hp: 480,
            hpPerLevel: 18,
            mana: 200,
            manaPerLevel: 18,
            armor: 2.0,
            attackRange: 150,
            moveSpeed: 310,
            attackSpeed: 100,
            str: 16,
            agi: 22,
            int: 14,
            strPerLevel: 1.8,
            agiPerLevel: 2.7,
            intPerLevel: 1.3,
            damageMin: 45,
            damageMax: 55
        }
    },
    {
        id: 'vengefulSpirit',
        name: 'Vengeful Spirit',
        type: 'AGI',
        team: 'scourge',
        role: 'Melee Physical',
        baseStats: {
            hp: 480,
            hpPerLevel: 18,
            mana: 240,
            manaPerLevel: 18,
            armor: 1.0,
            attackRange: 150,
            moveSpeed: 300,
            attackSpeed: 100,
            str: 16,
            agi: 20,
            int: 15,
            strPerLevel: 1.8,
            agiPerLevel: 2.8,
            intPerLevel: 1.3,
            damageMin: 45,
            damageMax: 55
        }
    },
    {
        id: 'crystalMaiden',
        name: 'Crystal Maiden',
        type: 'INT',
        team: 'sentinel',
        role: 'Ranged Magical',
        baseStats: {
            hp: 380,
            hpPerLevel: 18,
            mana: 300,
            manaPerLevel: 20,
            armor: 0.0,
            attackRange: 600,
            moveSpeed: 285,
            attackSpeed: 100,
            str: 14,
            agi: 14,
            int: 22,
            strPerLevel: 1.6,
            agiPerLevel: 1.4,
            intPerLevel: 3.0,
            damageMin: 38,
            damageMax: 48
        }
    },
    {
        id: 'zeus',
        name: 'Zeus',
        type: 'INT',
        team: 'sentinel',
        role: 'Ranged Magical',
        baseStats: {
            hp: 380,
            hpPerLevel: 18,
            mana: 350,
            manaPerLevel: 20,
            armor: 0.0,
            attackRange: 600,
            moveSpeed: 285,
            attackSpeed: 100,
            str: 14,
            agi: 14,
            int: 25,
            strPerLevel: 1.6,
            agiPerLevel: 1.4,
            intPerLevel: 3.0,
            damageMin: 40,
            damageMax: 50
        }
    },
    {
        id: 'lina',
        name: 'Lina',
        type: 'INT',
        team: 'sentinel',
        role: 'Ranged Magical',
        baseStats: {
            hp: 400,
            hpPerLevel: 18,
            mana: 300,
            manaPerLevel: 20,
            armor: 0.0,
            attackRange: 600,
            moveSpeed: 295,
            attackSpeed: 100,
            str: 15,
            agi: 14,
            int: 22,
            strPerLevel: 1.6,
            agiPerLevel: 1.4,
            intPerLevel: 3.0,
            damageMin: 40,
            damageMax: 50
        }
    },
    {
        id: 'lion',
        name: 'Lion',
        type: 'INT',
        team: 'sentinel',
        role: 'Ranged Magical',
        baseStats: {
            hp: 380,
            hpPerLevel: 18,
            mana: 300,
            manaPerLevel: 20,
            armor: 0.0,
            attackRange: 600,
            moveSpeed: 285,
            attackSpeed: 100,
            str: 14,
            agi: 14,
            int: 22,
            strPerLevel: 1.6,
            agiPerLevel: 1.4,
            intPerLevel: 3.0,
            damageMin: 38,
            damageMax: 48
        }
    },
    {
        id: 'enigma',
        name: 'Enigma',
        type: 'INT',
        team: 'scourge',
        role: 'Ranged Magical',
        baseStats: {
            hp: 420,
            hpPerLevel: 18,
            mana: 320,
            manaPerLevel: 20,
            armor: 1.0,
            attackRange: 600,
            moveSpeed: 285,
            attackSpeed: 100,
            str: 16,
            agi: 14,
            int: 22,
            strPerLevel: 1.8,
            agiPerLevel: 1.4,
            intPerLevel: 3.0,
            damageMin: 40,
            damageMax: 50
        }
    }
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get hero template by ID
 * @param {string} heroId - Hero ID (e.g., 'lich', 'sniper')
 * @returns {Object | undefined} Hero template or undefined
 */
export function getHeroTemplate(heroId) {
    return HERO_REGISTRY.find(hero => hero.id === heroId);
}

/**
 * Build a hero object from template
 * @param {string} heroId - Hero ID
 * @param {string} team - Team affiliation ('sentinel' | 'scourge')
 * @param {Vector3} position - Initial position
 * @param {number} level - Starting level
 * @returns {Hero} Built hero instance
 */
export function buildHero(heroId, team, position, level = 1) {
    const template = getHeroTemplate(heroId);
    if (!template) {
        console.error(`[Hero Registry] Hero template not found: ${heroId}`);
        return null;
    }
    
    // Override team from template if provided
    const hero = new Hero({
        heroId: template.id,
        team: team,
        position: position,
        level: level
    });
    
    return hero;
}

/**
 * Spawn a hero with default lane position
 * @param {string} heroId - Hero ID
 * @param {string} team - Team affiliation ('sentinel' | 'scourge')
 * @param {string} lane - Lane assignment ('top' | 'mid' | 'bot')
 * @param {number} level - Starting level
 * @returns {Hero | null} Spawned hero instance or null
 */
export function spawnHero(heroId, team, lane, level = 1) {
    const lanePositions = {
        top: { x: 70, z: lane === 'top' ? 45 : lane === 'mid' ? 50 : 55 },
        mid: { x: 50, z: 50 },
        bot: { x: 70, z: lane === 'top' ? 55 : lane === 'mid' ? 50 : 45 }
    };
    
    const lanePos = lanePositions[lane] || lanePositions.mid;
    const position = { ...lanePos, y: 0.15 };
    
    return buildHero(heroId, team, position, level);
}

/**
 * Create hero entity from template for registry
 * @param {Object} heroTemplate - Hero template from registry
 * @param {string} team - Team affiliation
 * @param {Vector3} position - Initial position
 * @returns {Object} Entity ready for G.heroes registry
 */
export function createHeroEntity(heroTemplate, team, position) {
    if (!heroTemplate) {
        console.error('[Hero Registry] Invalid hero template');
        return null;
    }
    
    const entityId = `${TEAM_PREFIXES[team]}${heroTemplate.id}`;
    const baseStats = heroTemplate.baseStats;
    
    // Calculate starting stats based on level 1
    const level = 1;
    const hp = baseStats.hp;
    const mana = baseStats.mana;
    
    return {
        id: entityId,
        heroId: heroTemplate.id,
        name: heroTemplate.name,
        type: 'hero',
        team: team,
        position: { ...position, y: 0.15 },
        hp: hp,
        maxHp: hp,
        mana: mana,
        maxMana: mana,
        level: level,
        xp: 0,
        xpToNextLevel: 200,
        gold: 500,
        isDead: false,
        respawnTime: 0,
        currentAnim: ANIMATION_STATES.IDLE,
        state: HERO_STATES.ALIVE,
        
        // Base attributes
        strength: baseStats.str,
        agility: baseStats.agi,
        intelligence: baseStats.int,
        
        // Derived stats
        armor: baseStats.armor,
        attackSpeed: baseStats.attackSpeed,
        moveSpeed: baseStats.moveSpeed,
        attackRange: baseStats.attackRange,
        viewDistance: 1800,
        
        // Combat
        damageMin: baseStats.damageMin,
        damageMax: baseStats.damageMax,
        
        // Status effects
        statusEffects: new Map(),
        
        // Entity references
        mesh: null,
        group: null,
        light: null
    };
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize hero registry system
 */
export function initHeroes() {
    console.log('[Hero Registry] Initialized with', HERO_REGISTRY.length, 'heroes');
    
    // Log all heroes
    HERO_REGISTRY.forEach(hero => {
        console.log(`  - ${hero.name} (${hero.id}): ${hero.type} - ${hero.role}`);
    });
}

// ============================================================================
// Export
// ============================================================================

export default {
    HERO_REGISTRY,
    getHeroTemplate,
    buildHero,
    spawnHero,
    createHeroEntity,
    initHeroes,
    
    // Re-export constants
    ANIMATION_STATES,
    HERO_STATES
};
