'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Shape3DParams, Shape3DType, buildGeometry } from '@/lib/shapes3d';

interface Props {
  tipo: Shape3DType;
  params: Shape3DParams;
  cor: string;
}

export default function Preview3D({ tipo, params, cor }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#e2e8f0');

    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.01,
      100
    );
    camera.position.set(1.8, 1.4, 1.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(2, 3, 2);
    scene.add(dirLight);

    const grid = new THREE.GridHelper(4, 8, 0x94a3b8, 0xcbd5e1);
    scene.add(grid);

    const mesh = new THREE.Mesh(
      buildGeometry(tipo, params),
      new THREE.MeshStandardMaterial({ color: cor })
    );
    mesh.position.y = params.altura / 2;
    meshRef.current = mesh;
    scene.add(mesh);

    let frameId: number;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [tipo, params, cor]);

  return <div ref={containerRef} className="w-full h-full" />;
}
