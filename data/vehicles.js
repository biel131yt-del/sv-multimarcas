/**
 * SV Multimarcas - Fonte unica de dados do estoque
 *
 * Este e o UNICO lugar onde os veiculos sao cadastrados.
 * O site publico (index.html, veiculo.html) e o painel admin leem daqui.
 *
 * FOTOS - cada veiculo tem 3 angulos minimos:
 *   frente   -> capa do anuncio (card no estoque + topo da pagina do veiculo)
 *   interior -> 2a foto da galeria
 *   traseira -> 3a foto da galeria
 *   extras   -> fotos adicionais (opcional)
 *
 * Gerado pelo painel administrativo.
 */
window.SV_VEHICLES = [
  {
    "id": 1,
    "marca": "Volkswagen",
    "modelo": "Golf",
    "versao": "GTI",
    "ano": 2022,
    "km": 18500,
    "cambio": "Automático",
    "combustivel": "Gasolina",
    "preco": 149900,
    "fotos": {
      "frente": "images/placeholder-veiculo.svg",
      "interior": "images/placeholder-veiculo.svg",
      "traseira": "/api/foto?pathname=carros%2F1-traseira-costas-golf-gti-2022.jpg",
      "extras": []
    },
    "destaque": true,
    "status": "disponivel",
    "descricao": "Hatch médio premium em excelente estado de conservação. Revisado e com laudo aprovado.",
    "portas": 4,
    "cor": "Preto",
    "placa": "Mercosul",
    "unicoDono": "Sim",
    "revisao": "Concessionária",
    "checklist": [
      "Revisão em dia",
      "Laudo aprovado",
      "Pneus novos",
      "Freios revisados",
      "IPTV quitado",
      "Manual do proprietário",
      "Chave reserva",
      "Nota fiscal"
    ],
    "atualizado_em": "2026-10-21T23:01:46.546Z"
  },
  {
    "id": 2,
    "marca": "BMW",
    "modelo": "320i",
    "versao": "M Sport",
    "ano": 2021,
    "km": 32000,
    "cambio": "Automático",
    "combustivel": "Gasolina",
    "preco": 189900,
    "fotos": {
      "frente": "images/placeholder-veiculo.svg",
      "interior": "images/placeholder-veiculo.svg",
      "traseira": "images/placeholder-veiculo.svg",
      "extras": []
    },
    "destaque": true,
    "status": "disponivel",
    "descricao": "Sedã executivo com acabamento impecável e baixa quilometragem.",
    "portas": 4,
    "cor": "Branco",
    "placa": "Mercosul",
    "unicoDono": "Sim",
    "revisao": "Em dia",
    "checklist": [
      "Revisão em dia",
      "Laudo aprovado",
      "Pneus 80%",
      "Freios ok",
      "IPTV quitado",
      "Manual do proprietário",
      "Chave reserva"
    ],
    "atualizado_em": "2026-10-21T22:36:23.406Z"
  },
  {
    "id": 3,
    "marca": "Mercedes-Benz",
    "modelo": "CLA 200",
    "versao": "Style",
    "ano": 2020,
    "km": 45000,
    "cambio": "Automático",
    "combustivel": "Gasolina",
    "preco": 159900,
    "fotos": {
      "frente": "images/placeholder-veiculo.svg",
      "interior": "images/placeholder-veiculo.svg",
      "traseira": "images/placeholder-veiculo.svg",
      "extras": []
    },
    "destaque": false,
    "status": "disponivel",
    "descricao": "Coupé de 4 portas com design esportivo e tecnologia de ponta.",
    "portas": 4,
    "cor": "Prata",
    "placa": "Mercosul",
    "unicoDono": "Não",
    "revisao": "Em dia",
    "checklist": [
      "Revisão em dia",
      "Laudo aprovado",
      "Pneus 70%",
      "Freios ok",
      "IPTV quitado",
      "Manual do proprietário"
    ],
    "atualizado_em": "2026-10-21T22:36:23.523Z"
  },
  {
    "id": 4,
    "marca": "Audi",
    "modelo": "Q3",
    "versao": "2.0 TFSI",
    "ano": 2023,
    "km": 12000,
    "cambio": "Automático",
    "combustivel": "Gasolina",
    "preco": 219900,
    "fotos": {
      "frente": "images/placeholder-veiculo.svg",
      "interior": "images/placeholder-veiculo.svg",
      "traseira": "images/placeholder-veiculo.svg",
      "extras": []
    },
    "destaque": true,
    "status": "disponivel",
    "descricao": "SUV compacto premium com pouquíssimo uso e garantia de fábrica.",
    "portas": 5,
    "cor": "Branco",
    "placa": "Mercosul",
    "unicoDono": "Sim",
    "revisao": "Concessionária",
    "checklist": [
      "Revisão em dia",
      "Garantia de fábrica",
      "Laudo aprovado",
      "Pneus novos",
      "Freios ok",
      "IPTV quitado",
      "Manual do proprietário",
      "Chave reserva",
      "Nota fiscal"
    ],
    "atualizado_em": "2026-10-21T22:36:23.639Z"
  },
  {
    "id": 5,
    "marca": "Toyota",
    "modelo": "Corolla",
    "versao": "Altis",
    "ano": 2022,
    "km": 28000,
    "cambio": "Automático",
    "combustivel": "Flex",
    "preco": 119900,
    "fotos": {
      "frente": "images/placeholder-veiculo.svg",
      "interior": "images/placeholder-veiculo.svg",
      "traseira": "images/placeholder-veiculo.svg",
      "extras": []
    },
    "destaque": false,
    "status": "disponivel",
    "descricao": "Sedã confiável, econômico e de revenda valorizada.",
    "portas": 4,
    "cor": "Prata",
    "placa": "Mercosul",
    "unicoDono": "Sim",
    "revisao": "Em dia",
    "checklist": [
      "Revisão em dia",
      "Laudo aprovado",
      "Pneus 85%",
      "Freios ok",
      "IPTV quitado",
      "Manual do proprietário",
      "Chave reserva"
    ],
    "atualizado_em": "2026-10-21T22:36:23.756Z"
  },
  {
    "id": 6,
    "marca": "Ford",
    "modelo": "Mustang",
    "versao": "GT",
    "ano": 2019,
    "km": 55000,
    "cambio": "Automático",
    "combustivel": "Gasolina",
    "preco": 249900,
    "fotos": {
      "frente": "images/placeholder-veiculo.svg",
      "interior": "images/placeholder-veiculo.svg",
      "traseira": "images/placeholder-veiculo.svg",
      "extras": []
    },
    "destaque": false,
    "status": "reservado",
    "descricao": "Muscle car icônico com motor V8 e desempenho de sobra.",
    "portas": 2,
    "cor": "Vermelho",
    "placa": "Mercosul",
    "unicoDono": "Não",
    "revisao": "Em dia",
    "checklist": [
      "Revisão em dia",
      "Laudo aprovado",
      "Pneus 60%",
      "Freios ok",
      "IPTV quitado",
      "Manual do proprietário"
    ],
    "atualizado_em": "2026-10-21T22:36:23.872Z"
  },
  {
    "id": 7,
    "marca": "Chevrolet",
    "modelo": "Onix",
    "versao": "Premier",
    "ano": 2023,
    "km": 21000,
    "cambio": "Automático",
    "combustivel": "Flex",
    "preco": 89900,
    "fotos": {
      "frente": "images/placeholder-veiculo.svg",
      "interior": "images/placeholder-veiculo.svg",
      "traseira": "images/placeholder-veiculo.svg",
      "extras": []
    },
    "destaque": false,
    "status": "disponivel",
    "descricao": "Sedã compacto com bom equipamento e economia de combustível.",
    "portas": 4,
    "cor": "Branco",
    "placa": "Mercosul",
    "unicoDono": "Sim",
    "revisao": "Em dia",
    "checklist": [
      "Revisão em dia",
      "Laudo aprovado",
      "Pneus 90%",
      "Freios ok",
      "IPTV quitado",
      "Chave reserva"
    ],
    "atualizado_em": "2026-10-21T22:36:23.989Z"
  },
  {
    "id": 8,
    "marca": "Hyundai",
    "modelo": "HB20",
    "versao": "Evolution",
    "ano": 2022,
    "km": 34000,
    "cambio": "Manual",
    "combustivel": "Flex",
    "preco": 74900,
    "fotos": {
      "frente": "images/placeholder-veiculo.svg",
      "interior": "images/placeholder-veiculo.svg",
      "traseira": "images/placeholder-veiculo.svg",
      "extras": []
    },
    "destaque": false,
    "status": "disponivel",
    "descricao": "Hatch compacto, econômico e de fácil manutenção.",
    "portas": 4,
    "cor": "Prata",
    "placa": "Mercosul",
    "unicoDono": "Não",
    "revisao": "Em dia",
    "checklist": [
      "Revisão em dia",
      "Laudo aprovado",
      "Pneus 75%",
      "Freios ok",
      "IPTV quitado"
    ],
    "atualizado_em": "2026-10-21T22:36:24.105Z"
  },
  {
    "id": 9,
    "marca": "Jeep",
    "modelo": "Compass",
    "versao": "Limited",
    "ano": 2021,
    "km": 48000,
    "cambio": "Automático",
    "combustivel": "Flex",
    "preco": 199900,
    "fotos": {
      "frente": "images/placeholder-veiculo.svg",
      "interior": "images/placeholder-veiculo.svg",
      "traseira": "images/placeholder-veiculo.svg",
      "extras": []
    },
    "destaque": false,
    "status": "disponivel",
    "descricao": "SUV médio com tração integral e boa posição de dirigir.",
    "portas": 5,
    "cor": "Cinza",
    "placa": "Mercosul",
    "unicoDono": "Sim",
    "revisao": "Em dia",
    "checklist": [
      "Revisão em dia",
      "Laudo aprovado",
      "Pneus 70%",
      "Freios ok",
      "IPTV quitado",
      "Manual do proprietário",
      "Chave reserva"
    ],
    "atualizado_em": "2026-10-21T22:36:24.222Z"
  }
];
