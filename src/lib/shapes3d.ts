import * as THREE from 'three';

export type Shape3DType = 'cubo' | 'cilindro' | 'esfera' | 'cone' | 'piramide';

export interface Shape3DParams {
  largura: number;
  altura: number;
  profundidade: number;
  raio: number;
}

export const SHAPE_LABELS: Record<Shape3DType, string> = {
  cubo: '🧊 Cubo / Caixa',
  cilindro: '🥫 Cilindro',
  esfera: '⚽ Esfera',
  cone: '🍦 Cone',
  piramide: '📐 Pirâmide',
};

export const DEFAULT_PARAMS: Shape3DParams = {
  largura: 1,
  altura: 1,
  profundidade: 1,
  raio: 0.5,
};

export function paramsUsedBy(tipo: Shape3DType): Array<keyof Shape3DParams> {
  switch (tipo) {
    case 'cubo':
      return ['largura', 'altura', 'profundidade'];
    case 'cilindro':
      return ['raio', 'altura'];
    case 'esfera':
      return ['raio'];
    case 'cone':
      return ['raio', 'altura'];
    case 'piramide':
      return ['largura', 'altura', 'profundidade'];
  }
}

export function buildGeometry(tipo: Shape3DType, p: Shape3DParams): THREE.BufferGeometry {
  switch (tipo) {
    case 'cubo':
      return new THREE.BoxGeometry(p.largura, p.altura, p.profundidade);
    case 'cilindro':
      return new THREE.CylinderGeometry(p.raio, p.raio, p.altura, 32);
    case 'esfera':
      return new THREE.SphereGeometry(p.raio, 32, 24);
    case 'cone':
      return new THREE.ConeGeometry(p.raio, p.altura, 32);
    case 'piramide':
      return new THREE.ConeGeometry(
        Math.max(p.largura, p.profundidade) / Math.SQRT2,
        p.altura,
        4
      );
  }
}
