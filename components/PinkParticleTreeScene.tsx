
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * CINEMATIC CONFIGURATION
 */
const CONFIG = {
  TREE_PARTICLES: 800000, 
  SILVER_ORNAMENT_COUNT: 1200, 
  GOLD_ORNAMENT_COUNT: 400,   
  SEQUIN_COUNT: 800, // Shiny silver sequins
  GIFT_BOX_COUNT: 24, 
  SNOW_PARTICLES: 15000,  
  HEART_PARTICLES: 15000, 
  WISH_METEOR_PARTICLES: 200000, 
  SPIRAL_METEOR_PARTICLES: 100000, 
  COLOR_GOLD_METALLIC: new THREE.Color(0xffd700),
  BLOOM_STRENGTH: 0.6,
};

interface SceneProps {
  isMagicTriggered: boolean;
  wishTrigger?: number;
  photos?: string[];
}

const PinkParticleTreeScene: React.FC<SceneProps> = ({ isMagicTriggered, wishTrigger, photos = [] }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const magicRef = useRef(isMagicTriggered);
  const wishShowerStartTime = useRef<number | null>(null);
  const lastWishTrigger = useRef(0);
  const frameMeshesRef = useRef<THREE.Mesh[]>([]);
  const giftBoxesRef = useRef<THREE.Group[]>([]);
  const textureLoader = useRef(new THREE.TextureLoader());

  useEffect(() => {
    magicRef.current = isMagicTriggered;
  }, [isMagicTriggered]);

  useEffect(() => {
    if (wishTrigger && wishTrigger !== lastWishTrigger.current) {
      lastWishTrigger.current = wishTrigger;
      wishShowerStartTime.current = performance.now();
    }
  }, [wishTrigger]);

  useEffect(() => {
    photos.forEach((photoData, index) => {
      if (index < frameMeshesRef.current.length) {
        textureLoader.current.load(photoData, (texture) => {
          const mesh = frameMeshesRef.current[index];
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.map = texture;
          mat.opacity = 1.0;
          mat.color.set(0xffffff);
          mat.needsUpdate = true;
        });
      }
    });
  }, [photos]);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    mountRef.current.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envScene = new THREE.Scene();
    const createEnvPanel = (color: number, pos: THREE.Vector3, scale: THREE.Vector3) => {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color }));
      panel.position.copy(pos); panel.scale.copy(scale); envScene.add(panel);
    };
    createEnvPanel(0xffffff, new THREE.Vector3(10, 5, 0), new THREE.Vector3(2, 20, 2));
    createEnvPanel(0xffffff, new THREE.Vector3(-10, 5, 0), new THREE.Vector3(2, 20, 2));
    createEnvPanel(0xffffff, new THREE.Vector3(0, 15, 0), new THREE.Vector3(20, 2, 20));
    createEnvPanel(0xffb6c1, new THREE.Vector3(0, 0, 10), new THREE.Vector3(20, 2, 2));
    const envMap = pmremGenerator.fromScene(envScene).texture;
    scene.environment = envMap;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 4.5, 0);

    const starGlowLight = new THREE.PointLight(0xffffff, 0.7, 30); 
    starGlowLight.position.set(0, 9.4, 0);
    scene.add(starGlowLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35); 
    scene.add(ambientLight);

    const treeGroup = new THREE.Group();
    scene.add(treeGroup);

    // --- PHOTO FRAMES ---
    const frameGroup = new THREE.Group();
    treeGroup.add(frameGroup);
    frameMeshesRef.current = [];
    const frameGeom = new THREE.PlaneGeometry(0.8, 1.0);
    const borderGeom = new THREE.BoxGeometry(0.85, 1.05, 0.05);
    const goldFrameMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1.0, roughness: 0.1, emissive: 0x331100 });
    const framePositions = [
      { y: 2.2, angle: 0.5, rMult: 0.95 }, { y: 4.5, angle: 2.1, rMult: 0.92 }, { y: 6.8, angle: 3.8, rMult: 0.88 },
      { y: 3.5, angle: 5.2, rMult: 0.94 }, { y: 5.5, angle: 0.9, rMult: 0.90 }, { y: 1.8, angle: 3.2, rMult: 0.96 },
    ];
    framePositions.forEach((pos) => {
      const g = new THREE.Group();
      const r = (9 - pos.y) / 9 * 3.6 * pos.rMult;
      const x = Math.cos(pos.angle) * r, z = Math.sin(pos.angle) * r;
      g.position.set(x, pos.y, z);
      g.lookAt(new THREE.Vector3(x, 0, z).normalize().multiplyScalar(10).add(g.position));
      const border = new THREE.Mesh(borderGeom, goldFrameMat); g.add(border);
      const photoMesh = new THREE.Mesh(frameGeom, new THREE.MeshStandardMaterial({ color: 0x111111, transparent: true, opacity: 0.5 }));
      photoMesh.position.z = 0.03; g.add(photoMesh);
      frameMeshesRef.current.push(photoMesh);
      frameGroup.add(g);
    });

    // --- METALLIC GIFT BOXES ---
    const giftGroup = new THREE.Group();
    treeGroup.add(giftGroup);
    giftBoxesRef.current = [];
    const silverMetalMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1.0, roughness: 0.1, envMapIntensity: 2.0 });
    const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xff9eb5, metalness: 0.7, roughness: 0.2 });
    const giftBoxGeom = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    const ribbonVGeom = new THREE.BoxGeometry(0.57, 0.57, 0.12);
    const ribbonHGeom = new THREE.BoxGeometry(0.12, 0.57, 0.57);
    const bowGeom = new THREE.TorusGeometry(0.12, 0.03, 8, 16);

    for (let i = 0; i < CONFIG.GIFT_BOX_COUNT; i++) {
      const boxContainer = new THREE.Group();
      const box = new THREE.Mesh(giftBoxGeom, silverMetalMat.clone());
      boxContainer.add(box);
      const r1 = new THREE.Mesh(ribbonVGeom, ribbonMat);
      const r2 = new THREE.Mesh(ribbonHGeom, ribbonMat);
      boxContainer.add(r1); boxContainer.add(r2);
      const b1 = new THREE.Mesh(bowGeom, ribbonMat); b1.position.set(0.08, 0.3, 0); b1.rotation.y = Math.PI/2; b1.rotation.x = Math.PI/4; boxContainer.add(b1);
      const b2 = new THREE.Mesh(bowGeom, ribbonMat); b2.position.set(-0.08, 0.3, 0); b2.rotation.y = Math.PI/2; b2.rotation.x = -Math.PI/4; boxContainer.add(b2);
      const t = i / (CONFIG.GIFT_BOX_COUNT - 1);
      const y = 0.7 + Math.pow(t, 1.2) * 8.0;
      const angle = t * Math.PI * 2 * 2.5 + (Math.random() * 0.5);
      const r = ((9.5 - y) / 9.5) * 3.6 * (0.9 + Math.random() * 0.15);
      boxContainer.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
      boxContainer.rotation.y = Math.random() * Math.PI;
      boxContainer.rotation.x = (Math.random() - 0.5) * 0.4;
      giftGroup.add(boxContainer); giftBoxesRef.current.push(boxContainer);
    }

    // --- TREE PARTICLES ---
    const treeMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uMagic: { value: 0 } },
      vertexShader: `
        uniform float uTime; uniform float uMagic;
        attribute float aScale, aOffset; attribute vec3 aColor;
        varying vec3 vColor; varying float vTwinkle;
        void main() {
          vec3 pos = position;
          float t = uTime * 0.4 + aOffset;
          pos.y += sin(t) * 0.05; pos.x += cos(t * 1.1) * 0.03;
          if(uMagic > 0.01) pos += normalize(pos) * sin(uTime * 4.0 + aOffset) * 0.15 * uMagic;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = aScale * (450.0 / -mvPosition.z);
          vColor = aColor;
          vTwinkle = 0.3 + 0.7 * pow(0.5 + 0.5 * sin(uTime * 3.8 + aOffset * 22.0), 3.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor; varying float vTwinkle;
        void main() {
          float r = distance(gl_PointCoord, vec2(0.5)); if (r > 0.5) discard;
          gl_FragColor = vec4(vColor, pow(1.0 - (r * 2.0), 2.5) * vTwinkle * 0.8); 
        }
      `,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    });

    const treeGeo = new THREE.BufferGeometry();
    const posArr = new Float32Array(CONFIG.TREE_PARTICLES * 3);
    const colArr = new Float32Array(CONFIG.TREE_PARTICLES * 3);
    const scaleArr = new Float32Array(CONFIG.TREE_PARTICLES);
    const offsetArr = new Float32Array(CONFIG.TREE_PARTICLES);
    for (let i = 0; i < CONFIG.TREE_PARTICLES; i++) {
      const y = Math.random() * 9, t = Math.random() * Math.PI * 2, maxRadius = (9 - y) / 9 * 3.6, r = (0.28 + Math.pow(Math.random(), 1.45) * 0.72) * maxRadius;
      posArr[i*3] = Math.cos(t)*r; posArr[i*3+1] = y; posArr[i*3+2] = Math.sin(t)*r;
      let pColor = new THREE.Color(0xffb6c1); if (Math.random() > 0.7) pColor = new THREE.Color(0xffc0cb); if (Math.random() > 0.9) pColor = new THREE.Color(0xff69b4); 
      if (r/maxRadius > 0.65) pColor.lerp(CONFIG.COLOR_GOLD_METALLIC, (r/maxRadius - 0.65) * 2.5);
      colArr[i*3] = pColor.r; colArr[i*3+1] = pColor.g; colArr[i*3+2] = pColor.b;
      scaleArr[i] = Math.random() > 0.98 ? 0.12 + Math.random() * 0.15 : 0.02 + Math.random() * 0.04;
      offsetArr[i] = Math.random() * Math.PI * 100;
    }
    treeGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    treeGeo.setAttribute('aColor', new THREE.BufferAttribute(colArr, 3));
    treeGeo.setAttribute('aScale', new THREE.BufferAttribute(scaleArr, 1));
    treeGeo.setAttribute('aOffset', new THREE.BufferAttribute(offsetArr, 1));
    treeGroup.add(new THREE.Points(treeGeo, treeMat));

    // --- ORNAMENTS (METALLIC BALLS & SEQUINS) ---
    const ballSilverMat = new THREE.MeshStandardMaterial({ 
      color: 0xe0e0e0, metalness: 1.0, roughness: 0.05, 
      emissive: 0xffffff, emissiveIntensity: 0.05, envMapIntensity: 2.5 
    });
    const ballGoldMat = new THREE.MeshStandardMaterial({ 
      color: 0xffd700, metalness: 1.0, roughness: 0.05, 
      emissive: 0xffaa00, emissiveIntensity: 0.05, envMapIntensity: 2.5 
    });
    const sequinMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, metalness: 1.0, roughness: 0.01,
      side: THREE.DoubleSide, envMapIntensity: 3.0
    });

    const ballSilverMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 16, 16), ballSilverMat, CONFIG.SILVER_ORNAMENT_COUNT);
    const ballGoldMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.085, 16, 16), ballGoldMat, CONFIG.GOLD_ORNAMENT_COUNT);
    const sequinMesh = new THREE.InstancedMesh(new THREE.CircleGeometry(0.04, 8), sequinMat, CONFIG.SEQUIN_COUNT);

    const dummyOrnament = new THREE.Object3D();
    
    // Position Silver Balls
    for (let i = 0; i < CONFIG.SILVER_ORNAMENT_COUNT; i++) {
      const y = 0.4 + Math.random() * 8.6; const maxR = (9 - y) / 9 * 3.6; const r = maxR * (0.97 + Math.random() * 0.03); const angle = Math.random() * Math.PI * 2;
      dummyOrnament.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r); 
      dummyOrnament.scale.setScalar(0.4 + Math.random() * 0.9); dummyOrnament.updateMatrix(); ballSilverMesh.setMatrixAt(i, dummyOrnament.matrix);
    }
    
    // Position Gold Balls
    for (let i = 0; i < CONFIG.GOLD_ORNAMENT_COUNT; i++) {
      const y = 0.8 + Math.random() * 8.2; const maxR = (9 - y) / 9 * 3.6; const r = maxR * (0.95 + Math.random() * 0.03); const angle = Math.random() * Math.PI * 2;
      dummyOrnament.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r); 
      dummyOrnament.scale.setScalar(0.7 + Math.random() * 0.8); dummyOrnament.updateMatrix(); ballGoldMesh.setMatrixAt(i, dummyOrnament.matrix);
    }

    // Position Sequins
    for (let i = 0; i < CONFIG.SEQUIN_COUNT; i++) {
      const y = 0.5 + Math.random() * 8.5; const maxR = (9 - y) / 9 * 3.6; const r = maxR * (0.98 + Math.random() * 0.04); const angle = Math.random() * Math.PI * 2;
      dummyOrnament.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
      dummyOrnament.lookAt(new THREE.Vector3(0, y, 0)); // Make them face outwards/sideways
      dummyOrnament.rotation.z += Math.random() * Math.PI;
      dummyOrnament.updateMatrix(); sequinMesh.setMatrixAt(i, dummyOrnament.matrix);
    }

    treeGroup.add(ballSilverMesh); 
    treeGroup.add(ballGoldMesh);
    treeGroup.add(sequinMesh);

    // --- SPIRAL METEOR ---
    const spiralGeo = new THREE.BufferGeometry();
    const spirOf = new Float32Array(CONFIG.SPIRAL_METEOR_PARTICLES);
    for (let i = 0; i < CONFIG.SPIRAL_METEOR_PARTICLES; i++) spirOf[i] = Math.random() * 20000;
    spiralGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(CONFIG.SPIRAL_METEOR_PARTICLES * 3), 3));
    spiralGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(CONFIG.SPIRAL_METEOR_PARTICLES), 1));
    spiralGeo.setAttribute('opacity', new THREE.BufferAttribute(new Float32Array(CONFIG.SPIRAL_METEOR_PARTICLES), 1));
    spiralGeo.setAttribute('aOffset', new THREE.BufferAttribute(spirOf, 1));
    const spiralMat = new THREE.ShaderMaterial({
      uniforms: { uTime:{value:0}, uColor:{value:new THREE.Color(0xfffffa)} },
      vertexShader: `
        attribute float size, opacity, aOffset; uniform float uTime; varying float vOpacity, vSparkle;
        void main() { 
          vOpacity = opacity; vSparkle = 0.1 + 0.9 * pow(max(0.0, sin(uTime * 65.0 + aOffset) * 0.7 + sin(uTime * 32.0 + aOffset * 2.1) * 0.3), 4.0);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPos; gl_PointSize = size * (1500.0 / -mvPos.z); 
        }`,
      fragmentShader: `uniform vec3 uColor; varying float vOpacity, vSparkle; void main() { float r = distance(gl_PointCoord, vec2(0.5)); if (r > 0.5) discard; gl_FragColor = vec4(uColor, vOpacity * vSparkle * pow(1.0 - r * 2.0, 8.0) * 0.7); }`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    });
    treeGroup.add(new THREE.Points(spiralGeo, spiralMat));

    // --- WISH METEOR SHOWER ---
    const wishMeteorGeo = new THREE.BufferGeometry();
    const wishMP = new Float32Array(CONFIG.WISH_METEOR_PARTICLES * 3);
    const wishMS = new Float32Array(CONFIG.WISH_METEOR_PARTICLES);
    const wishMO = new Float32Array(CONFIG.WISH_METEOR_PARTICLES);
    const numStreaks = 600; 
    const partsPerStreak = Math.floor(CONFIG.WISH_METEOR_PARTICLES / numStreaks);
    const streakData = Array.from({ length: numStreaks }, (_, i) => {
      const isKing = i === 0;
      return {
        isKing, delay: isKing ? 100 : Math.random() * 800,
        speedFactor: isKing ? 1.2 : 1.8 + Math.random() * 1.5,
        startX: isKing ? -55 : -70 + (Math.random() - 0.5) * 80,
        startY: isKing ? -10 : -50 + (Math.random() - 0.5) * 50,
        endXOffset: isKing ? 120 : 90 + (Math.random() - 0.5) * 30,
        endYOffset: isKing ? 50 : 70 + (Math.random() - 0.5) * 20
      };
    });
    wishMeteorGeo.setAttribute('position', new THREE.BufferAttribute(wishMP, 3));
    wishMeteorGeo.setAttribute('aSize', new THREE.BufferAttribute(wishMS, 1));
    wishMeteorGeo.setAttribute('aOpacity', new THREE.BufferAttribute(wishMO, 1));
    const wishMeteorMat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(0xf8f8ff) }, uTime: { value: 0 } },
      vertexShader: `
        uniform float uTime; attribute float aSize, aOpacity; varying float vOpacity, vSparkle;
        void main() { vOpacity = aOpacity; vSparkle = 0.3 + 0.7 * pow(sin(uTime * 120.0 + position.x * 30.0 + position.y * 30.0) * 0.5 + 0.5, 2.5);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPos; gl_PointSize = aSize * (1800.0 / -mvPos.z); }
      `,
      fragmentShader: `uniform vec3 uColor; varying float vOpacity, vSparkle; void main() { float r = distance(gl_PointCoord, vec2(0.5)); if (r > 0.5) discard; gl_FragColor = vec4(uColor, vOpacity * vSparkle * pow(1.0 - r * 2.0, 4.0)); }`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    });
    scene.add(new THREE.Points(wishMeteorGeo, wishMeteorMat));

    // --- HEART / TOP STAR ---
    const heartGeo = new THREE.BufferGeometry();
    const hP = new Float32Array(CONFIG.HEART_PARTICLES*3), hS = new Float32Array(CONFIG.HEART_PARTICLES), hOf = new Float32Array(CONFIG.HEART_PARTICLES);
    for(let i=0; i<CONFIG.HEART_PARTICLES; i++){
      const t=Math.random()*Math.PI*2, r=Math.pow(Math.random(),0.5); 
      const x=16*Math.pow(Math.sin(t),3), y=13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t), sf=0.045*r;
      hP[i*3]=x*sf; hP[i*3+1]=y*sf; hP[i*3+2]=(Math.random()-0.5)*0.15; hS[i]=0.04+Math.random()*0.12; hOf[i]=Math.random()*100;
    }
    heartGeo.setAttribute('position', new THREE.BufferAttribute(hP, 3));
    heartGeo.setAttribute('aScale', new THREE.BufferAttribute(hS, 1));
    heartGeo.setAttribute('aOffset', new THREE.BufferAttribute(hOf, 1));
    const heartMat = new THREE.ShaderMaterial({
      uniforms: { uTime:{value:0}, uColor:{value:new THREE.Color(0xffffff)}, uMagic:{value:0} },
      vertexShader: `uniform float uTime, uMagic; attribute float aScale, aOffset; varying float vT; void main() { vec3 p=position; if(uMagic>0.5) p*=1.0+sin(uTime*12.0+aOffset)*0.05; vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv; gl_PointSize=aScale*(450.0/-mv.z); vT=0.2+0.8*pow(0.5+0.5*sin(uTime*8.0+aOffset*0.1), 5.0); }`,
      fragmentShader: `uniform vec3 uColor; varying float vT; void main() { float r=distance(gl_PointCoord,vec2(0.5)); if(r>0.5)discard; gl_FragColor=vec4(uColor, vT*(1.0-r*2.0)*0.25); }`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const hPoints = new THREE.Points(heartGeo, heartMat); hPoints.position.set(0,9.4,0); treeGroup.add(hPoints);

    // --- SNOW ---
    const snowGeo = new THREE.BufferGeometry();
    const snP = new Float32Array(CONFIG.SNOW_PARTICLES*3);
    for(let i=0; i<CONFIG.SNOW_PARTICLES; i++){ snP[i*3]=(Math.random()-0.5)*70; snP[i*3+1]=Math.random()*35; snP[i*3+2]=(Math.random()-0.5)*70; }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snP, 3));
    const snowMat = new THREE.ShaderMaterial({
      uniforms: { uTime:{value:0} },
      vertexShader: `uniform float uTime; void main() { vec3 pos=position; pos.x+=sin(uTime*0.4+position.x)*2.0; pos.z+=cos(uTime*0.2+position.z)*1.5; vec4 mv=modelViewMatrix*vec4(pos,1.0); gl_Position=projectionMatrix*mv; gl_PointSize=(0.6+fract(position.y)*0.5)*(250.0/-mv.z); }`,
      fragmentShader: `void main() { float r=distance(gl_PointCoord,vec2(0.5)); if(r>0.5)discard; gl_FragColor=vec4(1.0,1.0,1.0,pow(1.0-r*2.0,3.0)*0.3); }`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    });
    scene.add(new THREE.Points(snowGeo, snowMat));

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), CONFIG.BLOOM_STRENGTH, 0.4, 0.85);
    composer.addPass(bloom); composer.addPass(new OutputPass());

    const clock = new THREE.Clock();
    const animate = () => {
      const time = clock.getElapsedTime();
      const isMagic = magicRef.current;
      const now = performance.now();

      treeMat.uniforms.uTime.value = time; treeMat.uniforms.uMagic.value = THREE.MathUtils.lerp(treeMat.uniforms.uMagic.value, isMagic ? 1.0 : 0.0, 0.1);
      heartMat.uniforms.uTime.value = time; heartMat.uniforms.uMagic.value = isMagic ? 1.0 : 0.0;
      snowMat.uniforms.uTime.value = time; spiralMat.uniforms.uTime.value = time; wishMeteorMat.uniforms.uTime.value = time;
      
      treeGroup.rotation.y = time * 0.25;
      starGlowLight.intensity = (0.7 + Math.pow(0.5+0.5*Math.sin(time*8.0), 4.0)*0.5) * (isMagic ? 2.0 : 1.0);
      
      const envInt = isMagic ? 4.0 : 2.5;
      ballSilverMat.envMapIntensity = envInt + 1.0;
      ballGoldMat.envMapIntensity = envInt + 1.0;
      sequinMat.envMapIntensity = envInt + 2.0;
      silverMetalMat.envMapIntensity = envInt + 1.5;

      // UPDATE PHOTO FRAMES
      frameGroup.children.forEach((f, idx) => {
        f.rotation.z = Math.sin(time + idx) * 0.05;
        f.rotation.y = Math.cos(time * 0.5 + idx) * 0.03;
      });

      // UPDATE GIFT BOXES
      giftBoxesRef.current.forEach((g, idx) => {
        g.rotation.y += 0.005;
        g.rotation.z = Math.sin(time * 0.7 + idx) * 0.08;
        g.position.y += Math.sin(time * 1.2 + idx) * 0.0015;
      });

      // UPDATE SPIRAL METEOR
      const spiralDuration = 10.0; 
      const cycleProg = (time % spiralDuration) / spiralDuration;
      const spPArr = spiralGeo.attributes.position.array as Float32Array;
      const spSArr = spiralGeo.attributes.size.array as Float32Array;
      const spOArr = spiralGeo.attributes.opacity.array as Float32Array;
      for (let i = 0; i < CONFIG.SPIRAL_METEOR_PARTICLES; i++) {
        const iN = i / CONFIG.SPIRAL_METEOR_PARTICLES; const p = cycleProg - (iN * 0.5); const isV = (p > 0 && p < 1) ? 1.0 : 0.0;
        const nP = Math.max(0, Math.min(1, p)); const y = nP * 9.6; const ang = nP * Math.PI * 8; const rAtY = ((9.6 - y) / 9.6) * 3.6 + 0.55;
        spPArr[i*3] = Math.cos(ang) * (rAtY + (Math.pow(Math.random(), 2.0) - 0.5) * 0.1);
        spPArr[i*3+1] = y + (Math.random() - 0.5) * 0.1;
        spPArr[i*3+2] = Math.sin(ang) * (rAtY + (Math.pow(Math.random(), 2.0) - 0.5) * 0.1);
        spSArr[i] = (0.13 * Math.pow(1.0 - iN, 1.4) + 0.004) * isV;
        spOArr[i] = isV * Math.pow(1.0 - iN, 2.2) * 0.6;
      }
      spiralGeo.attributes.position.needsUpdate = true; spiralGeo.attributes.size.needsUpdate = true; spiralGeo.attributes.opacity.needsUpdate = true;

      // UPDATE WISH METEOR SHOWER
      if (wishShowerStartTime.current) {
        const wPArr = wishMeteorGeo.attributes.position.array as Float32Array;
        const wSArr = wishMeteorGeo.attributes.aSize.array as Float32Array;
        const wOArr = wishMeteorGeo.attributes.aOpacity.array as Float32Array;
        const showerElapsed = now - wishShowerStartTime.current;
        if (showerElapsed < 3500) {
          for (let s = 0; s < numStreaks; s++) {
            const data = streakData[s]; const streakElapsed = showerElapsed - data.delay; const streakTotalTime = 1200 / data.speedFactor; const progress = streakElapsed / streakTotalTime;
            const startVec = new THREE.Vector3(data.startX, data.startY, -15); const endVec = new THREE.Vector3(data.startX + data.endXOffset, data.startY + data.endYOffset, -15);
            const trailSpan = data.isKing ? 1.0 : 0.4;
            for (let p = 0; p < partsPerStreak; p++) {
              const idx = s * partsPerStreak + p; const pRatio = p / partsPerStreak; const pProgress = progress - (pRatio * trailSpan); const isVisible = (pProgress > 0 && pProgress < 1.0) ? 1.0 : 0.0;
              if (isVisible) {
                const currentPos = new THREE.Vector3().lerpVectors(startVec, endVec, pProgress); const jitter = (data.isKing ? 0.015 : 0.04) * (1.0 + pRatio * 5.0);
                wPArr[idx*3] = currentPos.x + (Math.random() - 0.5) * jitter; wPArr[idx*3+1] = currentPos.y + (Math.random() - 0.5) * jitter; wPArr[idx*3+2] = currentPos.z + (Math.random() - 0.5) * jitter;
                const isHead = pRatio < 0.04;
                if (data.isKing) {
                  wSArr[idx] = (isHead ? 0.85 : (0.35 * Math.pow(1.0 - pRatio, 1.2) + 0.05)) * (1.3 - progress * 0.3); wOArr[idx] = (isHead ? 1.0 : (0.95 * Math.pow(1.0 - pRatio, 1.3))) * (1.0 - progress * 0.1);
                } else {
                  wSArr[idx] = (isHead ? 0.35 : (0.1 * Math.pow(1.0 - pRatio, 2.0) + 0.01)) * (1.0 - progress * 0.4); wOArr[idx] = (isHead ? 0.9 : (0.7 * Math.pow(1.0 - pRatio, 3.0))) * (1.0 - progress * 0.3);
                }
              } else { wSArr[idx] = 0; wOArr[idx] = 0; }
            }
          }
        } else { for (let i = 0; i < CONFIG.WISH_METEOR_PARTICLES; i++) { wSArr[i] = 0; wOArr[i] = 0; } wishShowerStartTime.current = null; }
        wishMeteorGeo.attributes.position.needsUpdate = true; wishMeteorGeo.attributes.aSize.needsUpdate = true; wishMeteorGeo.attributes.aOpacity.needsUpdate = true;
      }

      // SNOW UPDATE
      const snPArr = snowGeo.attributes.position.array as Float32Array;
      for(let i=0; i<CONFIG.SNOW_PARTICLES; i++) { snPArr[i*3+1]-=(0.02+Math.random()*0.05)*(isMagic?5:1); if(snPArr[i*3+1]<-6)snPArr[i*3+1]=32; }
      snowGeo.attributes.position.needsUpdate=true;

      bloom.strength = (CONFIG.BLOOM_STRENGTH + (isMagic ? 0.3 : 0)) * (0.9 + 0.1 * Math.sin(time * 2.5));
      controls.update(); composer.render(); requestAnimationFrame(animate);
    };
    
    animate();

    const handleResize = () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); composer.setSize(window.innerWidth, window.innerHeight); };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); if (mountRef.current) mountRef.current.removeChild(renderer.domElement); pmremGenerator.dispose(); renderer.dispose(); };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default PinkParticleTreeScene;
