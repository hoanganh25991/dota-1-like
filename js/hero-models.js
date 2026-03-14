/**
 * Hero 3D Models System
 * Crimson Lane - DotA 1 style MOBA
 * 
 * This module provides:
 * - buildLich() - Returns THREE.Group with Lich hero geometry
 * - buildSniper() - Returns THREE.Group with Sniper hero geometry
 * - buildDragonKnight() - Returns THREE.Group with Dragon Knight hero geometry
 * - buildShadowFiend() - Returns THREE.Group with Shadow Fiend hero geometry
 * - buildWindrunner() - Returns THREE.Group with Windrunner hero geometry
 * 
 * Each function creates a stylized, low-poly hero representation using
 * BoxGeometry, CylinderGeometry, and SphereGeometry.
 * 
 * Mobile optimized: Low polygon count (20-30 meshes per hero).
 */

// ============================================================================
// Material Definitions (Shared by all heroes)
// ============================================================================

/**
 * Create standard material with given color
 * @param {number} hexColor - Color hex value
 * @param {number} roughness - Roughness factor (0-1)
 * @param {number} metalness - Metalness factor (0-1)
 * @returns {THREE.MeshLambertMaterial}
 */
function createStandardMaterial(hexColor, roughness = 0.5, metalness = 0.1) {
    return new THREE.MeshLambertMaterial({
        color: hexColor,
        roughness,
        metalness
    });
}

/**
 * Create glowing material (for magical effects)
 * @param {number} hexColor - Color hex value
 * @returns {THREE.MeshBasicMaterial}
 */
function createGlowMaterial(hexColor) {
    return new THREE.MeshBasicMaterial({
        color: hexColor
    });
}

/**
 * Create metallic material (for armor/weapons)
 * @param {number} hexColor - Color hex value
 * @returns {THREE.MeshStandardMaterial}
 */
function createMetallicMaterial(hexColor) {
    return new THREE.MeshStandardMaterial({
        color: hexColor,
        roughness: 0.3,
        metalness: 0.8
    });
}

// ============================================================================
// Hero Build Functions
// ============================================================================

/**
 * Build Lich hero model
 * - Bone white body with deep purple robe
 * - Cyan glowing eyes (magical hero)
 * - Staff with Frost Nova orb
 * 
 * @returns {THREE.Group} Complete hero group
 */
export function buildLich() {
    const group = new THREE.Group();
    group.userData = { heroType: 'lich' };

    // Materials
    const bodyMat = createStandardMaterial(0xe8ddc8);      // Bone white
    const robeMat = createStandardMaterial(0x1a0a2e);      // Deep purple robe
    const eyesMat = createGlowMaterial(0x00ffcc);          // Cyan glow
    const staffMat = createMetallicMaterial(0x666688);     // Dark metal
    const orbMat = createGlowMaterial(0x00ffcc);           // Frost Nova orb

    // == HEAD ==
    const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = 2.0;
    head.castShadow = true;
    group.add(head);

    // == EYES (Cyan glowing points) ==
    const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeo, eyesMat);
    leftEye.position.set(-0.15, 2.05, 0.32);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyesMat);
    rightEye.position.set(0.15, 2.05, 0.32);
    group.add(rightEye);

    // Eye point light for magical hero
    const eyeLight = new THREE.PointLight(0x00ffcc, 1.0, 5);
    eyeLight.position.set(0, 2.1, 0.35);
    group.add(eyeLight);

    // == ROBE ==
    const robeGeo = new THREE.CylinderGeometry(0.35, 0.5, 1.2, 12);
    const robe = new THREE.Mesh(robeGeo, robeMat);
    robe.position.y = 0.9;
    robe.castShadow = true;
    group.add(robe);

    // == STAFF ==
    // Staff shaft
    const staffShaftGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.0, 8);
    const staffShaft = new THREE.Mesh(staffShaftGeo, staffMat);
    staffShaft.position.set(0.4, 1.2, 0);
    staffShaft.rotation.z = -0.3;
    staffShaft.castShadow = true;
    group.add(staffShaft);

    // Staff top
    const staffTopGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const staffTop = new THREE.Mesh(staffTopGeo, staffMat);
    staffTop.position.set(0.4, 2.2, 0);
    group.add(staffTop);

    // Frost Nova orb
    const orbGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.set(0.4, 2.4, 0);
    group.add(orb);

    // Orb glow light
    const orbLight = new THREE.PointLight(0x00ffcc, 1.5, 6);
    orbLight.position.set(0.4, 2.4, 0);
    group.add(orbLight);

    // == ARMS ==
    // Left arm
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
    const leftArm = new THREE.Mesh(armGeo, bodyMat);
    leftArm.position.set(-0.4, 1.4, 0);
    leftArm.rotation.z = -0.5;
    group.add(leftArm);

    // Right arm (holding staff)
    const rightArm = new THREE.Mesh(armGeo, bodyMat);
    rightArm.position.set(0.35, 1.5, 0);
    rightArm.rotation.z = 0.5;
    group.add(rightArm);

    // == LEGS ==
    const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.9, 8);
    
    // Left leg
    const leftLeg = new THREE.Mesh(legGeo, bodyMat);
    leftLeg.position.set(-0.2, 0.45, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    // Right leg
    const rightLeg = new THREE.Mesh(legGeo, bodyMat);
    rightLeg.position.set(0.2, 0.45, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    // == SCOURGE TEAM LIGHT (subtle red point light below feet) ==
    const teamLight = new THREE.PointLight(0x8a0000, 0.3, 2.0);
    teamLight.position.set(0, 0.1, 0);
    group.add(teamLight);

    return group;
}

/**
 * Build Sniper hero model
 * - Warm tan body with brown leather/hat
 * - Blue eyes
 * - Long-range rifle
 * 
 * @returns {THREE.Group} Complete hero group
 */
export function buildSniper() {
    const group = new THREE.Group();
    group.userData = { heroType: 'sniper' };

    // Materials
    const bodyMat = createStandardMaterial(0xd4a870);      // Warm tan
    const hatMat = createStandardMaterial(0x5c4033);       // Brown leather
    const eyesMat = createStandardMaterial(0x2244aa);      // Blue eyes
    const rifleMat = createStandardMaterial(0x333333);     // Dark gun metal
    const scopeMat = createStandardMaterial(0x112244);     // Scope glass

    // == HEAD ==
    const headGeo = new THREE.SphereGeometry(0.38, 16, 16);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = 2.05;
    head.castShadow = true;
    group.add(head);

    // == HAT ==
    const hatBaseGeo = new THREE.CylinderGeometry(0.38, 0.45, 0.2, 16);
    const hatBase = new THREE.Mesh(hatBaseGeo, hatMat);
    hatBase.position.y = 2.35;
    group.add(hatBase);

    const hatTopGeo = new THREE.CylinderGeometry(0.25, 0.38, 0.3, 16);
    const hatTop = new THREE.Mesh(hatTopGeo, hatMat);
    hatTop.position.y = 2.5;
    group.add(hatTop);

    // == EYES (Blue) ==
    const eyeGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeo, eyesMat);
    leftEye.position.set(-0.18, 2.1, 0.35);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyesMat);
    rightEye.position.set(0.18, 2.1, 0.35);
    group.add(rightEye);

    // == RIFLE ==
    // Rifle body
    const rifleBodyGeo = new THREE.BoxGeometry(0.12, 0.12, 1.6);
    const rifleBody = new THREE.Mesh(rifleBodyGeo, rifleMat);
    rifleBody.position.set(0.45, 1.3, 0);
    rifleBody.rotation.z = -0.3;
    rifleBody.castShadow = true;
    group.add(rifleBody);

    // Rifle stock
    const rifleStockGeo = new THREE.BoxGeometry(0.1, 0.1, 0.4);
    const rifleStock = new THREE.Mesh(rifleStockGeo, hatMat);
    rifleStock.position.set(0.45, 1.3, -0.2);
    rifleStock.rotation.z = -0.3;
    group.add(rifleStock);

    // Rifle scope
    const scopeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.3, 12);
    const scope = new THREE.Mesh(scopeGeo, scopeMat);
    scope.rotation.z = Math.PI / 2;
    scope.position.set(0.45, 1.4, 0);
    group.add(scope);

    // == ARMS ==
    // Left arm (support)
    const armGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.6, 8);
    const leftArm = new THREE.Mesh(armGeo, bodyMat);
    leftArm.position.set(-0.4, 1.4, 0);
    leftArm.rotation.z = -0.4;
    group.add(leftArm);

    // Right arm (holding rifle)
    const rightArm = new THREE.Mesh(armGeo, bodyMat);
    rightArm.position.set(0.4, 1.35, 0);
    rightArm.rotation.z = 0.4;
    group.add(rightArm);

    // == LEGS ==
    const legGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.9, 8);
    
    const leftLeg = new THREE.Mesh(legGeo, bodyMat);
    leftLeg.position.set(-0.22, 0.45, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, bodyMat);
    rightLeg.position.set(0.22, 0.45, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    // == SENTINEL TEAM LIGHT (subtle blue point light below feet) ==
    const teamLight = new THREE.PointLight(0x1a8a1a, 0.3, 2.0);
    teamLight.position.set(0, 0.1, 0);
    group.add(teamLight);

    return group;
}

/**
 * Build Dragon Knight hero model
 * - Red-black armor with gold trim
 * - Amber glowing eyes
 * - Dragon shield and spear
 * 
 * @returns {THREE.Group} Complete hero group
 */
export function buildDragonKnight() {
    const group = new THREE.Group();
    group.userData = { heroType: 'dragonKnight' };

    // Materials
    const armorMat = createStandardMaterial(0x8a0000);     // Red-black armor
    const goldMat = createStandardMaterial(0xffcc44);      // Gold trim
    const eyesMat = createStandardMaterial(0xffaa22);      // Amber eyes
    const spearMat = createStandardMaterial(0x555555);     // Metal spear
    const shieldMat = createStandardMaterial(0x444444);    // Dark shield

    // == HEAD ==
    const headGeo = new THREE.SphereGeometry(0.42, 16, 16);
    const head = new THREE.Mesh(headGeo, armorMat);
    head.position.y = 2.1;
    head.castShadow = true;
    group.add(head);

    // == HELM CREST ==
    const crestGeo = new THREE.ConeGeometry(0.3, 0.5, 8);
    const crest = new THREE.Mesh(crestGeo, goldMat);
    crest.position.y = 2.5;
    crest.rotation.z = -0.3;
    group.add(crest);

    // == EYES (Amber glowing) ==
    const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeo, eyesMat);
    leftEye.position.set(-0.2, 2.15, 0.38);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyesMat);
    rightEye.position.set(0.2, 2.15, 0.38);
    group.add(rightEye);

    // Eye point light
    const eyeLight = new THREE.PointLight(0xffaa22, 1.0, 4);
    eyeLight.position.set(0, 2.2, 0.4);
    group.add(eyeLight);

    // == SHOULDERS/ARMOR ==
    // Left shoulder
    const leftShoulderGeo = new THREE.SphereGeometry(0.25, 12, 12);
    const leftShoulder = new THREE.Mesh(leftShoulderGeo, armorMat);
    leftShoulder.position.set(-0.5, 1.6, 0);
    leftShoulder.castShadow = true;
    group.add(leftShoulder);

    // Right shoulder
    const rightShoulderGeo = new THREE.SphereGeometry(0.25, 12, 12);
    const rightShoulder = new THREE.Mesh(rightShoulderGeo, armorMat);
    rightShoulder.position.set(0.5, 1.6, 0);
    rightShoulder.castShadow = true;
    group.add(rightShoulder);

    // Gold trim on shoulders
    const goldRingGeo = new THREE.TorusGeometry(0.15, 0.05, 8, 16);
    
    const leftGold = new THREE.Mesh(goldRingGeo, goldMat);
    leftGold.position.set(-0.5, 1.6, 0);
    group.add(leftGold);

    const rightGold = new THREE.Mesh(goldRingGeo, goldMat);
    rightGold.position.set(0.5, 1.6, 0);
    group.add(rightGold);

    // == CHEST PLATE ==
    const chestGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.5, 12);
    const chest = new THREE.Mesh(chestGeo, armorMat);
    chest.position.y = 1.45;
    chest.castShadow = true;
    group.add(chest);

    // Chest gold trim
    const chestGold = new THREE.Mesh(goldRingGeo, goldMat);
    chestGold.position.y = 1.65;
    chestGold.position.x = 0;
    group.add(chestGold);

    // == SWORD ==
    const swordHandleGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8);
    const swordHandle = new THREE.Mesh(swordHandleGeo, goldMat);
    swordHandle.position.set(0.5, 1.3, 0);
    swordHandle.rotation.z = -0.4;
    group.add(swordHandle);

    const swordBladeGeo = new THREE.BoxGeometry(0.1, 0.8, 0.08);
    const swordBlade = new THREE.Mesh(swordBladeGeo, spearMat);
    swordBlade.position.set(0.5, 1.85, 0);
    swordBlade.rotation.z = -0.4;
    swordBlade.castShadow = true;
    group.add(swordBlade);

    // == ARMOR PLATE ==
    const armorPlateGeo = new THREE.BoxGeometry(0.4, 0.6, 0.15);
    const armorPlate = new THREE.Mesh(armorPlateGeo, armorMat);
    armorPlate.position.set(0.4, 1.45, -0.1);
    group.add(armorPlate);

    // == ARMS ==
    const armGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.65, 8);
    
    const leftArm = new THREE.Mesh(armGeo, armorMat);
    leftArm.position.set(-0.45, 1.5, 0);
    leftArm.rotation.z = -0.2;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, armorMat);
    rightArm.position.set(0.5, 1.35, 0);
    rightArm.rotation.z = -0.5;
    group.add(rightArm);

    // == LEGS ==
    const legGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 8);
    
    const leftLeg = new THREE.Mesh(legGeo, armorMat);
    leftLeg.position.set(-0.25, 0.45, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, armorMat);
    rightLeg.position.set(0.25, 0.45, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    // == SENTINEL TEAM LIGHT ==
    const teamLight = new THREE.PointLight(0x1a8a1a, 0.3, 2.0);
    teamLight.position.set(0, 0.1, 0);
    group.add(teamLight);

    return group;
}

/**
 * Build Shadow Fiend hero model
 * - Near-black body with blood red accents
 * - Red glowing eyes
 * - Wings (skeletal)
 * - Claws
 * 
 * @returns {THREE.Group} Complete hero group
 */
export function buildShadowFiend() {
    const group = new THREE.Group();
    group.userData = { heroType: 'shadowFiend' };

    // Materials
    const bodyMat = createStandardMaterial(0x140606);      // Near-black
    const accentMat = createStandardMaterial(0x8a0000);    // Blood red
    const eyesMat = createGlowMaterial(0xff2200);          // Red glow
    const wingMat = createStandardMaterial(0x0a0a0a);      // Dark wings
    const clawMat = createStandardMaterial(0x222222);      // Dark claws

    // == HEAD ==
    const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = 2.0;
    head.castShadow = true;
    group.add(head);

    // == HORN/HAIR ==
    const hornGeo = new THREE.ConeGeometry(0.08, 0.6, 8);
    
    const leftHorn = new THREE.Mesh(hornGeo, accentMat);
    leftHorn.position.set(-0.3, 2.3, 0);
    leftHorn.rotation.z = -0.5;
    leftHorn.rotation.y = -0.3;
    group.add(leftHorn);

    const rightHorn = new THREE.Mesh(hornGeo, accentMat);
    rightHorn.position.set(0.3, 2.3, 0);
    rightHorn.rotation.z = 0.5;
    rightHorn.rotation.y = 0.3;
    group.add(rightHorn);

    // == EYES (Red glowing) ==
    const eyeGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeo, eyesMat);
    leftEye.position.set(-0.18, 2.05, 0.32);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyesMat);
    rightEye.position.set(0.18, 2.05, 0.32);
    group.add(rightEye);

    // Eye point light
    const eyeLight = new THREE.PointLight(0xff2200, 1.2, 5);
    eyeLight.position.set(0, 2.1, 0.35);
    group.add(eyeLight);

    // == WINGS (Skeletal) ==
    // Left wing
    const leftWingGeo = new THREE.PlaneGeometry(1.2, 0.8);
    const leftWing = new THREE.Mesh(leftWingGeo, wingMat);
    leftWing.position.set(-0.7, 1.5, 0);
    leftWing.rotation.y = -0.3;
    leftWing.rotation.z = 0.8;
    group.add(leftWing);

    // Right wing
    const rightWingGeo = new THREE.PlaneGeometry(1.2, 0.8);
    const rightWing = new THREE.Mesh(rightWingGeo, wingMat);
    rightWing.position.set(0.7, 1.5, 0);
    rightWing.rotation.y = 0.3;
    rightWing.rotation.z = -0.8;
    group.add(rightWing);

    // Wing bone structure
    const wingBoneGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 6);
    
    const leftBone = new THREE.Mesh(wingBoneGeo, accentMat);
    leftBone.position.set(-0.7, 1.5, 0);
    leftBone.rotation.y = -0.3;
    leftBone.rotation.z = 0.8;
    group.add(leftBone);

    const rightBone = new THREE.Mesh(wingBoneGeo, accentMat);
    rightBone.position.set(0.7, 1.5, 0);
    rightBone.rotation.y = 0.3;
    rightBone.rotation.z = -0.8;
    group.add(rightBone);

    // == TAIL ==
    const tailGeo = new THREE.ConeGeometry(0.1, 1.5, 8);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.position.set(0, 0.75, -0.5);
    tail.rotation.x = 0.8;
    tail.castShadow = true;
    group.add(tail);

    const tailTipGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const tailTip = new THREE.Mesh(tailTipGeo, accentMat);
    tailTip.position.set(0, 0.2, 0.3);
    group.add(tailTip);

    // == CLAWS ==
    const clawGeo = new THREE.ConeGeometry(0.04, 0.2, 6);
    
    // Left hand claws
    const leftClaw1 = new THREE.Mesh(clawGeo, clawMat);
    leftClaw1.position.set(-0.45, 1.3, 0);
    leftClaw1.rotation.x = -0.5;
    leftClaw1.rotation.z = 0.2;
    group.add(leftClaw1);

    const leftClaw2 = new THREE.Mesh(clawGeo, clawMat);
    leftClaw2.position.set(-0.45, 1.3, 0);
    leftClaw2.rotation.x = -0.5;
    leftClaw2.rotation.z = -0.2;
    group.add(leftClaw2);

    // Right hand claws
    const rightClaw1 = new THREE.Mesh(clawGeo, clawMat);
    rightClaw1.position.set(0.45, 1.3, 0);
    rightClaw1.rotation.x = -0.5;
    rightClaw1.rotation.z = -0.2;
    group.add(rightClaw1);

    const rightClaw2 = new THREE.Mesh(clawGeo, clawMat);
    rightClaw2.position.set(0.45, 1.3, 0);
    rightClaw2.rotation.x = -0.5;
    rightClaw2.rotation.z = 0.2;
    group.add(rightClaw2);

    // == ARMS ==
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
    
    const leftArm = new THREE.Mesh(armGeo, bodyMat);
    leftArm.position.set(-0.45, 1.5, 0);
    leftArm.rotation.z = -0.1;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, bodyMat);
    rightArm.position.set(0.45, 1.5, 0);
    rightArm.rotation.z = 0.1;
    group.add(rightArm);

    // == LEGS ==
    const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.9, 8);
    
    const leftLeg = new THREE.Mesh(legGeo, bodyMat);
    leftLeg.position.set(-0.2, 0.45, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, bodyMat);
    rightLeg.position.set(0.2, 0.45, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    // == SCOURGE TEAM LIGHT ==
    const teamLight = new THREE.PointLight(0x8a0000, 0.3, 2.0);
    teamLight.position.set(0, 0.1, 0);
    group.add(teamLight);

    return group;
}

/**
 * Build Windrunner hero model
 * - Pale body with forest green hood
 * - Teal glowing eyes
 * - Bow
 * 
 * @returns {THREE.Group} Complete hero group
 */
export function buildWindrunner() {
    const group = new THREE.Group();
    group.userData = { heroType: 'windrunner' };

    // Materials
    const bodyMat = createStandardMaterial(0xddc49a);      // Pale
    const hoodMat = createStandardMaterial(0x228a4a);      // Forest green
    const eyesMat = createGlowMaterial(0x00cc88);          // Teal glow
    const bowMat = createStandardMaterial(0x8b5a2b);       // Wood bow
    const stringMat = createStandardMaterial(0xffffff);    // Bow string

    // == HEAD ==
    const headGeo = new THREE.SphereGeometry(0.36, 16, 16);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = 2.0;
    head.castShadow = true;
    group.add(head);

    // == HOOD ==
    const hoodGeo = new THREE.SphereGeometry(0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const hood = new THREE.Mesh(hoodGeo, hoodMat);
    hood.position.y = 2.1;
    hood.scale.y = 0.6;
    group.add(hood);

    // == EYES (Teal glowing) ==
    const eyeGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeo, eyesMat);
    leftEye.position.set(-0.18, 2.05, 0.32);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyesMat);
    rightEye.position.set(0.18, 2.05, 0.32);
    group.add(rightEye);

    // Eye point light
    const eyeLight = new THREE.PointLight(0x00cc88, 1.0, 5);
    eyeLight.position.set(0, 2.1, 0.35);
    group.add(eyeLight);

    // == ARMS ==
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
    
    // Left arm (holding bow)
    const leftArm = new THREE.Mesh(armGeo, bodyMat);
    leftArm.position.set(-0.45, 1.4, 0);
    leftArm.rotation.z = 0.3;
    group.add(leftArm);

    // Right arm (bow hand)
    const rightArm = new THREE.Mesh(armGeo, bodyMat);
    rightArm.position.set(0.45, 1.4, 0);
    rightArm.rotation.z = 0.3;
    group.add(rightArm);

    // == BOW ==
    const bowArcGeo = new THREE.TorusGeometry(0.6, 0.05, 8, 24, Math.PI);
    const bowArc = new THREE.Mesh(bowArcGeo, bowMat);
    bowArc.position.set(0, 1.4, 0);
    bowArc.rotation.y = -Math.PI / 2;
    group.add(bowArc);

    // Bow string
    const stringGeo = new THREE.PlaneGeometry(1.2, 0.02);
    const stringMesh = new THREE.Mesh(stringGeo, stringMat);
    stringMesh.position.set(0, 1.4, 0);
    stringMesh.rotation.y = -Math.PI / 2;
    group.add(stringMesh);

    // == LEGS ==
    const legGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.9, 8);
    
    const leftLeg = new THREE.Mesh(legGeo, bodyMat);
    leftLeg.position.set(-0.2, 0.45, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, bodyMat);
    rightLeg.position.set(0.2, 0.45, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    // == SENTINEL TEAM LIGHT ==
    const teamLight = new THREE.PointLight(0x1a8a1a, 0.3, 2.0);
    teamLight.position.set(0, 0.1, 0);
    group.add(teamLight);

    return group;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a simple idle animation loop for a hero group
 * @param {THREE.Group} group - Hero group
 * @param {number} time - Current time in seconds
 * @param {number} speed - Animation speed multiplier
 */
export function animateHeroIdle(group, time, speed = 1.0) {
    if (!group) return;
    
    // Gentle bobbing
    const bobAmount = 0.05;
    const bobY = Math.sin(time * 1.5 * speed) * bobAmount;
    group.position.y = bobY;
}

/**
 * Create a simple walk animation for a hero group
 * @param {THREE.Group} group - Hero group
 * @param {number} time - Current time in seconds
 * @param {number} speed - Animation speed multiplier
 */
export function animateHeroWalk(group, time, speed = 1.0) {
    if (!group) return;
    
    // Leg swing animation
    const legAngle = Math.sin(time * 2.0 * speed) * 0.5;
    
    group.children.forEach((child) => {
        if (child.userData && (child.userData.heroPart === 'leftLeg' || child.userData.heroPart === 'rightLeg')) {
            child.rotation.x = legAngle;
        }
        if (child.userData && child.userData.heroPart === 'rightLeg') {
            child.rotation.x = -legAngle;
        }
    });
}

// ============================================================================
// Export
// ============================================================================

export default {
    buildLich,
    buildSniper,
    buildDragonKnight,
    buildShadowFiend,
    buildWindrunner,
    animateHeroIdle,
    animateHeroWalk,
    
    // Materials for external use
    createStandardMaterial,
    createGlowMaterial,
    createMetallicMaterial
};
