import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white px-5 shadow-sm z-20 flex gap-5 shrink-0 border-b border-slate-200">
      <Link href="/" className="py-3 text-sm font-medium text-slate-600 hover:text-blue-600">🏠 Início</Link>
      <Link href="/cad" className="py-3 text-sm font-medium text-slate-600 hover:text-blue-600">✏️ Desenho Livre (CAD)</Link>
      <Link href="/simples" className="py-3 text-sm font-medium text-slate-600 hover:text-blue-600">📐 Modo Simples</Link>
      <Link href="/formas-3d" className="py-3 text-sm font-medium text-slate-600 hover:text-blue-600">🧩 Formas 3D</Link>
      <Link href="/configuracoes" className="py-3 text-sm font-medium text-slate-600 hover:text-blue-600 ml-auto">⚙️ Configurações</Link>
    </header>
  );
}