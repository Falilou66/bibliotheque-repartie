#!/usr/bin/env bash
# ============================================================
# Compile l'interface React : app/static/app.jsx  ->  app.js
# (JSX transpilé une fois avec Babel, servi ensuite en JS classique
#  par FastAPI — pas de Babel dans le navigateur).
#
# Usage : ./scripts/build_front.sh
# Prérequis : node + npm. @babel/standalone est installé localement
# dans scripts/.build (ignoré par git) au premier lancement.
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CACHE="$ROOT/scripts/.build"
SRC="$ROOT/app/static/app.jsx"
OUT="$ROOT/app/static/app.js"

if [ ! -d "$CACHE/node_modules/@babel/standalone" ]; then
    echo "Installation de @babel/standalone (première fois)…"
    mkdir -p "$CACHE"
    (cd "$CACHE" && npm init -y >/dev/null 2>&1 && npm install @babel/standalone >/dev/null 2>&1)
fi

node -e "
const Babel = require('$CACHE/node_modules/@babel/standalone');
const fs = require('fs');
const src = fs.readFileSync('$SRC', 'utf8');
// runtime 'classic' -> émet React.createElement (React global UMD), pas d'import/require
const out = Babel.transform(src, {
  presets: [['react', { runtime: 'classic' }]],
  sourceType: 'script',
}).code;
fs.writeFileSync('$OUT', out);
console.log('OK : app.jsx -> app.js (' + out.length + ' octets)');
"
