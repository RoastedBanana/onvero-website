'use client';

import { useRef, useEffect } from 'react';
import type * as ThreeTypes from 'three';

export function Model3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let cancelled = false;
    let cleanupFn: (() => void) | null = null;

    (async () => {
      const THREE = (await import('three')) as typeof ThreeTypes;
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      if (cancelled) return;

      // ── Renderer ──────────────────────────────────────────────────────────
      // The container is CSS-scaled up to 4× by the parallax. Render at 4× the
      // container's CSS size so the canvas stays crisp at maximum zoom.
      const ZOOM_SCALE = 4;
      const w = (mount.clientWidth  || 200) * ZOOM_SCALE;
      const h = (mount.clientHeight || 150) * ZOOM_SCALE;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h, false); // false = don't overwrite canvas CSS style
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping        = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 2.2;
      mount.appendChild(renderer.domElement);
      Object.assign(renderer.domElement.style, {
        position: 'absolute', inset: '0', width: '100%', height: '100%',
      });

      // ── Scene & Camera ────────────────────────────────────────────────────
      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 1000);
      camera.position.set(0, 0, 6);
      camera.lookAt(0, 0, 0);

      // ── Lights ────────────────────────────────────────────────────────────
      scene.add(new THREE.AmbientLight(0xffffff, 1.5));

      const dirA = new THREE.DirectionalLight(0xffffff, 3.0);
      dirA.position.set(5, 5, 5);
      scene.add(dirA);

      const dirB = new THREE.DirectionalLight(0x8888ff, 1.5);
      dirB.position.set(-5, -3, -5);
      scene.add(dirB);

      // ── Interaction state (mouse only) ───────────────────────────────────
      let targetRotationX  = 0;
      let targetRotationY  = 0;
      let currentRotationX = 0;
      let currentRotationY = 0;

      const onMouseMove = (e: MouseEvent) => {
        const rect = mount.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width  - 0.5;
        const y = (e.clientY - rect.top)  / rect.height - 0.5;
        targetRotationY = x * 0.4;
        targetRotationX = -y * 0.4;
      };
      const onMouseLeave = () => {
        targetRotationX = 0;
        targetRotationY = 0;
      };

      mount.addEventListener('mousemove',  onMouseMove);
      mount.addEventListener('mouseleave', onMouseLeave);

      // ── Resize ────────────────────────────────────────────────────────────
      const ro = new ResizeObserver(() => {
        const nw = mount.clientWidth  * ZOOM_SCALE;
        const nh = mount.clientHeight * ZOOM_SCALE;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh, false); // false = don't overwrite canvas CSS style
      });
      ro.observe(mount);

      // ── Load GLB ──────────────────────────────────────────────────────────
      let raf = 0;

      new GLTFLoader().load(
        '/onvero-3d.glb',
        (gltf: { scene: ThreeTypes.Object3D; animations: ThreeTypes.AnimationClip[] }) => {
          if (cancelled) return;

          const model = gltf.scene;
          scene.add(model);

          // Scale first, then centre — order matters
          const box    = new THREE.Box3().setFromObject(model);
          const centre = box.getCenter(new THREE.Vector3());
          const size   = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const k      = 3.5 / maxDim;

          model.scale.setScalar(k);
          model.position.set(-centre.x * k, -centre.y * k, -centre.z * k);

          // Replace Spline glass/mirror materials with a lit standard material
          model.traverse((child: ThreeTypes.Object3D) => {
            if (!(child as ThreeTypes.Mesh).isMesh) return;
            (child as ThreeTypes.Mesh).material = new THREE.MeshStandardMaterial({
              color: 0xe8eef8,
              metalness: 0.25,
              roughness: 0.35,
              side: THREE.DoubleSide,
            });
          });

          // ── Animation loop (started after model loads) ───────────────────
          const loop = () => {
            currentRotationX += (targetRotationX - currentRotationX) * 0.08;
            currentRotationY += (targetRotationY - currentRotationY) * 0.08;
            model.rotation.x = currentRotationX;
            model.rotation.y = currentRotationY;
            renderer.render(scene, camera);
            raf = requestAnimationFrame(loop);
          };
          raf = requestAnimationFrame(loop);
        },
        undefined,
        (err: unknown) => { console.warn('GLB load error', err); }
      );

      cleanupFn = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        mount.removeEventListener('mousemove',  onMouseMove);
        mount.removeEventListener('mouseleave', onMouseLeave);
        renderer.dispose();
        if (mount.contains(renderer.domElement))
          mount.removeChild(renderer.domElement);
      };
    })();

    return () => {
      cancelled = true;
      cleanupFn?.();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', position: 'relative', cursor: 'grab' }}
    />
  );
}
