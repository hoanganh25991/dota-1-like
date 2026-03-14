/**
 * Scene Manager
 * Crimson Lane - DotA 1 style MOBA
 * 
 * This module handles Three.js setup, camera, lighting, and rendering.
 * It provides scene initialization, camera follow functionality, and responsive resizing.
 */

import { G } from './state.js';
import { WORLD_WIDTH, WORLD_HEIGHT } from './constants.js';

// ============================================================================
// Module References
// ============================================================================

let scene = null;
let camera = null;
let renderer = null;
let cameraControls = null;
let raycaster = null;
let mouse = null;

// Lighting objects
let directionalLight = null;
let hemisphereLight = null;

// Camera state
let currentHero = null;
let cameraOffset = { x: 0, y: 15, z: 15 };
let cameraSmoothness = 0.08;

// ============================================================================
// Scene Setup
// ============================================================================

/**
 * Initialize Three.js scene
 * @returns {THREE.Scene} The created scene
 */
export function initScene() {
    console.log('[Scene] Initializing scene...');

    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07070f);
    scene.fog = new THREE.FogExp2(0x07070f, 0.02);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // Add renderer to DOM
    const container = document.getElementById('game-container');
    if (container) {
        container.appendChild(renderer.domElement);
    }

    // Create camera
    initCamera();

    // Create lighting
    initLighting();

    // Initialize raycaster for interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Add event listeners
    window.addEventListener('resize', onWindowResize);

    // Initial render
    renderer.render(scene, camera);

    console.log('[Scene] Scene initialized successfully');
    
    // Expose for global access
    window.scene = scene;
    window.camera = camera;
    window.renderer = renderer;

    return scene;
}

/**
 * Initialize camera with perspective projection
 */
function initCamera() {
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(50, 30, 50);
    camera.lookAt(50, 0, 50);
    
    // Store camera reference globally for easy access
    window.gameCamera = camera;
}

/**
 * Initialize lighting setup
 */
function initLighting() {
    // Directional light (top-right)
    directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(80, 100, 80);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.bias = -0.0001;
    directionalLight.shadow.normalBias = 0.05;
    
    scene.add(directionalLight);

    // Hemisphere light (ambient fill)
    hemisphereLight = new THREE.HemisphereLight(0x2a2a4a, 0x1a1208, 0.4);
    scene.add(hemisphereLight);
    
    // Store references
    window.directionalLight = directionalLight;
    window.hemisphereLight = hemisphereLight;
}

// ============================================================================
// Camera Functions
// ============================================================================

/**
 * Set the hero that the camera should follow
 * @param {Object} hero - The hero entity to follow
 */
export function setCameraFollowHero(hero) {
    currentHero = hero;
    console.log(`[Camera] Following hero: ${hero?.id || 'none'}`);
}

/**
 * Smoothly follow a hero with the camera
 * @param {Object} hero - The hero to follow
 */
export function cameraFollowHero(hero) {
    if (!hero || !hero.position) return;
    
    // Calculate target position based on hero position
    const targetX = hero.position.x + cameraOffset.x;
    const targetY = hero.position.y + cameraOffset.y;
    const targetZ = hero.position.z + cameraOffset.z;
    
    // Smoothly interpolate camera position
    camera.position.x += (targetX - camera.position.x) * cameraSmoothness;
    camera.position.y += (targetY - camera.position.y) * cameraSmoothness;
    camera.position.z += (targetZ - camera.position.z) * cameraSmoothness;
    
    // Keep camera looking at the hero
    camera.lookAt(hero.position.x, hero.position.y, hero.position.z);
}

/**
 * Manually position camera
 * @param {Vector3} position - Camera position
 * @param {Vector3} lookAt - Point to look at
 */
export function setCameraPosition(position, lookAt) {
    camera.position.copy(position);
    camera.lookAt(lookAt || new THREE.Vector3(50, 0, 50));
}

/**
 * Get camera position
 * @returns {THREE.Vector3} Camera position
 */
export function getCameraPosition() {
    return camera.position.clone();
}

/**
 * Get camera target direction
 * @returns {THREE.Vector3} Camera forward direction
 */
export function getCameraDirection() {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    return direction;
}

// ============================================================================
// Raycasting & Interaction
// ============================================================================

/**
 * Raycast against scene objects
 * @param {number} clientX - Client X coordinate
 * @param {number} clientY - Client Y coordinate
 * @returns {Array} Array of intersection results
 */
export function raycastObjects(clientX, clientY) {
    // Normalize mouse coordinates
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    // Get all meshes in scene
    const meshes = [];
    scene.traverse((object) => {
        if (object.isMesh) {
            meshes.push(object);
        }
    });
    
    return raycaster.intersectObjects(meshes, true);
}

/**
 * Get ground position from screen coordinates
 * @param {number} clientX - Client X coordinate
 * @param {number} clientY - Client Y coordinate
 * @returns {Vector3 | null} Ground position or null if no intersection
 */
export function getGroundPosition(clientX, clientY) {
    const intersections = raycastObjects(clientX, clientY);
    
    for (const intersection of intersections) {
        if (intersection.object.userData.isGround) {
            return intersection.point;
        }
    }
    
    return null;
}

// ============================================================================
// Renderer Functions
// ============================================================================

/**
 * Resize renderer for responsive display
 * @param {number} width - New width
 * @param {number} height - New height
 */
export function resizeRenderer(width, height) {
    if (!camera || !renderer) return;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

/**
 * Render the scene
 */
export function renderScene() {
    if (!scene || !camera || !renderer) return;
    
    renderer.render(scene, camera);
}

/**
 * Update scene (called every frame)
 */
export function updateScene() {
    // Follow hero if set
    if (currentHero && currentHero.position) {
        cameraFollowHero(currentHero);
    }
}

// ============================================================================
// Scene Cleanup
// ============================================================================

/**
 * Dispose scene resources
 */
export function disposeScene() {
    // Dispose geometry and materials
    scene.traverse((object) => {
        if (object.isMesh) {
            object.geometry.dispose();
            if (object.material.length) {
                object.material.forEach(material => material.dispose());
            } else {
                object.material.dispose();
            }
        }
    });
    
    // Remove all lights
    if (directionalLight) {
        scene.remove(directionalLight);
        directionalLight = null;
    }
    if (hemisphereLight) {
        scene.remove(hemisphereLight);
        hemisphereLight = null;
    }
    
    // Remove renderer
    if (renderer) {
        renderer.dispose();
        const canvas = renderer.domElement;
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
        renderer = null;
    }
    
    // Reset references
    scene = null;
    camera = null;
    raycaster = null;
    mouse = null;
}

// ============================================================================
// Window Resize Handler
// ============================================================================

/**
 * Handle window resize event
 */
function onWindowResize() {
    resizeRenderer(window.innerWidth, window.innerHeight);
}

// ============================================================================
// Day/Night Cycle Support
// ============================================================================

/**
 * Update lighting for day/night cycle
 * @param {boolean} isDay - Whether it's currently day
 */
export function updateDayNightLighting(isDay) {
    if (!directionalLight || !hemisphereLight) return;
    
    if (isDay) {
        // Day settings
        directionalLight.intensity = 1.2;
        directionalLight.color.setHex(0xffffff);
        hemisphereLight.intensity = 0.4;
        hemisphereLight.color.setHex(0x2a2a4a);
        hemisphereLight.groundColor.setHex(0x1a1208);
    } else {
        // Night settings
        directionalLight.intensity = 0.15;
        directionalLight.color.setHex(0x445577);
        hemisphereLight.intensity = 0.15;
        hemisphereLight.color.setHex(0x111122);
        hemisphereLight.groundColor.setHex(0x080602);
    }
}

// ============================================================================
// Map Integration
// ============================================================================

/**
 * Get the scene object
 * @returns {THREE.Scene | null} The scene
 */
export function getScene() {
    return scene;
}

/**
 * Get the renderer object
 * @returns {THREE.WebGLRenderer | null} The renderer
 */
export function getRenderer() {
    return renderer;
}

/**
 * Get the camera object
 * @returns {THREE.PerspectiveCamera | null} The camera
 */
export function getCamera() {
    return camera;
}

// ============================================================================
// Module Export
// ============================================================================

export default {
    initScene,
    setCameraFollowHero,
    cameraFollowHero,
    setCameraPosition,
    getCameraPosition,
    getCameraDirection,
    raycastObjects,
    getGroundPosition,
    resizeRenderer,
    renderScene,
    updateScene,
    disposeScene,
    updateDayNightLighting,
    getScene,
    getRenderer,
    getCamera
};
