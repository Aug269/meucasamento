import assert from 'node:assert/strict';
import {readdir, readFile, stat} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const base = '/meucasamento/';

async function exists(relativePath) {
  try {
    await stat(join(dist, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(directory) {
  const entries = await readdir(directory, {withFileTypes: true});
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(path));
    else files.push(path);
  }
  return files;
}

const requiredFiles = [
  'targets/teste-casal.jpg',
  'media/video-teste.mp4',
  'media/musica-teste.mp3',
  'vendor/aframe.min.js',
  'vendor/mindar-image-aframe.prod.js',
];

for (const file of requiredFiles) {
  assert.equal(await exists(file), true, `Arquivo ausente na publicação: ${file}`);
}

const html = await readFile(join(dist, 'index.html'), 'utf8');
assert.ok(html.includes(`${base}vendor/aframe.min.js`), 'A-Frame deve usar o caminho base do GitHub Pages');
assert.ok(html.includes(`${base}vendor/mindar-image-aframe.prod.js`), 'MindAR deve usar o caminho base do GitHub Pages');

const outputFiles = await collectFiles(dist);
const bundles = await Promise.all(
  outputFiles.filter((file) => file.endsWith('.js')).map((file) => readFile(file, 'utf8'))
);
const output = bundles.join('\\n');

for (const asset of [
  `${base}targets/teste-casal.jpg`,
  `${base}targets/casal.mind`,
  `${base}targets/teste-casal.mind`,
  `${base}media/video-teste.mp4`,
  `${base}media/musica-teste.mp3`,
]) {
  assert.ok(output.includes(asset), `O bundle não contém o caminho público esperado: ${asset}`);
}

console.log('Verificação de assets: todos os arquivos e caminhos usam /meucasamento/.');
