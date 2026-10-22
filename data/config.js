/**
 * SV Multimarcas — Configuração central
 * Altere aqui os dados da loja. Todos os arquivos do site leem deste arquivo.
 */
window.SV_CONFIG = {
  // Identidade
  nome: 'SV Multimarcas',
  nomeAlternativo: 'Souza Veículos Multimarcas',
  slogan: 'Seu próximo carro está aqui.',

  // Contato — dados reais da loja
  whatsapp: '5511999754932',        // (11) 99975-4932
  telefone: '11999754932',
  telefone2: '1136512783',          // (11) 3651-2783
  email: 'contato@svmultimarcas.com.br',
  instagram: 'https://www.instagram.com/sv26anos/',
  facebook: 'https://www.facebook.com/SouzaVeiculosMultimarcas/?locale=pt_BR',
  googleMaps: '',                    // TODO: colar o link real do Google Maps
  endereco: {
    logradouro: 'Av. dos Automobilistas, nº 000', // TODO: confirmar endereço
    cidade: 'São Paulo',
    uf: 'SP',
    cep: '00000-000'                 // TODO: confirmar CEP
  },
  horario: {
    semana: 'Segunda a sexta: 9h às 18h',
    sabado: 'Sábado: 9h às 14h'
  },

  // Backend: configurado no servidor (Vercel). Não precisa mexer aqui.
};
