/**
 * Windrunner Hero Module
 * Crimson Lane - DotA 1 style MOBA
 * 
 * Hero: Windrunner (Sentinel · Agility)
 * Role: Ranged attacker with mobility and burst
 * 
 * Skills:
 * - Q: Shackleshot - Long-range stun with tree/unit chaining
 * - W: Powershot - Vector-target long-range piercing arrow
 * - E: Windrun - Self movement buff with evasion
 * - R: Focus Fire - Max attack speed on target
 */

import { buildWindrunner } from '../hero-models.js';
import { CAST_RANGES, TARGET_TYPES, DAMAGE_TYPES, STATUS_TYPES } from '../constants.js';

// ============================================================================
// Skill Templates
// ============================================================================

export function getSkillTemplates() {
    return {
        // Q: Shackleshot - Long-range stun with tree/unit chaining
        shackleshot: {
            id: 'shackleshot',
            name: 'Shackleshot',
            description: 'Fires arrow at target, chaining to trees/other units',
            slot: 'Q',
            skillType: 'active',
            targetRule: TARGET_TYPES.enemyUnit,
            castRange: 600,
            damageType: DAMAGE_TYPES.physical,
            
            // Costs and cooldowns
            manaCostByLevel: [90, 100, 110, 120],
            cooldownByLevel: [15, 15, 15, 15],
            levelRequirement: 1,
            maxLevel: 4,
            
            // Effect values per level
            effectValuesByLevel: {
                stunDuration: [0.75, 1.5, 2.25, 3.0]
            }
        },
        
        // W: Powershot - Vector-target long-range piercing arrow
        powershot: {
            id: 'powershot',
            name: 'Powershot',
            description: 'Channels and fires a giant arrow through line',
            slot: 'W',
            skillType: 'active',
            targetRule: TARGET_TYPES.groundOrAllyUnit,
            castRange: 1700,
            effectRadius: 60,
            channelTime: 1,
            damageType: DAMAGE_TYPES.magical,
            
            // Costs and cooldowns
            manaCostByLevel: [90, 100, 110, 120],
            cooldownByLevel: [12, 12, 12, 12],
            levelRequirement: 1,
            maxLevel: 4,
            
            // Effect values per level
            effectValuesByLevel: {
                damage: [340, 480, 620, 760],
                damageDecay: [0.1, 0.1, 0.1, 0.1]
            }
        },
        
        // E: Windrun - Self movement buff with evasion
        windrun: {
            id: 'windrun',
            name: 'Windrun',
            description: 'Gives +50% evasion and move speed',
            slot: 'E',
            skillType: 'active',
            targetRule: TARGET_TYPES.self,
            castRange: 0,
            duration: 3,
            damageType: DAMAGE_TYPES.pure,
            
            // Costs and cooldowns
            manaCostByLevel: [100, 100, 100, 100],
            cooldownByLevel: [15, 12, 9, 6],
            levelRequirement: 1,
            maxLevel: 4,
            
            // Effect values per level
            effectValuesByLevel: {
                moveSpeedBonus: [50, 50, 50, 50],
                evasionBonus: [50, 50, 50, 50]
            }
        },
        
        // R: Focus Fire - Max attack speed on target
        focusFire: {
            id: 'focus_fire',
            name: 'Focus Fire',
            description: 'Attacks target at max attack speed',
            slot: 'R',
            skillType: 'active',
            targetRule: TARGET_TYPES.enemyUnit,
            castRange: 600,
            duration: 20,
            damageType: DAMAGE_TYPES.physical,
            
            // Costs and cooldowns
            manaCostByLevel: [200, 275, 350],
            cooldownByLevel: [60, 60, 60],
            levelRequirement: 6,
            maxLevel: 3,
            
            // Effect values per level
            effectValuesByLevel: {
                attackSpeed: [400, 600, 800],
                damagePenalty: [8, 4, 0]
            }
        }
    };
}

// ============================================================================
// Hero Build Model
// ============================================================================

/**
 * Build Windrunner hero model
 * @param {number} level - Hero level (1-25)
 * @param {string} team - Team affiliation ('sentinel' | 'scourge')
 * @returns {THREE.Group} Hero Three.js group
 */
export function buildModel(level, team) {
    const group = buildWindrunner();
    
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
