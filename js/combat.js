/**
 * Combat System
 * Crimson Lane - DotA 1 style MOBA
 * 
 * This module provides:
 * - Damage calculation: physical/magical/pure
 * - Armor reduction formula
 * - Unit attack system (attackUnit)
 * - Projectile system with spawn and update loops
 * - Death handling with bounty, XP, VFX, respawn
 * - Combat events for UI/HUD hooks
 */

import { G } from './state.js';
import { 
    getDamageMultiplier, 
    getRespawnTime, 
    ATTACK, 
    PROJECTILE, 
    DAMAGE_TYPES, 
    STATUS_TYPES,
    DEATH_ANIMATION_DURATION
} from './constants.js';

// ============================================================================
// Combat Event Emitter
// ============================================================================

/**
 * Combat events emitter
 * @type {EventTarget}
 */
const combatEvents = new EventTarget();

/**
 * Dispatch a combat event
 * @param {string} type - Event type
 * @param {Object} detail - Event data
 */
function dispatchCombatEvent(type, detail) {
    const event = new CustomEvent(type, { detail });
    combatEvents.dispatchEvent(event);
}

/**
 * Add event listener for combat events
 * @param {string} type - Event type
 * @param {Function} callback - Event handler
 */
export function onCombatEvent(type, callback) {
    combatEvents.addEventListener(type, callback);
}

/**
 * Remove event listener for combat events
 * @param {string} type - Event type
 * @param {Function} callback - Event handler
 */
export function offCombatEvent(type, callback) {
    combatEvents.removeEventListener(type, callback);
}

// ============================================================================
// Damage System
// ============================================================================

/**
 * Calculate damage based on type and mitigation
 * @param {number} damage - Base damage amount
 * @param {string} damageType - 'physical' | 'magical' | 'pure'
 * @param {number} armor - Target armor value
 * @param {number} magicResist - Target magic resistance percentage (0-100)
 * @returns {number} Final damage amount
 */
export function calculateDamage(damage, damageType, armor, magicResist) {
    switch (damageType) {
        case DAMAGE_TYPES.physical:
            // Physical damage reduced by armor
            // Formula: PhysicalDamageTaken = damage * 100 / (100 + armor * 6)
            const armorMultiplier = getDamageMultiplier(armor);
            return damage * armorMultiplier;
            
        case DAMAGE_TYPES.magical:
            // Magical damage reduced by magic resistance
            // Formula: MagicalDamageTaken = damage * (100 - magicResist) / 100
            const magicMultiplier = (100 - magicResist) / 100;
            return damage * magicMultiplier;
            
        case DAMAGE_TYPES.pure:
            // Pure damage ignores all mitigation
            return damage;
            
        default:
            console.warn(`[Combat] Unknown damage type: ${damageType}`);
            return damage;
    }
}

/**
 * Apply damage to a unit
 * @param {Object} unit - Target unit
 * @param {number} damage - Base damage amount
 * @param {string} damageType - 'physical' | 'magical' | 'pure'
 * @param {string} damageSource - Source of damage ('hero', 'creep', 'tower', 'spell')
 * @param {string} attackerId - ID of attacker (if applicable)
 * @returns {Object} Damage result with actual damage applied
 */
export function applyDamage(unit, damage, damageType, damageSource = 'unknown', attackerId = null) {
    if (!unit || unit.isDead) {
        return null;
    }
    
    // Get unit stats
    const armor = unit.armor || 0;
    const magicResist = unit.magicResist || 25;  // Default 25%
    
    // Calculate actual damage after mitigation
    const actualDamage = calculateDamage(damage, damageType, armor, magicResist);
    
    // Apply damage
    unit.hp = Math.max(0, unit.hp - actualDamage);
    
    // Dispatch damage event
    dispatchCombatEvent('damageApplied', {
        unitId: unit.id,
        unitType: unit.type,
        damage: actualDamage,
        damageType,
        damageSource,
        attackerId,
        hpBefore: unit.hp + actualDamage,
        hpAfter: unit.hp,
        isCritical: false  // For future crit system
    });
    
    return {
        damage: actualDamage,
        damageType,
        damageSource,
        attackerId,
        hpBefore: unit.hp + actualDamage,
        hpAfter: unit.hp
    };
}

// ============================================================================
// Attack System
// ============================================================================

/**
 * Attack a unit
 * @param {Object} attacker - Attacking unit
 * @param {Object} target - Target unit
 * @returns {boolean} Whether attack was successful
 */
export function attackUnit(attacker, target) {
    if (!attacker || !target || target.isDead) {
        return false;
    }
    
    // Check if in range
    const distance = getDistance(attacker.position, target.position);
    const attackRange = attacker.attackRange || ATTACK.baseSpeed;
    const hitBuffer = ATTACK.hitBuffer || 4;
    
    if (distance > attackRange + hitBuffer) {
        return false;
    }
    
    // Check if in attack wind-up period
    if (attacker.attackCooldown > 0) {
        return false;
    }
    
    // Calculate attack damage
    const baseDamage = (attacker.damageMin + attacker.damageMax) / 2;
    
    // Apply attack speed multiplier
    // AttackInterval = baseAttackTime / attackSpeedMultiplier
    const baseAttackTime = ATTACK.baseSpeed || 1.7;
    const attackSpeedMultiplier = attacker.attackSpeed ? attacker.attackSpeed / 100 : 1.0;
    const attackInterval = baseAttackTime / attackSpeedMultiplier;
    
    // Determine damage type based on attacker type
    // Heroes with high agility deal more physical damage
    // Heroes with high intelligence deal more magical damage
    let damageType = DAMAGE_TYPES.physical;
    if (attacker.type === 'hero') {
        if (attacker.intelligence > attacker.agility) {
            damageType = DAMAGE_TYPES.magical;
        }
    } else if (attacker.type === 'tower' || attacker.type === 'barracks') {
        damageType = DAMAGE_TYPES.physical;
    } else if (attacker.type === 'ancient') {
        damageType = DAMAGE_TYPES.physical;
    }
    
    // Apply damage to target
    const damageResult = applyDamage(
        target, 
        baseDamage, 
        damageType, 
        attacker.type,
        attacker.id
    );
    
    if (!damageResult) {
        return false;
    }
    
    // Set attack cooldown
    attacker.attackCooldown = attackInterval;
    
    // Trigger attack animation
    if (attacker.currentAnim) {
        attacker.currentAnim = 'attack';
    }
    
    // Check if target is killed
    if (target.hp <= 0) {
        killUnit(target, attacker);
    }
    
    // Ranged attacks spawn projectiles
    if (attacker.attackRange > 200) {
        spawnProjectile(attacker, target, ATTACK.projectileSpeed, baseDamage, damageType);
    }
    
    return true;
}

// ============================================================================
// Projectile System
// ============================================================================

/**
 * Projectile data structure
 * @typedef {Object} Projectile
 * @property {string} id - Unique projectile ID
 * @property {string} casterId - ID of caster
 * @property {string} targetId - ID of target
 * @property {Vector3} position - Current position
 * @property {Vector3} velocity - Movement velocity
 * @property {number} speed - Movement speed
 * @property {number} damage - Damage amount
 * @property {string} damageType - Damage type
 * @property {number} lifetime - Time until expiration
 * @property {number} maxLifetime - Maximum lifetime
 * @property {boolean} hasHit - Whether projectile has hit target
 * @property {THREE.Mesh} visual - Visual representation
 */

/**
 * Spawn a projectile
 * @param {Object} caster - Caster unit
 * @param {Object|Vector3} target - Target unit or target position
 * @param {number} speed - Projectile speed
 * @param {number} damage - Damage amount
 * @param {string} damageType - Damage type
 * @returns {Object} Projectile object
 */
export function spawnProjectile(caster, target, speed, damage, damageType) {
    const projectileId = `proj_${G.tickCount}_${G.projectiles.size}`;
    
    // Get target position
    let targetPos;
    if (target.position) {
        targetPos = { ...target.position };
    } else {
        targetPos = { ...target };
    }
    
    // Create projectile
    const projectile = {
        id: projectileId,
        casterId: caster.id,
        targetId: target.id || 'ground',
        position: { ...caster.position },
        velocity: { x: 0, y: 0, z: 0 },
        speed: speed || PROJECTILE.speed,
        damage: damage,
        damageType: damageType || DAMAGE_TYPES.physical,
        lifetime: PROJECTILE.lifetime || 5.0,
        maxLifetime: PROJECTILE.lifetime || 5.0,
        hasHit: false,
        visual: null
    };
    
    // Calculate velocity vector
    const direction = {
        x: targetPos.x - projectile.position.x,
        y: targetPos.y - projectile.position.y,
        z: targetPos.z - projectile.position.z
    };
    
    const magnitude = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
    if (magnitude > 0) {
        projectile.velocity.x = (direction.x / magnitude) * speed;
        projectile.velocity.z = (direction.z / magnitude) * speed;
    }
    
    // Add to registry
    G.projectiles.set(projectileId, projectile);
    
    // Dispatch projectile spawn event
    dispatchCombatEvent('projectileSpawned', {
        projectileId,
        casterId: caster.id,
        targetId: target.id || 'ground',
        position: projectile.position,
        velocity: projectile.velocity,
        speed,
        damage,
        damageType
    });
    
    return projectile;
}

/**
 * Update all projectiles in the world
 * @param {number} deltaTime - Time since last frame
 */
export function updateProjectiles(deltaTime) {
    const projectilesToRemove = [];
    
    G.projectiles.forEach((projectile, projectileId) => {
        // Update lifetime
        projectile.lifetime -= deltaTime;
        
        // Check if expired
        if (projectile.lifetime <= 0) {
            projectilesToRemove.push(projectileId);
            return;
        }
        
        // Move projectile
        const moveX = projectile.velocity.x * deltaTime;
        const moveZ = projectile.velocity.z * deltaTime;
        
        projectile.position.x += moveX;
        projectile.position.z += moveZ;
        
        // Check for collision with target
        if (!projectile.hasHit) {
            const target = G.heroes.get(projectile.targetId) || 
                          G.creeps.get(projectile.targetId);
            
            if (target && !target.isDead) {
                const distance = getDistance(projectile.position, target.position);
                const targetSize = target.type === 'hero' ? 1.0 : 0.5;
                
                if (distance <= targetSize) {
                    // Hit target
                    projectile.hasHit = true;
                    
                    // Apply damage
                    applyDamage(target, projectile.damage, projectile.damageType, 'projectile', projectile.casterId);
                    
                    // Remove projectile
                    projectilesToRemove.push(projectileId);
                    
                    // Dispatch projectile hit event
                    dispatchCombatEvent('projectileHit', {
                        projectileId,
                        targetId: target.id,
                        damage: projectile.damage,
                        damageType: projectile.damageType
                    });
                }
            }
        }
    });
    
    // Remove expired or hit projectiles
    projectilesToRemove.forEach(id => G.projectiles.delete(id));
}

// ============================================================================
// Death & Respawn System
// ============================================================================

/**
 * Get distance between two positions
 * @param {Vector3} a - First position
 * @param {Vector3} b - Second position
 * @returns {number} Distance
 */
function getDistance(a, b) {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Kill a unit
 * @param {Object} unit - Unit to kill
 * @param {Object} killer - Unit that killed this unit (optional)
 */
export function killUnit(unit, killer = null) {
    if (!unit || unit.isDead) {
        return;
    }
    
    // Mark as dead
    unit.isDead = true;
    unit.hp = 0;
    
    // Calculate bounty and XP
    const bounty = calculateBounty(unit, killer);
    const xpValue = calculateXP(unit);
    
    // Grant rewards to killer (if exists)
    if (killer && killer !== unit) {
        grantGold(killer, bounty);
        grantXP(killer, xpValue);
        
        // Add assist XP to nearby allies
        addAssistXP(unit, xpValue, killer);
    } else {
        // Neutral death - no killer
        // Bonus gold to last attacker or split among nearby allies
        distributeNeutralDeathRewards(unit, bounty, xpValue);
    }
    
    // Death VFX
    triggerDeathVFX(unit);
    
    // Set respawn timer
    const respawnTime = getRespawnTime(unit.level || 1);
    unit.respawnTime = respawnTime;
    
    // Dispatch unit died event
    dispatchCombatEvent('unitDied', {
        unitId: unit.id,
        unitType: unit.type,
        killerId: killer ? killer.id : null,
        bounty,
        xp: xpValue,
        respawnTime
    });
    
    // Start death animation
    if (unit.currentAnim) {
        unit.currentAnim = 'death';
    }
    
    // Add to dead heroes tracking if hero
    if (unit.type === 'hero') {
        G.deadHeroes.set(unit.id, Date.now() + respawnTime * 1000);
    }
}

/**
 * Calculate bounty for a killed unit
 * @param {Object} unit - Killed unit
 * @param {Object} killer - Killer unit
 * @returns {number} Bounty amount
 */
function calculateBounty(unit, killer) {
    let bounty = 0;
    
    switch (unit.type) {
        case 'hero':
            // Hero bounty formula (simplified)
            // Base + level multiplier + kill streak bonus
            bounty = 150 + (unit.level || 1) * 25;
            break;
            
        case 'creep':
            // Creep bounty from stats
            bounty = unit.goldBounty || 0;
            break;
            
        case 'tower':
            // Tower bounty based on tier
            bounty = 200 + (unit.tier || 1) * 100;
            break;
            
        case 'barracks':
            bounty = 100;
            break;
            
        case 'ancient':
            bounty = 500;
            break;
            
        default:
            bounty = 0;
    }
    
    return bounty;
}

/**
 * Calculate XP value for a killed unit
 * @param {Object} unit - Killed unit
 * @returns {number} XP value
 */
function calculateXP(unit) {
    let xp = 0;
    
    switch (unit.type) {
        case 'hero':
            // Hero XP formula
            xp = 200 + (unit.level || 1) * 50;
            break;
            
        case 'creep':
            // Creep XP from stats
            xp = unit.xpValue || 0;
            break;
            
        case 'tower':
            xp = 150 + (unit.tier || 1) * 50;
            break;
            
        case 'barracks':
            xp = 100;
            break;
            
        case 'ancient':
            xp = 300;
            break;
            
        default:
            xp = 0;
    }
    
    return xp;
}

/**
 * Grant gold to a unit
 * @param {Object} unit - Recipient unit
 * @param {number} amount - Gold amount
 */
export function grantGold(unit, amount) {
    if (!unit || unit.isDead) {
        return;
    }
    
    unit.gold = (unit.gold || 0) + amount;
    
    // Dispatch gold granted event
    dispatchCombatEvent('goldGranted', {
        unitId: unit.id,
        amount,
        goldAfter: unit.gold
    });
}

/**
 * Grant XP to a unit
 * @param {Object} unit - Recipient unit
 * @param {number} amount - XP amount
 */
export function grantXP(unit, amount) {
    if (!unit || unit.isDead) {
        return;
    }
    
    unit.xp = (unit.xp || 0) + amount;
    
    // Check for level up
    checkLevelUp(unit);
    
    // Dispatch XP granted event
    dispatchCombatEvent('xpGranted', {
        unitId: unit.id,
        amount,
        xpAfter: unit.xp
    });
}

/**
 * Check if unit should level up
 * @param {Object} unit - Unit to check
 */
function checkLevelUp(unit) {
    if (unit.type !== 'hero') {
        return;
    }
    
    // Level up threshold (simplified)
    const xpToNextLevel = unit.xpToNextLevel || (200 + (unit.level || 1) * 100);
    
    if (unit.xp >= xpToNextLevel) {
        // Level up
        unit.level = (unit.level || 1) + 1;
        unit.xp -= xpToNextLevel;
        unit.xpToNextLevel = xpToNextLevel * 1.5;  // Next level costs 50% more
        
        // Heal on level up
        unit.hp = unit.maxHp;
        unit.mana = unit.maxMana;
        
        // Stat increase
        if (unit.type === 'hero') {
            unit.maxHp += 100;
            unit.hp = unit.maxHp;
            unit.maxMana += 50;
            unit.mana = unit.maxMana;
        }
        
        // Dispatch level up event
        dispatchCombatEvent('levelUp', {
            unitId: unit.id,
            level: unit.level
        });
    }
}

/**
 * Add assist XP to nearby allies
 * @param {Object} killedUnit - Killed unit
 * @param {number} totalXP - Total XP value
 * @param {Object} killer - Killer unit (excluded from assists)
 */
function addAssistXP(killedUnit, totalXP, killer) {
    const assistRadius = 1000;  // XP_RADIUS from constants
    const allies = [];
    
    // Find nearby allies
    G.heroes.forEach(hero => {
        if (hero.team === killedUnit.team && !hero.isDead && hero.id !== killer.id) {
            const distance = getDistance(killedUnit.position, hero.position);
            if (distance <= assistRadius) {
                allies.push(hero);
            }
        }
    });
    
    // Distribute XP equally among allies
    if (allies.length > 0) {
        const assistXP = Math.floor(totalXP / (allies.length + 1));  // +1 for killer
        
        allies.forEach(allie => {
            grantXP(allie, assistXP);
        });
    }
}

/**
 * Distribute rewards for neutral death (no killer)
 * @param {Object} unit - Killed unit
 * @param {number} bounty - Bounty amount
 * @param {number} xp - XP value
 */
function distributeNeutralDeathRewards(unit, bounty, xp) {
    // Find nearest ally hero
    let nearestAlly = null;
    let nearestDistance = Infinity;
    
    G.heroes.forEach(hero => {
        if (hero.team === unit.team && !hero.isDead) {
            const distance = getDistance(unit.position, hero.position);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestAlly = hero;
            }
        }
    });
    
    // Grant rewards to nearest ally
    if (nearestAlly) {
        grantGold(nearestAlly, bounty);
        grantXP(nearestAlly, xp);
    }
}

/**
 * Trigger death visual effects
 * @param {Object} unit - Died unit
 */
function triggerDeathVFX(unit) {
    // Simple particle effect at death position
    const particleCount = 10;
    const particleSize = 0.5;
    
    for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const distance = Math.random() * 2;
        
        const particle = {
            id: `death_${unit.id}_${i}`,
            position: {
                x: unit.position.x + Math.cos(angle) * distance,
                z: unit.position.z + Math.sin(angle) * distance,
                y: 0.5
            },
            velocity: {
                x: Math.cos(angle) * (Math.random() * 2),
                z: Math.sin(angle) * (Math.random() * 2),
                y: Math.random() * 2
            },
            lifetime: 1.0,
            size: particleSize * (0.5 + Math.random() * 0.5),
            color: unit.team === 'sentinel' ? 0x1a8a1a : 0x8a1a1a
        };
        
        // Add to particle registry (to be rendered by visual system)
        if (!G.deathParticles) {
            G.deathParticles = new Map();
        }
        G.deathParticles.set(particle.id, particle);
    }
}

/**
 * Update death particles
 * @param {number} deltaTime - Time since last frame
 */
export function updateDeathParticles(deltaTime) {
    if (!G.deathParticles) {
        return;
    }
    
    const particlesToRemove = [];
    
    G.deathParticles.forEach((particle, particleId) => {
        particle.lifetime -= deltaTime;
        
        if (particle.lifetime <= 0) {
            particlesToRemove.push(particleId);
            return;
        }
        
        // Move particle
        particle.position.x += particle.velocity.x * deltaTime;
        particle.position.z += particle.velocity.z * deltaTime;
        particle.position.y += particle.velocity.y * deltaTime - 9.8 * deltaTime * deltaTime;  // Gravity
        
        particle.velocity.y -= 9.8 * deltaTime;  // Apply gravity
    });
    
    // Remove expired particles
    particlesToRemove.forEach(id => G.deathParticles.delete(id));
}

// ============================================================================
// Respawn System
// ============================================================================

/**
 * Check for units ready to respawn
 * @param {number} currentTime - Current time in milliseconds
 */
export function checkRespawns(currentTime) {
    G.deadHeroes.forEach((respawnTime, unitId) => {
        if (currentTime >= respawnTime) {
            // Respawn unit
            const unit = G.heroes.get(unitId);
            if (unit) {
                respawnUnit(unit);
            }
        }
    });
}

/**
 * Respawn a unit
 * @param {Object} unit - Unit to respawn
 */
function respawnUnit(unit) {
    if (!unit.isDead) {
        return;
    }
    
    // Reset stats
    unit.isDead = false;
    unit.hp = unit.maxHp;
    unit.mana = unit.maxMana;
    unit.respawnTime = 0;
    
    // Reset to base position
    const basePos = unit.team === 'sentinel' 
        ? { x: 82, z: 82 }  // Sentinel fountain
        : { x: 18, z: 18 };  // Scourge fountain
    
    unit.position = { ...basePos, y: 0.15 };
    
    // Clear status effects
    if (unit.statusEffects) {
        unit.statusEffects.clear();
    }
    
    // Remove from dead heroes
    G.deadHeroes.delete(unit.id);
    
    // Dispatch respawn event
    dispatchCombatEvent('unitRespawned', {
        unitId: unit.id,
        position: unit.position
    });
    
    // Reset animation
    if (unit.currentAnim) {
        unit.currentAnim = 'idle';
    }
}

// ============================================================================
// Combat Loop Integration
// ============================================================================

/**
 * Initialize combat system
 */
export function initCombat() {
    console.log('[Combat] Combat system initialized');
    
    // Setup event listeners for game loop
    G.combatUpdate = updateCombatLoop;
}

/**
 * Update combat loop (called each frame)
 * @param {number} deltaTime - Time since last frame
 */
export function updateCombatLoop(deltaTime) {
    // Update projectiles
    updateProjectiles(deltaTime);
    
    // Update death particles
    updateDeathParticles(deltaTime);
    
    // Check respawns
    const currentTime = Date.now();
    checkRespawns(currentTime);
    
    // Decrement attack cooldowns
    G.heroes.forEach(hero => {
        if (hero.attackCooldown > 0) {
            hero.attackCooldown -= deltaTime;
            if (hero.attackCooldown < 0) {
                hero.attackCooldown = 0;
            }
        }
    });
    
    G.creeps.forEach(creep => {
        if (creep.attackCooldown > 0) {
            creep.attackCooldown -= deltaTime;
            if (creep.attackCooldown < 0) {
                creep.attackCooldown = 0;
            }
        }
    });
}

// ============================================================================
// Export
// ============================================================================

export default {
    // Event system
    onCombatEvent,
    offCombatEvent,
    
    // Damage system
    calculateDamage,
    applyDamage,
    
    // Attack system
    attackUnit,
    
    // Projectile system
    spawnProjectile,
    updateProjectiles,
    
    // Death & respawn system
    killUnit,
    grantGold,
    grantXP,
    respawnUnit,
    checkRespawns,
    updateDeathParticles,
    
    // Combat loop
    initCombat,
    updateCombatLoop,
    
    // Constants (re-export for convenience)
    DAMAGE_TYPES,
    STATUS_TYPES
};
