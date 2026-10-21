/**
 * SV Multimarcas — Fonte única de dados do estoque
 *
 * Este é o ÚNICO lugar onde os veículos são cadastrados.
 * O site público (index.html, veiculo.html) e o painel admin leem daqui.
 *
 * FOTOS — cada veículo tem 3 ângulos mínimos:
 *   frente   → capa do anúncio (card no estoque + topo da página do veículo)
 *   interior → 2ª foto da galeria
 *   traseira → 3ª foto da galeria
 *   extras   → fotos adicionais (opcional)
 *
 * While as fotos reais não estiverem em images/carros/, usamos o placeholder
 * SVG — o site continua funcionando e sinaliza o que falta.
 */
window.SV_VEHICLES = [
  {
    id: 1,
    marca: 'Volkswagen',
    modelo: 'Golf',
    versao: 'GTI',
    ano: 2022,
    km: 18500,
    cambio: 'Automático',
    combustivel: 'Gasolina',
    preco: 149900,
    fotos: {
      frente: 'images/placeholder-veiculo.svg',
      interior: 'images/placeholder-veiculo.svg',
      traseira: 'images/placeholder-veiculo.svg',
      extras: []
    },
    destaque: true,
    status: 'disponivel',
    atualizado_em: '2026-10-21T09:00:00Z',
    descricao: 'Hatch médio premium em excelente estado de conservação. Revisado e com laudo aprovado.',
    portas: 4,
    cor: 'Preto',
    placa: 'Mercosul',
    unicoDono: 'Sim',
    revisao: 'Concessionária',
    checklist: [
      'Revisão em dia', 'Laudo aprovado', 'Pneus novos', 'Freios revisados',
      'IPTV quitado', 'Manual do proprietário', 'Chave reserva', 'Nota fiscal'
    ]
  },
  {
    id: 2,
    marca: 'BMW',
    modelo: '320i',
    versao: 'M Sport',
    ano: 2021,
    km: 32000,
    cambio: 'Automático',
    combustivel: 'Gasolina',
    preco: 189900,
    fotos: {
      frente: 'images/placeholder-veiculo.svg',
      interior: 'images/placeholder-veiculo.svg',
      traseira: 'images/placeholder-veiculo.svg',
      extras: []
    },
    destaque: true,
    status: 'disponivel',
    atualizado_em: '2026-10-20T14:30:00Z',
    descricao: 'Sedã executivo com acabamento impecável e baixa quilometragem.',
    portas: 4,
    cor: 'Branco',
    placa: 'Mercosul',
    unicoDono: 'Sim',
    revisao: 'Em dia',
    checklist: [
      'Revisão em dia', 'Laudo aprovado', 'Pneus 80%', 'Freios ok',
      'IPTV quitado', 'Manual do proprietário', 'Chave reserva'
    ]
  },
  {
    id: 3,
    marca: 'Mercedes-Benz',
    modelo: 'CLA 200',
    versao: 'Style',
    ano: 2020,
    km: 45000,
    cambio: 'Automático',
    combustivel: 'Gasolina',
    preco: 159900,
    fotos: {
      frente: 'images/placeholder-veiculo.svg',
      interior: 'images/placeholder-veiculo.svg',
    traseira: 'images/placeholder-veiculo.svg',
      extras: []
    },
    destaque: false,
    status: 'disponivel',
    atualizado_em: '2026-10-19T11:15:00Z',
    descricao: 'Coupé de 4 portas com design esportivo e tecnologia de ponta.',
    portas: 4,
    cor: 'Prata',
    placa: 'Mercosul',
    unicoDono: 'Não',
    revisao: 'Em dia',
    checklist: [
      'Revisão em dia', 'Laudo aprovado', 'Pneus 70%', 'Freios ok',
      'IPTV quitado', 'Manual do proprietário'
    ]
  },
  {
    id: 4,
    marca: 'Audi',
    modelo: 'Q3',
    versao: '2.0 TFSI',
    ano: 2023,
    km: 12000,
    cambio: 'Automático',
    combustivel: 'Gasolina',
    preco: 219900,
    fotos: {
      frente: 'images/placeholder-veiculo.svg',
      interior: 'images/placeholder-veiculo.svg',
      traseira: 'images/placeholder-veiculo.svg',
      extras: []
    },
    destaque: true,
    status: 'disponivel',
    atualizado_em: '2026-10-21T08:20:00Z',
    descricao: 'SUV compacto premium com pouquíssimo uso e garantia de fábrica.',
    portas: 5,
    cor: 'Branco',
    placa: 'Mercosul',
    unicoDono: 'Sim',
    revisao: 'Concessionária',
    checklist: [
      'Revisão em dia', 'Garantia de fábrica', 'Laudo aprovado', 'Pneus novos', 'Freios ok',
      'IPTV quitado', 'Manual do proprietário', 'Chave reserva', 'Nota fiscal'
    ]
  },
  {
    id: 5,
    marca: 'Toyota',
    modelo: 'Corolla',
    versao: 'Altis',
    ano: 2022,
    km: 28000,
    cambio: 'Automático',
    combustivel: 'Flex',
    preco: 119900,
    fotos: {
      frente: 'images/placeholder-veiculo.svg',
      interior: 'images/placeholder-veiculo.svg',
      traseira: 'images/placeholder-veiculo.svg',
      extras: []
    },
    destaque: false,
    status: 'disponivel',
    atualizado_em: '2026-10-18T16:45:00Z',
    descricao: 'Sedã confiável, econômico e de revenda valorizada.',
    portas: 4,
    cor: 'Prata',
    placa: 'Mercosul',
    unicoDono: 'Sim',
    revisao: 'Em dia',
    checklist: [
      'Revisão em dia', 'Laudo aprovado', 'Pneus 85%', 'Freios ok',
      'IPTV quitado', 'Manual do proprietário', 'Chave reserva'
    ]
  },
  {
    id: 6,
    marca: 'Ford',
    modelo: 'Mustang',
    versao: 'GT',
    ano: 2019,
    km: 55000,
    cambio: 'Automático',
    combustivel: 'Gasolina',
    preco: 249900,
    fotos: {
      frente: 'images/placeholder-veiculo.svg',
      interior: 'images/placeholder-veiculo.svg',
      traseira: 'images/placeholder-veiculo.svg',
      extras: []
    },
    destaque: false,
    status: 'reservado',
    atualizado_em: '2026-10-17T10:05:00Z',
    descricao: 'Muscle car icônico com motor V8 e desempenho de sobra.',
    portas: 2,
    cor: 'Vermelho',
    placa: 'Mercosul',
    unicoDono: 'Não',
    revisao: 'Em dia',
    checklist: [
      'Revisão em dia', 'Laudo aprovado', 'Pneus 60%', 'Freios ok',
      'IPTV quitado', 'Manual do proprietário'
    ]
  },
  {
    id: 7,
    marca: 'Chevrolet',
    modelo: 'Onix',
    versao: 'Premier',
    ano: 2023,
    km: 21000,
    cambio: 'Automático',
    combustivel: 'Flex',
    preco: 89900,
    fotos: {
      frente: 'images/placeholder-veiculo.svg',
      interior: 'images/placeholder-veiculo.svg',
      traseira: 'images/placeholder-veiculo.svg',
      extras: []
    },
    destaque: false,
    status: 'disponivel',
    atualizado_em: '2026-10-20T09:30:00Z',
    descricao: 'Sedã compacto com bom equipamento e economia de combustível.',
    portas: 4,
    cor: 'Branco',
    placa: 'Mercosul',
    unicoDono: 'Sim',
    revisao: 'Em dia',
    checklist: [
      'Revisão em dia', 'Laudo aprovado', 'Pneus 90%', 'Freios ok',
      'IPTV quitado', 'Chave reserva'
    ]
  },
  {
    id: 8,
    marca: 'Hyundai',
    modelo: 'HB20',
    versao: 'Evolution',
    ano: 2022,
    km: 34000,
    cambio: 'Manual',
    combustivel: 'Flex',
    preco: 74900,
    fotos: {
      frente: 'images/placeholder-veiculo.svg',
      interior: 'images/placeholder-veiculo.svg',
      traseira: 'images/placeholder-veiculo.svg',
      extras: []
    },
    destaque: false,
    status: 'disponivel',
    atualizado_em: '2026-10-16T13:20:00Z',
    descricao: 'Hatch compacto, econômico e de fácil manutenção.',
    portas: 4,
    cor: 'Prata',
    placa: 'Mercosul',
    unicoDono: 'Não',
    revisao: 'Em dia',
    checklist: [
      'Revisão em dia', 'Laudo aprovado', 'Pneus 75%', 'Freios ok', 'IPTV quitado'
    ]
  },
  {
    id: 9,
    marca: 'Jeep',
    modelo: 'Compass',
    versao: 'Limited',
    ano: 2021,
    km: 48000,
    cambio: 'Automático',
    combustivel: 'Flex',
    preco: 199900,
    fotos: {
      frente: 'images/placeholder-veiculo.svg',
      interior: 'images/placeholder-veiculo.svg',
      traseira: 'images/placeholder-veiculo.svg',
      extras: []
    },
    destaque: false,
    status: 'disponivel',
    atualizado_em: '2026-10-21T10:40:00Z',
    descricao: 'SUV médio com tração integral e boa posição de dirigir.',
    portas: 5,
    cor: 'Cinza',
    placa: 'Mercosul',
    unicoDono: 'Sim',
    revisao: 'Em dia',
    checklist: [
      'Revisão em dia', 'Laudo aprovado', 'Pneus 70%', 'Freios ok',
      'IPTV quitado', 'Manual do proprietário', 'Chave reserva'
    ]
  }
];
