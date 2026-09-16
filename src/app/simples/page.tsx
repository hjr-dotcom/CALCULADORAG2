'use client';
import { useState, useRef } from 'react';
import { usePrices } from '../../usePrices';
import { calcFixacao, formataMoeda, calcularParedeDrywall, calcularForroModular } from '../../utils';
import TabelaOrcamento from '../../TabelaOrcamento';

export default function ModoSimples() {
  const { prices, isLoaded } = usePrices();
  
  // Novos estados para o tipo de estrutura
  const [tipoEstrutura, setTipoEstrutura] = useState<'forro_drywall' | 'parede_drywall' | 'forro_modular'>('forro_drywall');
  const [formatoModular, setFormatoModular] = useState<'125x62' | '62x62'>('125x62');

  const [largura, setLargura] = useState(4.0);
  const [comprimento, setComprimento] = useState(5.0);
  const [rebaixo, setRebaixo] = useState(0.30);
  const [usarLa, setUsarLa] = useState(false);
  const [usarIso, setUsarIso] = useState(false);
  
  const [orcamento, setOrcamento] = useState<any[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const calcular = () => {
    if (!isLoaded) return;
    const L = largura; const C = comprimento; const R = rebaixo;

    if (L <= 0 || C <= 0) return alert("Medidas inválidas.");

    const area = L * C;
    const perimetro = 2 * (L + C);
    let novoOrcamento: any[] = [];

    if (tipoEstrutura === 'forro_drywall') {
        const qtdPlacas = Math.ceil(area / 2.16);
        const qtdCantoneira = Math.ceil(perimetro / 3.0); 
        const numLinhasF530 = Math.floor(L / 0.60);
        const linearF530 = numLinhasF530 * C;
        const qtdF530 = Math.ceil(linearF530 / 3.0); 
        const penduraisPorLinha = Math.floor(C / 1.0);
        const totalPendurais = numLinhasF530 * penduraisPorLinha;
        const arameMetros = totalPendurais * R;

        novoOrcamento = [
            { nome: prices.placa.nome, qtd: qtdPlacas, un: 'un', pPix: prices.placa.pix, pCred: prices.placa.cred },
            { nome: prices.cantoneira.nome, qtd: qtdCantoneira, un: 'un', pPix: prices.cantoneira.pix, pCred: prices.cantoneira.cred },
            { nome: prices.f530.nome, qtd: qtdF530, un: 'un', pPix: prices.f530.pix, pCred: prices.f530.cred },
            { nome: usarIso ? 'Isoflex Amortecedor' : prices.pendural.nome, qtd: totalPendurais, un: 'un', pPix: usarIso ? prices.isoflex.pix : prices.pendural.pix, pCred: usarIso ? prices.isoflex.cred : prices.pendural.cred },
            { nome: prices.arame.nome, qtd: parseFloat(arameMetros.toFixed(1)), un: 'm', pPix: prices.arame.pix, pCred: prices.arame.cred },
            { nome: prices.fita.nome, qtd: Math.max(1, Math.ceil((1.5 * area) / 90)), un: 'rl', pPix: prices.fita.pix, pCred: prices.fita.cred },
            { nome: prices.massa.nome, qtd: Math.max(1, Math.ceil((0.5 * area) / 25)), un: 'un', pPix: prices.massa.pix, pCred: prices.massa.cred }
        ];

        novoOrcamento.push(...calcFixacao(prices.gn25.nome, 'Parafuso GN25 (Avulso)', (qtdPlacas * 30), 1000, prices.gn25.pix, prices.gn25.cred));
        novoOrcamento.push(...calcFixacao(prices.bucha8.nome, 'Bucha S8 (Avulso)', Math.ceil(perimetro / 0.60), 1000, prices.bucha8.pix, prices.bucha8.cred));
        novoOrcamento.push(...calcFixacao(prices.parafuso60.nome, 'Parafuso 5x60mm (Avulso)', Math.ceil(perimetro / 0.60), 200, prices.parafuso60.pix, prices.parafuso60.cred));

        desenharForro(L, C, numLinhasF530, penduraisPorLinha);
    } 
    else if (tipoEstrutura === 'parede_drywall') {
        const mat = calcularParedeDrywall(area, L, C); // C atua como Altura aqui
        novoOrcamento = [
            { nome: prices.placa.nome, qtd: mat.placas_120x180, un: 'un', pPix: prices.placa.pix, pCred: prices.placa.cred },
            { nome: prices.montante_90.nome, qtd: mat.montantes_3m, un: 'un', pPix: prices.montante_90.pix, pCred: prices.montante_90.cred },
            { nome: prices.guia_90.nome, qtd: mat.guias_3m, un: 'un', pPix: prices.guia_90.pix, pCred: prices.guia_90.cred },
            { nome: prices.massa.nome, qtd: Math.max(1, Math.ceil(mat.massa_kg / 25)), un: 'un', pPix: prices.massa.pix, pCred: prices.massa.cred },
            { nome: prices.fita.nome, qtd: Math.max(1, Math.ceil(mat.fita_m / 90)), un: 'rl', pPix: prices.fita.pix, pCred: prices.fita.cred }
        ];
        novoOrcamento.push(...calcFixacao(prices.gn25.nome, 'Parafuso GN25 (Avulso)', mat.parafusos_ta25, 1000, prices.gn25.pix, prices.gn25.cred));
        limparDesenho();
    }
    else if (tipoEstrutura === 'forro_modular') {
        const mat = calcularForroModular(area, perimetro, formatoModular);
        const placaKey = formatoModular === '125x62' ? 'placa_modular_125x62' : 'placa_modular_62x62';
        
        novoOrcamento = [
            { nome: prices[placaKey].nome, qtd: mat.placas, un: 'un', pPix: prices[placaKey].pix, pCred: prices[placaKey].cred },
            { nome: prices.perfil_principal_3125.nome, qtd: mat.perfilPrincipal_312, un: 'un', pPix: prices.perfil_principal_3125.pix, pCred: prices.perfil_principal_3125.cred },
            { nome: prices.perfil_travessa_1250.nome, qtd: mat.perfilTravessa_125, un: 'un', pPix: prices.perfil_travessa_1250.pix, pCred: prices.perfil_travessa_1250.cred }
        ];

        if (mat.perfilTravessa_062 > 0) {
            novoOrcamento.push({ nome: prices.perfil_travessa_625.nome, qtd: mat.perfilTravessa_062, un: 'un', pPix: prices.perfil_travessa_625.pix, pCred: prices.perfil_travessa_625.cred });
        }

        novoOrcamento.push({ nome: prices.cantoneira.nome, qtd: mat.cantoneira_3m, un: 'un', pPix: prices.cantoneira.pix, pCred: prices.cantoneira.cred });
        novoOrcamento.push({ nome: prices.tirante_modular.nome, qtd: mat.tirantes, un: 'un', pPix: prices.tirante_modular.pix, pCred: prices.tirante_modular.cred });
        limparDesenho();
    }

    if (usarLa) {
        let pctLa = Math.ceil(area / 4.32);
        novoOrcamento.push({ nome: prices.la.nome, qtd: pctLa, un: 'pcts', pPix: prices.la.pix, pCred: prices.la.cred });
    }

    setOrcamento(novoOrcamento);
  };

  const limparDesenho = () => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0,0, c.width, c.height);
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#64748b'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Esquema visual disponível apenas para Forro Drywall.', c.width/2, c.height/2);
  }

  const desenharForro = (L: number, C: number, linhas: number, pendurais: number) => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    
    ctx.clearRect(0,0, c.width, c.height);
    const margin = 20;
    const scale = Math.min((c.width - margin*2)/L, (c.height - margin*2)/C);
    const sl = L * scale, sc = C * scale;
    const oxS = (c.width - sl)/2, oyS = (c.height - sc)/2;

    ctx.fillStyle = '#f1f5f9'; ctx.fillRect(oxS, oyS, sl, sc);
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3; ctx.strokeRect(oxS, oyS, sl, sc);
    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 1.5;
    ctx.fillStyle = usarIso ? '#a855f7' : '#22c55e';

    for(let i=1; i<=linhas; i++) {
        let px = oxS + (i * 0.60 * scale);
        if(px < oxS+sl) {
            ctx.beginPath(); ctx.moveTo(px, oyS); ctx.lineTo(px, oyS+sc); ctx.stroke();
            for(let j=1; j<=pendurais; j++) {
                let py = oyS + (j * 1.0 * scale);
                if(py < oyS+sc) { ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI*2); ctx.fill(); }
            }
        }
    }
  };

  const exportarOrcamento = (tipoPgt: 'PIX' | 'CREDITO', incluirDesenho: boolean, nomeCliente: string, telefoneCliente: string) => {
    if (orcamento.length === 0) return alert("Gere um orçamento primeiro.");

    let imagemUrl = '';
    if (incluirDesenho && canvasRef.current && tipoEstrutura === 'forro_drywall') {
      imagemUrl = canvasRef.current.toDataURL('image/png');
    }

    let titulo = `Orçamento - G2 Acústica e Térmica`;
    let subTitulo = tipoPgt === 'PIX' ? 'Pagamento via PIX' : 'Crédito em até 6x';
    let nomeEstrutura = tipoEstrutura === 'forro_drywall' ? 'Forro Drywall' : tipoEstrutura === 'parede_drywall' ? 'Parede Drywall' : 'Forro Modular';
    let dimensoes = tipoEstrutura === 'parede_drywall' ? `${largura}m (Largura) x ${comprimento}m (Altura)` : `${largura}m x ${comprimento}m`;

    let linhasHTML = '';
    let totalGeral = 0;

    orcamento.forEach(i => {
      let unit = tipoPgt === 'PIX' ? i.pPix : i.pCred;
      let sub = i.qtd * unit;
      totalGeral += sub;
      linhasHTML += `
        <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px;">${i.nome}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${i.qtd} ${i.un}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${formataMoeda(unit)}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-weight: 500;">${formataMoeda(sub)}</td>
        </tr>`;
    });

    let janelaImpressao = window.open('', '_blank');
    if (!janelaImpressao) return alert("Permita pop-ups no navegador para exportar.");

    janelaImpressao.document.write(`
      <html>
        <head>
          <title>${titulo}</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #1e293b; max-width: 800px; margin: 0 auto; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
            h1 { font-size: 24px; margin: 0 0 5px 0; color: #0f172a; }
            h2 { font-size: 16px; margin: 0 0 15px 0; color: #3b82f6; font-weight: normal; }
            .cliente-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; }
            .cliente-info p { margin: 5px 0; }
            .desenho-container { text-align: center; margin-bottom: 20px; background: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; }
            .desenho-container img { max-width: 100%; height: auto; border: 1px solid #cbd5e1; border-radius: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 25px; }
            th { background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 10px 8px; text-align: left; }
            tfoot { font-weight: bold; background-color: #f8fafc; }
            .legenda { border-top: 1px solid #cbd5e1; padding-top: 15px; margin-top: 20px; font-size: 12px; color: #475569; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${titulo}</h1>
            <h2>${subTitulo}</h2>
          </div>

          <div class="cliente-info">
            <p><strong>Cliente:</strong> ${nomeCliente || 'Não informado'}</p>
            <p><strong>Contato:</strong> ${telefoneCliente || 'Não informado'}</p>
            <p><strong>Tipo de Estrutura:</strong> ${nomeEstrutura}</p>
            <p><strong>Dimensões:</strong> ${dimensoes} ${tipoEstrutura === 'forro_drywall' ? ` | <strong>Rebaixo:</strong> ${rebaixo}m` : ''}</p>
            <p><strong>Área Total:</strong> ${(largura * comprimento).toFixed(2)} m²</p>
          </div>
          
          ${incluirDesenho && imagemUrl ? `
            <div class="desenho-container">
              <p style="margin-top:0; font-weight: bold; font-size: 13px; color: #334155;">Esquema Técnico do Forro</p>
              <img src="${imagemUrl}" />
            </div>
          ` : ''}

          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th style="text-align: center;">Quantidade</th>
                <th style="text-align: right;">Valor Unit.</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${linhasHTML}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="border: 1px solid #cbd5e1; padding: 12px 8px; text-align: right;">TOTAL GERAL:</td>
                <td style="border: 1px solid #cbd5e1; padding: 12px 8px; text-align: right; font-size: 16px; color: ${tipoPgt === 'PIX' ? '#1d4ed8' : '#b91c1c'};">${formataMoeda(totalGeral)}</td>
              </tr>
            </tfoot>
          </table>

          <div class="legenda">
            <p>Orçamento gerado automaticamente. Valores sujeitos a alteração sem aviso prévio.</p>
          </div>

          <script>
            window.onload = function() { setTimeout(() => { window.print(); window.close(); }, 500); }
          </script>
        </body>
      </html>
    `);
    janelaImpressao.document.close();
  };

  if (!isLoaded) return <div className="p-10">Carregando...</div>;

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Cálculo Estrutural de Gesso</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            
            {/* SELETOR DE TIPO DE ESTRUTURA */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Estrutura</label>
                <select 
                    value={tipoEstrutura} 
                    onChange={e => setTipoEstrutura(e.target.value as any)}
                    className="w-full border border-slate-300 rounded p-2 text-sm bg-white font-medium text-slate-900"
                >
                    <option value="forro_drywall">Forro Drywall (F530)</option>
                    <option value="parede_drywall">Parede Drywall (Montante 90)</option>
                    <option value="forro_modular">Forro Modular</option>
                </select>
            </div>

            {/* SELETOR DE PLACA SE FOR MODULAR */}
            {tipoEstrutura === 'forro_modular' && (
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Formato das Placas</label>
                    <select 
                        value={formatoModular} 
                        onChange={e => setFormatoModular(e.target.value as any)}
                        className="w-full border border-slate-300 rounded p-2 text-sm bg-white text-slate-900"
                    >
                        <option value="125x62">1,25m x 0,62m</option>
                        <option value="62x62">0,62m x 0,62m</option>
                    </select>
                </div>
            )}

            <hr className="border-slate-200 my-2" />

            <div>
                <label className="block text-sm text-slate-600">Largura (m)</label>
                <input type="number" value={largura} onChange={e => setLargura(Number(e.target.value))} step="0.1" className="w-full border border-slate-300 rounded p-2 text-sm" />
            </div>
            <div>
                <label className="block text-sm text-slate-600">
                    {tipoEstrutura === 'parede_drywall' ? 'Altura (m)' : 'Comprimento (m)'}
                </label>
                <input type="number" value={comprimento} onChange={e => setComprimento(Number(e.target.value))} step="0.1" className="w-full border border-slate-300 rounded p-2 text-sm" />
            </div>
            
            {/* Oculta o Rebaixo se for Parede */}
            {tipoEstrutura !== 'parede_drywall' && (
                <div>
                    <label className="block text-sm text-slate-600">Rebaixo da Laje (m)</label>
                    <input type="number" value={rebaixo} onChange={e => setRebaixo(Number(e.target.value))} step="0.05" className="w-full border border-slate-300 rounded p-2 text-sm" />
                </div>
            )}
            
            <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={usarLa} onChange={e => setUsarLa(e.target.checked)} className="rounded" /> Lã de Rocha Acústica
                </label>
                {/* Mostra Isoflex apenas no forro drywall */}
                {tipoEstrutura === 'forro_drywall' && (
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={usarIso} onChange={e => setUsarIso(e.target.checked)} className="rounded" /> Usar Isoflex (Amortecedor)
                    </label>
                )}
            </div>
            
            <button onClick={calcular} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition shadow-sm mt-4">
                Calcular Material
            </button>
          </div>

          <div className="md:col-span-2 space-y-6">
            <TabelaOrcamento orcamento={orcamento} onExport={exportarOrcamento} />
            
            <div className="mt-6">
                <p className="text-sm font-bold text-slate-700 mb-2">Representação Gráfica:</p>
                <canvas ref={canvasRef} width={500} height={260} className="bg-slate-50 border border-slate-200 rounded-lg w-full max-w-[500px]"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
