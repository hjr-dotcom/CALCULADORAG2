'use client';
import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { usePrices } from '@/hooks/usePrices';
import { calcFixacao, formataMoeda, calcularForroModular } from '@/lib/utils';
import { MODULAR_PLACA_KEYS } from '@/lib/defaultPrices';
import CanvasDraw, { CanvasDrawHandle } from '@/components/cad/CanvasDraw';
import TabelaOrcamento from '@/components/TabelaOrcamento';

export default function CadPage() {
  const { prices, isLoaded } = usePrices();
  const [activeTool, setActiveTool] = useState<'line' | 'select' | 'delete' | 'pan' | 'calibrate'>('line');
  const [ortho, setOrtho] = useState(false);
  const [rebaixo, setRebaixo] = useState(0.30);
  const [usarLa, setUsarLa] = useState(false);
  const [usarIso, setUsarIso] = useState(false);

  const [temImagemFundo, setTemImagemFundo] = useState(false);
  const [opacidadeFundo, setOpacidadeFundo] = useState(0.4);
  const canvasDrawRef = useRef<CanvasDrawHandle>(null);

  const handleBgFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    canvasDrawRef.current?.setBackgroundImage(file);
    setTemImagemFundo(true);
    e.target.value = '';
  };

  const handleRemoveBg = () => {
    canvasDrawRef.current?.clearBackgroundImage();
    setTemImagemFundo(false);
    if (activeTool === 'calibrate') setActiveTool('line');
  };

  const handleBgOpacityChange = (v: number) => {
    setOpacidadeFundo(v);
    canvasDrawRef.current?.setBackgroundOpacity(v);
  };

  const [tipoForro, setTipoForro] = useState<'drywall' | 'modular'>('drywall');
  const [formatoModular, setFormatoModular] = useState<'125x62' | '62x62'>('125x62');
  const [materialModular, setMaterialModular] = useState('placa_modular_125x62');

  // Pré-seleciona o tipo de forro vindo do menu inicial (ex: /cad?tipo=forro_modular)
  useEffect(() => {
    const tipo = new URLSearchParams(window.location.search).get('tipo');
    if (tipo === 'forro_modular') setTipoForro('modular');
    else if (tipo === 'forro_drywall') setTipoForro('drywall');
  }, []);

  const [geomData, setGeomData] = useState<{ perimetro: number; areaEst: number; areaPoligono: number; modPoints: any[]; boundW: number; boundH: number } | null>(null);
  const [orcamento, setOrcamento] = useState<any[]>([]);

  const cadCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpdateGeometry = (_lines: any[], data: any) => {
    setGeomData(data);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        canvasDrawRef.current?.undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const gerarOrcamentoCAD = () => {
    if (!geomData || (tipoForro === 'drywall' && geomData.modPoints.length === 0) || (tipoForro === 'modular' && geomData.boundW <= 0)) {
      return alert("Desenhe e feche o perímetro das paredes no CAD primeiro.");
    }

    const { perimetro, areaEst, modPoints, boundW, boundH } = geomData;
    let novoOrcamento: any[] = [];

    if (tipoForro === 'drywall') {
      const qtdPlacas = Math.ceil(areaEst / 2.16);
      const qtdCantoneira = Math.ceil(perimetro / 3.0);
      const linearF530 = areaEst / 0.6;
      const qtdF530 = Math.ceil(linearF530 / 3.0);
      const totalPendurais = modPoints.length;
      const arameMetros = totalPendurais * rebaixo;

      novoOrcamento = [
        { nome: prices.placa.nome, qtd: qtdPlacas, un: 'un', pPix: prices.placa.pix, pCred: prices.placa.cred },
        { nome: prices.cantoneira.nome, qtd: qtdCantoneira, un: 'un', pPix: prices.cantoneira.pix, pCred: prices.cantoneira.cred },
        { nome: prices.f530.nome, qtd: qtdF530, un: 'un', pPix: prices.f530.pix, pCred: prices.f530.cred },
        { nome: usarIso ? 'Isoflex Amortecedor' : prices.pendural.nome, qtd: totalPendurais, un: 'un', pPix: usarIso ? prices.isoflex.pix : prices.pendural.pix, pCred: usarIso ? prices.isoflex.cred : prices.pendural.cred },
        { nome: prices.arame.nome, qtd: parseFloat(arameMetros.toFixed(1)), un: 'm', pPix: prices.arame.pix, pCred: prices.arame.cred },
        { nome: prices.fita.nome, qtd: Math.max(1, Math.ceil((1.5 * areaEst) / 90)), un: 'rl', pPix: prices.fita.pix, pCred: prices.fita.cred },
        { nome: prices.massa.nome, qtd: Math.max(1, Math.ceil((0.5 * areaEst) / 25)), un: 'un', pPix: prices.massa.pix, pCred: prices.massa.cred }
      ];

      novoOrcamento.push(...calcFixacao(prices.gn25.nome, 'Parafuso GN25 (Avulso)', (qtdPlacas * 30), 1000, prices.gn25.pix, prices.gn25.cred));
      novoOrcamento.push(...calcFixacao(prices.bucha8.nome, 'Bucha S8 (Avulso)', Math.ceil(perimetro / 0.60), 1000, prices.bucha8.pix, prices.bucha8.cred));
      novoOrcamento.push(...calcFixacao(prices.parafuso60.nome, 'Parafuso 5x60mm (Avulso)', Math.ceil(perimetro / 0.60), 200, prices.parafuso60.pix, prices.parafuso60.cred));
    } else {
      // Forro Modular: usa o retângulo envolvente do desenho como largura/comprimento
      // para aplicar as mesmas fórmulas do Modo Simples (estimativa para formas irregulares).
      const mat = calcularForroModular(boundW, boundH, formatoModular, rebaixo);
      const placaMat = prices[materialModular];
      const fatorCorte = formatoModular === '62x62' ? 0.5 : 1;

      novoOrcamento = [
        { nome: `${placaMat.nome}${formatoModular === '62x62' ? ' (cortada 0,625x0,625m)' : ''}`, qtd: mat.placas, un: 'un', pPix: placaMat.pix * fatorCorte, pCred: placaMat.cred * fatorCorte },
        { nome: prices.perfil_principal_3125.nome, qtd: mat.perfilPrincipal, un: 'un', pPix: prices.perfil_principal_3125.pix, pCred: prices.perfil_principal_3125.cred },
        { nome: prices.perfil_secundario_0625.nome, qtd: mat.perfilSecundario, un: 'un', pPix: prices.perfil_secundario_0625.pix, pCred: prices.perfil_secundario_0625.cred },
        { nome: prices.perfil_travessa_625.nome, qtd: mat.travessa625, un: 'un', pPix: prices.perfil_travessa_625.pix, pCred: prices.perfil_travessa_625.cred },
        { nome: prices.perfil_canto_modular.nome, qtd: mat.perfilCanto, un: 'un', pPix: prices.perfil_canto_modular.pix, pCred: prices.perfil_canto_modular.cred },
        { nome: prices.tirante_modular.nome, qtd: mat.pendural, un: 'un', pPix: prices.tirante_modular.pix, pCred: prices.tirante_modular.cred },
        { nome: prices.presilha_modular.nome, qtd: mat.presilha, un: 'un', pPix: prices.presilha_modular.pix, pCred: prices.presilha_modular.cred },
        { nome: prices.prego_aco.nome, qtd: mat.pregoAco, un: 'un', pPix: prices.prego_aco.pix, pCred: prices.prego_aco.cred },
        { nome: prices.arame.nome, qtd: mat.arame, un: 'm', pPix: prices.arame.pix, pCred: prices.arame.cred }
      ];
    }

    if (usarLa) {
      let pctLa = Math.ceil(areaEst / 4.32);
      novoOrcamento.push({ nome: prices.la.nome, qtd: pctLa, un: 'pcts', pPix: prices.la.pix, pCred: prices.la.cred });
    }

    setOrcamento(novoOrcamento);
  };

  const exportarOrcamento = (tipo: 'PIX' | 'CREDITO', incluirDesenho: boolean, nomeCliente: string, telefoneCliente: string) => {
    if (orcamento.length === 0) return alert("Gere um orçamento primeiro.");

    let imagemUrl = '';
    if (incluirDesenho && cadCanvasRef.current) {
      imagemUrl = cadCanvasRef.current.toDataURL('image/png');
    }

    let titulo = `Orçamento - Drywall e Cia (${tipo === 'PIX' ? 'Pagamento via PIX' : 'Crédito em até 6x'})`;
    let linhasHTML = '';
    let totalGeral = 0;

    orcamento.forEach(i => {
      let unit = tipo === 'PIX' ? i.pPix : i.pCred;
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
            body { font-family: sans-serif; padding: 30px; color: #1e293b; }
            h1 { font-size: 20px; margin-bottom: 5px; }
            .info-cliente { background: #f1f5f9; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; }
            .info-cliente p { margin: 2px 0; color: #334155; }
            .desenho-container { text-align: center; margin-bottom: 15px; background: #1e1e1e; padding: 15px; border-radius: 8px; }
            .desenho-container img { max-width: 100%; height: auto; border: 1px solid #475569; border-radius: 4px; }
            
            .legenda-visual {
              display: flex;
              justify-content: center;
              gap: 20px;
              margin-bottom: 25px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 10px;
              border-radius: 6px;
              font-size: 12px;
            }
            .legenda-item {
              display: flex;
              align-items: center;
              gap: 6px;
              font-weight: 500;
              color: #334155;
            }
            .cor-box { width: 12px; height: 12px; border-radius: 2px; }

            table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 25px; }
            th { background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            tfoot { font-weight: bold; background-color: #f8fafc; }
            
            .rodape-obs {
              margin-top: 15px;
              padding: 10px;
              background: #fef2f2;
              border: 1px solid #fecaca;
              color: #991b1b;
              font-size: 12px;
              font-weight: bold;
              text-align: center;
              border-radius: 4px;
            }

            .detalhes-tecnicos { border-top: 1px solid #cbd5e1; padding-top: 15px; margin-top: 20px; font-size: 11px; color: #475569; }
            .detalhes-tecnicos h4 { font-size: 12px; margin-bottom: 6px; color: #1e293b; text-transform: uppercase; }
            .detalhes-tecnicos ul { margin: 0; padding-left: 15px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <h1>${titulo}</h1>
          <p style="font-size: 12px; color: #64748b; margin-bottom: 15px;">Projeto em Desenho Livre (CAD) | ${tipoForro === 'modular' ? `Forro Removível / Modular (${prices[materialModular]?.nome ?? ''}, ${formatoModular === '62x62' ? '0,625x0,625m' : '1,25x0,625m'})` : 'Forro Acartonado'} | Rebaixo: ${rebaixo}m</p>

          ${(nomeCliente || telefoneCliente) ? `
            <div class="info-cliente">
              ${nomeCliente ? `<p><strong>Cliente:</strong> ${nomeCliente}</p>` : ''}
              ${telefoneCliente ? `<p><strong>Contato:</strong> ${telefoneCliente}</p>` : ''}
            </div>
          ` : ''}
          
          ${incluirDesenho && imagemUrl ? `
            <div class="desenho-container">
              <p style="margin-top:0; font-weight: bold; font-size: 13px; color: #f8fafc; margin-bottom: 10px;">Planta Baixa & Modulação</p>
              <img src="${imagemUrl}" />
            </div>

            <div class="legenda-visual">
              <div class="legenda-item">
                <div class="cor-box" style="background-color: #ef4444;"></div>
                <span>${tipoForro === 'modular' ? 'Perfil Canto / Paredes' : 'Cantoneira / Paredes'}</span>
              </div>
              ${tipoForro === 'modular' ? `
              <div class="legenda-item">
                <div class="cor-box" style="background-color: #3b82f6;"></div>
                <span>Travessa 0,625m</span>
              </div>
              <div class="legenda-item">
                <div class="cor-box" style="background-color: #f59e0b;"></div>
                <span>Perfil Principal</span>
              </div>
              ` : `
              <div class="legenda-item">
                <div class="cor-box" style="background-color: #3b82f6;"></div>
                <span>Perfil / Canaleta F530</span>
              </div>
              <div class="legenda-item">
                <div class="cor-box" style="background-color: #22c55e;"></div>
                <span>Regulador / Pendural</span>
              </div>
              `}
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
                <td colspan="3" style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">TOTAL GERAL:</td>
                <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-size: 15px; color: ${tipo === 'PIX' ? '#1d4ed8' : '#b91c1c'};">${formataMoeda(totalGeral)}</td>
              </tr>
            </tfoot>
          </table>

          <div class="rodape-obs">
            ⚠️ Atenção: Consultar valor do frete e disponibilidade de entrega para a região.
          </div>

          <div class="detalhes-tecnicos">
            <h4>Especificações Técnicas</h4>
            <ul>
              ${tipoForro === 'modular' ? `
              <li><strong>Perfil Canto:</strong> Perfil metálico perimetral fixado nas paredes para apoio das bordas do forro.</li>
              <li><strong>Perfil Principal / Perfil Secundário / Travessa 0,625m:</strong> Grade metálica estrutural onde as placas modulares se apoiam, suspensa por tirantes.</li>
              <li><strong>Tirante c/ Regulador:</strong> Sistema de suspensão que nivela a grade a partir da laje.</li>
              ` : `
              <li><strong>Cantoneira (Perfil 25x30):</strong> Perfil metálico perimetral fixado nas paredes para suporte e acabamento das extremidades do forro.</li>
              <li><strong>Canaleta / Perfil F530:</strong> Perfil metálico estrutural principal onde as placas de gesso acartonado são parafusadas diretamente.</li>
              <li><strong>Regulador / Pendural:</strong> Sistema de suspensão (pendural, arame galvanizado e fixações) para nivelar a estrutura do forro a partir da laje.</li>
              `}
            </ul>
          </div>

          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    janelaImpressao.document.close();
  };

  if (!isLoaded) return <div className="p-10">Carregando...</div>;

  return (
    <div className="flex w-full h-[calc(100vh-53px)] overflow-hidden">
      {/* 50% Esquerda - Canvas CAD Interativo */}
      <div className="w-1/2 h-full border-r border-slate-300">
        <CanvasDraw
          ref={canvasDrawRef}
          tool={activeTool}
          orthoEnabled={ortho}
          onUpdateGeometry={handleUpdateGeometry}
          canvasRefProp={cadCanvasRef}
          gridMode={tipoForro === 'modular' ? 'modular' : 'drywall'}
        />
      </div>

      {/* 50% Direita - Ferramentas e Orçamento */}
      <div className="w-1/2 h-full bg-white p-6 overflow-y-auto">
        <div className="max-w-xl mx-auto space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Ferramentas de Desenho</h2>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={() => setActiveTool('line')}
                className={`p-2 text-sm font-medium border rounded transition ${activeTool === 'line' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
              >
                ✏️ Desenhar Linha (L)
              </button>
              <button
                onClick={() => setActiveTool('select')}
                className={`p-2 text-sm font-medium border rounded transition ${activeTool === 'select' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
              >
                🖱️ Selecionar
              </button>
              <button
                onClick={() => setActiveTool('delete')}
                className={`p-2 text-sm font-medium border rounded transition ${activeTool === 'delete' ? 'bg-red-600 text-white border-red-600' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
              >
                🗑️ Apagar Linha
              </button>
              <button
                onClick={() => setActiveTool('pan')}
                className={`p-2 text-sm font-medium border rounded transition ${activeTool === 'pan' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
              >
                🖐️ Mover Câmera (Pan)
              </button>
              <button
                onClick={() => canvasDrawRef.current?.undo()}
                className="p-2 text-sm font-medium border rounded transition bg-slate-50 text-slate-700 hover:bg-slate-100"
              >
                ↩️ Desfazer (Ctrl+Z)
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-2">
              <button
                onClick={() => canvasDrawRef.current?.zoomIn()}
                className="p-2 text-sm font-medium border rounded transition bg-slate-50 text-slate-700 hover:bg-slate-100 text-center"
              >
                🔍+ Zoom
              </button>
              <button
                onClick={() => canvasDrawRef.current?.zoomOut()}
                className="p-2 text-sm font-medium border rounded transition bg-slate-50 text-slate-700 hover:bg-slate-100 text-center"
              >
                🔍- Zoom
              </button>
              <button
                onClick={() => canvasDrawRef.current?.resetView()}
                className="p-2 text-sm font-medium border rounded transition bg-slate-50 text-slate-700 hover:bg-slate-100 text-center"
              >
                🎯 Centralizar
              </button>
            </div>

            <div className="mt-3">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer bg-slate-50 p-2 rounded border border-slate-200">
                <input type="checkbox" checked={ortho} onChange={(e) => setOrtho(e.target.checked)} className="rounded text-blue-600" />
                <span>📐 Travar Ângulo Ortogonal (90°)</span>
              </label>
            </div>

            {geomData && geomData.areaPoligono > 0 && (
              <div className="mt-3 flex gap-2 text-sm">
                <span className="flex-1 bg-yellow-50 border border-yellow-200 text-yellow-800 font-semibold rounded p-2 text-center">
                  📐 Área: {geomData.areaPoligono.toFixed(2)} m²
                </span>
                <span className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded p-2 text-center">
                  📏 Perímetro: {geomData.perimetro.toFixed(2)} m
                </span>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Decalque (Imagem de Fundo)</h2>
            <div className="mt-3 space-y-2">
              <input
                type="file" accept="image/*" onChange={handleBgFileChange}
                className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              />

              {temImagemFundo && (
                <>
                  <button
                    onClick={() => setActiveTool('calibrate')}
                    className={`w-full p-2 text-sm font-medium border rounded transition ${activeTool === 'calibrate' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                  >
                    📏 Calibrar Escala da Imagem
                  </button>

                  <div>
                    <label className="text-xs font-semibold text-slate-600">Transparência ({Math.round(opacidadeFundo * 100)}%)</label>
                    <input
                      type="range" min="0.1" max="1" step="0.1" value={opacidadeFundo}
                      onChange={(e) => handleBgOpacityChange(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <button
                    onClick={handleRemoveBg}
                    className="w-full p-2 text-sm font-medium border rounded transition bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                  >
                    ❌ Remover Imagem
                  </button>
                </>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Parâmetros & Opções</h2>

            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Forro</label>
              <select
                value={tipoForro}
                onChange={e => setTipoForro(e.target.value as any)}
                className="w-full border border-slate-300 rounded p-2 text-sm bg-white font-medium text-slate-900"
              >
                <option value="drywall">Forro Acartonado (F530)</option>
                <option value="modular">Forro Removível / Modular</option>
              </select>
            </div>

            {tipoForro === 'modular' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Formato das Placas</label>
                  <select
                    value={formatoModular}
                    onChange={e => setFormatoModular(e.target.value as any)}
                    className="w-full border border-slate-300 rounded p-2 text-sm bg-white text-slate-900 mt-1"
                  >
                    <option value="125x62">Retangular 1,25m x 0,625m</option>
                    <option value="62x62">Quadrada 0,625m x 0,625m (cortada)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Material da Placa</label>
                  <select
                    value={materialModular}
                    onChange={e => setMaterialModular(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-sm bg-white text-slate-900 mt-1"
                  >
                    {MODULAR_PLACA_KEYS.map(key => (
                      <option key={key} value={key}>{prices[key]?.nome ?? key}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Altura Rebaixo (m)</label>
                <input
                  type="number" value={rebaixo} onChange={(e) => setRebaixo(Number(e.target.value))} step="0.05"
                  className="border border-slate-300 rounded px-3 py-1.5 text-sm w-full mt-1"
                />
              </div>
              <div className="flex flex-col justify-end gap-2 pb-1">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={usarLa} onChange={(e) => setUsarLa(e.target.checked)} className="rounded" /> Lã de Rocha
                </label>
                {tipoForro === 'drywall' && (
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={usarIso} onChange={e => setUsarIso(e.target.checked)} className="rounded" /> Usar Isoflex
                  </label>
                )}
              </div>
            </div>

            <button
              onClick={gerarOrcamentoCAD}
              className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded text-sm transition shadow-sm"
            >
              Gerar Modulação & Orçamento
            </button>
          </div>

          {orcamento.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Orçamento Detalhado (CAD)</h2>
              <TabelaOrcamento orcamento={orcamento} onExport={exportarOrcamento} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}