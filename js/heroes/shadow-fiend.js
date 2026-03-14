/**
 * Shadow Fiend Hero Module
 * Crimson Lane - DotA 1 style MOBA
 * 
 * Hero: Shadow Fiend (Scourge · Agility)
 * Role: Melee attacker with soul collection and AoE damage
 * 
 * Skills:
 * - Q: Shadowraze (×3 variants) - Fixed-range AoEs
 * - W: Necromastery (Passive) - Soul collection
 * - E: Presence of the Dark Lord (Passive Aura) - Enemy armor reduction
 * - R: Requiem of Souls - All souls fire as lines
 */

import { buildShadowFiend } from '../hero-models.js';
import { CAST_RANGES, TARGET_TYPES, DAMAGE_TYPES } from '../constants.js';

// ============================================================================
// Skill Templates
// ============================================================================

export function getSkillTemplates() {
    return {
        // Q: Shadowraze - Fixed-range AoEs (3 variants)
        shadowrazeShort: {
            id: 'shadowraze_short',
            name: 'Shadowraze (Short)',
            description: 'Creates black smoke at 200 units ahead',
            slot: 'Q',
            skillType: 'active',
            targetRule: TARGET_TYPES.ground,
            castRange: 200,
            effectRadius: 120,
            damageType: DAMAGE_TYPES.magical,
            
            // Costs and cooldowns
            manaCostByLevel: [75, 75, 75, 75],
            cooldownByLevel: [10, 10, 10, 10],
            levelRequirement: 1,
            maxLevel: 4,
            
            // Effect values per level
            effectValuesByLevel: {
                damage: [75, 150, 225, 300]
            }
        },
        
        shadowrazeMedium: {
            id: 'shadowraze_medium',
            name: 'Shadowraze (Medium)',
            description: 'Creates black smoke at 450 units ahead',
            slot: 'Q',
            skillType: 'active',
            targetRule: TARGET_TYPES.ground,
            castRange: 450,
            effectRadius: 120,
            damageType: DAMAGE_TYPES.magical,
            
            // Costs and cooldowns
            manaCostByLevel: [75, 75, 75, 75],
            cooldownByLevel: [10, 10, 10, 10],
            levelRequirement: 1,
            maxLevel: 4,
            
            // Effect values per level
            effectValuesByLevel: {
                damage: [75, 150, 225, 300]
            }
        },
        
        shadowrazeLong: {
            id: 'shadowraze_long',
            name: 'Shadowraze (Long)',
            description: 'Creates black smoke at 700 units ahead',
            slot: 'Q',
            skillType: 'active',
            targetRule: TARGET_TYPES.ground,
            castRange: 700,
            effectRadius: 120,
            damageType: DAMAGE_TYPES.magical,
            
            // Costs and cooldowns
            manaCostByLevel: [75, 75, 75, 75],
            cooldownByLevel: [10, 10, 10, 10],
            levelRequirement: 1,
            maxLevel: 4,
            
            // Effect values per level
            effectValuesByLevel: {
                damage: [75, 150, 225, 300]
            }
        },
        
        // W: Necromastery (Passive) - Soul collection
        necromastery: {
            id: 'necromastery',
            name: 'Necromastery',
            description: 'Passive - Gain souls on kills, each soul adds damage',
            slot: 'W',
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
                maxSouls: [12, 16, 20, 24],
                damagePerSoul: [2, 2, 2, 2]
            }
        },
        
        // E: Presence of the Dark Lord (Passive Aura) - Enemy armor reduction
        presenceOfDarkLord: {
            id: 'presence_of_dark_lord',
            name: 'Presence of the Dark Lord',
            description: 'Passive aura - Reduces enemy armor in 900 radius',
            slot: 'E',
            skillType: 'passive',
            targetRule: TARGET_TYPES.self,
            castRange: 0,
            auraRadius: 900,
            damageType: DAMAGE_TYPES.pure,
            
            // Costs and cooldowns
            manaCostByLevel: [0, 0, 0, 0],
            cooldownByLevel: [0, 0, 0, 0],
            levelRequirement: 1,
            maxLevel: 4,
            
            // Effect values per level
            effectValuesByLevel: {
                armorReduction: [3, 4, 5, 6]
            }
        },
        
        // R: Requiem of Souls - All souls fire as lines
        requiemOfSouls: {
            id: 'requiem_of_souls',
            name: 'Requiem of Souls',
            description: 'All stored souls fire as lines outward, then pull back',
            slot: 'R',
            skillType: 'active',
            targetRule: TARGET_TYPES.self,
            castRange: 0,
            effectRadius: 1000,
            damageType: DAMAGE_TYPES.magical,
            
            // Costs and cooldowns
            manaCostByLevel: [150, 175, 200],
            cooldownByLevel: [120, 110, 100],
            levelRequirement: 6,
            maxLevel: 3,
            
            // Effect values per level
            effectValuesByLevel: {
                damagePerSoul: [80, 120, 160],
                slowPercentage: [20, 30, 50],
                slowDuration: [0.5, 0.5, 0.5]
            }
        }
    };
}

// ============================================================================
// Hero Build Model
// ============================================================================

/**
 * Build Shadow Fiend hero model
 * @param {number} level - Hero level (1-25)
 * @param {string} team - Team affiliation ('sentinel' | 'scourge')
 * @returns {THREE.Group} Hero Three.js group
 */
export function buildModel(level, team) {
    const group = buildShadowFiend();
    
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
