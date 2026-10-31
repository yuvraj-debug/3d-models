/**
 * 3D Robot Component - Plug & Play Web Module
 * Matches 3D robot design with exact studio lighting & materials.
 * 
 * Usage in any website:
 *   import { initRobot3D } from './robot-3d.js';
 *   const bot = initRobot3D(document.getElementById('robot-container'));
 * 
 * Or using Web Component:
 *   <script type="module" src="./robot-3d.js"></script>
 *   <robot-3d style="width: 350px; height: 420px;"></robot-3d>
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export const DEFAULT_CONFIG = {
  // User calibrated defaults
  rimIntensity: 10.0,
  rimColor: '#ff7711',
  bloomStrength: 0.0,
  emissiveIntensity: 1.5,
  bodyRoughness: 0.26,
  bodyClearcoat: 0.00,
  showGrid: false,
  
  // Website integration options
  transparentBackground: true,
  backgroundColor: 0x0a0b0d,
  enableOrbitControls: true,
  enableMouseLook: true,
  idleAnimation: true,
  cameraDistance: 6.2
};

export function initRobot3D(container, userOptions = {}) {
  if (!container) {
    console.error('[Robot3D] Container element is required.');
    return null;
  }

  const config = { ...DEFAULT_CONFIG, ...userOptions };

  // Ensure container has relative/absolute positioning
  const computedStyle = window.getComputedStyle(container);
  if (computedStyle.position === 'static') {
    container.style.position = 'relative';
  }

  const width = container.clientWidth || 400;
  const height = container.clientHeight || 450;

  // Scene
  const scene = new THREE.Scene();
  if (!config.transparentBackground) {
    scene.background = new THREE.Color(config.backgroundColor);
  }

  // Camera
  const camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 100);
  camera.position.set(0, -0.18, config.cameraDistance);
  const cameraTarget = new THREE.Vector3(0, -0.32, 0);
  camera.lookAt(cameraTarget);

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: config.transparentBackground,
    preserveDrawingBuffer: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  // Orbit Controls
  let controls = null;
  if (config.enableOrbitControls) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(cameraTarget);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.maxDistance = 12;
    controls.minDistance = 2.5;
  }

  // Post Processing
  let composer = null;
  let bloomPass = null;
  if (config.bloomStrength > 0) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      config.bloomStrength,
      0.4,
      0.8
    );
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());
  }

  // Studio Reflection Environment
  function setupStudioEnv() {
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x06070a);
    const panelGeo = new THREE.PlaneGeometry(16, 16);

    const warmMat = new THREE.MeshBasicMaterial({ color: 0xff6a00 });
    const warmPanel = new THREE.Mesh(panelGeo, warmMat);
    warmPanel.position.set(-10, 4, 3);
    warmPanel.lookAt(0, 0, 0);
    envScene.add(warmPanel);

    const topMat = new THREE.MeshBasicMaterial({ color: 0xff8820 });
    const topPanel = new THREE.Mesh(panelGeo, topMat);
    topPanel.position.set(0, 12, 1);
    topPanel.rotation.x = Math.PI / 2;
    envScene.add(topPanel);

    const fillMat = new THREE.MeshBasicMaterial({ color: 0x222632 });
    const fillPanel = new THREE.Mesh(panelGeo, fillMat);
    fillPanel.position.set(10, 2, 2);
    fillPanel.lookAt(0, 0, 0);
    envScene.add(fillPanel);

    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envMap = pmrem.fromScene(envScene).texture;
    pmrem.dispose();
    return envMap;
  }
  scene.environment = setupStudioEnv();

  // Background Grid (Optional)
  const gridGroup = new THREE.Group();
  const gridWall = new THREE.GridHelper(18, 26, 0x181a20, 0x111317);
  gridWall.position.set(0, -0.3, -2.2);
  gridWall.rotation.x = Math.PI / 2;
  gridGroup.add(gridWall);
  gridGroup.visible = config.showGrid;
  scene.add(gridGroup);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x161822, 0.9);
  scene.add(ambientLight);

  const warmRimLight = new THREE.PointLight(new THREE.Color(config.rimColor), config.rimIntensity, 25, 1.2);
  warmRimLight.position.set(-3.4, 1.8, 1.4);
  scene.add(warmRimLight);

  const warmDirRim = new THREE.DirectionalLight(new THREE.Color(config.rimColor), config.rimIntensity * 0.35);
  warmDirRim.position.set(-5, 2.0, 0.2);
  scene.add(warmDirRim);

  const topLight = new THREE.DirectionalLight(0xff8820, 1.5);
  topLight.position.set(0.2, 5.5, 1.6);
  scene.add(topLight);

  const rightRimLight = new THREE.PointLight(0xff9933, 2.2, 16, 1.3);
  rightRimLight.position.set(3.4, 0.6, 0.8);
  scene.add(rightRimLight);

  const frontFill = new THREE.DirectionalLight(0x2d323e, 1.0);
  frontFill.position.set(0, 0.2, 4.8);
  scene.add(frontFill);

  // Materials
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x101113,
    metalness: 0.06,
    roughness: config.bodyRoughness,
    clearcoat: config.bodyClearcoat,
    clearcoatRoughness: 0.20,
    reflectivity: 0.55,
    envMapIntensity: 0.95
  });

  const yellowEmissiveMaterial = new THREE.MeshStandardMaterial({
    color: 0xffb703,
    emissive: 0xff9100,
    emissiveIntensity: config.emissiveIntensity,
    roughness: 0.28,
    metalness: 0.0
  });

  const darkMetalMaterial = new THREE.MeshStandardMaterial({
    color: 0x0c0d0f,
    metalness: 0.8,
    roughness: 0.28
  });

  // Robot Model
  const robot = new THREE.Group();
  robot.position.set(0, -0.36, 0);
  scene.add(robot);

  // 1. Head Group
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.44, 0);
  robot.add(headGroup);

  const headGeo = new RoundedBoxGeometry(1.42, 1.20, 1.06, 12, 0.28);
  const headMesh = new THREE.Mesh(headGeo, bodyMaterial);
  headGroup.add(headMesh);

  // Face Screen
  const faceScreenGeo = new RoundedBoxGeometry(1.08, 0.80, 0.10, 10, 0.12);
  const faceScreenMesh = new THREE.Mesh(faceScreenGeo, bodyMaterial);
  faceScreenMesh.position.set(0, -0.015, 0.505);
  headGroup.add(faceScreenMesh);

  // Eyes
  const eyeGeo = new RoundedBoxGeometry(0.22, 0.25, 0.08, 8, 0.035);
  const leftEye = new THREE.Mesh(eyeGeo, yellowEmissiveMaterial);
  leftEye.position.set(-0.25, 0.055, 0.545);
  headGroup.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, yellowEmissiveMaterial);
  rightEye.position.set(0.25, 0.055, 0.545);
  headGroup.add(rightEye);

  // Mouth
  const mouthGeo = new RoundedBoxGeometry(0.44, 0.065, 0.08, 8, 0.028);
  const mouth = new THREE.Mesh(mouthGeo, yellowEmissiveMaterial);
  mouth.position.set(0, -0.19, 0.545);
  headGroup.add(mouth);

  // Ears
  const earGeo = new THREE.CylinderGeometry(0.165, 0.165, 0.17, 36);
  earGeo.rotateZ(Math.PI / 2);
  const earCollarGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.04, 36);
  earCollarGeo.rotateZ(Math.PI / 2);

  const leftEarMesh = new THREE.Mesh(earGeo, yellowEmissiveMaterial);
  leftEarMesh.position.set(-0.73, 0.05, 0);
  headGroup.add(leftEarMesh);

  const leftCollar = new THREE.Mesh(earCollarGeo, bodyMaterial);
  leftCollar.position.set(-0.66, 0.05, 0);
  headGroup.add(leftCollar);

  const rightEarMesh = new THREE.Mesh(earGeo, yellowEmissiveMaterial);
  rightEarMesh.position.set(0.73, 0.05, 0);
  headGroup.add(rightEarMesh);

  const rightCollar = new THREE.Mesh(earCollarGeo, bodyMaterial);
  rightCollar.position.set(0.66, 0.05, 0);
  headGroup.add(rightCollar);

  // Antenna
  const antennaGroup = new THREE.Group();
  antennaGroup.position.set(0, 0.60, 0);

  const antennaBaseGeo = new THREE.CylinderGeometry(0.06, 0.09, 0.05, 24);
  antennaBaseGeo.translate(0, 0.025, 0);
  const antennaBase = new THREE.Mesh(antennaBaseGeo, bodyMaterial);
  antennaGroup.add(antennaBase);

  const stemGeo = new THREE.CylinderGeometry(0.020, 0.020, 0.35, 24);
  stemGeo.translate(0, 0.22, 0);
  const stemMesh = new THREE.Mesh(stemGeo, darkMetalMaterial);
  antennaGroup.add(stemMesh);

  const bulbGeo = new THREE.SphereGeometry(0.125, 32, 32);
  const bulbMesh = new THREE.Mesh(bulbGeo, yellowEmissiveMaterial);
  bulbMesh.position.set(0, 0.44, 0);
  antennaGroup.add(bulbMesh);
  headGroup.add(antennaGroup);

  // 2. Neck
  const neckGeo = new THREE.CylinderGeometry(0.24, 0.36, 0.23, 36);
  const neckMesh = new THREE.Mesh(neckGeo, bodyMaterial);
  neckMesh.position.set(0, -0.25, 0);
  robot.add(neckMesh);

  // 3. Torso
  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, -0.82, 0);
  robot.add(bodyGroup);

  const torsoGeo = new RoundedBoxGeometry(1.26, 0.88, 0.88, 12, 0.32);
  const torsoMesh = new THREE.Mesh(torsoGeo, bodyMaterial);
  bodyGroup.add(torsoMesh);

  const chestCircleGeo = new THREE.CylinderGeometry(0.185, 0.185, 0.05, 36);
  chestCircleGeo.rotateX(Math.PI / 2);
  const chestEmblem = new THREE.Mesh(chestCircleGeo, yellowEmissiveMaterial);
  chestEmblem.position.set(0, 0.01, 0.455);
  bodyGroup.add(chestEmblem);

  // 4. Arms
  const armGeo = new THREE.CapsuleGeometry(0.105, 0.46, 16, 32);

  const leftArm = new THREE.Mesh(armGeo, bodyMaterial);
  leftArm.position.set(-0.78, -0.04, 0.02);
  leftArm.rotation.set(-0.08, 0, 0.32);
  bodyGroup.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, bodyMaterial);
  rightArm.position.set(0.78, -0.04, 0.02);
  rightArm.rotation.set(-0.08, 0, -0.32);
  bodyGroup.add(rightArm);

  // Mouse Look Interaction
  let targetRotationX = 0;
  let targetRotationY = 0;
  const onMouseMove = (event) => {
    if (!config.enableMouseLook) return;
    const rect = container.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    targetRotationY = x * 0.28;
    targetRotationX = -y * 0.18;
  };

  if (config.enableMouseLook) {
    window.addEventListener('mousemove', onMouseMove);
  }

  // Animation Loop
  let isRunning = true;
  let animId = null;
  const clock = new THREE.Clock();

  function render() {
    if (!isRunning) return;
    animId = requestAnimationFrame(render);

    const elapsed = clock.getElapsedTime();

    if (config.idleAnimation) {
      const breath = Math.sin(elapsed * 1.8) * 0.015;
      headGroup.position.y = 0.44 + breath * 1.2;
      headGroup.rotation.z = Math.sin(elapsed * 0.9) * 0.012;
      antennaGroup.rotation.z = Math.sin(elapsed * 2.2) * 0.025;
      leftArm.rotation.z = 0.32 + Math.sin(elapsed * 1.8) * 0.02;
      rightArm.rotation.z = -0.32 - Math.sin(elapsed * 1.8) * 0.02;
      bodyGroup.position.y = -0.82 + breath * 0.6;
    }

    if (config.enableMouseLook) {
      robot.rotation.y += (targetRotationY - robot.rotation.y) * 0.06;
      robot.rotation.x += (targetRotationX - robot.rotation.x) * 0.06;
    }

    if (controls) controls.update();

    if (composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }

  render();

  // Resize Handling
  const resize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    renderer.setSize(w, h);
    if (composer) {
      composer.setSize(w, h);
      if (bloomPass) bloomPass.resolution.set(w, h);
    }
  };

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(container);

  // Return Public API
  return {
    container,
    scene,
    camera,
    renderer,
    robot,
    materials: {
      body: bodyMaterial,
      emissive: yellowEmissiveMaterial
    },
    lights: {
      rimLight: warmRimLight,
      dirRim: warmDirRim,
      topLight: topLight
    },
    resetView: () => {
      camera.position.set(0, -0.18, config.cameraDistance);
      camera.lookAt(cameraTarget);
      if (controls) {
        controls.target.copy(cameraTarget);
        controls.update();
      }
      robot.rotation.set(0, 0, 0);
    },
    setIdleAnimation: (enable) => {
      config.idleAnimation = enable;
      if (!enable) {
        headGroup.position.y = 0.44;
        headGroup.rotation.set(0, 0, 0);
        antennaGroup.rotation.set(0, 0, 0);
        leftArm.rotation.set(-0.08, 0, 0.32);
        rightArm.rotation.set(-0.08, 0, -0.32);
        bodyGroup.position.y = -0.82;
      }
    },
    destroy: () => {
      isRunning = false;
      if (animId) cancelAnimationFrame(animId);
      if (config.enableMouseLook) {
        window.removeEventListener('mousemove', onMouseMove);
      }
      resizeObserver.disconnect();
      if (controls) controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    }
  };
}

// Custom Web Component (<robot-3d></robot-3d>)
class Robot3DElement extends HTMLElement {
  connectedCallback() {
    const mouseLook = this.getAttribute('mouse-look') !== 'false';
    const orbit = this.getAttribute('orbit-controls') !== 'false';
    const transparent = this.getAttribute('transparent') !== 'false';

    this.botInstance = initRobot3D(this, {
      enableMouseLook: mouseLook,
      enableOrbitControls: orbit,
      transparentBackground: transparent
    });
  }

  disconnectedCallback() {
    if (this.botInstance) {
      this.botInstance.destroy();
    }
  }
}

if (!customElements.get('robot-3d')) {
  customElements.define('robot-3d', Robot3DElement);
}
