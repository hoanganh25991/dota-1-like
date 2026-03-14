/**
 * Dragon Knight Hero Module
 * Crimson Lane - DotA 1 style MOBA
 * 
 * Hero: Dragon Knight (Sentinel · Strength)
 * Role: Tanky melee fighter with transformation
 * 
 * Skills:
 * - Q: Dragon Blood (Passive) - Self regen and armor
 * - W: Dragon Tail - Melee stun + damage
 * - E: Breathe Fire - Line AoE damage
 * - R: Elder Dragon Form - Transformation
 */

import { buildDragonKnight } from '../hero-models.js';
import { CAST_RANGES, TARGET_TYPES, DAMAGE_TYPES, STATUS_TYPES } from '../constants.js';

// ============================================================================
// Skill Templates
// ============================================================================

export function getSkillTemplates() {
    return {
        // Q: Dragon Blood (Passive) - Self regen and armor
        dragonBlood: {
            id: 'dragon_blood',
            name: 'Dragon Blood',
            description: 'Passive - Increases HP regen and armor',
            slot: 'Q',
            skillType: 'passive',
            targetRule: TARGET_TYPES.self,
            castRange: 0,
            damageType: DAMAGE_TYPES.pure,
            
            // Costs and cooldowns
            manaCostByLevel: [0, 0, 0, 0],
            cooldownByLevel: [0, 0, 0, 0],
            levelRequirement: 1,
            maxLevel: 4,
            
            // Effect values per level
            effectValuesByLevel: {
                hpRegenBonus: [3, 6, 9, 12],
                armorBonus: [3, 4, 5, 6]
            }
        },
        
        // W: Dragon Tail - Melee stun + damage
        dragonTail: {
            id: 'dragon_tail',
            name: 'Dragon Tail',
            description: 'Shield bash that stuns and damages enemies',
            slot: 'W',
            skillType: 'active',
            targetRule: TARGET_TYPES.enemyUnit,
            castRange: 150,
            damageType: DAMAGE_TYPES.magical,
            
            // Costs and cooldowns
            manaCostByLevel: [100, 100, 100, 100],
            cooldownByLevel: [9, 9, 9, 9],
            levelRequirement: 1,
            maxLevel: 4,
            
            // Effect values per level
            effectValuesByLevel: {
                damage: [25, 50, 75, 100],
                stunDuration: [2, 2, 2, 2.5]
            }
        },
        
        // E: Breathe Fire - Line AoE damage
        breatheFire: {
            id: 'breathe_fire',
            name: 'Breathe Fire',
            description: 'Sprays fire in a cone, damaging and reducing enemy attack damage',
            slot: 'E',
            skillType: 'active',
            targetRule: TARGET_TYPES.enemyUnitOrGround,
            castRange: 600,
            effectRadius: 60,
            damageType: DAMAGE_TYPES.magical,
            
            // Costs and cooldowns
            manaCostByLevel: [100, 110, 120, 130],
            cooldownByLevel: [15, 12, 9, 6],
            levelRequirement: 1,
            maxLevel: 4,
            
            // Effect values per level
            effectValuesByLevel: {
                damage: [75, 150, 225, 300],
                damageReduction: [35, 35, 35, 35],
                damageReductionDuration: [5, 5, 5, 5]
            }
        },
        
        // R: Elder Dragon Form - Transformation
        dragonForm: {
            id: 'dragon_form',
            name: 'Elder Dragon Form',
            description: 'Transforms into an Elder Dragon with enhanced abilities',
            slot: 'R',
            skillType: 'toggle',
            targetRule: TARGET_TYPES.self,
            castRange: 0,
            duration: 60,
            damageType: DAMAGE_TYPES.pure,
            
            // Costs and cooldowns
            manaCostByLevel: [0, 0, 0],
            cooldownByLevel: [100, 100, 100],
            levelRequirement: 6,
            maxLevel: 3,
            
            // Effect values per level
            effectValuesByLevel: {
                armorBonus: [15, 15, 15],
                moveSpeedBonus: [50, 50, 50],
                attackRange: [500, 500, 500],
                attackSpeed: [400, 400, 400]
            }
        }
    };
}

// ============================================================================
// Hero Build Model
// ============================================================================

/**
 * Build Dragon Knight hero model
 * @param {number} level - Hero level (1-25)
 * @param {string} team - Team affiliation ('sentinel' | 'scourge')
 * @returns {THREE.Group} Hero Three.js group
 */
export function buildModel(level, team) {
    const group = buildDragonKnight();
    
    // Add team indicator light
    const teamLight = team === 'sentinel'
        ? new THREE.PointLight(0x1a8a1a, 0.3, 2.0)
        : new THREE.PointLight(0x8a1a1a, 0.3, 2.0);
    teamLight.position.set(0, 0.1, 0);
    group.add(teamLight);
    
    return group;
}

// ============================================================================
// Export
// ============================================================================

export default {
    buildModel,
    getSkillTemplates
};
