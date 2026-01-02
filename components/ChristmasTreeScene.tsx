
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

interface ChristmasTreeSceneProps {
  isMagicTriggered: boolean;
  wishTrigger?: number;
  photos?: string[];
  rotationOffset?: number;
  focusIndex?: number | null;
  zoomFactor?: number;
}

const ChristmasTreeScene: React.FC<ChristmasTreeSceneProps> = ({ 
  isMagicTriggered, 
  wishTrigger, 
  photos = [],
  rotationOffset = 0,
  focusIndex = null,
  zoomFactor = 0
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    morph: 0, // 0: SCATTERED, 1: TREE_SHAPE
    targetMorph: 1,
    lastTime: 0
  });

  const refs = useRef({
    magic: isMagicTriggered,
    rot: rotationOffset,
    zoom: zoomFactor,
    focus: focusIndex,
    photos: [] as THREE.Group[],
    needles: null as any,
    baubles: null as THREE.InstancedMesh | null,
    gifts: null as THREE.InstancedMesh | null,
    star: null as THREE.Mesh | null
  });

  useEffect(() => { 
    refs.current.magic = isMagicTriggered;
    // When magic is triggered (Open Palm), we ensure tree is shaped. 
    // Otherwise, we could let it drift, but here we link morph to zoomFactor for logic.
    stateRef.current.targetMorph = zoomFactor > 0.5 ? 1 : 1; // Keeping it 1 for default, 0 for scattered
  }, [isMagicTriggered, zoomFactor]);

  useEffect(() => { refs.current.rot = rotationOffset; }, [rotationOffset]);
  useEffect(() => { refs.current.focus = focusIndex; }, [focusIndex]);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x010103);
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 6, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ReinhardToneMapping;
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 4.5, 0);

    const ambient = new THREE.AmbientLight(0x101020, 1.5);
    scene.add(ambient);

    const mainLight = new THREE.PointLight(0xffffff, 20, 40);
    mainLight.position.set(5, 15, 5);
    scene.add(mainLight);

    const treeGroup = new THREE.Group();
    scene.add(treeGroup);

    // --- 1. MORPHING NEEDLE PARTICLES (The Tree Body) ---
    const needleCount = 120000;
    const needleGeo = new THREE.BufferGeometry();
    const needleTreePos = new Float32Array(needleCount * 3);
    const needleScatterPos = new Float32Array(needleCount * 3);
    const needleColors = new Float32Array(needleCount * 3);
    const needleOffsets = new Float32Array(needleCount);

    const treeColor = new THREE.Color(0x062b06);
    const tipColor = new THREE.Color(0x0a3d0a);

    for (let i = 0; i < needleCount; i++) {
      // Tree shape (Multiple cones)
      const layer = Math.floor(Math.random() * 4);
      const hRange = [4, 3.2, 2.4, 1.6][layer];
      const rRange = [3.2, 2.4, 1.6, 0.9][layer];
      const yBase = [3.0, 5.0, 6.8, 8.2][layer];
      
      const py = (Math.random() - 0.5) * hRange;
      const radiusAtY = rRange * (1 - (py + hRange/2) / hRange);
      const angle = Math.random() * Math.PI * 2;
      
      needleTreePos[i*3] = Math.cos(angle) * radiusAtY;
      needleTreePos[i*3+1] = yBase + py;
      needleTreePos[i*3+2] = Math.sin(angle) * radiusAtY;

      // Scatter position (Large sphere)
      const sAngle = Math.random() * Math.PI * 2;
      const sPhi = Math.acos(2 * Math.random() - 1);
      const sDist = 10 + Math.random() * 20;
      needleScatterPos[i*3] = sDist * Math.sin(sPhi) * Math.cos(sAngle);
      needleScatterPos[i*3+1] = sDist * Math.sin(sPhi) * Math.sin(sAngle) + 5;
      needleScatterPos[i*3+2] = sDist * Math.cos(sPhi);

      const col = treeColor.clone().lerp(tipColor, Math.random());
      needleColors[i*3] = col.r; needleColors[i*3+1] = col.g; needleColors[i*3+2] = col.b;
      needleOffsets[i] = Math.random() * 100;
    }

    needleGeo.setAttribute('position', new THREE.BufferAttribute(needleTreePos, 3)); // Placeholder
    needleGeo.setAttribute('aTreePos', new THREE.BufferAttribute(needleTreePos, 3));
    needleGeo.setAttribute('aScatterPos', new THREE.BufferAttribute(needleScatterPos, 3));
    needleGeo.setAttribute('aColor', new THREE.BufferAttribute(needleColors, 3));
    needleGeo.setAttribute('aOffset', new THREE.BufferAttribute(needleOffsets, 1));

    const needleMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uMorph: { value: 1.0 }, uMagic: { value: 0 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `
        uniform float uTime, uMorph, uMagic;
        attribute vec3 aTreePos, aScatterPos, aColor;
        attribute float aOffset;
        varying vec3 vColor;
        void main() {
          vec3 pos = mix(aScatterPos, aTreePos, uMorph);
          // Drift logic
          float drift = (1.0 - uMorph) * 2.0;
          pos.x += sin(uTime * 0.5 + aOffset) * drift;
          pos.y += cos(uTime * 0.3 + aOffset) * drift;
          
          if(uMagic > 0.1) {
             pos += normalize(pos - vec3(0,5,0)) * sin(uTime * 10.0 + aOffset) * 0.1 * uMagic;
          }

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = (1.5 + sin(uTime + aOffset) * 0.5) * (300.0 / -mvPosition.z);
          vColor = aColor;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          if(distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;
          gl_FragColor = vec4(vColor, 0.7);
        }
      `
    });
    const needles = new THREE.Points(needleGeo, needleMat);
    treeGroup.add(needles);
    refs.current.needles = needleMat;

    // --- 2. INSTANCED ORNAMENTS ---
    const baubleCount = 80;
    const baubleMesh = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      new THREE.MeshStandardMaterial({ metalness: 1, roughness: 0.1 }),
      baubleCount
    );
    const baubleData = Array.from({ length: baubleCount }, () => {
      const y = 1.5 + Math.random() * 7.5;
      const r = 3.2 * (1 - y/10.5) + 0.3;
      const angle = Math.random() * Math.PI * 2;
      return {
        tree: new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r),
        scatter: new THREE.Vector3().setFromSphericalCoords(15 + Math.random()*5, Math.random()*Math.PI, Math.random()*Math.PI*2).add(new THREE.Vector3(0,5,0)),
        color: new THREE.Color([0xcc0000, 0xffd700, 0xeeeeee][Math.floor(Math.random()*3)]),
        weight: 0.6 + Math.random() * 0.4
      };
    });
    baubleData.forEach((d, i) => baubleMesh.setColorAt(i, d.color));
    treeGroup.add(baubleMesh);
    refs.current.baubles = baubleMesh;

    const giftCount = 20;
    const giftMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.3, 0.3, 0.3),
      new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.5 }),
      giftCount
    );
    const giftData = Array.from({ length: giftCount }, () => {
      const y = 1.0 + Math.random() * 6;
      const r = 3.2 * (1 - y/10.5) + 0.2;
      const angle = Math.random() * Math.PI * 2;
      return {
        tree: new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r),
        scatter: new THREE.Vector3().setFromSphericalCoords(20 + Math.random()*5, Math.random()*Math.PI, Math.random()*Math.PI*2).add(new THREE.Vector3(0,5,0)),
        color: new THREE.Color(Math.random() > 0.5 ? 0x004400 : 0x660000),
        weight: 0.2 + Math.random() * 0.2 // Heavier boxes move slower
      };
    });
    giftData.forEach((d, i) => giftMesh.setColorAt(i, d.color));
    treeGroup.add(giftMesh);
    refs.current.gifts = giftMesh;

    // --- 3. PHOTO FRAMES (RESTORED) ---
    const createPhotoFrame = (pos: THREE.Vector3) => {
      const group = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.05), new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1 }));
      group.add(frame);
      const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.0), new THREE.MeshStandardMaterial({ color: 0x111111, transparent: true, opacity: 0.9 }));
      photo.name = 'photoPlane'; photo.position.z = 0.03; group.add(photo);
      group.position.copy(pos);
      return group;
    };
    const fPos = [new THREE.Vector3(2.5, 2.5, 1.5), new THREE.Vector3(-2.8, 4, 1.2), new THREE.Vector3(1.5, 6, 0.8), new THREE.Vector3(-1.2, 6.5, -1.5), new THREE.Vector3(0.5, 4.5, -2.2), new THREE.Vector3(-0.8, 2.2, 2.8)];
    refs.current.photos = fPos.map(p => {
      const f = createPhotoFrame(p);
      f.lookAt(0, p.y, 0);
      treeGroup.add(f);
      return f;
    });

    // --- STAR ---
    const starShape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 0.6 : 0.25;
      const a = (Math.PI / 5) * i;
      if (i === 0) starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    const star = new THREE.Mesh(new THREE.ExtrudeGeometry(starShape, { depth: 0.1, bevelEnabled: true }), new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 5 }));
    star.position.set(0, 9.4, 0);
    treeGroup.add(star);
    refs.current.star = star;

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.6, 0.4, 0.85));
    composer.addPass(new OutputPass());

    const dummy = new THREE.Object3D();
    const clock = new THREE.Clock();

    const animate = () => {
      const time = clock.getElapsedTime();
      const { magic, rot, zoom, focus } = refs.current;

      // Morph State Logic
      // Target 1 (Tree) if not magic triggered, Target 0 (Scattered) if magic triggered? 
      // Actually let's make it more fun: Scatter when magic is on!
      stateRef.current.targetMorph = magic ? 0.0 : 1.0;
      stateRef.current.morph = THREE.MathUtils.lerp(stateRef.current.morph, stateRef.current.targetMorph, 0.03);
      const m = stateRef.current.morph;

      needleMat.uniforms.uTime.value = time;
      needleMat.uniforms.uMorph.value = m;
      needleMat.uniforms.uMagic.value = THREE.MathUtils.lerp(needleMat.uniforms.uMagic.value, magic ? 1.0 : 0.0, 0.1);

      star.visible = m > 0.5;
      star.rotation.y = time * 2;
      star.scale.setScalar(m);

      // Update Baubles Morph
      baubleData.forEach((d, i) => {
        const weightM = Math.max(0, Math.min(1, (m - (1 - d.weight)) / d.weight));
        dummy.position.lerpVectors(d.scatter, d.tree, weightM);
        dummy.updateMatrix();
        baubleMesh.setMatrixAt(i, dummy.matrix);
      });
      baubleMesh.instanceMatrix.needsUpdate = true;

      // Update Gifts Morph
      giftData.forEach((d, i) => {
        const weightM = Math.max(0, Math.min(1, (m - (1 - d.weight)) / d.weight));
        dummy.position.lerpVectors(d.scatter, d.tree, weightM);
        dummy.rotation.set(time * (1-m), time * (1-m), 0);
        dummy.updateMatrix();
        giftMesh.setMatrixAt(i, dummy.matrix);
      });
      giftMesh.instanceMatrix.needsUpdate = true;

      // Camera & Controls
      if (focus !== null && refs.current.photos[focus]) {
        const frame = refs.current.photos[focus];
        const worldPos = new THREE.Vector3(); frame.getWorldPosition(worldPos);
        const focusPos = worldPos.clone().add(worldPos.clone().normalize().multiplyScalar(4));
        camera.position.lerp(focusPos, 0.05);
        controls.target.lerp(worldPos, 0.05);
      } else {
        const targetPos = new THREE.Vector3(0, 6, 18 - zoom * 10);
        camera.position.lerp(targetPos, 0.05);
        controls.target.lerp(new THREE.Vector3(0, 4.5, 0), 0.05);
      }

      treeGroup.rotation.y = rot + time * 0.15;
      refs.current.photos.forEach((f, i) => {
        f.visible = m > 0.4;
        f.scale.setScalar(m);
        f.rotation.z = Math.sin(time + i) * 0.1;
      });

      controls.update();
      composer.render();
      requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight); composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); renderer.dispose(); };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default ChristmasTreeScene;
