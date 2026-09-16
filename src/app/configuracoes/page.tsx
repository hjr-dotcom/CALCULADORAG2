'use client';
import { usePrices } from '@/hooks/usePrices';
import { useEffect, useState } from 'react';
import { PRICE_CONFIRM_CODE } from '@/lib/security';

type PriceMap = Record<string, { nome: string; pix: number; cred: number }>;

export default function Configuracoes() {
  const { prices, updateMaterial, isLoaded } = usePrices();
  const [draft, setDraft] = useState<PriceMap>({});
  const [msg, setMsg] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    if (isLoaded) setDraft(prices);
    // Só sincroniza o rascunho quando os preços carregam do navegador; depois
    // disso o rascunho fica independente até ser confirmado ou descartado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  if (!isLoaded) return <div className="p-10">Carregando...</div>;

  const isDirty = JSON.stringify(draft) !== JSON.stringify(prices);

  const handleFieldChange = (key: string, field: 'nome' | 'pix' | 'cred', value: string) => {
    setDraft(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: field === 'nome' ? value : (parseFloat(value) || 0)
      }
    }));
  };

  const handleDescartar = () => {
    setDraft(prices);
  };

  const abrirConfirmacao = () => {
    setPinInput('');
    setPinError('');
    setShowPinModal(true);
  };

  const confirmarComCodigo = () => {
    if (pinInput !== PRICE_CONFIRM_CODE) {
      setPinError('Código incorreto. Tente novamente.');
      return;
    }
    Object.entries(draft).forEach(([key, val]) => {
      const original = prices[key];
      if (!original || original.nome !== val.nome || original.pix !== val.pix || original.cred !== val.cred) {
        updateMaterial(key, val.nome, val.pix, val.cred);
      }
    });
    setShowPinModal(false);
    setPinInput('');
    setPinError('');
    setMsg('Alterações salvas com sucesso!');
    setTimeout(() => setMsg(''), 2500);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Configuração de Materiais & Preços</h1>
          <p className="text-sm text-slate-500">
            Você pode editar os valores livremente, mas nada é salvo até confirmar com o código de segurança.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium animate-pulse">✓ {msg}</span>}
          {isDirty && (
            <>
              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded text-sm font-medium">Alterações pendentes</span>
              <button
                onClick={handleDescartar}
                className="px-4 py-2 rounded text-sm font-semibold border border-slate-300 text-slate-600 bg-white hover:bg-slate-50"
              >
                Descartar
              </button>
            </>
          )}
          <button
            onClick={abrirConfirmacao}
            disabled={!isDirty}
            className="px-4 py-2 rounded text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            🔒 Confirmar Alterações
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(draft).map(([key, val]) => {
          const changed = JSON.stringify(prices[key]) !== JSON.stringify(val);
          return (
            <div key={key} className={`bg-white p-4 border rounded-xl shadow-sm space-y-3 ${changed ? 'border-amber-400 ring-1 ring-amber-200' : 'border-slate-200'}`}>
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{key}</span>
                {changed && <span className="text-xs font-semibold text-amber-600">Editado</span>}
              </div>

              <div>
                <label className="text-xs text-slate-600 font-semibold">Nome do Material / Descrição</label>
                <input
                  type="text"
                  value={val.nome}
                  onChange={(e) => handleFieldChange(key, 'nome', e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 text-sm mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-600 font-semibold">PIX (R$)</label>
                  <input
                    type="number" step="0.01"
                    value={val.pix}
                    onChange={(e) => handleFieldChange(key, 'pix', e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 text-sm mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-semibold">Crédito (R$)</label>
                  <input
                    type="number" step="0.01"
                    value={val.cred}
                    onChange={(e) => handleFieldChange(key, 'cred', e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 text-sm mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Confirmar Alterações</h2>
            <p className="text-sm text-slate-500 mb-4">Digite o código de segurança para salvar os novos valores.</p>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmarComCodigo(); }}
              placeholder="Código de confirmação"
              className="w-full border border-slate-300 rounded p-2 text-sm mb-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {pinError && <p className="text-sm text-red-600 mb-2">{pinError}</p>}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowPinModal(false)}
                className="flex-1 px-4 py-2 rounded text-sm font-semibold border border-slate-300 text-slate-600 bg-white hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarComCodigo}
                className="flex-1 px-4 py-2 rounded text-sm font-bold text-white bg-blue-600 hover:bg-blue-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
