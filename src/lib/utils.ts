export function formataMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function calcFixacao(nomeCaixa: string, nomeUn: string, qtdNecessaria: number, qtdPorCaixa: number, pPix: number, pCred: number) {
  let result = [];
  let caixas = Math.floor(qtdNecessaria / qtdPorCaixa);
  let resto = qtdNecessaria % qtdPorCaixa;
  
  if (resto >= qtdPorCaixa * 0.8) {
      caixas++;
      resto = 0;
  }
  
  if (caixas > 0) {
      result.push({ nome: nomeCaixa, qtd: caixas, un: 'cx', pPix: pPix, pCred: pCred });
  }
  
  if (resto > 0) {
      result.push({ nome: nomeUn, qtd: resto, un: 'un', pPix: pPix / qtdPorCaixa, pCred: pCred / qtdPorCaixa });
  }
  return result;
}

// 1. Parede Drywall (Placas 1,20 x 1,80m = 2,16m²)
export function calcularParedeDrywall(area: number, largura: number, altura: number) {
  return {
    placas_120x180: Math.ceil((area / 2.16) * 1.1), // 10% de perda
    montantes_3m: Math.ceil((largura / 0.60 + 1) * (altura / 3)),
    guias_3m: Math.ceil((largura * 2) / 3),
    parafusos_ta25: Math.ceil(area * 25),
    massa_kg: +(area * 0.3).toFixed(2),
    fita_m: +(area * 1.5).toFixed(2)
  };
}

// 2. Forro Modular (Opções 1,25x0,62m ou 0,62x0,62m)
export function calcularForroModular(area: number, perimetro: number, formato: '125x62' | '62x62') {
  // Área da placa base de 1.25 * 0.625 = 0.78125m²
  const placas = formato === '62x62' ? Math.ceil(area / 0.390625) : Math.ceil(area / 0.78125);
  // Se for 62x62, adiciona 1 perfil de 0,62 para cada vão de 1,25m
  const travessa_062 = formato === '62x62' ? Math.ceil(area / 0.78125) : 0;

  return {
    placas: placas,
    perfilPrincipal_312: Math.ceil(area / 2.4),
    perfilTravessa_125: Math.ceil(area / 0.8),
    perfilTravessa_062: travessa_062,
    cantoneira_3m: Math.ceil(perimetro / 3),
    tirantes: Math.ceil(area * 1.2)
  };
}
