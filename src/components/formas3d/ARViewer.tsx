'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { Shape3DParams, Shape3DType, buildGeometry } from '@/lib/shapes3d';

interface Props {
  tipo: Shape3DType;
  params: Shape3DParams;
  cor: string;
  onClose: () => void;
}

const SEM_SUPORTE_MSG =
  'Este navegador não suporta WebXR/AR. Use o Chrome mais recente em um Android com suporte a ARCore.';

export default function ARViewer({ tipo, params, cor, onClose }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [erro] = useState<string | null>(() =>
    typeof navigator !== 'undefined' && !navigator.xr ? SEM_SUPORTE_MSG : null
  );
  const [dica, setDica] = useState('Aponte a câmera para o chão e toque na tela para posicionar a forma.');

  const cleanupRef = useRef<() => void>(() => {});

  const handleClose = useCallback(() => {
    cleanupRef.current();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!navigator.xr) {
      return;
    }

    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(1, 2, 1);
    scene.add(dirLight);

    const geometry = buildGeometry(tipo, params);
    const material = new THREE.MeshStandardMaterial({ color: cor });
    const shapeMesh = new THREE.Mesh(geometry, material);
    shapeMesh.visible = false;
    scene.add(shapeMesh);

    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 0.1, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x3b82f6 })
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    let hitTestSource: XRHitTestSource | null = null;
    let hitTestSourceRequested = false;
    let placed = false;

    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ['hit-test'],
    });
    arButton.style.display = 'none';
    document.body.appendChild(arButton);

    const onSelect = () => {
      if (!reticle.visible) return;
      shapeMesh.position.setFromMatrixPosition(reticle.matrix);
      shapeMesh.position.y += params.altura / 2;
      shapeMesh.visible = true;
      placed = true;
      setDica('Forma posicionada. Toque novamente para reposicionar.');
    };

    const controller = renderer.xr.getController(0);
    controller.addEventListener('select', onSelect);
    scene.add(controller);

    const onSessionEnd = () => {
      hitTestSource = null;
      hitTestSourceRequested = false;
      handleClose();
    };

    renderer.xr.addEventListener('sessionend', onSessionEnd);

    renderer.setAnimationLoop((_timestamp, frame) => {
      if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        if (!hitTestSourceRequested && session && referenceSpace) {
          session.requestReferenceSpace('viewer').then((viewerSpace) => {
            session.requestHitTestSource?.({ space: viewerSpace })?.then((source) => {
              hitTestSource = source ?? null;
            });
          });
          hitTestSourceRequested = true;
        }

        if (hitTestSource && referenceSpace) {
          const hitTestResults = frame.getHitTestResults(hitTestSource);
          if (hitTestResults.length > 0 && !placed) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(referenceSpace);
            if (pose) {
              reticle.visible = true;
              reticle.matrix.fromArray(pose.transform.matrix);
            }
          } else if (!placed) {
            reticle.visible = false;
          } else {
            reticle.visible = false;
          }
        }
      }
      renderer.render(scene, camera);
    });

    cleanupRef.current = () => {
      renderer.setAnimationLoop(null);
      renderer.xr.removeEventListener('sessionend', onSessionEnd);
      const session = renderer.xr.getSession();
      session?.end().catch(() => {});
      controller.removeEventListener('select', onSelect);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (arButton.parentNode) arButton.parentNode.removeChild(arButton);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };

    arButton.click();

    return () => {
      cleanupRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (erro) {
    return (
      <div className="fixed inset-0 bg-black/90 text-white flex flex-col items-center justify-center p-6 z-50 gap-4">
        <p className="text-center max-w-sm">{erro}</p>
        <button
          onClick={onClose}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
        >
          Fechar
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      <div ref={mountRef} className="w-full h-full" />
      <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start pointer-events-none">
        <p className="bg-black/60 text-white text-xs rounded-lg px-3 py-2 max-w-[70%] pointer-events-auto">
          {dica}
        </p>
        <button
          onClick={handleClose}
          className="bg-black/60 text-white text-sm font-semibold rounded-full w-9 h-9 flex items-center justify-center pointer-events-auto"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
