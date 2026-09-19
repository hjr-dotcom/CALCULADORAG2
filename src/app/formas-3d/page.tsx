'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  DEFAULT_PARAMS,
  SHAPE_LABELS,
  Shape3DParams,
  Shape3DType,
  paramsUsedBy,
} from '@/lib/shapes3d';

const Preview3D = dynamic(() => import('@/components/formas3d/Preview3D'), { ssr: false });
const ARViewer = dynamic(() => import('@/components/formas3d/ARViewer'), { ssr: false });

const CAMPO_LABEL: Record<keyof Shape3DParams, string> = {
  largura: 'Largura (m)',
  altura: 'Altura (m)',
  profundidade: 'Profundidade (m)',
  raio: 'Raio (m)',
};

const CORES = ['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#a855f7', '#f97316'];

export default function Formas3DPage() {
  const [tipo, setTipo] = useState<Shape3DType>('cubo');
  const [params, setParams] = useState<Shape3DParams>(DEFAULT_PARAMS);
  const [cor, setCor] = useState(CORES[0]);
  const [arAberto, setArAberto] = useState(false);

  const camposAtivos = useMemo(() => paramsUsedBy(tipo), [tipo]);

  function atualizarParam(campo: keyof Shape3DParams, valor: number) {
    if (Number.isNaN(valor) || valor <= 0) return;
    setParams((prev) => ({ ...prev, [campo]: valor }));
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">🧩 Formas 3D</h1>
        <p className="text-sm text-slate-500 mb-8">
          Monte uma forma simples, veja em 3D e visualize em tamanho real com a câmera do
          celular (Realidade Aumentada).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-5">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Forma</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(SHAPE_LABELS) as Shape3DType[]).map((chave) => (
                  <button
                    key={chave}
                    onClick={() => setTipo(chave)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition ${
                      tipo === chave
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {SHAPE_LABELS[chave]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Dimensões
              </label>
              <div className="grid grid-cols-2 gap-3">
                {camposAtivos.map((campo) => (
                  <div key={campo} className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500">{CAMPO_LABEL[campo]}</span>
                    <input
                      type="number"
                      min={0.05}
                      step={0.05}
                      value={params[campo]}
                      onChange={(e) => atualizarParam(campo, parseFloat(e.target.value))}
                      className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Cor</label>
              <div className="flex gap-2">
                {CORES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-8 h-8 rounded-full border-2 ${
                      cor === c ? 'border-slate-800' : 'border-transparent'
                    }`}
                    aria-label={`Cor ${c}`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={() => setArAberto(true)}
              className="mt-auto bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg text-sm transition"
            >
              📱 Ver em AR com a câmera
            </button>
            <p className="text-xs text-slate-400 -mt-3">
              Funciona no Chrome para Android com suporte a ARCore. Em outros navegadores, use o
              preview 3D ao lado.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-80 md:h-auto">
            <Preview3D tipo={tipo} params={params} cor={cor} />
          </div>
        </div>
      </div>

      {arAberto && (
        <ARViewer tipo={tipo} params={params} cor={cor} onClose={() => setArAberto(false)} />
      )}
    </div>
  );
}
