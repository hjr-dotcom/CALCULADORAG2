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
// Placas sempre compradas na chapa cheia 1,25x0,625m (0,78125m²) e cortadas ao meio
// quando o formato for 62x62 (cada chapa cheia gera 2 peças de 0,625x0,625m).
// Fórmulas de quantidade baseadas na planilha de referência FORRO_LEVE.xlsx (aba "FORRO LEVE"),
// incluindo o fator de perda de 5% usado nela.
export function calcularForroModular(lado1: number, lado2: number, formato: '125x62' | '62x62', rebaixo: number) {
  const area = lado1 * lado2;
  const perimetro = 2 * (lado1 + lado2);

  // Quantidade de peças instaladas (chapa cheia ou metade, conforme formato)
  const areaPeca = formato === '62x62' ? 0.390625 : 0.78125;
  const placas = Math.ceil((area / areaPeca) * 1.05);

  // Travessa 0,625: uma por peça da grade padrão (chapa cheia), mais uma extra por
  // peça quando o formato é 62x62 (a chapa cortada ao meio precisa de um travessa
  // adicional apoiando a emenda do corte).
  const travessaBase = Math.ceil((area / 0.78125) * 1.05);
  const travessaExtra = formato === '62x62' ? Math.ceil((area / 0.390625) * 1.05) : 0;
  const travessa625 = travessaBase + travessaExtra;

  const perfilCanto = Math.ceil(perimetro / 3);
  const perfilPrincipalRaw = (lado1 / 1.25) * (lado2 / 3.125) * 1.05;
  const perfilPrincipal = Math.ceil(perfilPrincipalRaw);
  const perfilSecundario = Math.ceil((lado1 / 1.25) * (lado2 / 0.625) * 1.05);
  const pendural = Math.ceil(perfilPrincipalRaw * 3);
  const presilha = placas * 2;
  const arame = +(pendural * rebaixo * 1.15).toFixed(1);

  return { area, perimetro, placas, travessa625, perfilCanto, perfilPrincipal, perfilSecundario, pendural, presilha, arame };
}
