const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://indway.github.io';
const DIARY_DIR = path.join(__dirname, '../diary');
const CONTENT_JS = path.join(__dirname, 'content.js');
const OUTPUT_FILE = path.join(__dirname, '../llms.txt');

function getDiaryFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter(file => file.endsWith('.md') && file !== 'index.md');
}

function extractProducts(content) {
    const products = [];
    try {
        // Regex to find each product object block
        const productBlockRegex = /\{[\s\S]+?name:\s*"([^"]+)"[\s\S]+?desc:\s*\{[\s\S]+?id:\s*"([^"]+)"/g;
        let match;
        while ((match = productBlockRegex.exec(content)) !== null) {
            products.push({ name: match[1], desc: match[2] });
        }
    } catch (e) {
        console.error('Error extracting products:', e);
    }
    return products;
}

function generateLLMs() {
    console.log('Generating llms.txt...');

    let output = `# indway\n\n`;
    output += `indway adalah personal lab untuk membangun AI tools dan produk digital dari kebutuhan nyata. Sederhana, jujur, dan bisa langsung dipakai.\n\n`;
    output += `Link: ${DOMAIN}\n\n`;

    // Add Products Section
    if (fs.existsSync(CONTENT_JS)) {
        const content = fs.readFileSync(CONTENT_JS, 'utf8');
        const products = extractProducts(content);
        if (products.length > 0) {
            output += `## Products\n\n`;
            products.forEach(p => {
                output += `- ${p.name}: ${p.desc}\n`;
            });
            output += `\n`;
        }
    }

    // Add Diary Section
    const diaryFiles = getDiaryFiles(DIARY_DIR);
    if (diaryFiles.length > 0) {
        output += `## Diary entries\n\n`;
        diaryFiles.forEach(file => {
            const filePath = path.join(DIARY_DIR, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const title = file.replace('.md', '');
            
            // Extract first non-empty line as summary or just use first 100 chars
            const firstLine = content.split('\n').find(l => l.trim().length > 0) || '';
            const summary = firstLine.replace(/^#+\s*/, '').trim();

            output += `- [${title}](${DOMAIN}/diary/${title}): ${summary}\n`;
        });
    }

    fs.writeFileSync(OUTPUT_FILE, output);
    console.log(`llms.txt generated successfully at ${OUTPUT_FILE}`);
}

generateLLMs();
