/**
 * Teste do fluxo de publicacao: monta o payload do POST /api/veiculos
 * a partir de data/vehicles.js (preserva acentos) e mostra o resultado.
 *
 * Uso: node scripts/testar-publicacao.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(__dirname, '..');

const raw = readFileSync(resolve(raiz, 'data', 'vehicles.js'), 'utf8');
// O arquivo e JavaScript (aspas simples), nao JSON puro: avalia o array.
const arrayJs = raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1);
const veiculos = new Function('return ' + arrayJs + ';')();

console.log('Veículos carregados:', veiculos.length);
console.log('Acento preservado (cambio):', veiculos[0].cambio);
console.log('Foto do primeiro:', veiculos[0].fotos.frente);

const payload = { veiculos, mensagem: 'Teste: veiculo 1 com foto real' };
const destino = resolve(process.env.TEMP || '.', 'veic.json');
writeFileSync(destino, JSON.stringify(payload), 'utf8');

console.log('Payload gravado em:', destino, '->', (JSON.stringify(payload).length / 1024).toFixed(1), 'KB');
