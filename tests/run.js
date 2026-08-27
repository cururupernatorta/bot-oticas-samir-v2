#!/usr/bin/env node
/** Roda toda a suíte. Sem framework: o repo não tem um, e não vale adicionar por isto. */
const { execFileSync } = require('child_process');
const fs = require('fs');

const arquivos = fs.readdirSync(__dirname).filter(f => f.endsWith('.test.js')).sort();
let falhou = false;

for (const f of arquivos) {
  console.log('\n\x1b[1m' + f + '\x1b[0m');
  try {
    execFileSync(process.execPath, [__dirname + '/' + f], { stdio: 'inherit' });
  } catch {
    falhou = true;
  }
}

console.log('\n' + '═'.repeat(50));
console.log(falhou ? '\x1b[31m✗ suíte com falhas\x1b[0m' : '\x1b[32m✓ suíte completa passou\x1b[0m');
process.exit(falhou ? 1 : 0);
