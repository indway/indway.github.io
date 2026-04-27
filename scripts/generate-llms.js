/**
 * generate-llms.js
 * Generates llms.txt and llms-full.txt from content.js (window.INDWAY_DATA)
 * 
 * Usage:
 *   node scripts/generate-llms.js
 *   node scripts/generate-llms.js --lang en   (default: id)
 *   node scripts/generate-llms.js --full       (also generate llms-full.txt)
 */

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

/* ── CONFIG ───────────────────────────────── */
const DOMAIN      = 'https://indway.github.io';
const LANG        = process.argv.includes('--lang') 
                    ? process.argv[process.argv.indexOf('--lang') + 1] 
                    : 'id';
const FULL        = process.argv.includes('--full');
const CONTENT_JS  = path.join(__dirname, 'content.js');
const DIARY_DIR   = path.join(__dirname, '../diary');
const OUT_SHORT   = path.join(__dirname, '../llms.txt');
const OUT_FULL    = path.join(__dirname, '../llms-full.txt');

/* ── LOAD content.js ──────────────────────── */
function loadData() {
  const raw = fs.readFileSync(CONTENT_JS, 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(raw, sandbox);
  return sandbox.window.INDWAY_DATA;
}

/* ── HELPERS ──────────────────────────────── */
const t = (obj) => (obj && obj[LANG]) || (obj && obj['id']) || '';

function statusEmoji(status) {
  return { active: '🟢', wip: '🟡', archived: '⚪' }[status] || '';
}

function getDiaryFiles() {
  if (!fs.existsSync(DIARY_DIR)) return [];
  return fs.readdirSync(DIARY_DIR)
    .filter(f => f.endsWith('.md') && f !== 'index.md')
    .sort();
}

function extractDiarySummary(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  // Skip frontmatter block (--- ... ---)
  let i = 0;
  if (lines[0]?.trim() === '---') {
    i = 1;
    while (i < lines.length && lines[i]?.trim() !== '---') i++;
    i++; // skip closing ---
  }
  // Find first non-empty, non-heading line
  for (; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('#') && !line.startsWith('---')) {
      return line.replace(/\*\*/g, '').substring(0, 120);
    }
  }
  return '—';
}

/* ── SECTION BUILDERS ─────────────────────── */
function buildProfile(profile) {
  const lines = [];
  lines.push(`# indway\n`);
  lines.push(`> ${t(profile.bio)}\n`);
  lines.push(`- Role: ${profile.title}`);
  lines.push(`- Experience: ${profile.experience}`);
  lines.push(`- Availability: ${profile.availability}`);
  lines.push(`- Stack: ${profile.stack.join(', ')}`);
  lines.push(`- Services: ${profile.services.map(s => s.label).join(', ')}`);
  lines.push(`- Link: ${DOMAIN}`);
  return lines.join('\n') + '\n';
}

function buildRates(rates) {
  const r = rates[LANG] || rates['en'];
  return `\n## Rates\n\n- ${r.symbol}${r.amount}/${r.unit} ${r.note}\n`;
}

function buildSocials(socials) {
  const lines = ['\n## Contact & Socials\n'];
  socials.forEach(s => {
    lines.push(`- ${s.label}: ${s.url}`);
  });
  return lines.join('\n') + '\n';
}

function buildItems(items, sectionTitle, full = false) {
  if (!items || items.length === 0) return '';
  const lines = [`\n## ${sectionTitle}\n`];
  items.forEach(item => {
    const desc   = t(item.desc);
    const detail = t(item.detail);
    const url    = item.url ? ` — ${item.url}` : '';
    const status = statusEmoji(item.status);
    const tags   = item.tags?.length ? ` [${item.tags.join(', ')}]` : '';

    if (full) {
      lines.push(`### ${status} ${item.name} · ${item.category || ''}`);
      lines.push(`**${desc}**`);
      if (detail) lines.push(detail);
      if (item.url) lines.push(`URL: ${item.url}`);
      if (tags) lines.push(`Tags:${tags}`);

      // Sub-items
      if (item.subs?.length) {
        item.subs.forEach(sub => {
          lines.push(`  - [${sub.name}](${sub.url}) — ${t(sub.desc)}`);
        });
      }
      lines.push('');
    } else {
      const line = item.url
        ? `- [${item.name}](${item.url}): ${desc}${tags}`
        : `- ${status} **${item.name}**: ${desc}${tags}`;
      lines.push(line);

      // Sub-items (short)
      if (item.subs?.length) {
        item.subs.forEach(sub => {
          lines.push(`  - [${sub.name}](${sub.url}): ${t(sub.desc)}`);
        });
      }
    }
  });
  return lines.join('\n') + '\n';
}

function buildDiary(full = false) {
  const files = getDiaryFiles();
  if (!files.length) return '';
  const lines = [`\n## Diary / Personal Log\n`];
  files.forEach(file => {
    const title   = file.replace('.md', '');
    const summary = extractDiarySummary(path.join(DIARY_DIR, file));
    const url     = `${DOMAIN}/diary/${title}`;
    if (full) {
      lines.push(`### [${title}](${url})`);
      lines.push(summary);
      lines.push('');
    } else {
      lines.push(`- [${title}](${url}): ${summary}`);
    }
  });
  return lines.join('\n') + '\n';
}

/* ── MAIN ─────────────────────────────────── */
function generate() {
  console.log(`⚙️  Loading content.js...`);
  const data = loadData();

  // ── llms.txt (short) ──
  let short = '';
  short += buildProfile(data.profile);
  short += buildRates(data.rates);
  short += buildSocials(data.socials);
  short += buildItems(data.products,  'Products (Lab)', false);
  short += buildItems(data.websites,  'Managed Websites', false);
  short += buildItems(data.side,      'Side Projects', false);
  short += buildItems(data.themes,    'Web Themes', false);
  short += buildItems(data.cyber,     'Cybersecurity Tools', false);
  short += buildDiary(false);

  fs.writeFileSync(OUT_SHORT, short);
  console.log(`✅ llms.txt → ${OUT_SHORT}`);

  // ── llms-full.txt (detailed) ──
  if (FULL) {
    let full = '';
    full += buildProfile(data.profile);
    full += buildRates(data.rates);
    full += buildSocials(data.socials);
    full += buildItems(data.products,  'Products (Lab)', true);
    full += buildItems(data.websites,  'Managed Websites', true);
    full += buildItems(data.side,      'Side Projects', true);
    full += buildItems(data.themes,    'Web Themes', true);
    full += buildItems(data.cyber,     'Cybersecurity Tools', true);
    full += buildDiary(true);

    fs.writeFileSync(OUT_FULL, full);
    console.log(`✅ llms-full.txt → ${OUT_FULL}`);
  }

  console.log(`\n📄 Preview llms.txt:\n${'─'.repeat(50)}`);
  console.log(short.substring(0, 800) + (short.length > 800 ? '\n...' : ''));
}

generate();
