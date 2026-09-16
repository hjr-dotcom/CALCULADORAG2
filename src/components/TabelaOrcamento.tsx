'use client';
import { useState } from 'react';
import { formataMoeda } from '@/lib/utils';

interface TabelaOrcamentoProps {
  orcamento: any[];
  onExport?: (tipo: 'PIX' | 'CREDITO', incluirDesenho: boolean, nomeCliente: string, telefoneCliente: string) => void;
}

export default function TabelaOrcamento({ orcamento, onExport }: TabelaOrcamentoProps) {
  const [incluirDesenho, setIncluirDesenho] = useState(true);
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');

  if (!orcamento || orcamento.length === 0) return null;

  const totalPix = orcamento.reduce((acc, item) => acc + (item.qtd * item.pPix), 0);
  const totalCred = orcamento.reduce((acc, item) => acc + (item.qtd * item.pCred), 0);

  return (
    <div className="mt-6 space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="border px-3 py-2 text-left text-xs font-semibold">Material</th>
              <th className="border px-3 py-2 text-center text-xs font-semibold">Qtd</th>
              <th className="border px-3 py-2 text-right text-xs font-semibold">PIX (R$)</th>
              <th className="border px-3 py-2 text-right text-xs font-semibold">Crédito (R$)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {orcamento.map((i, idx) => {
              const subPix = i.qtd * i.pPix;
              const subCred = i.qtd * i.pCred;
              return (
                <tr key={idx} className="bg-white">
                  <td className="border px-3 py-1.5 font-medium">{i.nome}</td>
                  <td className="border px-3 py-1.5 text-center">{i.qtd} {i.un}</td>
                  <td className="border px-3 py-1.5 text-right">{formataMoeda(subPix)}</td>
                  <td className="border px-3 py-1.5 text-right">{formataMoeda(subCred)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-100 font-bold">
            <tr>
              <td colSpan={2} className="border px-3 py-2 text-right">TOTAL GERAL:</td>
              <td className="border px-3 py-2 text-right text-blue-700">{formataMoeda(totalPix)}</td>
              <td className="border px-3 py-2 text-right text-red-700">{formataMoeda(totalCred)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {onExport && (
        <div className="space-y-3 pt-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800">Dados para Exportação</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nome do Cliente</label>
              <input 
                type="text" 
                value={nomeCliente} 
                onChange={(e) => setNomeCliente(e.target.value)} 
                placeholder="Ex: João da Silva" 
                className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Telefone / Contato</label>
              <input 
                type="text" 
                value={telefoneCliente} 
                onChange={(e) => setTelefoneCliente(e.target.value)} 
                placeholder="Ex: (22) 99999-9999" 
                className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm bg-white text-slate-900"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer pt-1">
            <input 
              type="checkbox" 
              checked={incluirDesenho} 
              onChange={(e) => setIncluirDesenho(e.target.checked)} 
              className="rounded text-blue-600 w-4 h-4" 
            />
            <span className="font-medium">Incluir desenho técnico / esquema na exportação</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={() => onExport('PIX', incluirDesenho, nomeCliente, telefoneCliente)} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              🖨️ Exportar Tabela PIX
            </button>
            <button 
              type="button"
              onClick={() => onExport('CREDITO', incluirDesenho, nomeCliente, telefoneCliente)} 
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              🖨️ Exportar Tabela Crédito
            </button>
          </div>
        </div>
      )}
    </div>
  );
}