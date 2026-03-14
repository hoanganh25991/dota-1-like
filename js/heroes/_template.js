/**
 * Hero Class Template
 * Crimson Lane - DotA 1 style MOBA
 * 
 * Base class for all heroes with core functionality:
 * - Stats management (STR, AGI, INT, HP, mana, armor, move speed, attack speed)
 * - Position/rotation
 * - Health/mana state
 * - Animation states (idle/walk/attack/death)
 * - State machine (alive | dead | respawning)
 * - Level system with XP tracking
 * - Stat calculation based on base stats + growth per level
 * - Animation speed scaling based on attack speed stat
 * - Attack range and projectile handling
 */

import { HERO_BASE_STATS, ATTR_MULTIPLIERS } from '../constants.js';

// Animation state constants
export const ANIMATION_STATES = {
    IDLE: 'idle',
    WALK: 'walk',
    ATTACK: 'attack',
    CAST: 'cast',
    DEATH: 'death',
    HIT: 'hit',
    CHANNEL: 'channel'
};

// Hero state constants
export const HERO_STATES = {
    ALIVE: 'alive',
    DEAD: 'dead',
    RESPAWNING: 'respawning'
};

// Attack type constants
export const ATTACK_TYPES = {
    MELEE: 'melee',
    RANGED: 'ranged'
};

// Damage type constants
export const DAMAGE_TYPES = {
    PHYSICAL: 'physical',
    MAGICAL: 'magical',
    PURE: 'pure'
};

/**
 * Base Hero class
 */
export class Hero {
    /**
     * Create a new Hero instance
     * @param {Object} options
     * @param {string} options.heroId - Hero ID (e.g., 'lich', 'sniper')
     * @param {string} options.team - Team affiliation ('sentinel' | 'scourge')
     * @param {Vector3} options.position - Initial position
     * @param {number} [options.level=1] - Starting level
     */
    constructor({ heroId, team, position, level = 1 }) {
        // Core identity
        this.heroId = heroId;
        this.team = team;
        this.position = { ...position };
        this.rotation = 0; // Y-axis rotation in radians
        
        // Stats from base stats
        this.level = level;
        this.xp = 0;
        this.xpToNextLevel = this._getXpRequired(level);
        
        // Base attributes
        this.baseStats = {
            strength: HERO_BASE_STATS.strength,
            agility: HERO_BASE_STATS.agility,
            intelligence: HERO_BASE_STATS.intelligence,
            hp: HERO_BASE_STATS.hp,
            mana: HERO_BASE_STATS.mana,
            hpRegen: HERO_BASE_STATS.hpRegen,
            manaRegen: HERO_BASE_STATS.manaRegen,
            moveSpeed: HERO_BASE_STATS.moveSpeed,
            attackSpeed: HERO_BASE_STATS.attackSpeed,
            attackTime: HERO_BASE_STATS.attackTime,
            attackRange: HERO_BASE_STATS.attackRange,
            damageMin: HERO_BASE_STATS.damageMin,
            damageMax: HERO_BASE_STATS.damageMax,
            armor: HERO_BASE_STATS.armor,
            magicResist: HERO_BASE_STATS.magicResist,
            statusResist: HERO_BASE_STATS.statusResist,
            viewDistance: HERO_BASE_STATS.vision
        };
        
        // Derived stats (calculated from base + level)
        this.stats = this._calculateStats();
        
        // Current state
        this.hp = this.stats.maxHp;
        this.mana = this.stats.maxMana;
        this.state = HERO_STATES.ALIVE;
        
        // Animation state
        this.currentAnim = ANIMATION_STATES.IDLE;
        this.animTime = 0;
        this.animSpeed = 1.0;
        
        // Combat state
        this.isAttacking = false;
        this.isCasting = false;
        this.lastAttackTime = 0;
        this.attackCooldown = 0;
        this.targetId = null;
        
        // Combat properties
        this.attackType = ATTACK_TYPES.RANGED; // Default to ranged
        this.projectileSpeed = 800; // World units per second
        
        // Status effects
        this.statusEffects = new Map();
        
        // Entity references
        this.mesh = null;
        this.group = null;
        this.light = null;
        
        // Team-specific color
        this.teamColor = team === 'sentinel' ? 0x1a8a1a : 0x8a1a1a;
    }
    
    // =========================================================================
    // Stats Calculation
    // =========================================================================
    
    /**
     * Calculate derived stats based on base stats and level
     * @returns {Object} Calculated stats
     */
    _calculateStats() {
        const level = this.level;
        const str = this.baseStats.strength + (level - 1) * 1.75;
        const agi = this.baseStats.agility + (level - 1) * 1.5;
        const int = this.baseStats.intelligence + (level - 1) * 3.0;
        
        // HP calculation: baseHP + strength * hpPerStrength + levelGrowthHP
        const hp = this.baseStats.hp + str * ATTR_MULTIPLIERS.hpPerStrength + (level - 1) * 100;
        
        // Mana calculation: baseMana + intelligence * manaPerIntelligence + levelGrowthMana
        const mana = this.baseStats.mana + int * ATTR_MULTIPLIERS.manaPerIntelligence + (level - 1) * 50;
        
        // HP regen: base + strength * hpRegenPerStrength
        const hpRegen = this.baseStats.hpRegen + str * ATTR_MULTIPLIERS.hpRegenPerStrength;
        
        // Mana regen: base + intelligence * manaRegenPerIntelligence
        const manaRegen = this.baseStats.manaRegen + int * ATTR_MULTIPLIERS.manaRegenPerIntelligence;
        
        // Armor: base + agility * armorPerAgility
        const armor = this.baseStats.armor + agi * ATTR_MULTIPLIERS.armorPerAgility;
        
        // Attack speed: base + agility * attackSpeedPerAgility
        const attackSpeed = this.baseStats.attackSpeed + agi * ATTR_MULTIPLIERS.attackSpeedPerAgility;
        
        // Damage: base + strength * damagePerStrength + agility * damagePerAgility
        const damageMin = this.baseStats.damageMin + str * ATTR_MULTIPLIERS.damagePerStrength + agi * ATTR_MULTIPLIERS.damagePerAgility;
        const damageMax = this.baseStats.damageMax + str * ATTR_MULTIPLIERS.damagePerStrength + agi * ATTR_MULTIPLIERS.damagePerAgility;
        
        // Move speed (clamped)
        const moveSpeed = Math.max(100, Math.min(550, this.baseStats.moveSpeed));
        
        // Attack range (clamped for melee vs ranged)
        const attackRange = this.baseStats.attackRange;
        
        // Attack interval: 1700 / (1 + attackSpeed / 100)
        const attackInterval = 1700 / (1 + attackSpeed / 100);
        
        return {
            strength: Math.floor(str),
            agility: Math.floor(agi),
            intelligence: Math.floor(int),
            maxHp: Math.floor(hp),
            maxMana: Math.floor(mana),
            hpRegen,
            manaRegen,
            armor,
            attackSpeed,
            attackInterval,
            damageMin,
            damageMax,
            moveSpeed,
            attackRange,
            viewDistance: HERO_BASE_STATS.vision,
            magicResist: this.baseStats.magicResist,
            statusResist: this.baseStats.statusResist
        };
    }
    
    /**
     * Update stats when level changes
     */
    recalcStats() {
        this.stats = this._calculateStats();
        this.hp = Math.min(this.hp, this.stats.maxHp);
        this.mana = Math.min(this.mana, this.stats.maxMana);
    }
    
    /**
     * Get XP required for next level
     * @param {number} level - Current level
     * @returns {number} XP required
     */
    _getXpRequired(level) {
        // XP curve: 200, 400, 600, 800, 1000, etc.
        return 200 + (level - 1) * 200;
    }
    
    /**
     * Gain XP and level up if threshold reached
     * @param {number} xp - XP to gain
     * @returns {Object} Level up info
     */
    gainXp(xp) {
        if (this.state !== HERO_STATES.ALIVE) return { leveledUp: false, newLevel: this.level };
        
        this.xp += xp;
        let leveledUp = false;
        let newLevel = this.level;
        
        while (this.xp >= this.xpToNextLevel && this.level < 25) {
            this.level++;
            this.xp -= this.xpToNextLevel;
            this.xpToNextLevel = this._getXpRequired(this.level);
            this.recalcStats();
            leveledUp = true;
            newLevel = this.level;
        }
        
        return { leveledUp, newLevel, xpGained: xp };
    }
    
    // =========================================================================
    // Movement & Rotation
    // =========================================================================
    
    /**
     * Move hero in world space
     * @param {Vector3} direction - Movement direction vector
     * @param {number} dt - Delta time in seconds
     */
    move(direction, dt) {
        if (this.state !== HERO_STATES.ALIVE) return;
        
        const speed = this.stats.moveSpeed / 100; // Normalize to world units per second
        this.position.x += direction.x * speed * dt;
        this.position.z += direction.z * speed * dt;
        
        this.currentAnim = ANIMATION_STATES.WALK;
        this.animTime += dt * this.animSpeed;
    }
    
    /**
     * Rotate hero to face a target
     * @param {Vector3} targetPos - Target position
     */
    rotateTo(targetPos) {
        const dx = targetPos.x - this.position.x;
        const dz = targetPos.z - this.position.z;
        this.rotation = Math.atan2(dx, dz);
    }
    
    /**
     * Set hero position directly
     * @param {Vector3} position - New position
     */
    setPosition(position) {
        this.position = { ...position };
    }
    
    /**
     * Set hero rotation directly
     * @param {number} rotation - Rotation in radians
     */
    setRotation(rotation) {
        this.rotation = rotation;
    }
    
    // =========================================================================
    // Combat System
    // =========================================================================
    
    /**
     * Attack a target
     * @param {string} targetId - Target entity ID
     * @returns {boolean} Whether attack started
     */
    attack(targetId) {
        if (this.state !== HERO_STATES.ALIVE) return false;
        if (this.isAttacking) return false;
        
        this.targetId = targetId;
        this.isAttacking = true;
        this.lastAttackTime = Date.now();
        this.currentAnim = ANIMATION_STATES.ATTACK;
        
        // Calculate animation speed based on attack speed stat
        // animationSpeed = 1700 / attackInterval
        this.animSpeed = 1700 / this.stats.attackInterval;
        
        return true;
    }
    
    /**
     * Check if attack hit is successful
     * @param {Object} target - Target entity
     * @returns {boolean} Whether hit registered
     */
    checkAttackHit(target) {
        if (!this.isAttacking || !target) return false;
        
        const distance = Math.sqrt(
            Math.pow(target.position.x - this.position.x, 2) +
            Math.pow(target.position.z - this.position.z, 2)
        );
        
        return distance <= this.stats.attackRange + 4;
    }
    
    /**
     * Deal damage to target
     * @param {Object} target - Target entity
     * @param {number} damage - Damage amount
     * @param {string} damageType - 'physical' | 'magical' | 'pure'
     * @returns {Object} Damage result
     */
    dealDamage(target, damage, damageType = DAMAGE_TYPES.PHYSICAL) {
        if (!target || target.isDead) return null;
        
        let damageDealt = damage;
        
        // Apply armor reduction for physical damage
        if (damageType === DAMAGE_TYPES.PHYSICAL && target.stats?.armor !== undefined) {
            damageDealt = damage * 100 / (100 + target.stats.armor * 6);
        }
        
        target.takeDamage(damageDealt, this.heroId, damageType);
        
        return {
            damage: damageDealt,
            damageType,
            targetId: target.id,
            isCrit: false
        };
    }
    
    /**
     * Take damage from attacker
     * @param {number} damage - Damage amount
     * @param {string} attackerId - Attacker hero ID
     * @param {string} damageType - 'physical' | 'magical' | 'pure'
     */
    takeDamage(damage, attackerId, damageType = DAMAGE_TYPES.PHYSICAL) {
        if (this.state !== HERO_STATES.ALIVE) return;
        
        this.hp -= damage;
        
        // Trigger hit animation
        this.currentAnim = ANIMATION_STATES.HIT;
        
        // Check for death
        if (this.hp <= 0) {
            this.hp = 0;
            this.die(attackerId);
        }
    }
    
    /**
     * Hero dies
     * @param {string} killerId - Killer hero ID
     */
    die(killerId) {
        this.state = HERO_STATES.DEAD;
        this.currentAnim = ANIMATION_STATES.DEATH;
        this.isAttacking = false;
        this.isCasting = false;
        
        // Respawn timer: 5 + level * 2 seconds
        this.respawnTime = 5 + this.level * 2;
        
        // Send death event
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('heroDied', {
                detail: { heroId: this.heroId, killerId, team: this.team, level: this.level }
            }));
        }
    }
    
    /**
     * Respawn hero at base
     */
    respawn() {
        if (this.state !== HERO_STATES.DEAD) return;
        
        this.state = HERO_STATES.RESPAWNING;
        this.currentAnim = ANIMATION_STATES.IDLE;
        this.hp = this.stats.maxHp;
        this.mana = this.stats.maxMana;
        
        // Reset after respawn time
        setTimeout(() => {
            this.state = HERO_STATES.ALIVE;
            this.currentAnim = ANIMATION_STATES.IDLE;
            
            // Reset to base position
            const basePos = this.team === 'sentinel' 
                ? { x: 85, z: 85 }
                : { x: 15, z: 15 };
            this.position = { ...basePos, y: 0.15 };
            this.rotation = Math.PI; // Face toward enemy base
            
            if (typeof window !== 'undefined' && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('heroRespawned', {
                    detail: { heroId: this.heroId, team: this.team }
                }));
            }
        }, this.respawnTime * 1000);
    }
    
    // =========================================================================
    // Casting System
    // =========================================================================
    
    /**
     * Cast a skill
     * @param {Object} skill - Skill definition
     * @param {string} targetId - Target entity ID (optional)
     * @param {Vector3} targetPos - Target position (optional)
     * @returns {boolean} Whether cast started
     */
    castSkill(skill, targetId = null, targetPos = null) {
        if (this.state !== HERO_STATES.ALIVE) return false;
        if (this.isCasting) return false;
        
        // Check mana cost
        const manaCost = skill.manaCost || 0;
        if (this.mana < manaCost) return false;
        
        // Check cooldown
        const now = Date.now();
        const cooldownEnd = this.lastCastTime?.[skill.id] || 0;
        if (now < cooldownEnd) return false;
        
        this.mana -= manaCost;
        this.isCasting = true;
        this.currentAnim = ANIMATION_STATES.CAST;
        
        // Store cast info
        this.currentCast = {
            skill,
            targetId,
            targetPos,
            startTime: now
        };
        
        // Calculate animation speed for cast
        // For skills, animation speed scales with attack speed
        this.animSpeed = 1700 / this.stats.attackInterval;
        
        return true;
    }
    
    /**
     * End a cast (called after animation completes)
     */
    endCast() {
        if (!this.isCasting) return;
        
        this.isCasting = false;
        this.currentAnim = ANIMATION_STATES.IDLE;
        
        if (this.currentCast) {
            // Apply skill effects
            this._applySkillEffect(this.currentCast);
            
            // Set cooldown
            if (!this.lastCastTime) this.lastCastTime = {};
            this.lastCastTime[this.currentCast.skill.id] = 
                Date.now() + (this.currentCast.skill.cooldown || 0) * 1000;
            
            this.currentCast = null;
        }
    }
    
    /**
     * Apply skill effect (to be overridden by hero-specific implementation)
     * @param {Object} castInfo - Cast information
     */
    _applySkillEffect(castInfo) {
        // Base implementation - no effect
        // Hero-specific implementations should override this
    }
    
    // =========================================================================
    // Update System
    // =========================================================================
    
    /**
     * Update hero state
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        if (this.state === HERO_STATES.RESPAWNING) return;
        
        // Regenerate HP and mana
        this.hp = Math.min(this.hp + this.stats.hpRegen * dt, this.stats.maxHp);
        this.mana = Math.min(this.mana + this.stats.manaRegen * dt, this.stats.maxMana);
        
        // Handle attack cooldown
        if (this.isAttacking) {
            if (Date.now() - this.lastAttackTime >= this.stats.attackInterval) {
                this.isAttacking = false;
                this.currentAnim = ANIMATION_STATES.IDLE;
                this.targetId = null;
            }
        }
        
        // Handle cast completion
        if (this.isCasting && this.currentCast) {
            const castDuration = this.currentCast.skill.castTime || 0.5;
            if (Date.now() - this.currentCast.startTime >= castDuration * 1000) {
                this.endCast();
            }
        }
        
        // Update animation time for idle/walk
        if (this.currentAnim === ANIMATION_STATES.IDLE) {
            this.animTime += dt * 1.5; // Base idle animation speed
        } else if (this.currentAnim === ANIMATION_STATES.WALK) {
            this.animTime += dt * this.animSpeed;
        }
    }
    
    // =========================================================================
    // Entity Management
    // =========================================================================
    
    /**
     * Set the Three.js mesh for this hero
     * @param {THREE.Mesh} mesh - Hero mesh
     */
    setMesh(mesh) {
        this.mesh = mesh;
    }
    
    /**
     * Set the Three.js group for this hero (for transforms)
     * @param {THREE.Group} group - Hero group
     */
    setGroup(group) {
        this.group = group;
    }
    
    /**
     * Set the team light for this hero
     * @param {THREE.PointLight} light - Team color point light
     */
    setTeamLight(light) {
        this.light = light;
    }
    
    /**
     * Add a status effect
     * @param {Object} effect - Status effect definition
     */
    addStatusEffect(effect) {
        this.statusEffects.set(effect.type, {
            ...effect,
            startTime: Date.now(),
            endTime: Date.now() + effect.duration * 1000
        });
    }
    
    /**
     * Remove a status effect
     * @param {string} type - Effect type
     */
    removeStatusEffect(type) {
        this.statusEffects.delete(type);
    }
    
    /**
     * Check if hero has a status effect
     * @param {string} type - Effect type
     * @returns {boolean}
     */
    hasStatusEffect(type) {
        return this.statusEffects.has(type);
    }
    
    /**
     * Get status effect by type
     * @param {string} type - Effect type
     * @returns {Object | undefined}
     */
    getStatusEffect(type) {
        return this.statusEffects.get(type);
    }
    
    // =========================================================================
    // Utility Methods
    // =========================================================================
    
    /**
     * Get hero info for debugging
     * @returns {Object} Hero info
     */
    getInfo() {
        return {
            heroId: this.heroId,
            team: this.team,
            level: this.level,
            xp: this.xp,
            xpToNextLevel: this.xpToNextLevel,
            hp: this.hp,
            maxHp: this.stats.maxHp,
            mana: this.mana,
            maxMana: this.stats.maxMana,
            strength: this.stats.strength,
            agility: this.stats.agility,
            intelligence: this.stats.intelligence,
            armor: this.stats.armor,
            attackSpeed: this.stats.attackSpeed,
            moveSpeed: this.stats.moveSpeed,
            attackRange: this.stats.attackRange,
            state: this.state,
            currentAnim: this.currentAnim
        };
    }
    
    /**
     * Check if hero is alive
     * @returns {boolean}
     */
    isAlive() {
        return this.state === HERO_STATES.ALIVE;
    }
    
    /**
     * Check if hero is dead
     * @returns {boolean}
     */
    isDead() {
        return this.state === HERO_STATES.DEAD;
    }
    
    /**
     * Check if hero is respawning
     * @returns {boolean}
     */
    isRespawning() {
        return this.state === HERO_STATES.RESPAWNING;
    }
}

// ============================================================================
// Export
// ============================================================================

export default Hero;
