/**
 * Define quais veiculos tem foto real (fora do placeholder).
 *
 * Uso: node scripts/marcar-fotos.mjs <id> <frente> <interior> <traseira>
 * Ex.: node scripts/marcar-fotos.mjs 1 images/carros/1-frente.jpg
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(__dirname, '..');
const caminho = resolve(raiz, 'data', 'vehicles.js');

const PLACEHOLDER = 'images/placeholder-veiculo.svg';

const raw = readFileSync(caminho, 'utf8');
const arrayJs = raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1);
const veiculos = new Function('return ' + arrayJs + ';')();

const [idArg, frente, interior, traseira] = process.argv.slice(2);
const id = Number(idArg);
const alvo = veiculos.find(v => v.id === id);

if (!alvo) {
  console.error('Veículo não encontrado:', idArg);
  process.exit(1);
}

// Todos os veiculos voltam ao placeholder; so o alvo recebe fotos reais.
for (const v of veiculos) {
  for (const angulo of ['frente', 'interior', 'traseira']) {
    v.fotos[angulo] = PLACEHOLDER;
  }
}
for (const extra of veiculos.flatMap(v => v.fotos.extras || [])) {
  if (!extra.startsWith('images/carros/')) continue;
}

if (frente) alvo.fotos.frente = frente;
if (interior) alvo.fotos.interior = interior;
if (traseira) alvo.fotos.traseira = traseira;

const cabecalho = raw.slice(0, raw.indexOf('['));
const corpo = 'window.SV_VEHICLES = ' + JSON.stringify(veiculos, null, 2) + ';\n';
writeFileSync(caminho, cabecalho + corpo, 'utf8');

console.log('Veículo', id, '→', alvo.marca, alvo.modelo);
console.log('  frente  :', alvo.fotos.frente);
console.log('  interior:', alvo.fotos.interior);
console.log('  traseira:', alvo.fotos.traseira);
console.log('\nArquivo atualizado:', caminho);
