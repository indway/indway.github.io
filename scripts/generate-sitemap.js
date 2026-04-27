const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://indway.github.io';
const DIARY_DIR = path.join(__dirname, '../diary');
const OUTPUT_FILE = path.join(__dirname, '../sitemap.xml');

function getFiles(dir) {
    return fs.readdirSync(dir).filter(file => file.endsWith('.md'));
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function generateSitemap() {
    console.log('Generating sitemap...');

    const urls = [];

    // Add HTML files from root
    const rootFiles = fs.readdirSync(path.join(__dirname, '..'));
    rootFiles.forEach(file => {
        if (file.endsWith('.html')) {
            const filePath = path.join(__dirname, '..', file);
            const stat = fs.statSync(filePath);
            const name = file.replace('.html', '');
            
            let urlPath = name === 'index' ? '/' : `/${name}`;
            let priority = name === 'index' ? '1.0' : '0.7';

            urls.push({
                loc: `${DOMAIN}${urlPath}`,
                lastmod: formatDate(stat.mtime),
                priority: priority
            });
        }
    });

    // Add diary index explicitly
    const diaryIndexHtml = path.join(DIARY_DIR, 'index.html');
    if (fs.existsSync(diaryIndexHtml)) {
        const stat = fs.statSync(diaryIndexHtml);
        urls.push({
            loc: `${DOMAIN}/diary/`,
            lastmod: formatDate(stat.mtime),
            priority: '0.8'
        });
    }

    // Add diary entries from markdown files
    if (fs.existsSync(DIARY_DIR)) {
        const diaryFiles = fs.readdirSync(DIARY_DIR).filter(f => f.endsWith('.md') && f !== 'index.md');
        
        diaryFiles.forEach(file => {
            const filePath = path.join(DIARY_DIR, file);
            const stat = fs.statSync(filePath);
            const name = file.replace('.md', '');
            const urlPath = `/diary/${name}`;

            if (!urls.some(u => u.loc === `${DOMAIN}${urlPath}`)) {
                urls.push({
                    loc: `${DOMAIN}${urlPath}`,
                    lastmod: formatDate(stat.mtime),
                    priority: '0.6'
                });
            }
        });
    }


    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    fs.writeFileSync(OUTPUT_FILE, sitemapContent);
    console.log(`Sitemap generated successfully at ${OUTPUT_FILE}`);
}

generateSitemap();
