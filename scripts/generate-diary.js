const fs = require('fs');
const path = require('path');

const DIARY_DIR = path.join(__dirname, '../diary');
const OUTPUT_FILE = path.join(__dirname, 'diary.json');

function getDiaryFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter(file => file.endsWith('.md') && file !== 'index.md');
}

/**
 * Simple Frontmatter Parser
 */
function parseFrontmatter(content) {
    const fmRegex = /^---([\s\S]*?)---/;
    const match = content.match(fmRegex);
    const metadata = {};
    let mainContent = content;

    if (match) {
        const fmText = match[1];
        mainContent = content.replace(match[0], '').trim();
        
        fmText.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
                metadata[key.trim()] = valueParts.join(':').trim();
            }
        });
    }

    return { metadata, mainContent };
}

function generateDiary() {
    console.log('Generating diary.json (metadata only)...');

    const entries = [];
    const files = getDiaryFiles(DIARY_DIR);

    files.forEach(file => {
        const filePath = path.join(DIARY_DIR, file);
        const rawContent = fs.readFileSync(filePath, 'utf8');
        const stat = fs.statSync(filePath);
        
        const { metadata, mainContent } = parseFrontmatter(rawContent);
        
        // Extract fallback title: first non-empty line of content
        const lines = mainContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const fallbackTitle = lines[0] || file;
        
        // Short excerpt: skip title and take next few lines
        const excerpt = lines.slice(1, 4).join(' ') || '';

        entries.push({
            slug: file.replace('.md', ''),
            title: metadata.title || fallbackTitle,
            excerpt: metadata.description || (excerpt.length > 200 ? excerpt.substring(0, 200) + '...' : excerpt),
            date: metadata.date || stat.mtime.toISOString(),
            tags: metadata.tags ? metadata.tags.split(',').map(t => t.trim()) : [],
            // No full content here, will be fetched dynamically
        });
    });

    // Sort by date descending
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(entries, null, 2));
    console.log(`diary.json generated successfully at ${OUTPUT_FILE}`);
}

generateDiary();
