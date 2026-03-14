/**
 * Map Manager
 * Crimson Lane - DotA 1 style MOBA
 * 
 * This module handles map creation, lanes, jungle camps, and base positions.
 * It provides visual markers for lanes and map layout.
 */

import { G } from './state.js';
import { WORLD_WIDTH, WORLD_HEIGHT, BASE_POSITIONS, JUNGLE_CAMP_POSITIONS, LANES } from './constants.js';
import { getScene, getRenderer } from './scene.js';

// ============================================================================
// Module References
// ============================================================================

let mapGroup = null;
let groundPlane = null;
let laneMarkers = [];
let jungleCamps = [];
let baseMarkers = [];

// ============================================================================
// Map Geometry
// ============================================================================

/**
 * Create ground plane
 * @returns {THREE.Mesh} The ground plane mesh
 */
function createGroundPlane() {
    const geometry = new THREE.PlaneGeometry(WORLD_WIDTH, WORLD_HEIGHT);
    geometry.rotateX(-Math.PI / 2);
    
    const material = new THREE.MeshStandardMaterial({
        color: 0x07070f,
        roughness: 0.8,
        metalness: 0.1
    });
    
    const ground = new THREE.Mesh(geometry, material);
    ground.receiveShadow = true;
    ground.userData.isGround = true;
    ground.name = 'ground';
    
    return ground;
}

/**
 * Create lane visual markers
 * @param {string} laneName - Lane name (top, mid, bot)
 * @param {Array} waypoints - Array of waypoint positions
 * @param {number} color - Color for this lane
 * @returns {THREE.Group} Group containing lane markers
 */
function createLaneMarkers(laneName, waypoints, color) {
    const laneGroup = new THREE.Group();
    laneGroup.userData.lane = laneName;
    
    // Create path line
    const points = waypoints.map(wp => new THREE.Vector3(wp.x, 0.1, wp.z));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    const material = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.5
    });
    
    const line = new THREE.Line(geometry, material);
    line.userData.lane = laneName;
    laneGroup.add(line);
    
    // Create waypoint markers
    waypoints.forEach((wp, index) => {
        const markerGeo = new THREE.CircleGeometry(0.5, 8);
        markerGeo.rotateX(-Math.PI / 2);
        
        const markerMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.set(wp.x, 0.15, wp.z);
        marker.userData = { type: 'waypoint', lane: laneName, index };
        laneGroup.add(marker);
    });
    
    return laneGroup;
}

/**
 * Create base visual marker
 * @param {string} team - Team name (sentinel, scourge)
 * @param {Object} position - Base position
 * @param {number} color - Base color
 * @returns {THREE.Group} Base marker group
 */
function createBaseMarker(team, position, color) {
    const baseGroup = new THREE.Group();
    
    // Base marker ring
    const ringGeo = new THREE.RingGeometry(3, 4, 16);
    ringGeo.rotateX(-Math.PI / 2);
    
    const ringMat = new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3
    });
    
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(position.x, 0.1, position.z);
    ring.userData = { type: 'base', team };
    baseGroup.add(ring);
    
    // Base label
    const baseName = team === 'sentinel' ? 'SENTINEL BASE' : 'SCOURGE BASE';
    
    return baseGroup;
}

/**
 * Create jungle camp visual marker
 * @param {Object} campData - Jungle camp data
 * @param {number} color - Camp color
 * @returns {THREE.Group} Jungle camp marker group
 */
function createJungleCampMarker(campData, color) {
    const campGroup = new THREE.Group();
    
    // Camp center marker
    const centerGeo = new THREE.CircleGeometry(1.5, 8);
    centerGeo.rotateX(-Math.PI / 2);
    
    const centerMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.4
    });
    
    const center = new THREE.Mesh(centerGeo, centerMat);
    center.position.set(campData.x, 0.15, campData.z);
    center.userData = { type: 'jungle_camp', tier: campData.tier };
    campGroup.add(center);
    
    // Camp radius indicator
    const radiusGeo = new THREE.RingGeometry(campData.tier * 2, campData.tier * 2 + 0.5, 8);
    radiusGeo.rotateX(-Math.PI / 2);
    
    const radiusMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.2
    });
    
    const radius = new THREE.Mesh(radiusGeo, radiusMat);
    radius.position.set(campData.x, 0.1, campData.z);
    campGroup.add(radius);
    
    return campGroup;
}

/**
 * Create lane towers markers
 * @param {string} laneName - Lane name
 * @param {string} team - Team name
 * @param {Array} towerPositions - Array of tower positions
 * @param {number} color - Tower color
 * @returns {THREE.Group} Group containing tower markers
 */
function createLaneTowers(laneName, team, towerPositions, color) {
    const towerGroup = new THREE.Group();
    towerGroup.userData.lane = laneName;
    towerGroup.userData.team = team;
    
    towerPositions.forEach((pos, index) => {
        const towerGeo = new THREE.BoxGeometry(2, 4, 2);
        
        const towerMat = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.6,
            metalness: 0.3
        });
        
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(pos.x, 2, pos.z);
        tower.castShadow = true;
        tower.receiveShadow = true;
        tower.userData = { type: 'tower', lane: laneName, tier: index + 1, team };
        tower.name = `${team}_${laneName}_t${index + 1}`;
        
        towerGroup.add(tower);
    });
    
    return towerGroup;
}

// ============================================================================
// Map Creation
// ============================================================================

// Lane colors (Dota 1 style: top=green, mid=blue, bot=purple)
const LANE_COLORS = {
    top: 0x00ff00,
    mid: 0x0088ff,
    bot: 0x8800ff
};

// Tower positions (from base outward)
const TOWER_POSITIONS = {
    top: [
        { x: 75, z: 40 },  // Sentinel T3 (inner)
        { x: 65, z: 43 },  // Sentinel T2 (middle)
        { x: 55, z: 47 },  // Sentinel T1 (outer)
        { x: 45, z: 52 },  // Scourge T1
        { x: 35, z: 56 },  // Scourge T2
        { x: 25, z: 60 }   // Scourge T3 (inner)
    ],
    mid: [
        { x: 75, z: 50 },
        { x: 65, z: 50 },
        { x: 55, z: 50 },
        { x: 45, z: 50 },
        { x: 35, z: 50 },
        { x: 25, z: 50 }
    ],
    bot: [
        { x: 75, z: 60 },
        { x: 65, z: 57 },
        { x: 55, z: 53 },
        { x: 45, z: 48 },
        { x: 35, z: 44 },
        { x: 25, z: 40 }
    ]
};

// Barracks positions
const BARRACKS_POSITIONS = {
    sentinel: {
        top: { x: 65, z: 40 },
        mid: { x: 65, z: 50 },
        bot: { x: 65, z: 60 }
    },
    scourge: {
        top: { x: 35, z: 60 },
        mid: { x: 35, z: 50 },
        bot: { x: 35, z: 40 }
    }
};

//Ancient positions
const ANCIENT_POSITIONS = {
    sentinel: { x: 82, z: 82 },
    scourge: { x: 18, z: 18 }
};

/**
 * Initialize the map
 * @returns {THREE.Group} The map group containing all map elements
 */
export function initMap() {
    console.log('[Map] Initializing map...');

    // Create main map group
    mapGroup = new THREE.Group();
    mapGroup.name = 'map';
    
    const scene = getScene();
    if (!scene) {
        console.error('[Map] Scene not initialized');
        return null;
    }
    
    // Create ground plane
    groundPlane = createGroundPlane();
    mapGroup.add(groundPlane);
    
    // Create lane markers for all lanes
    ['top', 'mid', 'bot'].forEach(lane => {
        const laneGroup = createLaneMarkers(
            lane,
            LANES[lane].waypoints,
            LANE_COLORS[lane]
        );
        mapGroup.add(laneGroup);
        laneMarkers.push(laneGroup);
        
        // Create towers for this lane
        const sentinelGroup = createLaneTowers(
            lane,
            'sentinel',
            TOWER_POSITIONS[lane].slice(0, 3),
            0x1a8a1a  // Sentinel green
        );
        mapGroup.add(sentinelGroup);
        
        const scourgeGroup = createLaneTowers(
            lane,
            'scourge',
            TOWER_POSITIONS[lane].slice(3),
            0x8a1a1a  // Scourge red
        );
        mapGroup.add(scourgeGroup);
    });
    
    // Create base markers
    const sentinelBase = createBaseMarker('sentinel', BASE_POSITIONS.sentinel, 0x1a8a1a);
    sentinelBase.position.set(BASE_POSITIONS.sentinel.x, 0, BASE_POSITIONS.sentinel.z);
    mapGroup.add(sentinelBase);
    baseMarkers.push(sentinelBase);
    
    const scourgeBase = createBaseMarker('scourge', BASE_POSITIONS.scourge, 0x8a1a1a);
    scourgeBase.position.set(BASE_POSITIONS.scourge.x, 0, BASE_POSITIONS.scourge.z);
    mapGroup.add(scourgeBase);
    baseMarkers.push(scourgeBase);
    
    // Create jungle camp markers
    JUNGLE_CAMP_POSITIONS.forEach((camp, index) => {
        const color = camp.tier === 1 ? 0xffaa00 : camp.tier === 2 ? 0xff5500 : 0xff0000;
        const campMarker = createJungleCampMarker(camp, color);
        campMarker.position.set(camp.x, 0, camp.z);
        mapGroup.add(campMarker);
        jungleCamps.push(campMarker);
    });
    
    // Add map group to scene
    scene.add(mapGroup);
    
    // Store references for later use
    window.mapGroup = mapGroup;
    window.laneMarkers = laneMarkers;
    window.jungleCamps = jungleCamps;
    window.baseMarkers = baseMarkers;

    console.log('[Map] Map initialized successfully');
    
    return mapGroup;
}

// ============================================================================
// Map Data Access
// ============================================================================

/**
 * Get all lane waypoints
 * @returns {Object} Dictionary of lanes with their waypoints
 */
export function getLaneWaypoints() {
    return LANES;
}

/**
 * Get waypoints for a specific lane
 * @param {string} laneName - Lane name
 * @returns {Array} Array of waypoint positions
 */
export function getLaneWaypointsByName(laneName) {
    return LANES[laneName]?.waypoints || [];
}

/**
 * Get all jungle camp positions
 * @returns {Array} Array of jungle camp data
 */
export function getJungleCamps() {
    return JUNGLE_CAMP_POSITIONS;
}

/**
 * Get base positions
 * @returns {Object} Base positions for sentinel and scourge
 */
export function getBasePositions() {
    return BASE_POSITIONS;
}

/**
 * Get sentinel roster from state
 * @returns {Array} Array of sentinel hero IDs
 */
export function getSentinelRoster() {
    return G.sentinelRoster || [];
}

/**
 * Get scourge roster from state
 * @returns {Array} Array of scourge hero IDs
 */
export function getScourgeRoster() {
    return G.scourgeRoster || [];
}

// ============================================================================
// Map Updates
// ============================================================================

/**
 * Update map based on game state
 */
export function updateMap() {
    // Update base markers positions if needed
    if (baseMarkers.length >= 2) {
        baseMarkers[0].position.set(BASE_POSITIONS.sentinel.x, 0, BASE_POSITIONS.sentinel.z);
        baseMarkers[1].position.set(BASE_POSITIONS.scourge.x, 0, BASE_POSITIONS.scourge.z);
    }
}

/**
 * Highlight a lane (for UI feedback)
 * @param {string} laneName - Lane name to highlight
 * @param {boolean} isActive - Whether to highlight or remove highlight
 */
export function highlightLane(laneName, isActive) {
    laneMarkers.forEach(marker => {
        if (marker.userData.lane === laneName) {
            marker.children.forEach(child => {
                if (child.isLine && child.material) {
                    child.material.opacity = isActive ? 1.0 : 0.5;
                    child.material.needsUpdate = true;
                }
            });
        }
    });
}

/**
 * Highlight a jungle camp (for UI feedback)
 * @param {number} campIndex - Jungle camp index
 * @param {boolean} isActive - Whether to highlight or remove highlight
 */
export function highlightJungleCamp(campIndex, isActive) {
    if (jungleCamps[campIndex]) {
        const camp = jungleCamps[campIndex];
        camp.children.forEach(child => {
            if (child.material) {
                child.material.opacity = isActive ? 1.0 : 0.4;
                child.material.needsUpdate = true;
            }
        });
    }
}

// ============================================================================
// Map Cleanup
// ============================================================================

/**
 * Dispose map resources
 */
export function disposeMap() {
    if (mapGroup) {
        // Remove from scene
        const scene = getScene();
        if (scene) {
            scene.remove(mapGroup);
        }
        
        // Dispose all children
        mapGroup.traverse((object) => {
            if (object.isMesh) {
                object.geometry.dispose();
                if (object.material.length) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        
        mapGroup = null;
    }
    
    // Clear arrays
    laneMarkers = [];
    jungleCamps = [];
    baseMarkers = [];
    
    // Clear global references
    window.mapGroup = null;
    window.laneMarkers = [];
    window.jungleCamps = [];
    window.baseMarkers = [];
}

// ============================================================================
// Map Geometry Helpers
// ============================================================================

/**
 * Get distance between two points on the map
 * @param {Object} p1 - First position {x, z}
 * @param {Object} p2 - Second position {x, z}
 * @returns {number} Distance between points
 */
export function getMapDistance(p1, p2) {
    const dx = p1.x - p2.x;
    const dz = p1.z - p2.z;
    return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Check if a point is within the map boundaries
 * @param {Object} pos - Position to check {x, z}
 * @returns {boolean} Whether point is within map
 */
export function isWithinMapBoundaries(pos) {
    return pos.x >= 0 && pos.x <= WORLD_WIDTH && pos.z >= 0 && pos.z <= WORLD_HEIGHT;
}

/**
 * Clamp position to map boundaries
 * @param {Object} pos - Position to clamp {x, z}
 * @returns {Object} Clamped position
 */
export function clampToMapBoundaries(pos) {
    return {
        x: Math.max(0, Math.min(WORLD_WIDTH, pos.x)),
        z: Math.max(0, Math.min(WORLD_HEIGHT, pos.z))
    };
}

// ============================================================================
// Map Object Creation Helpers
// ============================================================================

/**
 * Create a simple box mesh for map objects
 * @param {Object} options - Mesh options
 * @returns {THREE.Mesh} Created mesh
 */
export function createBox(options = {}) {
    const {
        width = 1,
        height = 1,
        depth = 1,
        color = 0xffffff,
        position = { x: 0, y: 0, z: 0 },
        userData = {}
    } = options;
    
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.6,
        metalness: 0.3
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = userData;
    
    return mesh;
}

/**
 * Create a cylinder mesh for map objects (towers, fountains, etc.)
 * @param {Object} options - Mesh options
 * @returns {THREE.Mesh} Created mesh
 */
export function createCylinder(options = {}) {
    const {
        radius = 1,
        height = 2,
        segments = 16,
        color = 0xffffff,
        position = { x: 0, y: 0, z: 0 },
        userData = {}
    } = options;
    
    const geometry = new THREE.CylinderGeometry(radius, radius, height, segments);
    const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.6,
        metalness: 0.3
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y + height / 2, position.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = userData;
    
    return mesh;
}

// ============================================================================
// Module Export
// ============================================================================

export default {
    initMap,
    getLaneWaypoints,
    getLaneWaypointsByName,
    getJungleCamps,
    getBasePositions,
    getSentinelRoster,
    getScourgeRoster,
    updateMap,
    highlightLane,
    highlightJungleCamp,
    disposeMap,
    getMapDistance,
    isWithinMapBoundaries,
    clampToMapBoundaries,
    createBox,
    createCylinder
};
