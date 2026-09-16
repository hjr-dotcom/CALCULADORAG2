export const defaultPrices: Record<string, { nome: string; pix: number; cred: number }> = {
    // Insumos originais (Forro Drywall)
    'placa': { nome: 'CH ST Acartonado Standart Branca', pix: 42.95, cred: 56.60 },
    'f530': { nome: 'Perfil Drywall Canaleta F530', pix: 12.35, cred: 17.37 },
    'cantoneira': { nome: 'Perfil Drywall Cantoneira 25x30', pix: 7.42, cred: 10.42 },
    'pendural': { nome: 'Pendural Aço para F530', pix: 1.34, cred: 2.83 }, 
    'isoflex': { nome: 'Isoflex Amortecedor', pix: 1.50, cred: 3.50 },
    'arame': { nome: 'Arame Galvanizado N10 5kg', pix: 0.40, cred: 0.64 },
    'la': { nome: 'Painel Lã de Rocha D32', pix: 119.33, cred: 156.73 },
    'fita': { nome: 'Fita Telada 5cm x 90m Branca', pix: 26.95, cred: 38.66 },
    'massa': { nome: 'Massa Drywall 25kg', pix: 85.64, cred: 100.85 },
    'gn25': { nome: 'Parafuso GN25 (cx 1000)', pix: 28.11, cred: 43.69 },
    'bucha8': { nome: 'Bucha S8 c/ Anel (cx 1000)', pix: 23.00, cred: 29.06 },
    'parafuso60': { nome: 'Parafuso 5x60mm (cx 200)', pix: 30.13, cred: 56.93 },

    // Insumos adicionais (Parede Drywall)
    'montante_90': { nome: 'Montante Drywall 90mm x 3m', pix: 22.50, cred: 28.50 },
    'guia_90': { nome: 'Guia Drywall 90mm x 3m', pix: 18.50, cred: 24.50 },

    // Forro Modular - estrutura (comum a todos os tipos de placa, preço por peça/barra)
    'perfil_principal_3125': { nome: 'Perfil Principal Modular 3,125m', pix: 12.40, cred: 17.35 },
    'perfil_secundario_0625': { nome: 'Perfil Secundário Modular 0,625m', pix: 4.95, cred: 6.95 },
    'perfil_travessa_625': { nome: 'Travessa Modular 0,625m', pix: 2.15, cred: 3.05 },
    'perfil_canto_modular': { nome: 'Perfil Canto Modular 3m', pix: 8.15, cred: 11.45 },
    'presilha_modular': { nome: 'Presilha Forro Modular (un)', pix: 0.70, cred: 1.00 },
    'tirante_modular': { nome: 'Tirante c/ Regulador Mola (un)', pix: 1.90, cred: 2.70 },

    // Forro Modular - placas (peça cheia 1,25x0,625m; cortada ao meio quando 62x62)
    'placa_modular_125x62': { nome: 'Placa Modular Padrão/Genérica 1,25x0,625m', pix: 25.00, cred: 35.00 },
    'modular_isopor20': { nome: 'Placa Isopor 20mm 1,25x0,625m', pix: 25.85, cred: 36.20 },
    'modular_lapetstone': { nome: 'Placa Lã de PET Stone White 1,25x0,625m', pix: 48.10, cred: 67.35 },
    'modular_mineraldecor': { nome: 'Placa Mineral Decor (cx 12) 1,25x0,625m', pix: 52.35, cred: 73.30 },
    'modular_mineralis15': { nome: 'Placa Mineralis 15mm (cx 24) 1,25x0,625m', pix: 41.35, cred: 57.90 },
    'modular_pvc07': { nome: 'Placa PVC Modular 7mm 1,25x0,625m', pix: 51.55, cred: 72.15 },
    'modular_forrovidboreal': { nome: 'Placa Forrovid Boreal 15mm (cx 24) 1,25x0,625m', pix: 55.45, cred: 77.65 },
    'modular_forrovidpreto': { nome: 'Placa Forrovid Preto 1,25x0,625m', pix: 54.75, cred: 76.65 },
    'modular_mineralecomin': { nome: 'Placa Mineral Ecomin 1,25x0,625m', pix: 56.85, cred: 79.60 },
    'modular_ecophongedina': { nome: 'Placa Ecophon Gedina Branco 15mm (cx 24) 1,25x0,625m', pix: 48.75, cred: 68.25 },
    'modular_ecophonsombra': { nome: 'Placa Ecophon Sombra 15mm (cx 24) 1,25x0,625m', pix: 54.35, cred: 76.10 }
};

// Chaves de preço (defaultPrices) para cada opção de placa de forro modular disponível nos menus.
export const MODULAR_PLACA_KEYS: string[] = [
    'placa_modular_125x62',
    'modular_isopor20',
    'modular_lapetstone',
    'modular_mineraldecor',
    'modular_mineralis15',
    'modular_pvc07',
    'modular_forrovidboreal',
    'modular_forrovidpreto',
    'modular_mineralecomin',
    'modular_ecophongedina',
    'modular_ecophonsombra'
];
