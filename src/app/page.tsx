import Link from 'next/link';

export default function MenuInicial() {
  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Calculadora de Forro</h1>
        <p className="text-sm text-slate-500 mb-8">Escolha o tipo de estrutura e como deseja informar as medidas.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <h2 className="text-lg font-bold text-slate-900">🧱 Forro Acartonado</h2>
            <p className="text-sm text-slate-500 mt-1 mb-4 flex-1">Forro de gesso acartonado com estrutura F530, placas parafusadas e emassadas.</p>
            <div className="flex flex-col gap-2">
              <Link href="/simples?tipo=forro_drywall" className="text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition">
                📐 Lado x Lado
              </Link>
              <Link href="/cad?tipo=forro_drywall" className="text-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2.5 rounded-lg text-sm transition">
                ✏️ Desenhando
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <h2 className="text-lg font-bold text-slate-900">🔲 Forro Removível / Modular</h2>
            <p className="text-sm text-slate-500 mt-1 mb-4 flex-1">Forro em grade metálica com placas modulares (isopor, mineral, lã de PET, PVC, etc.), formato 1,25x0,625m ou 0,625x0,625m.</p>
            <div className="flex flex-col gap-2">
              <Link href="/simples?tipo=forro_modular" className="text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition">
                📐 Lado x Lado
              </Link>
              <Link href="/cad?tipo=forro_modular" className="text-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2.5 rounded-lg text-sm transition">
                ✏️ Desenhando
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:col-span-2">
            <h2 className="text-lg font-bold text-slate-900">🚧 Parede Drywall</h2>
            <p className="text-sm text-slate-500 mt-1 mb-4 flex-1">Parede em drywall com montante/guia 90mm.</p>
            <div className="flex flex-col gap-2 md:max-w-xs">
              <Link href="/simples?tipo=parede_drywall" className="text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition">
                📐 Lado x Lado
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
