'use client';
import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';

export interface CanvasDrawHandle {
  undo: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  setBackgroundImage: (file: File) => void;
  clearBackgroundImage: () => void;
  setBackgroundOpacity: (v: number) => void;
}

interface CanvasDrawProps {
  // 'line' desenha paredes; 'select' seleciona; 'pan' arrasta a câmera;
  // 'calibrate' mede uma linha sobre a imagem de fundo e pede o tamanho real.
  tool: 'line' | 'select' | 'pan' | 'calibrate' | string;
  orthoEnabled: boolean;
  onUpdateGeometry: (linesData: any[], modData: { modLines: any[]; modPoints: any[]; perimetro: number; areaEst: number; boundW: number; boundH: number }) => void;
  canvasRefProp?: React.RefObject<HTMLCanvasElement | null>;
  // 'drywall' desenha a modulação F530 (padrão); 'modular' desenha uma grade
  // esquemática de forro modular (perfil principal a cada 1,25m e travessas a
  // cada 0,625m) dentro do retângulo envolvente do desenho.
  gridMode?: 'drywall' | 'modular';
}

const CanvasDraw = forwardRef<CanvasDrawHandle, CanvasDrawProps>(function CanvasDraw(
  { tool, orthoEnabled, onUpdateGeometry, canvasRefProp, gridMode = 'drywall' },
  ref
) {
  const localCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeCanvasRef = canvasRefProp || localCanvasRef;
  const containerRef = useRef<HTMLDivElement>(null);

  const [lines, setLines] = useState<any[]>([]);
  const [modLines, setModLines] = useState<any[]>([]);
  const [modPoints, setModPoints] = useState<any[]>([]);
  const [modBounds, setModBounds] = useState<{ minX: number; maxX: number; minY: number; maxY: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [currentY, setCurrentY] = useState(0);

  // Imagem de fundo (decalque) e calibração de escala
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [bgScale, setBgScale] = useState(0.01); // metros por pixel da imagem original
  const [bgOffset, setBgOffset] = useState({ x: 0, y: 0 }); // posição (m) do canto superior-esquerdo da imagem
  const [bgOpacity, setBgOpacity] = useState(0.4);

  const historyRef = useRef<any[][]>([]);
  const panStateRef = useRef({ active: false, lastX: 0, lastY: 0 });

  const zoomRef = useRef(45);
  const oxRef = useRef(0);
  const oyRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  const s2w = useCallback((x: number, y: number) => ({
    x: (x - oxRef.current) / zoomRef.current,
    y: -(y - oyRef.current) / zoomRef.current
  }), []);

  const w2s = useCallback((x: number, y: number) => ({
    x: x * zoomRef.current + oxRef.current,
    y: -y * zoomRef.current + oyRef.current
  }), []);

  const render = useCallback(() => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Imagem de fundo (decalque)
    if (bgImage) {
      const p1 = w2s(bgOffset.x, bgOffset.y);
      const p2 = w2s(bgOffset.x + bgImage.width * bgScale, bgOffset.y - bgImage.height * bgScale);
      ctx.globalAlpha = bgOpacity;
      ctx.drawImage(bgImage, p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      ctx.globalAlpha = 1;
    }

    // Grid
    ctx.strokeStyle = '#c4c4c400';
    ctx.lineWidth = 1;
    let step = 1 * zoomRef.current;
    ctx.beginPath();
    for (let x = oxRef.current % step; x < w; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = oyRef.current % step; y < h; y += step) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();

    // Eixos X e Y
    let org = w2s(0, 0);
    ctx.strokeStyle = '#ff0055'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(org.x - 10, org.y); ctx.lineTo(org.x + 10, org.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(org.x, org.y - 10); ctx.lineTo(org.x, org.y + 10); ctx.stroke();

    if (gridMode === 'modular' && modBounds) {
      // Grade esquemática do forro modular: travessas a cada 0,625m e
      // perfil principal a cada 1,25m, dentro do retângulo envolvente do desenho.
      const { minX, maxX, minY, maxY } = modBounds;
      ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 1;
      for (let x = minX; x <= maxX + 0.001; x += 0.625) {
        let p1 = w2s(x, minY), p2 = w2s(x, maxY);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      }
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
      for (let y = minY; y <= maxY + 0.001; y += 1.25) {
        let p1 = w2s(minX, y), p2 = w2s(maxX, y);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      }
    } else {
      // Linhas de modulação (F530)
      ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 1.5;
      modLines.forEach(l => {
        let p1 = w2s(l.x1, l.y1), p2 = w2s(l.x2, l.y2);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      });

      // Pontos de modulação (Pendurais)
      ctx.fillStyle = '#22c55e';
      modPoints.forEach(p => {
        let sp = w2s(p.x, p.y);
        ctx.beginPath(); ctx.arc(sp.x, sp.y, 4, 0, Math.PI * 2); ctx.fill();
      });
    }

    // Paredes desenhadas
    ctx.lineWidth = 2.5;
    lines.forEach(l => {
      let p1 = w2s(l.x1, l.y1), p2 = w2s(l.x2, l.y2);
      ctx.strokeStyle = l.selected ? '#eab308' : '#ef4444';
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      ctx.fillStyle = 'white';
      ctx.fillRect(p1.x - 3, p1.y - 3, 6, 6);
      ctx.fillRect(p2.x - 3, p2.y - 3, 6, 6);
    });

    // Linha ativa ao desenhar ou calibrar
    if (isDrawing && (tool === 'line' || tool === 'calibrate')) {
      let p1 = w2s(startX, startY), p2 = w2s(currentX, currentY);
      ctx.strokeStyle = tool === 'calibrate' ? '#d946ef' : '#a3e635';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      ctx.fillStyle = 'white'; ctx.font = '13px monospace';
      const label = tool === 'calibrate' ? 'Definir escala...' : Math.hypot(currentX - startX, currentY - startY).toFixed(2) + 'm';
      ctx.fillText(label, p2.x + 12, p2.y - 12);
    }
  }, [lines, modLines, modPoints, modBounds, gridMode, isDrawing, tool, startX, startY, currentX, currentY, w2s, activeCanvasRef, bgImage, bgScale, bgOffset, bgOpacity]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = activeCanvasRef.current;
    if (!container || !canvas) return;

    const handleResize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      if (oxRef.current === 0) {
        oxRef.current = canvas.width / 2;
        oyRef.current = canvas.height / 2;
      }
      render();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render, activeCanvasRef]);

  useEffect(() => {
    render();
  }, [render]);

  const getSnap = (p: { x: number; y: number }) => {
    let closest: { x: number; y: number } | null = null;
    let minDist = 0.35;
    lines.forEach(l => {
      let d1 = Math.hypot(p.x - l.x1, p.y - l.y1);
      let d2 = Math.hypot(p.x - l.x2, p.y - l.y2);
      if (d1 < minDist) { closest = { x: l.x1, y: l.y1 }; minDist = d1; }
      if (d2 < minDist) { closest = { x: l.x2, y: l.y2 }; minDist = d2; }
    });
    return closest || { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    mouseRef.current = { x: mx, y: my };

    if (panStateRef.current.active) {
      oxRef.current += e.clientX - panStateRef.current.lastX;
      oyRef.current += e.clientY - panStateRef.current.lastY;
      panStateRef.current.lastX = e.clientX;
      panStateRef.current.lastY = e.clientY;
      render();
      return;
    }

    let snap = getSnap(s2w(mx, my));
    if (isDrawing && (tool === 'line' || tool === 'calibrate')) {
      let cX = snap.x;
      let cY = snap.y;
      if (e.shiftKey || orthoEnabled) {
        if (Math.abs(cX - startX) > Math.abs(cY - startY)) cY = startY;
        else cX = startX;
      }
      setCurrentX(cX);
      setCurrentY(cY);
    }
  };

  const finalizarCalibracao = (x1: number, y1: number, x2: number, y2: number) => {
    if (!bgImage) {
      alert('Carregue uma imagem de fundo antes de calibrar a escala.');
      return;
    }
    const real = window.prompt('Qual o tamanho real desta linha, em metros?', '1.0');
    if (real === null) return;
    const realNum = parseFloat(real.replace(',', '.'));
    if (!isFinite(realNum) || realNum <= 0) return;

    // Converte os pontos clicados (em metros, no sistema já usado pelas paredes)
    // para pixels da imagem original, usando a calibração atual (ou o palpite
    // inicial), e recalcula escala/posição da imagem para que a distância
    // medida passe a corresponder ao valor real informado.
    const ip1 = { x: (x1 - bgOffset.x) / bgScale, y: (bgOffset.y - y1) / bgScale };
    const ip2 = { x: (x2 - bgOffset.x) / bgScale, y: (bgOffset.y - y2) / bgScale };
    const pixDist = Math.hypot(ip2.x - ip1.x, ip2.y - ip1.y);
    if (pixDist <= 0) return;

    const newScale = realNum / pixDist;
    const newOffsetX = x1 - ip1.x * newScale;
    const newOffsetY = y1 + ip1.y * newScale;
    setBgScale(newScale);
    setBgOffset({ x: newOffsetX, y: newOffsetY });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;

    if (tool === 'pan') {
      panStateRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
      return;
    }

    const rect = canvas.getBoundingClientRect();
    let snap = getSnap(s2w(e.clientX - rect.left, e.clientY - rect.top));

    if (tool === 'line' || tool === 'calibrate') {
      if (!isDrawing) {
        setIsDrawing(true);
        setStartX(snap.x);
        setStartY(snap.y);
        setCurrentX(snap.x);
        setCurrentY(snap.y);
      } else {
        let fX = snap.x;
        let fY = snap.y;
        if (e.shiftKey || orthoEnabled) {
          if (Math.abs(fX - startX) > Math.abs(fY - startY)) fY = startY;
          else fX = startX;
        }
        if (Math.hypot(startX - fX, startY - fY) > 0.05) {
          if (tool === 'line') {
            historyRef.current.push(lines);
            if (historyRef.current.length > 30) historyRef.current.shift();
            const updatedLines = [...lines, { x1: startX, y1: startY, x2: fX, y2: fY, selected: false }];
            setLines(updatedLines);
            calcularModulacao(updatedLines);
          } else {
            finalizarCalibracao(startX, startY, fX, fY);
          }
        }
        if (tool === 'calibrate') {
          setIsDrawing(false);
        } else {
          setStartX(fX);
          setStartY(fY);
          setCurrentX(fX);
          setCurrentY(fY);
        }
      }
    } else if (tool === 'select') {
      const wPos = s2w(e.clientX - rect.left, e.clientY - rect.top);
      const updatedLines = lines.map(l => {
        const d = distToSeg(wPos, { x: l.x1, y: l.y1 }, { x: l.x2, y: l.y2 });
        return { ...l, selected: d < 12 / zoomRef.current };
      });
      setLines(updatedLines);
    }
  };

  const handleMouseUp = () => {
    panStateRef.current.active = false;
  };

  const distToSeg = (p: { x: number; y: number }, v: { x: number; y: number }, w: { x: number; y: number }) => {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = Math.max(0, Math.min(1, ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  };

  const calcularModulacao = (currentLines: any[]) => {
    if (currentLines.length < 3) {
      setModLines([]);
      setModPoints([]);
      setModBounds(null);
      onUpdateGeometry(currentLines, { modLines: [], modPoints: [], perimetro: 0, areaEst: 0, boundW: 0, boundH: 0 });
      return;
    }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    currentLines.forEach(l => {
      minX = Math.min(minX, l.x1, l.x2);
      maxX = Math.max(maxX, l.x1, l.x2);
      minY = Math.min(minY, l.y1, l.y2);
      maxY = Math.max(maxY, l.y1, l.y2);
    });
    setModBounds({ minX, maxX, minY, maxY });

    let mLines: any[] = [];
    let mPoints: any[] = [];
    let linearF530 = 0;

    for (let y = minY + 0.6; y < maxY; y += 0.6) {
      let rayHits: number[] = [];
      currentLines.forEach(l => {
        if ((l.y1 <= y && l.y2 > y) || (l.y2 <= y && l.y1 > y)) {
          rayHits.push(l.x1 + (y - l.y1) * (l.x2 - l.x1) / (l.y2 - l.y1));
        }
      });
      rayHits.sort((a, b) => a - b);
      for (let i = 0; i < rayHits.length - 1; i += 2) {
        mLines.push({ x1: rayHits[i], y1: y, x2: rayHits[i + 1], y2: y });
        linearF530 += (rayHits[i + 1] - rayHits[i]);
        for (let p = 1; p < (rayHits[i + 1] - rayHits[i]); p += 1.0) {
          mPoints.push({ x: rayHits[i] + p, y: y });
        }
      }
    }

    let perimetro = 0;
    currentLines.forEach(l => perimetro += Math.hypot(l.x2 - l.x1, l.y2 - l.y1));
    let areaEst = linearF530 * 0.6;

    setModLines(mLines);
    setModPoints(mPoints);
    onUpdateGeometry(currentLines, { modLines: mLines, modPoints: mPoints, perimetro, areaEst, boundW: maxX - minX, boundH: maxY - minY });
  };

  const zoomAtCenter = (factor: number) => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const wpB = s2w(cx, cy);
    zoomRef.current *= factor;
    const wpA = s2w(cx, cy);
    oxRef.current += (wpA.x - wpB.x) * zoomRef.current;
    oyRef.current -= (wpA.y - wpB.y) * zoomRef.current;
    render();
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const wpB = s2w(mouseRef.current.x, mouseRef.current.y);
    zoomRef.current *= e.deltaY < 0 ? 1.1 : 0.9;
    const wpA = s2w(mouseRef.current.x, mouseRef.current.y);
    oxRef.current += (wpA.x - wpB.x) * zoomRef.current;
    oyRef.current -= (wpA.y - wpB.y) * zoomRef.current;
    render();
  };

  useImperativeHandle(ref, () => ({
    undo: () => {
      if (historyRef.current.length === 0) return;
      const prev = historyRef.current.pop()!;
      setIsDrawing(false);
      setLines(prev);
      calcularModulacao(prev);
    },
    zoomIn: () => zoomAtCenter(1.25),
    zoomOut: () => zoomAtCenter(1 / 1.25),
    resetView: () => {
      zoomRef.current = 45;
      const canvas = activeCanvasRef.current;
      if (canvas) {
        oxRef.current = canvas.width / 2;
        oyRef.current = canvas.height / 2;
      }
      render();
    },
    setBackgroundImage: (file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const defaultScale = 0.01; // palpite inicial: 1px da imagem = 1cm, ajustável ao calibrar
          setBgImage(img);
          setBgScale(defaultScale);
          setBgOffset({ x: -(img.width * defaultScale) / 2, y: (img.height * defaultScale) / 2 });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    clearBackgroundImage: () => setBgImage(null),
    setBackgroundOpacity: (v: number) => setBgOpacity(v)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [render, lines, bgImage, bgScale, bgOffset]);

  return (
    <div ref={containerRef} className="w-full h-full bg-[#1e1e1e] relative">
      <canvas
        ref={activeCanvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => { e.preventDefault(); setIsDrawing(false); }}
        onWheel={handleWheel}
        className={`w-full h-full block ${tool === 'pan' ? 'cursor-grab' : 'cursor-crosshair'}`}
      />
    </div>
  );
});

export default CanvasDraw;
