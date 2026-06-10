#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src');
const dist = path.join(__dirname, '..', 'dist');
fs.mkdirSync(dist, { recursive: true });
for (const name of ['index.html', 'app.js', 'styles.css']) {
  fs.copyFileSync(path.join(src, name), path.join(dist, name));
}
console.log('built viewer static assets to dist/');
