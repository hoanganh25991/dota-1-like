/**
 * Sniper Hero Module
 * Crimson Lane - DotA 1 style MOBA
 * 
 * Hero: Sniper (Sentinel · Agility)
 * Role: Long-range damage dealer with burst damage
 * 
 * Skills:
 * - Q: Shrapnel - Point-target AoE zone
 * - W: Headshot (Passive) - Critical strike proc
 * - E: Aim (Passive) - Increased attack range
 * - R: Assassinate - Global long-range kill
 */

import { buildSniper } from '../hero-models.js';
import { CAST_RANGES, TARGET_TYPES, DAMAGE_TYPES } from '../constants.js';

// ============================================================================
// Skill Templates
// ============================================================================

export function getSkillTemplates() {
    return {
        // Q: Shrapnel - Point-target AoE zone
        shrapnel: {
            id: 'shrapnel',
            name: 'Shrapnel',
            description: 'Rains shrapnel in a zone, dealing damage over time',
            slot: 'Q',
            skillType: 'active',
            targetRule: TARGET_TYPES.ground,
            castRange: 900,
            effectRadius: 350,
            duration: 9,
            damageType: DAMAGE_TYPES.physical,
            
            // Costs and cooldowns
            manaCostByLevel: [120, 120, 120, 120],
            cooldownByLevel: [22, 22, 22, 22],
            levelRequirement: 1,
            maxLevel: 4,
            
            // Effect values per level
            effectValuesByLevel: {
                damagePerSecond: [15, 30, 45, 60],
                slowPercentage: [30, 30, 30, 30],
                slowDuration: [9, 9, 9, 9]
            }
        },
        
        // W: Headshot (Passive) - Critical strike proc
        headshot: {
            id: 'headshot',
            name: 'Headshot',
            description: 'Passive - Chance for bonus damage and mini-stun',
            slot: 'W',
            skillType: 'passive',
            targetRule: TARGET_TYPES.self,
            castRange: 0,
            damageType: DAMAGE_TYPES.physical,
            
            // Costs and cooldowns
            manaCostByLevel: [0, 0, 0, 0],
            cooldownByLevel: [0, 0, 0, 0],
            levelRequirement: 1,
            maxLevel: 4,
            
            // Effect values per level
            effectValuesByLevel: {
                procChance: [40, 40, 40, 40],
                bonusDamage: [30, 55, 80, 115],
                stunDuration: [0.5, 0.5, 0.5, 0.5]
            }
        },
        
        // E: Aim (Passive) - Increased attack range
        aim: {
            id: 'aim',
            name: 'Aim',
            description: 'Passive - Increases attack range',
            slot: 'E',
            skillType: 'passive',
            targetRule: TARGET_TYPES.self,
            castRange: 0,
            damageType: DAMAGE_TYPES.physical,
            
            // Costs and cooldowns
            manaCostByLevel: [0, 0, 0, 0],
            cooldownByLevel: [0, 0, 0, 0],
            levelRequirement: 1,
            maxLevel: 4,
            
            // Effect values per level
            effectValuesByLevel: {
                rangeBonus: [75, 150, 225, 300]
            }
        },
        
        // R: Assassinate - Global long-range kill
        assassinate: {
            id: 'assassinate',
            name: 'Assassinate',
            description: 'Channel to fire a deadly shot at a distant target',
            slot: 'R',
            skillType: 'active',
            targetRule: TARGET_TYPES.enemyUnit,
            castRange: 'global',
            damageType: DAMAGE_TYPES.magical,
            
            // Costs and cooldowns
            manaCostByLevel: [175, 250, 275],
            cooldownByLevel: [20, 20, 20],
            channelTime: 1.7,
            levelRequirement: 6,
            maxLevel: 3,
            
            // Effect values per level
            effectValuesByLevel: {
                damage: [355, 505, 655],
                slowDuration: [0.5, 0.5, 0.5]
            }
        }
    };
}

// ============================================================================
// Hero Build Model
// ============================================================================

/**
 * Build Sniper hero model
 * @param {number} level - Hero level (1-25)
 * @param {string} team - Team affiliation ('sentinel' | 'scourge')
 * @returns {THREE.Group} Hero Three.js group
 */
export function buildModel(level, team) {
    const group = buildSniper();
    
    // Set team color
    const teamColor = team === 'sentinel' ? 0x1a8a1a : 0x8a1a1a;
    
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
