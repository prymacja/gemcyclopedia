'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const pageDirs = ['Gems', path.join('pl', 'Gems')];
const records = [];
const missing = [];

for (const relDir of pageDirs) {
  const dir = path.join(root, relDir);
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir).filter((n) => n.toLowerCase().endsWith('.html'))) {
    const pagePath = path.join(dir, name);
    const html = fs.readFileSync(pagePath, 'utf8');
    const article = path.basename(name, '.html').toLocaleLowerCase('en-US');
    const tags = html.match(/<img\b[^>]*>/gi) || [];
    for (const tag of tags) {
      const match = tag.match(/\bsrc\s*=\s*(["'])(.*?)\1/i);
      if (!match) continue;
      let src = match[2].replace(/&amp;/g, '&');
      if (/^(?:https?:|data:)/i.test(src)) continue;
      src = decodeURIComponent(src.split(/[?#]/, 1)[0]).replace(/[\\/]+/g, path.sep);
      const fullPath = path.resolve(path.dirname(pagePath), src);
      if (!fs.existsSync(fullPath)) {
        missing.push({ page: path.relative(root, pagePath), src });
        continue;
      }
      const bytes = fs.readFileSync(fullPath);
      records.push({
        article,
        page: path.relative(root, pagePath),
        src: path.relative(root, fullPath).replace(/\\/g, '/'),
        hash: crypto.createHash('sha256').update(bytes).digest('hex'),
      });
    }
  }
}

function groupsBy(keyFn) {
  const byKey = new Map();
  for (const record of records) {
    const key = keyFn(record);
    if (!byKey.has(key)) byKey.set(key, new Map());
    byKey.get(key).set(record.article, record);
  }
  return [...byKey.entries()].filter(([, articles]) => articles.size > 1);
}

const sharedPaths = groupsBy((r) => r.src.toLocaleLowerCase('en-US'));
const sameFiles = groupsBy((r) => r.hash);
console.log(`Scanned ${records.length} image placements across ${new Set(records.map((r) => r.article)).size} gem articles.`);
console.log(`Cross-article shared paths: ${sharedPaths.length}; byte-identical groups: ${sameFiles.length}; broken references: ${missing.length}.`);
for (const [src, articles] of sharedPaths) console.log(`SHARED PATH ${src}: ${[...articles.keys()].join(', ')}`);
for (const [hash, articles] of sameFiles) {
  const files = [...new Set([...articles.values()].map((r) => r.src))];
  if (files.length > 1) console.log(`SAME CONTENT ${files.join(' = ')}: ${[...articles.keys()].join(', ')}`);
}
for (const item of missing) console.log(`MISSING ${item.page}: ${item.src}`);
if (sharedPaths.length || sameFiles.length || missing.length) process.exitCode = 1;