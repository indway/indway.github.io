const fs = require('fs');
const path = require('path');

const DIARY_JSON = path.join(__dirname, 'diary.json');
const RSS_OUTPUT = path.join(__dirname, '../feed.xml');
const DOMAIN = 'https://indway.github.io';

function generateRSS() {
    console.log('Generating RSS feed...');
    
    if (!fs.existsSync(DIARY_JSON)) {
        console.error('diary.json not found. Run generate-diary.js first.');
        return;
    }

    const diaryData = JSON.parse(fs.readFileSync(DIARY_JSON, 'utf8'));
    // Sort by date descending
    const sortedEntries = diaryData.sort((a, b) => new Date(b.date) - new Date(a.date));

    const lastBuildDate = new Date().toUTCString();

    let rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
    <title>indway — Diary</title>
    <link>${DOMAIN}/diary/</link>
    <description>Catatan Perjalanan Hidup dan Eksperimen Lab indway</description>
    <language>id-id</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${DOMAIN}/feed.xml" rel="self" type="application/rss+xml" />
`;

    sortedEntries.forEach(entry => {
        const url = `${DOMAIN}/diary/${entry.slug}`;
        const pubDate = new Date(entry.date).toUTCString();
        
        rss += `
    <item>
        <title><![CDATA[${entry.title}]]></title>
        <link>${url}</link>
        <guid isPermaLink="true">${url}</guid>
        <pubDate>${pubDate}</pubDate>
        <description><![CDATA[${entry.excerpt}]]></description>
    </item>`;
    });

    rss += `
</channel>
</rss>`;

    fs.writeFileSync(RSS_OUTPUT, rss);
    console.log(`RSS feed generated successfully at ${RSS_OUTPUT}`);
}

generateRSS();
