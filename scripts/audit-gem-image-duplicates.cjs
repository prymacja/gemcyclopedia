'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const pageDirs = ['Gems', path.join('pl', 'Gems')];

function analyze(label, pagePaths, readFile) {
  const records = [];
  const missing = [];
  for (const page of pagePaths) {
    const html = readFile(page).toString('utf8');
    const article = path.posix.basename(page.replace(/\\/g, '/'), '.html').toLocaleLowerCase('en-US');
    for (const tag of html.match(/<img\b[^>]*>/gi) || []) {
      const match = tag.match(/\bsrc\s*=\s*(["'])(.*?)\1/i);
      if (!match) continue;
      let src = match[2].replace(/&amp;/g, '&');
      if (/^(?:https?:|data:)/i.test(src)) continue;
      src = decodeURIComponent(src.split(/[?#]/, 1)[0]).replace(/[\\/]+/g, '/');
      const asset = path.posix.normalize(path.posix.join(path.posix.dirname(page.replace(/\\/g, '/')), src));
      try {
        const bytes = readFile(asset);
        records.push({ article, page, asset, hash: crypto.createHash('sha256').update(bytes).digest('hex') });
      } catch {
        missing.push({ page, src });
      }
    }
  }
  function groupsBy(keyFn) {
    const groups = new Map();
    for (const record of records) {
      const key = keyFn(record);
      if (!groups.has(key)) groups.set(key, new Map());
      groups.get(key).set(record.article, record);
    }
    return [...groups.entries()].filter(([, articles]) => articles.size > 1);
  }
  const sharedPaths = groupsBy((r) => r.asset.toLocaleLowerCase('en-US'));
  const sameFiles = groupsBy((r) => r.hash);
  const pair = ['alectorius', 'draconites'].map((name) => records.find((r) => r.article === name));
  const pairDuplicate = pair.every(Boolean) && (pair[0].asset.toLowerCase() === pair[1].asset.toLowerCase() || pair[0].hash === pair[1].hash);
  console.log(`${label}: ${records.length} image placements; ${new Set(records.map((r) => r.article)).size} articles; ${sharedPaths.length} shared paths; ${sameFiles.length} byte-identical groups; ${missing.length} broken references.`);
  console.log(`${label} Alectorius/Draconites duplicate: ${pairDuplicate ? 'YES' : 'no'}`);
  for (const [asset, articles] of sharedPaths) console.log(`  SHARED ${asset}: ${[...articles.keys()].join(', ')}`);
  for (const [hash, articles] of sameFiles) {
    const assets = [...new Set([...articles.values()].map((r) => r.asset))];
    if (assets.length > 1) console.log(`  SAME CONTENT ${assets.join(' = ')}: ${[...articles.keys()].join(', ')}`);
  }
  for (const item of missing) console.log(`  MISSING ${item.page}: ${item.src}`);
  return sharedPaths.length > 0 || sameFiles.length > 0 || missing.length > 0;
}

const workingPages = pageDirs.flatMap((relDir) => {
  const dir = path.join(root, relDir);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((n) => n.toLowerCase().endsWith('.html')).map((n) => path.join(relDir, n).replace(/\\/g, '/'));
});
const workingIssues = analyze('Working tree', workingPages, (rel) => fs.readFileSync(path.join(root, rel)));
const headPages = execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD', '--', 'Gems', 'pl/Gems'], { encoding: 'utf8' }).split(/\r?\n/).filter((n) => /^(?:Gems|pl\/Gems)\/[^/]+\.html$/i.test(n));
const headCache = new Map();
function readHead(rel) {
  if (!headCache.has(rel)) headCache.set(rel, execFileSync('git', ['show', `HEAD:${rel}`], { encoding: null, maxBuffer: 64 * 1024 * 1024 }));
  return headCache.get(rel);
}
const headIssues = analyze('Committed HEAD', headPages, readHead);
if (workingIssues || headIssues) process.exitCode = 1;
