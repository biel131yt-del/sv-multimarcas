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
 * Gerado pelo painel administrativo em 21/10/2026, 19:35:43
 */
window.SV_VEHICLES = [
  {
    "id": 1,
    "marca": "Volkswagen",
    "modelo": "Golf",
    "ano": 2022,
    "km": 18500,
    "cambio": "Automatico",
    "combustivel": "Gasolina",
    "preco": 149900,
    "fotos": {
      "frente": "images/carros/1-frente.jpg",
      "interior": "images/placeholder-veiculo.svg",
      "traseira": "images/placeholder-veiculo.svg",
      "extras": []
    },
    "status": "disponivel"
  }
];
