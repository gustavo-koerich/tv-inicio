// Empacota app/, instala na TV e abre. Uso: npm run deploy
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const { id, version } = JSON.parse(readFileSync('app/appinfo.json', 'utf8'));
const tv = process.env.TV_DEVICE || 'minha-tv'; // nome do dispositivo cadastrado no ares-setup-device
const run = c => execSync(c, { stdio: 'inherit' });
run('npx ares-package app -o dist');
run(`npx ares-install -d ${tv} dist/${id}_${version}_all.ipk`);
run(`npx ares-launch -d ${tv} ${id}`);
