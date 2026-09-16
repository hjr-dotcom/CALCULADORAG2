'use client';
import { useRef, useEffect, useState, useCallback } from 'react';

interface CanvasDrawProps {
  tool: string;
  orthoEnabled: boolean;
  onUpdateGeometry: (linesData: any[], modData: { modLines: any[]; modPoints: any[]; perimetro: number; areaEst: number }) => void;
  canvasRefProp?: React.RefObject<HTMLCanvasElement | null>;
}

export default function CanvasDraw({ tool, orthoEnabled, onUpdateGeometry, canvasRefProp }: CanvasDrawProps) {
  const localCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeCanvasRef = canvasRefProp || localCanvasRef;
  const containerRef = useRef<HTMLDivElement>(null);

  const [lines, setLines] = useState<any[]>([]);
  const [modLines, setModLines] = useState<any[]>([]);
  const [modPoints, setModPoints] = useState<any[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  
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

    // Linha ativa ao desenhar
    if (isDrawing && tool === 'line') {
      let p1 = w2s(startX, startY), p2 = w2s(currentX, currentY);
      ctx.strokeStyle = '#a3e635'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      ctx.fillStyle = 'white'; ctx.font = '13px monospace';
      ctx.fillText(Math.hypot(currentX - startX, currentY - startY).toFixed(2) + 'm', p2.x + 12, p2.y - 12);
    }
  }, [lines, modLines, modPoints, isDrawing, tool, startX, startY, currentX, currentY, w2s, activeCanvasRef]);

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

    let snap = getSnap(s2w(mx, my));
    if (isDrawing && tool === 'line') {
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

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let snap = getSnap(s2w(e.clientX - rect.left, e.clientY - rect.top));

    if (tool === 'line') {
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
          const updatedLines = [...lines, { x1: startX, y1: startY, x2: fX, y2: fY, selected: false }];
          setLines(updatedLines);
          calcularModulacao(updatedLines);
        }
        setStartX(fX);
        setStartY(fY);
        setCurrentX(fX);
        setCurrentY(fY);
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

  const distToSeg = (p: { x: number; y: number }, v: { x: number; y: number }, w: { x: number; y: number }) => {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = Math.max(0, Math.min(1, ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  };

  const calcularModulacao = (currentLines: any[]) => {
    if (currentLines.length < 3) return;
    let minY = Infinity, maxY = -Infinity;
    currentLines.forEach(l => {
      minY = Math.min(minY, l.y1, l.y2);
      maxY = Math.max(maxY, l.y1, l.y2);
    });

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
    onUpdateGeometry(currentLines, { modLines: mLines, modPoints: mPoints, perimetro, areaEst });
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

  return (
    <div ref={containerRef} className="w-full h-full bg-[#1e1e1e] relative">
      <canvas
        ref={activeCanvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onContextMenu={(e) => { e.preventDefault(); setIsDrawing(false); }}
        onWheel={handleWheel}
        className="w-full h-full block cursor-crosshair"
      />
    </div>
  );
}