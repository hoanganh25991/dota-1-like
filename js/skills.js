/**
 * Ability/Skill System
 * Crimson Lane - DotA 1 style MOBA
 * 
 * This module provides:
 * - Skill type system (Active, Passive, Toggle, Channel)
 * - Cast modes (Quick cast, Aim cast, Double-tap smart cast)
 * - Range validation for attacks and skills
 * - Target validation (enemy/ally/ground)
 * - Cast pipeline with mana/cooldown management
 * - Status effect application (stun, slow, silence, knockback)
 * - Garena-style mobile UX patterns
 * - Hero skill learning and progression
 */

import { G } from './state.js';
import { 
    CAST_RANGES, 
    TARGET_TYPES, 
    DAMAGE_TYPES, 
    STATUS_TYPES,
    SKILL_SLOTS,
    SKILL_TYPES
} from './constants.js';
import { getDistance } from './combat.js';

// ============================================================================
// Skill Type Definitions
// ============================================================================

/**
 * Skill state constants
 */
export const SKILL_STATES = {
    READY: 'ready',
    COOLDOWN: 'cooldown',
    LOW_MANA: 'low_mana',
    LEARNABLE: 'learnable',
    LEARNED: 'learned',
    LOCKED: 'locked',
    PASSIVE: 'passive',
    TOGGLE_ON: 'toggle_on',
    TOGGLE_OFF: 'toggle_off',
    CHANNELING: 'channeling'
};

/**
 * Skill event types for dispatch
 */
export const SKILL_EVENTS = {
    SKILL_LEARNED: 'skillLearned',
    SKILL_CAST_START: 'skillCastStart',
    SKILL_CAST_COMPLETE: 'skillCastComplete',
    SKILL_CAST_FAILED: 'skillCastFailed',
    TOGGLE_ACTIVATED: 'toggleActivated',
    TOGGLE_DEACTIVATED: 'toggleDeactivated',
    CHANNEL_STARTED: 'channelStarted',
    CHANNEL_INTERRUPTED: 'channelInterrupted'
};

// ============================================================================
// Range Validation System
// ============================================================================

/**
 * Check if hero is within cast range of target
 * @param {Object} hero - Caster hero
 * @param {Object|Vector3} target - Target unit or position
 * @param {number} castRange - Cast range in world units
 * @param {string} rangeType - Range type from CAST_RANGES
 * @returns {boolean} Whether target is in range
 */
export function isCastInRange(hero, target, castRange, rangeType = 'medium') {
    if (rangeType === CAST_RANGES.global || rangeType === 'global') {
        return true;  // Global skills have no range limit
    }
    
    if (rangeType === CAST_RANGES.self || rangeType === 'self' ||
        rangeType === CAST_RANGES.selfRadius || rangeType === 'self-radius') {
        return true;  // Self-target skills always in range
    }
    
    // Calculate actual distance
    let distance;
    if (target.position) {
        // Target is a unit
        distance = getDistance(hero.position, target.position);
    } else {
        // Target is a position
        distance = getDistance(hero.position, target);
    }
    
    // Clamp cast range for safety
    const clampedCastRange = Math.max(0, castRange || CAST_RANGES.medium);
    
    return distance <= clampedCastRange;
}

/**
 * Get cast range value from range type
 * @param {string} rangeType - Range type string
 * @returns {number} Cast range in world units
 */
export function getCastRangeValue(rangeType) {
    if (rangeType === 'global' || rangeType === CAST_RANGES.global) {
        return Infinity;
    }
    if (rangeType === 'self' || rangeType === CAST_RANGES.self) {
        return 0;
    }
    if (rangeType === 'self-radius' || rangeType === CAST_RANGES.selfRadius) {
        return 0;  // Uses effectRadius instead
    }
    if (rangeType === 'melee' || rangeType === CAST_RANGES.melee) {
        return CAST_RANGES.melee;
    }
    if (rangeType === 'short' || rangeType === CAST_RANGES.short) {
        return CAST_RANGES.short;
    }
    if (rangeType === 'medium' || rangeType === CAST_RANGES.medium) {
        return CAST_RANGES.medium;
    }
    if (rangeType === 'long' || rangeType === CAST_RANGES.long) {
        return CAST_RANGES.long;
    }
    if (rangeType === 'very-long' || rangeType === CAST_RANGES.veryLong) {
        return CAST_RANGES.veryLong;
    }
    return CAST_RANGES.medium;  // Default
}

/**
 * Validate attack range for basic attacks
 * @param {Object} hero - Attacking hero
 * @param {Object} target - Target unit
 * @param {number} hitBuffer - Additional buffer for hit detection
 * @returns {boolean} Whether target is in attack range
 */
export function isAttackInRange(hero, target, hitBuffer = 4) {
    if (!hero || !target || target.isDead) {
        return false;
    }
    
    const distance = getDistance(hero.position, target.position);
    const attackRange = hero.stats?.attackRange || hero.attackRange || 150;
    
    return distance <= attackRange + hitBuffer;
}

// ============================================================================
// Target Validation System
// ============================================================================

/**
 * Check if a target is valid for a skill
 * @param {Object} hero - Caster hero
 * @param {Object} target - Target unit
 * @param {string} targetRule - Target rule from skill definition
 * @returns {boolean} Whether target is valid
 */
export function isValidTarget(hero, target, targetRule) {
    if (!target) {
        return false;
    }
    
    switch (targetRule) {
        case TARGET_TYPES.self:
            return target.id === hero.id;
            
        case TARGET_TYPES.unit:
            return target.type === 'hero' || target.type === 'creep';
            
        case TARGET_TYPES.ground:
            return target.type === 'ground' || !target.type;
            
        case TARGET_TYPES.enemyUnit:
            return target.type === 'hero' && target.team !== hero.team;
            
        case TARGET_TYPES.allyUnit:
            return target.type === 'hero' && target.team === hero.team;
            
        case TARGET_TYPES.enemyUnitOrGround:
            return (target.type === 'hero' && target.team !== hero.team) || 
                   target.type === 'ground' || !target.type;
            
        case TARGET_TYPES.groundOrAllyUnit:
            return (target.type === 'hero' && target.team === hero.team) || 
                   target.type === 'ground' || !target.type;
                   
        default:
            return false;
    }
}

/**
 * Find nearest valid enemy hero within range
 * @param {Object} hero - Source hero
 * @param {number} range - Search range in world units
 * @returns {Object | null} Nearest enemy hero or null
 */
export function findNearestEnemyHero(hero, range = 500) {
    let nearest = null;
    let nearestDistance = Infinity;
    
    G.heroes.forEach(target => {
        if (target.team !== hero.team && !target.isDead) {
            const distance = getDistance(hero.position, target.position);
            if (distance <= range && distance < nearestDistance) {
                nearestDistance = distance;
                nearest = target;
            }
        }
    });
    
    return nearest;
}

/**
 * Find nearest valid creep within range (for auto-cast fallback)
 * @param {Object} hero - Source hero
 * @param {number} range - Search range in world units
 * @param {string} team - Team filter ('enemy' | 'ally' | null)
 * @returns {Object | null} Nearest creep or null
 */
export function findNearestCreep(hero, range = 500, team = null) {
    let nearest = null;
    let nearestDistance = Infinity;
    
    G.creeps.forEach(creep => {
        const teamMatch = team === null || 
                         team === 'enemy' && creep.team !== hero.team ||
                         team === 'ally' && creep.team === hero.team;
        
        if (teamMatch && !creep.isDead) {
            const distance = getDistance(hero.position, creep.position);
            if (distance <= range && distance < nearestDistance) {
                nearestDistance = distance;
                nearest = creep;
            }
        }
    });
    
    return nearest;
}

/**
 * Get all units in area of effect
 * @param {Object} centerPos - Center position
 * @param {number} radius - AOE radius in world units
 * @param {string} targetTeam - Target team filter ('enemy' | 'ally' | 'all')
 * @returns {Array} Array of units in AOE
 */
export function getUnitsInAOE(centerPos, radius, targetTeam = 'enemy') {
    const units = [];
    
    // Check heroes
    G.heroes.forEach(hero => {
        if (!hero.isDead) {
            const distance = getDistance(centerPos, hero.position);
            if (distance <= radius) {
                const teamMatch = targetTeam === 'all' ||
                                 (targetTeam === 'enemy' && hero.team !== G.playerHero?.team) ||
                                 (targetTeam === 'ally' && hero.team === G.playerHero?.team);
                if (teamMatch) {
                    units.push(hero);
                }
            }
        }
    });
    
    // Check creeps
    G.creeps.forEach(creep => {
        if (!creep.isDead) {
            const distance = getDistance(centerPos, creep.position);
            if (distance <= radius) {
                const teamMatch = targetTeam === 'all' ||
                                 (targetTeam === 'enemy' && creep.team !== G.playerHero?.team) ||
                                 (targetTeam === 'ally' && creep.team === G.playerHero?.team);
                if (teamMatch) {
                    units.push(creep);
                }
            }
        }
    });
    
    return units;
}

// ============================================================================
// Skill Cast Pipeline
// ============================================================================

/**
 * Skill cast result structure
 */
export const CAST_RESULT = {
    SUCCESS: 'success',
    FAIL_MANA: 'fail_mana',
    FAIL_COOLDOWN: 'fail_cooldown',
    FAIL_RANGE: 'fail_range',
    FAIL_TARGET: 'fail_target',
    FAIL_STATE: 'fail_state',
    FAIL_INVALID: 'fail_invalid'
};

/**
 * Cast a skill
 * @param {Object} hero - Caster hero
 * @param {Object} skill - Skill definition
 * @param {string} targetId - Target entity ID (optional)
 * @param {Vector3} targetPos - Target position (optional)
 * @param {string} castMode - Cast mode: 'quick' | 'aim' | 'double-tap'
 * @returns {Object} Cast result with success/failure status
 */
export function castSkill(hero, skill, targetId = null, targetPos = null, castMode = 'quick') {
    // Check hero state
    if (!hero || hero.state !== 'alive') {
        return { success: false, result: CAST_RESULT.FAIL_STATE };
    }
    
    // Check if skill exists
    const heroSkills = hero.skills || {};
    if (!heroSkills[skill.id] || !heroSkills[skill.id].learned) {
        return { success: false, result: CAST_RESULT.FAIL_INVALID };
    }
    
    // Get skill level (1-4 for most skills, 3 for ultimates)
    const skillLevel = heroSkills[skill.id].level || 1;
    
    // Check mana cost
    const manaCosts = skill.manaCostByLevel || [0];
    const manaCost = manaCosts[Math.min(skillLevel - 1, manaCosts.length - 1)];
    if (hero.mana < manaCost) {
        return { success: false, result: CAST_RESULT.FAIL_MANA };
    }
    
    // Check cooldown
    const cooldowns = skill.cooldownByLevel || [0];
    const cooldown = cooldowns[Math.min(skillLevel - 1, cooldowns.length - 1)];
    const now = Date.now();
    const cooldownEnd = hero.lastCastTime?.[skill.id] || 0;
    if (now < cooldownEnd) {
        return { success: false, result: CAST_RESULT.FAIL_COOLDOWN };
    }
    
    // Validate cast range (if not self-target or global)
    const castRange = getCastRangeValue(skill.castRange || 'medium');
    if (castRange !== Infinity) {
        let castRangeOK = false;
        
        if (skill.castRange === 0) {
            // Self-target skill
            castRangeOK = true;
        } else if (targetPos) {
            // Position target
            castRangeOK = isCastInRange(hero, targetPos, castRange);
        } else if (targetId) {
            // Unit target
            const target = G.heroes.get(targetId) || G.creeps.get(targetId);
            if (target) {
                castRangeOK = isCastInRange(hero, target, castRange);
            }
        }
        
        if (!castRangeOK) {
            return { success: false, result: CAST_RESULT.FAIL_RANGE };
        }
    }
    
    // Validate target rule (for unit-targeted skills)
    if (targetId && skill.targetRule && skill.targetRule !== TARGET_TYPES.ground) {
        const target = G.heroes.get(targetId) || G.creeps.get(targetId);
        if (!isValidTarget(hero, target, skill.targetRule)) {
            return { success: false, result: CAST_RESULT.FAIL_TARGET };
        }
    }
    
    // Apply cost and start cast
    hero.mana -= manaCost;
    hero.lastCastTime = hero.lastCastTime || {};
    hero.lastCastTime[skill.id] = now + (cooldown * 1000);
    
    // Set cast info for update loop
    hero.isCasting = true;
    hero.currentCast = {
        skill,
        skillLevel,
        targetId,
        targetPos,
        castMode,
        startTime: now,
        castComplete: false
    };
    
    // Dispatch cast start event
    if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent(SKILL_EVENTS.SKILL_CAST_START, {
            detail: { heroId: hero.heroId, skillId: skill.id, castMode }
        }));
    }
    
    return { 
        success: true, 
        result: CAST_RESULT.SUCCESS,
        manaCost,
        cooldown
    };
}

/**
 * End a skill cast (called after animation/completion)
 * @param {Object} hero - Caster hero
 * @returns {boolean} Whether cast ended successfully
 */
export function endSkillCast(hero) {
    if (!hero || !hero.isCasting || !hero.currentCast) {
        return false;
    }
    
    const castInfo = hero.currentCast;
    const skill = castInfo.skill;
    const skillLevel = castInfo.skillLevel;
    
    // Apply skill effects
    applySkillEffect(hero, skill, skillLevel, castInfo.targetId, castInfo.targetPos);
    
    // Dispatch cast complete event
    if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent(SKILL_EVENTS.SKILL_CAST_COMPLETE, {
            detail: { heroId: hero.heroId, skillId: skill.id }
        }));
    }
    
    // Reset cast state
    hero.isCasting = false;
    hero.currentCast = null;
    
    return true;
}

/**
 * Interrupt a skill cast (for stun, silence, etc.)
 * @param {Object} hero - Caster hero
 * @param {string} reason - Interruption reason
 * @returns {boolean} Whether cast was interrupted
 */
export function interruptSkillCast(hero, reason = 'stun') {
    if (!hero || !hero.isCasting || !hero.currentCast) {
        return false;
    }
    
    const castInfo = hero.currentCast;
    
    // Restore mana if cast hasn't consumed it yet
    // (For channel skills that spend on start vs. complete)
    if (castInfo.skill.channel && castInfo.skill.manaCostOnStart !== true) {
        const skillLevel = castInfo.skillLevel;
        const manaCosts = castInfo.skill.manaCostByLevel || [0];
        const manaCost = manaCosts[Math.min(skillLevel - 1, manaCosts.length - 1)];
        hero.mana += manaCost;
    }
    
    // Dispatch channel interrupted event
    if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent(SKILL_EVENTS.CHANNEL_INTERRUPTED, {
            detail: { heroId: hero.heroId, skillId: castInfo.skill.id, reason }
        }));
    }
    
    // Reset cast state
    hero.isCasting = false;
    hero.currentCast = null;
    
    return true;
}

// ============================================================================
// Skill Effect Application
// ============================================================================

/**
 * Apply skill effects based on skill type
 * @param {Object} hero - Caster hero
 * @param {Object} skill - Skill definition
 * @param {number} level - Skill level (1-4)
 * @param {string} targetId - Target entity ID
 * @param {Vector3} targetPos - Target position
 */
export function applySkillEffect(hero, skill, level, targetId, targetPos) {
    const effectValues = skill.effectValuesByLevel || {};
    const values = {};
    
    // Get effect values for this level
    Object.keys(effectValues).forEach(key => {
        const valuesByLevel = effectValues[key];
        values[key] = valuesByLevel[Math.min(level - 1, valuesByLevel.length - 1)];
    });
    
    // Apply effects based on skill type
    switch (skill.skillType) {
        case 'active':
            applyActiveSkillEffect(hero, skill, level, values, targetId, targetPos);
            break;
            
        case 'toggle':
            toggleSkillState(hero, skill, values);
            break;
            
        case 'passive':
            // Passive effects are applied automatically, nothing to do here
            break;
            
        case 'channel':
            applyChannelSkillEffect(hero, skill, level, values, targetId, targetPos);
            break;
            
        default:
            console.warn(`[Skills] Unknown skill type: ${skill.skillType}`);
    }
}

/**
 * Apply active skill effect
 * @param {Object} hero - Caster hero
 * @param {Object} skill - Skill definition
 * @param {number} level - Skill level
 * @param {Object} values - Effect values
 * @param {string} targetId - Target entity ID
 * @param {Vector3} targetPos - Target position
 */
export function applyActiveSkillEffect(hero, skill, level, values, targetId, targetPos) {
    const damageType = skill.damageType || DAMAGE_TYPES.magical;
    
    // Point/ground target skill
    if (targetPos) {
        // Apply AoE effect at position
        if (skill.effectRadius) {
            const units = getUnitsInAOE(targetPos, skill.effectRadius, 
                skill.targetRule === TARGET_TYPES.allyUnit ? 'ally' : 'enemy');
            
            units.forEach(unit => {
                if (unit.hp > 0) {
                    // Apply damage
                    if (values.damage) {
                        applyDamageToUnit(unit, values.damage, damageType, hero);
                    }
                    
                    // Apply status effects
                    if (values.statusEffect) {
                        applyStatusEffect(unit, values.statusEffect, values.statusDuration || 2);
                    }
                }
            });
        }
        
        // Single target at position (for skills like blink)
        if (skill.targetRule === TARGET_TYPES.ground && hero.heroId === 'zeus') {
            // Zeus TP: return to base
            if (skill.id === 'tp') {
                teleportToBase(hero);
            }
        }
    }
    
    // Unit target skill
    if (targetId) {
        const target = G.heroes.get(targetId) || G.creeps.get(targetId);
        if (target && target.hp > 0) {
            // Apply damage
            if (values.damage) {
                applyDamageToUnit(target, values.damage, damageType, hero);
            }
            
            // Apply status effects
            if (values.statusEffect) {
                applyStatusEffect(target, values.statusEffect, values.statusDuration || 2);
            }
        }
    }
    
    // Self-target skill (e.g., Windrun)
    if (skill.targetRule === TARGET_TYPES.self) {
        if (skill.id === 'windrun') {
            applyWindrunEffect(hero, values);
        }
    }
    
    // Self-radius skill (e.g., Ravage)
    if (skill.targetRule === TARGET_TYPES.self && skill.effectRadius) {
        if (skill.id === 'ravage') {
            applyRavageEffect(hero, values);
        }
    }
}

/**
 * Toggle skill state
 * @param {Object} hero - Caster hero
 * @param {Object} skill - Skill definition
 * @param {Object} values - Effect values
 */
export function toggleSkillState(hero, skill, values) {
    hero.toggledSkills = hero.toggledSkills || {};
    
    if (hero.toggledSkills[skill.id]) {
        // Turn off
        hero.toggledSkills[skill.id] = false;
        
        // Remove passive effects
        if (skill.onToggleOff) {
            skill.onToggleOff(hero, values);
        }
        
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent(SKILL_EVENTS.TOGGLE_DEACTIVATED, {
                detail: { heroId: hero.heroId, skillId: skill.id }
            }));
        }
    } else {
        // Check mana for toggle
        const manaCost = values.manaCost || 0;
        if (hero.mana < manaCost) {
            // Can't activate - show feedback
            return;
        }
        
        // Turn on
        hero.toggledSkills[skill.id] = true;
        hero.mana -= manaCost;
        
        // Apply passive effects
        if (skill.onToggleOn) {
            skill.onToggleOn(hero, values);
        }
        
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent(SKILL_EVENTS.TOGGLE_ACTIVATED, {
                detail: { heroId: hero.heroId, skillId: skill.id }
            }));
        }
    }
    
    // Update skill state in UI
    hero.skillStates = hero.skillStates || {};
    hero.skillStates[skill.id] = hero.toggledSkills[skill.id] ? SKILL_STATES.TOGGLE_ON : SKILL_STATES.TOGGLE_OFF;
}

/**
 * Apply channel skill effect
 * @param {Object} hero - Caster hero
 * @param {Object} skill - Skill definition
 * @param {number} level - Skill level
 * @param {Object} values - Effect values
 * @param {string} targetId - Target entity ID
 * @param {Vector3} targetPos - Target position
 */
export function applyChannelSkillEffect(hero, skill, level, values, targetId, targetPos) {
    // Channel skills start immediately and continue for duration
    hero.channeling = {
        skill,
        skillLevel: level,
        values,
        targetId,
        targetPos,
        startTime: Date.now(),
        duration: skill.duration || 3
    };
    
    // Apply initial effect
    applyActiveSkillEffect(hero, skill, level, targetId, targetPos);
    
    // Dispatch channel started event
    if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent(SKILL_EVENTS.CHANNEL_STARTED, {
            detail: { heroId: hero.heroId, skillId: skill.id }
        }));
    }
}

/**
 * Apply damage to a unit
 * @param {Object} unit - Target unit
 * @param {number} damage - Damage amount
 * @param {string} damageType - 'physical' | 'magical' | 'pure'
 * @param {Object} source - Damage source (caster)
 */
export function applyDamageToUnit(unit, damage, damageType, source) {
    // Calculate actual damage after mitigation
    let actualDamage = damage;
    
    if (damageType === DAMAGE_TYPES.physical && unit.stats?.armor !== undefined) {
        // Armor reduction: PhysicalDamageTaken = damage * 100 / (100 + armor * 6)
        actualDamage = damage * 100 / (100 + unit.stats.armor * 6);
    } else if (damageType === DAMAGE_TYPES.magical && unit.stats?.magicResist !== undefined) {
        // Magic reduction: MagicalDamageTaken = damage * (100 - magicResist) / 100
        actualDamage = damage * (100 - unit.stats.magicResist) / 100;
    }
    
    // Apply damage
    unit.hp = Math.max(0, unit.hp - actualDamage);
    
    // Trigger death if needed
    if (unit.hp <= 0) {
        unit.hp = 0;
        // Note: Actual death handling is in combat.js
    }
}

/**
 * Apply a status effect to a unit
 * @param {Object} unit - Target unit
 * @param {string} statusType - Status type from STATUS_TYPES
 * @param {number} duration - Duration in seconds
 * @param {Object} extra - Extra effect properties
 */
export function applyStatusEffect(unit, statusType, duration, extra = {}) {
    if (!unit.statusEffects) {
        unit.statusEffects = new Map();
    }
    
    const effect = {
        type: statusType,
        startTime: Date.now(),
        endTime: Date.now() + duration * 1000,
        duration,
        ...extra
    };
    
    // Add or update effect
    unit.statusEffects.set(statusType, effect);
    
    // Apply immediate effects
    switch (statusType) {
        case STATUS_TYPES.stun:
            unit.stunned = true;
            break;
            
        case STATUS_TYPES.silence:
            unit.silenced = true;
            break;
            
        case STATUS_TYPES.slow:
            unit.slowed = true;
            unit.slowMultiplier = extra.slowMultiplier || 0.5;
            break;
            
        case STATUS_TYPES.knockback:
            // Calculate knockback direction (away from center)
            if (extra.centerPos && unit.position) {
                const dx = unit.position.x - extra.centerPos.x;
                const dz = unit.position.z - extra.centerPos.z;
                const magnitude = Math.sqrt(dx * dx + dz * dz);
                if (magnitude > 0) {
                    unit.knockback = {
                        velocity: {
                            x: (dx / magnitude) * (extra.force || 10),
                            z: (dz / magnitude) * (extra.force || 10)
                        },
                        duration: duration
                    };
                }
            }
            break;
    }
}

// ============================================================================
// Specific Skill Implementations
// ============================================================================

/**
 * Apply Windrun effect (self-buff)
 * @param {Object} hero - Caster hero
 * @param {Object} values - Effect values
 */
export function applyWindrunEffect(hero, values) {
    // Temporary move speed and attack speed boost
    hero.windrunActive = true;
    hero.windrunEndTime = Date.now() + (values.duration || 3) * 1000;
    hero.windrunSpeedBonus = values.speedBonus || 50;
    hero.windrunEvasionBonus = values.evasionBonus || 30;
}

/**
 * Apply Ravage effect (self-radius AoE stun)
 * @param {Object} hero - Caster hero
 * @param {Object} values - Effect values
 */
export function applyRavageEffect(hero, values) {
    const units = getUnitsInAOE(hero.position, values.radius || 500, 'enemy');
    
    units.forEach(unit => {
        // Apply damage
        if (values.damage) {
            applyDamageToUnit(unit, values.damage, values.damageType || DAMAGE_TYPES.magical, hero);
        }
        
        // Apply stun
        applyStatusEffect(unit, STATUS_TYPES.stun, values.stunDuration || 0.6);
    });
}

/**
 * Teleport hero to base fountain
 * @param {Object} hero - Hero to teleport
 */
export function teleportToBase(hero) {
    const basePos = hero.team === 'sentinel' 
        ? { x: 82, z: 82 }  // Sentinel fountain
        : { x: 18, z: 18 };  // Scourge fountain
    
    hero.position = { ...basePos, y: 0.15 };
    hero.hp = hero.stats?.maxHp || hero.maxHp;
    hero.mana = hero.stats?.maxMana || hero.maxMana;
}

// ============================================================================
// Skill Learning System
// ============================================================================

/**
 * Skill learning result
 */
export const LEARN_RESULT = {
    SUCCESS: 'success',
    FAIL_LEVEL: 'fail_level',
    FAIL_POINTS: 'fail_points',
    FAIL_LOCKED: 'fail_locked',
    FAIL_ALREADY: 'fail_already'
};

/**
 * Check if a skill can be learned
 * @param {Object} hero - Hero to learn skill
 * @param {Object} skill - Skill definition
 * @returns {Object} Learn check result
 */
export function canLearnSkill(hero, skill) {
    // Check if skill is already learned
    const heroSkills = hero.skills || {};
    if (heroSkills[skill.id] && heroSkills[skill.id].learned) {
        return { canLearn: false, result: LEARN_RESULT.FAIL_ALREADY };
    }
    
    // Check skill slot availability
    const skillSlot = skill.slot || 'Q';
    const slots = ['Q', 'W', 'E', 'R'];
    if (!slots.includes(skillSlot)) {
        return { canLearn: false, result: LEARN_RESULT.FAIL_LOCKED };
    }
    
    // Check if slot is already taken
    for (const [sid, sdata] of Object.entries(heroSkills)) {
        if (sid !== skill.id && sdata.slot === skillSlot && sdata.learned) {
            return { canLearn: false, result: LEARN_RESULT.FAIL_LOCKED };
        }
    }
    
    // Check skill points
    const skillPoints = hero.skillPoints || 0;
    if (skillPoints < 1) {
        return { canLearn: false, result: LEARN_RESULT.FAIL_POINTS };
    }
    
    // Check level requirement
    const levelReq = skill.levelRequirement || 1;
    if (hero.level < levelReq) {
        return { canLearn: false, result: LEARN_RESULT.FAIL_LEVEL };
    }
    
    return { canLearn: true, result: LEARN_RESULT.SUCCESS };
}

/**
 * Learn a skill
 * @param {Object} hero - Hero to learn skill
 * @param {Object} skill - Skill definition
 * @returns {Object} Learn result
 */
export function learnSkill(hero, skill) {
    const check = canLearnSkill(hero, skill);
    if (!check.canLearn) {
        return check;
    }
    
    // Initialize skills if needed
    hero.skills = hero.skills || {};
    
    // Deduct skill point
    hero.skillPoints = (hero.skillPoints || 0) - 1;
    
    // Add skill
    hero.skills[skill.id] = {
        id: skill.id,
        slot: skill.slot || 'Q',
        level: 1,
        maxLevel: skill.maxLevel || 4,
        learned: true,
        xp: 0,
        xpToNextLevel: 200
    };
    
    // Dispatch skill learned event
    if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent(SKILL_EVENTS.SKILL_LEARNED, {
            detail: { heroId: hero.heroId, skillId: skill.id, slot: skill.slot }
        }));
    }
    
    return { canLearn: true, result: LEARN_RESULT.SUCCESS };
}

/**
 * Level up a skill
 * @param {Object} hero - Hero with skill
 * @param {string} skillId - Skill ID to level up
 * @returns {Object} Level up result
 */
export function levelUpSkill(hero, skillId) {
    const heroSkills = hero.skills || {};
    const skill = heroSkills[skillId];
    
    if (!skill || !skill.learned) {
        return { success: false, result: LEARN_RESULT.FAIL_ALREADY };
    }
    
    if (skill.level >= skill.maxLevel) {
        return { success: false, result: LEARN_RESULT.FAIL_ALREADY };
    }
    
    // Deduct skill point
    hero.skillPoints = (hero.skillPoints || 0) - 1;
    
    // Level up
    skill.level++;
    
    return { success: true, result: LEARN_RESULT.SUCCESS };
}

// ============================================================================
// Cast Mode: Double-Tap Smart Cast
// ============================================================================

/**
 * Cast on nearest valid target (double-tap)
 * @param {Object} hero - Caster hero
 * @param {Object} skill - Skill definition
 * @param {number} searchRange - Search range in world units
 * @returns {Object} Cast result
 */
export function smartCastNearestTarget(hero, skill, searchRange = 500) {
    // Find nearest valid target based on skill rules
    let nearestTarget = null;
    
    if (skill.targetRule === TARGET_TYPES.enemyUnit || 
        skill.targetRule === TARGET_TYPES.enemyUnitOrGround) {
        // Try enemy hero first
        nearestTarget = findNearestEnemyHero(hero, searchRange);
        
        // Fallback to creep if no hero found
        if (!nearestTarget) {
            nearestTarget = findNearestCreep(hero, searchRange, 'enemy');
        }
    } else if (skill.targetRule === TARGET_TYPES.allyUnit) {
        // Find nearest ally hero
        nearestTarget = findNearestAllyHero(hero, searchRange);
    } else if (skill.targetRule === TARGET_TYPES.groundOrAllyUnit) {
        // Find nearest ally or ground position
        nearestTarget = findNearestAllyHero(hero, searchRange) || { type: 'ground' };
    }
    
    if (!nearestTarget) {
        return { 
            success: false, 
            result: CAST_RESULT.FAIL_TARGET,
            reason: 'no_valid_target'
        };
    }
    
    // Cast on target
    const targetId = nearestTarget.type === 'ground' ? null : nearestTarget.id;
    const targetPos = nearestTarget.type === 'ground' ? hero.position : null;
    
    return castSkill(hero, skill, targetId, targetPos, 'double-tap');
}

/**
 * Find nearest ally hero
 * @param {Object} hero - Source hero
 * @param {number} range - Search range
 * @returns {Object | null} Nearest ally hero
 */
export function findNearestAllyHero(hero, range = 500) {
    let nearest = null;
    let nearestDistance = Infinity;
    
    G.heroes.forEach(target => {
        if (target.team === hero.team && !target.isDead && target.id !== hero.id) {
            const distance = getDistance(hero.position, target.position);
            if (distance <= range && distance < nearestDistance) {
                nearestDistance = distance;
                nearest = target;
            }
        }
    });
    
    return nearest;
}

// ============================================================================
// Cast Mode: Aim Cast (drag -> release)
// ============================================================================

/**
 * Aim cast indicator state
 */
export const AIM_INDICATOR = {
    NONE: 'none',
    DRAGGING: 'dragging',
    READY: 'ready',
    CANCELLED: 'cancelled'
};

/**
 * Start aim cast
 * @param {Object} hero - Caster hero
 * @param {Object} skill - Skill definition
 * @param {Vector3} startPos - Drag start position
 * @returns {boolean} Whether aim started
 */
export function startAimCast(hero, skill, startPos) {
    if (!hero || hero.isCasting) {
        return false;
    }
    
    hero.aimingSkill = {
        skill,
        startPos: { ...startPos },
        currentPos: { ...startPos },
        state: AIM_INDICATOR.DRAGGING
    };
    
    return true;
}

/**
 * Update aim cast position
 * @param {Object} hero - Caster hero
 * @param {Vector3} newPos - New drag position
 */
export function updateAimCast(hero, newPos) {
    if (!hero || !hero.aimingSkill) {
        return;
    }
    
    hero.aimingSkill.currentPos = { ...newPos };
    
    // Clamp to cast range
    const castRange = getCastRangeValue(hero.aimingSkill.skill.castRange || 'medium');
    if (castRange !== Infinity && castRange > 0) {
        const distance = getDistance(hero.position, newPos);
        if (distance > castRange) {
            // Clamp to cast range
            const ratio = castRange / distance;
            hero.aimingSkill.currentPos.x = hero.position.x + (newPos.x - hero.position.x) * ratio;
            hero.aimingSkill.currentPos.z = hero.position.z + (newPos.z - hero.position.z) * ratio;
        }
    }
}

/**
 * End aim cast
 * @param {Object} hero - Caster hero
 * @returns {Object} Cast result
 */
export function endAimCast(hero) {
    if (!hero || !hero.aimingSkill) {
        return { success: false, result: CAST_RESULT.FAIL_INVALID };
    }
    
    const aimInfo = hero.aimingSkill;
    
    // Check if dragged outside cancel radius
    if (aimInfo.state === AIM_INDICATOR.CANCELLED) {
        hero.aimingSkill = null;
        return { success: false, result: CAST_RESULT.FAIL_INVALID };
    }
    
    // Find valid target at position
    let targetPos = { ...aimInfo.currentPos };
    
    // Raycast to ground if needed
    if (aimInfo.skill.targetRule === TARGET_TYPES.ground || 
        aimInfo.skill.targetRule === TARGET_TYPES.enemyUnitOrGround ||
        aimInfo.skill.targetRule === TARGET_TYPES.groundOrAllyUnit) {
        // Already on ground
    } else {
        // Find nearest unit at position
        const units = getUnitsInAOE(targetPos, 7, 
            aimInfo.skill.targetRule === TARGET_TYPES.allyUnit ? 'ally' : 'enemy');
        
        if (units.length > 0) {
            // Cast on nearest unit
            const target = units[0];
            const castResult = castSkill(hero, aimInfo.skill, target.id, null, 'aim');
            hero.aimingSkill = null;
            return castResult;
        }
    }
    
    // Cast on ground position
    const castResult = castSkill(hero, aimInfo.skill, null, targetPos, 'aim');
    hero.aimingSkill = null;
    return castResult;
}

/**
 * Cancel aim cast
 * @param {Object} hero - Caster hero
 */
export function cancelAimCast(hero) {
    if (!hero || !hero.aimingSkill) {
        return;
    }
    
    hero.aimingSkill.state = AIM_INDICATOR.CANCELLED;
}

// ============================================================================
// Skill Update System
// ============================================================================

/**
 * Update all active skills for a hero
 * @param {Object} hero - Hero to update
 * @param {number} dt - Delta time in seconds
 */
export function updateHeroSkills(hero, dt) {
    if (!hero) return;
    
    // Check toggle skill status (e.g., Frost Arrows)
    updateToggleSkills(hero, dt);
    
    // Check channel skills
    updateChannelSkills(hero, dt);
    
    // Check temporary buffs (Windrun, etc.)
    updateTemporaryEffects(hero, dt);
}

/**
 * Update toggle skill effects
 * @param {Object} hero - Hero with toggled skills
 * @param {number} dt - Delta time in seconds
 */
export function updateToggleSkills(hero, dt) {
    if (!hero.toggledSkills) return;
    
    Object.entries(hero.toggledSkills).forEach(([skillId, isActive]) => {
        if (!isActive) return;
        
        // Get skill definition
        const skill = getSkillDefinition(hero.heroId, skillId);
        if (!skill) return;
        
        // Get mana cost per tick
        const effectValues = skill.effectValuesByLevel || {};
        const skillLevel = hero.skills?.[skillId]?.level || 1;
        const manaCost = (effectValues.manaCost || [0])[Math.min(skillLevel - 1, 3)] || 0;
        
        if (manaCost > 0) {
            // Check if hero can afford the tick
            if (hero.mana < manaCost) {
                // Turn off and show feedback
                hero.toggledSkills[skillId] = false;
                hero.skillStates = hero.skillStates || {};
                hero.skillStates[skillId] = SKILL_STATES.LOW_MANA;
                
                if (typeof window !== 'undefined' && window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent(SKILL_EVENTS.TOGGLE_DEACTIVATED, {
                        detail: { heroId: hero.heroId, skillId: skillId }
                    }));
                }
            }
        }
    });
}

/**
 * Update channel skills
 * @param {Object} hero - Hero with channeling skills
 * @param {number} dt - Delta time in seconds
 */
export function updateChannelSkills(hero, dt) {
    if (!hero.channeling) return;
    
    const channel = hero.channeling;
    const elapsed = (Date.now() - channel.startTime) / 1000;
    
    // Check if channel complete
    if (elapsed >= channel.duration) {
        hero.channeling = null;
        return;
    }
    
    // Check for interruption (stun, silence, death)
    if (hero.stunned || hero.silenced || hero.hp <= 0) {
        interruptSkillCast(hero, hero.stunned ? 'stun' : 'silence');
        return;
    }
    
    // Tick effect if configured
    if (channel.skill.tickRate) {
        if (elapsed % channel.skill.tickRate < dt) {
            applySkillEffect(hero, channel.skill, channel.skillLevel, 
                           channel.targetId, channel.targetPos);
        }
    }
}

/**
 * Update temporary buff effects
 * @param {Object} hero - Hero with temporary effects
 * @param {number} dt - Delta time in seconds
 */
export function updateTemporaryEffects(hero, dt) {
    // Check Windrun
    if (hero.windrunActive) {
        if (Date.now() >= hero.windrunEndTime) {
            hero.windrunActive = false;
            hero.windrunSpeedBonus = 0;
            hero.windrunEvasionBonus = 0;
        }
    }
    
    // Check knockback
    if (hero.knockback) {
        hero.knockback.duration -= dt;
        if (hero.knockback.duration <= 0) {
            hero.knockback = null;
        }
    }
}

/**
 * Get skill definition from hero ID and skill ID
 * @param {string} heroId - Hero ID
 * @param {string} skillId - Skill ID
 * @returns {Object | undefined} Skill definition
 */
export function getSkillDefinition(heroId, skillId) {
    // Import hero-specific skills
    try {
        // Try to import hero module
        const heroModule = await import(`./heroes/${heroId}.js`);
        const heroSkills = heroModule.default?.skills || [];
        return heroSkills.find(s => s.id === skillId);
    } catch (e) {
        console.warn(`[Skills] Could not load hero module: ${heroId}`);
        return undefined;
    }
}

// ============================================================================
// Skill Registry
// ============================================================================

/**
 * Skill registry - holds all skill definitions
 */
export const SKILL_REGISTRY = {};

/**
 * Register a skill definition
 * @param {string} heroId - Hero ID
 * @param {Object} skill - Skill definition
 */
export function registerSkill(heroId, skill) {
    if (!SKILL_REGISTRY[heroId]) {
        SKILL_REGISTRY[heroId] = [];
    }
    
    SKILL_REGISTRY[heroId].push(skill);
}

/**
 * Get all skills for a hero
 * @param {string} heroId - Hero ID
 * @returns {Array} Array of skill definitions
 */
export function getHeroSkills(heroId) {
    return SKILL_REGISTRY[heroId] || [];
}

// ============================================================================
// Helper: Get nearest target for auto-aim
// ============================================================================

/**
 * Get nearest valid target within aim radius
 * @param {Object} hero - Caster hero
 * @param {Vector3} aimPos - Aim position
 * @param {number} aimRadius - Aim radius in world units
 * @param {string} targetRule - Target rule
 * @returns {Object | null} Nearest valid target or null
 */
export function getNearestTargetAtAim(hero, aimPos, aimRadius = 7, targetRule) {
    let nearest = null;
    let nearestDistance = Infinity;
    
    // Check heroes
    G.heroes.forEach(target => {
        if (!target.isDead) {
            const distance = getDistance(aimPos, target.position);
            if (distance <= aimRadius && distance < nearestDistance) {
                if (isValidTarget(hero, target, targetRule)) {
                    nearestDistance = distance;
                    nearest = target;
                }
            }
        }
    });
    
    return nearest;
}

// ============================================================================
// Export
// ============================================================================

export default {
    // Constants
    SKILL_STATES,
    SKILL_EVENTS,
    CAST_RESULT,
    LEARN_RESULT,
    AIM_INDICATOR,
    
    // Range validation
    isCastInRange,
    getCastRangeValue,
    isAttackInRange,
    
    // Target validation
    isValidTarget,
    findNearestEnemyHero,
    findNearestCreep,
    findNearestAllyHero,
    getUnitsInAOE,
    getNearestTargetAtAim,
    
    // Cast pipeline
    castSkill,
    endSkillCast,
    interruptSkillCast,
    applySkillEffect,
    applyActiveSkillEffect,
    toggleSkillState,
    applyChannelSkillEffect,
    applyDamageToUnit,
    applyStatusEffect,
    
    // Specific skills
    applyWindrunEffect,
    applyRavageEffect,
    teleportToBase,
    
    // Learning
    canLearnSkill,
    learnSkill,
    levelUpSkill,
    
    // Smart cast
    smartCastNearestTarget,
    
    // Aim cast
    startAimCast,
    updateAimCast,
    endAimCast,
    cancelAimCast,
    
    // Update system
    updateHeroSkills,
    updateToggleSkills,
    updateChannelSkills,
    updateTemporaryEffects,
    getSkillDefinition,
    
    // Registry
    registerSkill,
    getHeroSkills,
    
    // Re-export constants
    SKILL_SLOTS,
    SKILL_TYPES,
    TARGET_TYPES,
    DAMAGE_TYPES,
    STATUS_TYPES
};
