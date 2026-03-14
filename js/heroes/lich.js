/**
 * Lich Hero Module
 * Crimson Lane - DotA 1 style MOBA
 * 
 * Hero: Lich (Scourge · Intelligence)
 * Role: Ranged damage dealer with crowd control
 * 
 * Skills:
 * - Q: Frost Nova - AoE damage + slow
 * - W: Dark Ritual - Mana restore via creep sacrifice
 * - E: Chain Frost - Multi-target projectile
 * - R: Frost Armor - Team buff (armor + attack speed)
 */

import { buildLich } from '../hero-models.js';
import { CAST_RANGES, TARGET_TYPES, DAMAGE_TYPES, STATUS_TYPES } from '../constants.js';

// ============================================================================
// Skill Templates
// ============================================================================

export function getSkillTemplates() {
    return {
        // Q: Frost Nova - Point-target AoE damage + slow
        frostNova: {
            id: 'frost_nova',
            name: 'Frost Nova',
            description: 'Explodes with frost energy, damaging and slowing nearby enemies',
            slot: 'Q',
            skillType: 'active',
            targetRule: TARGET_TYPES.ground,
            castRange: 600,
            effectRadius: 400,
            damageType: DAMAGE_TYPES.magical,
            
            // Costs and cooldowns
            manaCostByLevel: [120, 130, 145, 160],
            cooldownByLevel: [7, 6, 5, 4],
            levelRequirement: 1,
            maxLevel: 4,
            
            // Effect values per level
            effectValuesByLevel: {
                damage: [75, 150, 225, 300],
                bonusDamagePrimary: [100, 100, 100, 100],
                slowPercentage: [20, 30, 40, 50],
                slowDuration: [4, 4, 4, 4]
            }
        },
        
        // W: Dark Ritual - Unit-target (ally creep) mana restore
        darkRitual: {
            id: 'dark_ritual',
            name: 'Dark Ritual',
            description: 'Sacrifice an allied creep to restore mana',
            slot: 'W',
            skillType: 'active',
            targetRule: TARGET_TYPES.allyUnit,
            castRange: 400,
            damageType: DAMAGE_TYPES.pure,
            
            // Costs and cooldowns
            manaCostByLevel: [25, 25, 25, 25],
            cooldownByLevel: [55, 45, 35, 25],
            levelRequirement: 1,
            maxLevel: 4,
            
            // Effect values per level
            effectValuesByLevel: {
                manaRestorePercentage: [100, 130, 160, 200]
            }
        },
        
        // E: Chain Frost - Unit-target multi-bounce projectile
        chainFrost: {
            id: 'chain_frost',
            name: 'Chain Frost',
            description: 'Launches a frost orb that bounces between enemies',
            slot: 'E',
            skillType: 'active',
            targetRule: TARGET_TYPES.enemyUnit,
            castRange: 750,
            bounceRange: 750,
            maxBounces: 10,
            damageType: DAMAGE_TYPES.magical,
            
            // Costs and cooldowns
            manaCostByLevel: [150, 175, 200],
            cooldownByLevel: [8, 8, 8, 8],
            levelRequirement: 1,
            maxLevel: 3,
            
            // Effect values per level
            effectValuesByLevel: {
                damagePerBounce: [280, 370, 460],
                slowPercentage: [30, 30, 30],
                slowDuration: [3, 3, 3]
            }
        },
        
        // R: Frost Armor - Passive aura buff for self and allies
        frostArmor: {
            id: 'frost_armor',
            name: 'Frost Armor',
            description: 'Aura that adds armor and slows enemies who hit buffed units',
            slot: 'R',
            skillType: 'passive',
            targetRule: TARGET_TYPES.self,
            castRange: 0,
            auraRadius: 900,
            damageType: DAMAGE_TYPES.pure,
            
            // Costs and cooldowns
            manaCostByLevel: [0, 0, 0, 0],
            cooldownByLevel: [0, 0, 0, 0],
            levelRequirement: 6,
            maxLevel: 4,
            
            // Effect values per level
            effectValuesByLevel: {
                armorBonus: [3, 4, 5, 6],
                slowOnHit: [40, 40, 40, 40],
                slowDuration: [3, 3, 3, 3]
            }
        }
    };
}

// ============================================================================
// Hero Build Model
// ============================================================================

/**
 * Build Lich hero model
 * @param {number} level - Hero level (1-25)
 * @param {string} team - Team affiliation ('sentinel' | 'scourge')
 * @returns {THREE.Group} Hero Three.js group
 */
export function buildModel(level, team) {
    const group = buildLich();
    
    // Set team color
    const teamColor = team === 'sentinel' ? 0x1a8a1a : 0x8a1a1a;
    
    // Apply team color to materials
    group.children.forEach((child) => {
        if (child.material && child.material.color) {
            // Keep original colors for visual fidelity but add team indicator
            if (child.userData.heroPart === 'head') {
                // Keep bone white for Lich
            }
        }
    });
    
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
