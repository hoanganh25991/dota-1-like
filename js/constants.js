/**
 * Game Constants & Formulas
 * Crimson Lane - DotA 1 style MOBA
 * 
 * This module contains all game numbers, formulas, timings, and static data.
 * All constants are exported for use across the game.
 */

// ============================================================================
// Map & World Constants
// ============================================================================

/**
 * World dimensions in world units
 */
export const WORLD_WIDTH = 100;
export const WORLD_HEIGHT = 100;

/**
 * Map center
 */
export const MAP_CENTER = {
    x: WORLD_WIDTH / 2,
    y: 0,
    z: WORLD_HEIGHT / 2
};

/**
 * Base positions (Dota 1 orientation: bottom-left = Scourge, top-right = Sentinel)
 */
export const BASE_POSITIONS = {
    sentinel: { x: 85, z: 85, name: 'Sentinel Base' },
    scourge: { x: 15, z: 15, name: 'Scourge Base' }
};

/**
 * Fountain positions (HP/mana regen)
 */
export const FOUNTAIN_POSITIONS = {
    sentinel: { x: 82, z: 82 },
    scourge: { x: 18, z: 18 }
};

// ============================================================================
// Team Constants
// ============================================================================

/**
 * Team colors
 */
export const SENTINEL_COLOR = 0x1a8a1a;  // Sentinel Green
export const SCOURGE_COLOR = 0x8a1a1a;   // Scourge Red

/**
 * Team names
 */
export const TEAM_NAMES = {
    sentinel: 'Sentinel',
    scourge: 'Scourge'
};

/**
 * Team prefixes for entity naming
 */
export const TEAM_PREFIXES = {
    sentinel: 'sent_',
    scourge: 'scourge_'
};

// ============================================================================
// Time & Cycle Constants
// ============================================================================

/**
 * Day/Night cycle duration (seconds)
 * 5 minutes day + 5 minutes night = 10 minutes total cycle
 */
export const DAY_NIGHT_CYCLE = 300;  // 5 minutes in seconds

/**
 * Full cycle duration
 */
export const FULL_CYCLE_DURATION = DAY_NIGHT_CYCLE * 2;  // 10 minutes

/**
 * Match duration limits (seconds)
 */
export const MAX_MATCH_TIME = 3600;  // 60 minutes
export const MIN_MATCH_TIME = 300;   // 5 minutes

// ============================================================================
// Vision Constants
// ============================================================================

/**
 * Default hero vision ranges (world units)
 */
export const VISION = {
    day: 1800,    // Day vision
    night: 800,   // Night vision
    base: 1200    // Base vision (intermediate)
};

/**
 * Vision Multiplier for night
 */
export const NIGHT_VISION_MULTIPLIER = VISION.night / VISION.day;  // ~0.44

/**
 * Structure vision ranges
 */
export const STRUCTURE_VISION = {
    tower: 1200,
    barracks: 800,
    ancient: 1000
};

/**
 * Creep vision range
 */
export const CREEP_VISION = 400;

// ============================================================================
// Combat Formulas
// ============================================================================

/**
 * Damage multiplier formula (armor reduction)
 * PhysicalDamageTaken = damage * 100 / (100 + armor * 6)
 */
export function getDamageMultiplier(armor) {
    return 100 / (100 + armor * 6);
}

/**
 * Apply armor to damage
 */
export function applyArmor(damage, armor) {
    const multiplier = getDamageMultiplier(armor);
    return damage * multiplier;
}

/**
 * Respawn time formula
 * RespawnTime = 5 + level * 2 (seconds)
 */
export function getRespawnTime(level) {
    return 5 + level * 2;
}

/**
 * XP radius for nearby heroes
 */
export const XP_RADIUS = 1000;  // world units

/**
 * XP denial radius (enemies close enough to get reduced XP)
 */
export const DENY_XP_RADIUS = 800;

/**
 * XP reduction on deny (50%)
 */
export const DENY_XP_MULTIPLIER = 0.5;

/**
 * Gold on deny (0)
 */
export const DENY_GOLD_MULTIPLIER = 0;

// ============================================================================
// Creep Stats
// ============================================================================

/**
 * Creep spawn interval (seconds)
 */
export const CREEP_SPAWN_INTERVAL = 30;

/**
 * Base creep stats (per wave: 3 melee + 1 ranged)
 */
export const CREEP_STATS = {
    melee: {
        hp: 500,
        mana: 0,
        damage: 28,
        armor: 0,
        moveSpeed: 280,
        attackRange: 150,
        attackTime: 1.7,
        viewDistance: CREEP_VISION,
        goldBounty: 18,
        xpValue: 48
    },
    ranged: {
        hp: 380,
        mana: 0,
        damage: 24,
        armor: 0,
        moveSpeed: 280,
        attackRange: 400,
        attackTime: 1.7,
        viewDistance: CREEP_VISION,
        goldBounty: 15,
        xpValue: 44
    }
};

/**
 * Mega creep stats (after barracks destroyed)
 */
export const MEGA_CREEP_STATS = {
    melee: {
        hp: 1000,
        mana: 0,
        damage: 56,
        armor: 2,
        moveSpeed: 290,
        attackRange: 150,
        attackTime: 1.7,
        goldBounty: 36,
        xpValue: 96
    },
    ranged: {
        hp: 760,
        mana: 0,
        damage: 48,
        armor: 2,
        moveSpeed: 290,
        attackRange: 400,
        attackTime: 1.7,
        goldBounty: 30,
        xpValue: 88
    }
};

// ============================================================================
// Tower Stats
// ============================================================================

/**
 * Tower tier definitions
 */
export const TOWER_TIERS = {
    t1: { name: 'Tier 1', range: 500, damage: 130, hp: 1800, regen: 1.5 },
    t2: { name: 'Tier 2', range: 550, damage: 160, hp: 2200, regen: 1.8 },
    t3: { name: 'Tier 3', range: 600, damage: 190, hp: 2600, regen: 2.1 },
    base: { name: 'Base Tower', range: 650, damage: 220, hp: 3000, regen: 2.4 }
};

/**
 * Tower costs (for reference)
 */
export const TOWER_COSTS = {
    t1: 700,
    t2: 1000,
    t3: 1400,
    base: 1800
};

// ============================================================================
// Barracks Stats
// ============================================================================

export const BARRACKS_STATS = {
    hp: 1500,
    regen: 1.0,
    goldReward: 100,
    xpReward: 150
};

// ============================================================================
// Ancient Stats
// ============================================================================

export const ANCIENT_STATS = {
    sentinel: {
        hp: 2500,
        regen: 2.0,
        damage: 100,
        armor: 10,
        range: 400,
        goldReward: 0,
        xpReward: 0
    },
    scourge: {
        hp: 2500,
        regen: 2.0,
        damage: 100,
        armor: 10,
        range: 400,
        goldReward: 0,
        xpReward: 0
    }
};

// ============================================================================
// Hero Base Stats
// ============================================================================

/**
 * Base hero attributes
 */
export const HERO_BASE_STATS = {
    hp: 500,
    mana: 200,
    hpRegen: 1.5,
    manaRegen: 0.8,
    strength: 20,
    agility: 15,
    intelligence: 15,
    moveSpeed: 300,
    attackSpeed: 100,
    attackTime: 1.7,
    attackRange: 150,
    damageMin: 45,
    damageMax: 55,
    armor: 2,
    vision: VISION.day,
    magicResist: 25,
    statusResist: 20
};

/**
 * Attribute multipliers
 */
export const ATTR_MULTIPLIERS = {
    hpPerStrength: 20,
    hpRegenPerStrength: 0.05,
    manaPerIntelligence: 12,
    manaRegenPerIntelligence: 0.04,
    armorPerAgility: 0.15,
    attackSpeedPerAgility: 1,
    damagePerStrength: 1,
    damagePerAgility: 1
};

// ============================================================================
// Skill System Constants
// ============================================================================

/**
 * Skill slot names
 */
export const SKILL_SLOTS = ['Q', 'W', 'E', 'R'];

/**
 * Skill types
 */
export const SKILL_TYPES = {
    active: 'Active',
    passive: 'Passive',
    toggle: 'Toggle',
    channel: 'Channel'
};

/**
 * Cast range categories (world units)
 */
export const CAST_RANGES = {
    global: Infinity,
    self: 0,
    selfRadius: 0,
    melee: 150,
    short: 400,
    medium: 700,
    long: 1200,
    veryLong: 2000
};

/**
 * Target types
 */
export const TARGET_TYPES = {
    self: 'self',
    unit: 'unit',
    ground: 'ground',
    enemyUnit: 'enemy-unit',
    allyUnit: 'ally-unit',
    enemyUnitOrGround: 'enemy-unit-or-ground',
    groundOrAllyUnit: 'ground-or-ally-unit'
};

/**
 * Damage types
 */
export const DAMAGE_TYPES = {
    physical: 'physical',
    magical: 'magical',
    pure: 'pure'
};

/**
 * Status effect types
 */
export const STATUS_TYPES = {
    stun: 'stun',
    slow: 'slow',
    silence: 'silence',
    knockback: 'knockback',
    disarm: 'disarm',
    root: 'root',
    invulnerability: 'invulnerability',
    blindness: 'blindness'
};

// ============================================================================
// Item System Constants
// ============================================================================

/**
 * Inventory slots
 */
export const INVENTORY_SLOTS = 6;

/**
 * Item categories
 */
export const ITEM_CATEGORIES = {
    consumable: 'Consumable',
    attributes: 'Attributes',
    defense: 'Defense',
    mobility: 'Mobility',
    magic: 'Magic',
    upgrades: 'Upgrades'
};

/**
 * Shop category mapping
 */
export const SHOP_CATEGORIES = {
    movement: 'Mobility',
    mana: 'Magic',
    health: 'Attributes',
    damage: 'Attributes',
    defense: 'Defense',
    upgrade: 'Upgrades',
    consumable: 'Consumable'
};

// ============================================================================
// Combat System Constants
// ============================================================================

/**
 * Attack constants
 */
export const ATTACK = {
    baseSpeed: 1.7,  // base attack time in seconds
    minSpeed: 0.5,   // minimum attack time (max speed)
    maxSpeed: 5.0,   // maximum attack time (min speed)
    projectileSpeed: 800,  // world units per second
    hitBuffer: 4,    // buffer for melee hit detection
    windUp: 0.3,     // attack wind-up time
    recovery: 0.2    // attack recovery time
};

/**
 * projectile travel constants
 */
export const PROJECTILE = {
    speed: 800,
    gravity: 0,
    lifetime: 5.0  // seconds
};

/**
 *Death animation duration (seconds)
 */
export const DEATH_ANIMATION_DURATION = 3.0;

// ============================================================================
// Lane Constants
// ============================================================================

/**
 * Lane definitions
 */
export const LANES = {
    top: {
        name: 'Top Lane',
        startPos: { x: 85, z: 40 },
        endPos: { x: 15, z: 60 },
        waypoints: [
            { x: 85, z: 40 },  // Sentinel T3
            { x: 70, z: 45 },
            { x: 50, z: 50 },
            { x: 30, z: 55 },
            { x: 15, z: 60 }   // Scourge T3
        ]
    },
    mid: {
        name: 'Mid Lane',
        startPos: { x: 85, z: 50 },
        endPos: { x: 15, z: 50 },
        waypoints: [
            { x: 85, z: 50 },  // Sentinel T3
            { x: 70, z: 50 },
            { x: 50, z: 50 },  // River crossing
            { x: 30, z: 50 },
            { x: 15, z: 50 }   // Scourge T3
        ]
    },
    bot: {
        name: 'Bottom Lane',
        startPos: { x: 85, z: 60 },
        endPos: { x: 15, z: 40 },
        waypoints: [
            { x: 85, z: 60 },  // Sentinel T3
            { x: 70, z: 55 },
            { x: 50, z: 50 },
            { x: 30, z: 45 },
            { x: 15, z: 40 }   // Scourge T3
        ]
    }
};

/**
 * Lane tower positions (from base outward)
 */
export const LANE_TOWERS = ['t3', 't2', 't1'];  // inner to outer

// ============================================================================
// Jungle Constants
// ============================================================================

/**
 * Jungle camp positions
 */
export const JUNGLE_CAMP_POSITIONS = [
    { x: 50, z: 20, tier: 1 },  // Neutral camp 1
    { x: 80, z: 50, tier: 1 },  // Neutral camp 2
    { x: 50, z: 80, tier: 1 },  // Neutral camp 3
    { x: 20, z: 50, tier: 2 },  // Neutral camp 4
    { x: 70, z: 70, tier: 2 },  // Neutral camp 5
    { x: 30, z: 30, tier: 3 }   // Neutral camp 6
];

/**
 * Jungle camp respawn time (seconds)
 */
export const JUNGLE_RESPAWN_TIME = 60;

/**
 * Jungle camp XP rewards
 */
export const JUNGLE_XP_REWARDS = {
    tier1: 100,
    tier2: 150,
    tier3: 250
};

/**
 * Jungle camp gold rewards
 */
export const JUNGLE_GOLD_REWARDS = {
    tier1: 50,
    tier2: 80,
    tier3: 120
};

// ============================================================================
// AI Constants
// ============================================================================

/**
 * AI behavior states
 */
export const AI_STATES = {
    idle: 'idle',
    move: 'move',
    attack: 'attack',
    retreat: 'retreat',
    cast: 'cast',
    farm: 'farm',
    push: 'push',
    defend: 'defend',
    buy: 'buy',
    recall: 'recall',
    respawn: 'respawn'
};

/**
 * AI retreat thresholds (HP percentage)
 */
export const AI_RETREAT_THRESHOLDS = {
    easy: 0.3,
    normal: 0.25,
    hard: 0.2
};

/**
 * AI skill casting thresholds (mana percentage)
 */
export const AI_MANA_THRESHOLD = 0.3;

/**
 * AI farm zones
 */
export const FARM_ZONES = ['jungle', 'lane', 'rune'];

// ============================================================================
// Network Constants (for future multiplayer)
// ============================================================================

/**
 * State snapshot interval (seconds)
 */
export const STATE_SNAPSHOT_INTERVAL = 0.1;

/**
 * Command input buffer size
 */
export const INPUT_BUFFER_SIZE = 10;

/**
 * Latency compensation (seconds)
 */
export const LATENCY_COMPENSATION = 0.2;

// ============================================================================
// Export all constants
// ============================================================================

export default {
    // Map & World
    WORLD_WIDTH,
    WORLD_HEIGHT,
    MAP_CENTER,
    BASE_POSITIONS,
    FOUNTAIN_POSITIONS,
    
    // Teams
    SENTINEL_COLOR,
    SCOURGE_COLOR,
    TEAM_NAMES,
    TEAM_PREFIXES,
    
    // Time & Cycle
    DAY_NIGHT_CYCLE,
    FULL_CYCLE_DURATION,
    MAX_MATCH_TIME,
    MIN_MATCH_TIME,
    
    // Vision
    VISION,
    NIGHT_VISION_MULTIPLIER,
    STRUCTURE_VISION,
    CREEP_VISION,
    
    // Combat Formulas
    getDamageMultiplier,
    applyArmor,
    getRespawnTime,
    XP_RADIUS,
    DENY_XP_RADIUS,
    DENY_XP_MULTIPLIER,
    DENY_GOLD_MULTIPLIER,
    
    // Creep Stats
    CREEP_SPAWN_INTERVAL,
    CREEP_STATS,
    MEGA_CREEP_STATS,
    
    // Tower Stats
    TOWER_TIERS,
    TOWER_COSTS,
    
    // Barracks Stats
    BARRACKS_STATS,
    
    // Ancient Stats
    ANCIENT_STATS,
    
    // Hero Base Stats
    HERO_BASE_STATS,
    ATTR_MULTIPLIERS,
    
    // Skill System
    SKILL_SLOTS,
    SKILL_TYPES,
    CAST_RANGES,
    TARGET_TYPES,
    DAMAGE_TYPES,
    STATUS_TYPES,
    
    // Item System
    INVENTORY_SLOTS,
    ITEM_CATEGORIES,
    SHOP_CATEGORIES,
    
    // Combat System
    ATTACK,
    PROJECTILE,
    DEATH_ANIMATION_DURATION,
    
    // Lane Constants
    LANES,
    LANE_TOWERS,
    
    // Jungle Constants
    JUNGLE_CAMP_POSITIONS,
    JUNGLE_RESPAWN_TIME,
    JUNGLE_XP_REWARDS,
    JUNGLE_GOLD_REWARDS,
    
    // AI Constants
    AI_STATES,
    AI_RETREAT_THRESHOLDS,
    AI_MANA_THRESHOLD,
    FARM_ZONES,
    
    // Network Constants
    STATE_SNAPSHOT_INTERVAL,
    INPUT_BUFFER_SIZE,
    LATENCY_COMPENSATION
};
