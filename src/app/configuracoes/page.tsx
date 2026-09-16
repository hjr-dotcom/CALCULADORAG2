'use client';
import { usePrices } from '@/hooks/usePrices';
import { useState } from 'react';

export default function Configuracoes() {
  const { prices, updateMaterial, isLoaded } = usePrices();
  const [msg, setMsg] = useState('');

  if (!isLoaded) return <div className="p-10">Carregando...</div>;

  const handleBlur = (key: string, currentData: { nome: string; pix: number; cred: number }, field: 'nome' | 'pix' | 'cred', value: string) => {
    const newName = field === 'nome' ? value : currentData.nome;
    const newPix = field === 'pix' ? parseFloat(value) || 0 : currentData.pix;
    const newCred = field === 'cred' ? parseFloat(value) || 0 : currentData.cred;

    updateMaterial(key, newName, newPix, newCred);
    setMsg('Salvo no navegador!');
    setTimeout(() => setMsg(''), 2000);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Configuração de Materiais & Preços</h1>
          <p className="text-sm text-slate-500">Altere os nomes e valores. As modificações são salvas automaticamente no seu navegador.</p>
        </div>
        {msg && <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium animate-pulse">✓ {msg}</span>}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(prices).map(([key, val]) => (
          <div key={key} className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{key}</span>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-semibold">Nome do Material / Descrição</label>
              <input
                type="text" 
                defaultValue={val.nome}
                onBlur={(e) => handleBlur(key, val, 'nome', e.target.value)}
                className="w-full border border-slate-300 rounded p-1.5 text-sm mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-600 font-semibold">PIX (R$)</label>
                <input
                  type="number" step="0.01" 
                  defaultValue={val.pix}
                  onBlur={(e) => handleBlur(key, val, 'pix', e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 text-sm mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 font-semibold">Crédito (R$)</label>
                <input
                  type="number" step="0.01" 
                  defaultValue={val.cred}
                  onBlur={(e) => handleBlur(key, val, 'cred', e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 text-sm mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}