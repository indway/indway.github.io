require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ─── Config ──────────────────────────────────────────────────────────────────

const CONFIG = {
  model: "gemini-3-flash-preview",
  maxRetries: 3,
  retryDelayMs: 2000,
  minContentLength: 200,
  maxOutputTokens: 2048,
  temperature: 0.85,
};

// ─── Mode Detection ───────────────────────────────────────────────────────────
//
//  Mode 1 — GENERATE (default)
//    node scripts/generate-ai-content.js "topik saya"
//
//  Mode 2 — REWRITE (dari file yang sudah ada)
//    node scripts/generate-ai-content.js --rewrite path/to/file.md
//    node scripts/generate-ai-content.js --rewrite path/to/file.md "fokus pada gaya lebih personal"
//
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(args) {
  if (args[0] === "--rewrite" || args[0] === "-r") {
    const filePath = args[1];
    const hint = args.slice(2).join(" ").trim();
    if (!filePath) {
      console.error("❌ --rewrite membutuhkan path file. Contoh:");
      console.error(
        "   node scripts/generate-ai-content.js --rewrite diary/2742026A.md",
      );
      process.exit(1);
    }
    return { mode: "rewrite", filePath, hint };
  }

  const topic = args.join(" ").trim();
  if (!topic) {
    console.error("❌ Usage:");
    console.error("   [generate] node scripts/generate-ai-content.js <topik>");
    console.error(
      "   [rewrite]  node scripts/generate-ai-content.js --rewrite <file.md> [hint]",
    );
    console.error("");
    console.error("Contoh generate:");
    console.error(
      '   node scripts/generate-ai-content.js "overthinking bagi developer"',
    );
    console.error("");
    console.error("Contoh rewrite:");
    console.error(
      '   node scripts/generate-ai-content.js --rewrite diary/2742026A.md "buat lebih personal"',
    );
    process.exit(1);
  }

  return { mode: "generate", topic };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function log(icon, message, data = null) {
  const timestamp = new Date().toLocaleTimeString("id-ID");
  console.log(`[${timestamp}] ${icon} ${message}`);
  if (data) console.log("   ", JSON.stringify(data, null, 2));
}

function generateFilename() {
  const today = new Date();
  const d = today.getDate();
  const m = today.getMonth() + 1;
  const y = today.getFullYear();
  const ms = Date.now().toString(36).toUpperCase().slice(-3);
  return `${d}${m}${y}${ms}.md`;
}

// ─── Prompt Builders ──────────────────────────────────────────────────────────

function buildSystemInstruction(souls, skills, dateStr) {
  return `Kamu adalah mesin konten diary/blog berbahasa Indonesia yang menghasilkan tulisan berkualitas tinggi.

## Identitasmu (.souls):
${souls || "(tidak ada souls file)"}

## Kemampuan & Aturan (.skills):
${skills || "(tidak ada skills file)"}

## Tanggal Hari Ini:
${dateStr}

## Output Requirements (WAJIB DIPATUHI):
1. Format HARUS dimulai dengan YAML frontmatter yang valid:
   ---
   title: "Judul yang menarik dan spesifik"
   date: "${dateStr}"
   tags: ["tag1", "tag2"]
   mood: "reflective|thoughtful|inspired|calm|melancholic"
   ---
2. Setelah frontmatter, tulis konten Markdown yang mengalir natural.
3. Panjang konten: 300-700 kata.
4. Gunakan gaya personal, jujur, dan reflektif - bukan artikel informatif generik.
5. Boleh pakai subheading (##), quote (>), list, atau emphasis, tapi jangan berlebihan.
6. Akhiri dengan satu kalimat penutup yang berkesan atau pertanyaan untuk diri sendiri.
7. JANGAN bungkus output dengan blok kode markdown.`;
}

function buildGeneratePrompt(topic) {
  return `Topik / Perintah:
${topic}

Tulis konten diary yang autentik, personal, dan bernilai untuk pembaca yang sedang dalam fase refleksi diri. Hindari klise dan pembuka generik seperti "Di era modern ini..." atau "Pernahkah kamu...".`;
}

function buildRewritePrompt(originalContent, hint) {
  return `Kamu menerima sebuah tulisan diary yang sudah ada. Tugasmu adalah menulis ulang (rewrite) tulisan ini menjadi versi yang lebih baik.

## Tulisan Asli:
${originalContent}

## Instruksi Rewrite:
${
  hint
    ? `- Fokus khusus: ${hint}`
    : `- Tidak ada instruksi khusus, tingkatkan kualitas secara keseluruhan`
}
- Pertahankan ide dan pesan inti dari tulisan asli
- Perbaiki alur, diksi, dan kekuatan emosional tulisan
- Buat lebih personal, jujur, dan mengalir
- Update frontmatter jika perlu (title boleh diubah jadi lebih menarik, date JANGAN diubah)
- JANGAN tambahkan informasi baru yang tidak ada di tulisan asli
- Output hanya tulisan yang sudah direwrite, tanpa komentar atau penjelasan tambahan`;
}

// ─── Validator ────────────────────────────────────────────────────────────────

function validateContent(content) {
  const errors = [];

  if (content.length < CONFIG.minContentLength) {
    errors.push(
      `Konten terlalu pendek: ${content.length} karakter (min: ${CONFIG.minContentLength})`,
    );
  }

  if (!content.startsWith("---")) {
    errors.push("Frontmatter YAML tidak ditemukan (harus dimulai dengan ---)");
  }

  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const fm = frontmatterMatch[1];
    if (!fm.includes("title:"))
      errors.push("Frontmatter tidak memiliki field 'title'");
    if (!fm.includes("date:"))
      errors.push("Frontmatter tidak memiliki field 'date'");
  } else {
    errors.push("Frontmatter tidak lengkap (tidak ada penutup ---)");
  }

  return errors;
}

// ─── Content Cleaner ─────────────────────────────────────────────────────────

function cleanContent(raw) {
  let content = raw.trim();
  [/^```markdown\s*/, /^```md\s*/, /^```\s*/, /\s*```$/].forEach((re) => {
    content = content.replace(re, "");
  });
  return content.trim();
}

// ─── API Call with Retry ──────────────────────────────────────────────────────

async function generateWithRetry(genAI, systemInstruction, userPrompt) {
  let lastError;

  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      log(
        "🔄",
        `Attempt ${attempt}/${CONFIG.maxRetries} - model: ${CONFIG.model}`,
      );

      const model = genAI.getGenerativeModel({
        model: CONFIG.model,
        generationConfig: {
          temperature: CONFIG.temperature,
          maxOutputTokens: CONFIG.maxOutputTokens,
        },
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
      });

      const result = await model.generateContent(userPrompt);
      const response = result.response;

      if (response.usageMetadata) {
        log("📊", "Token usage:", {
          input: response.usageMetadata.promptTokenCount,
          output: response.usageMetadata.candidatesTokenCount,
        });
      }

      const content = cleanContent(response.text());
      const errors = validateContent(content);

      if (errors.length > 0) {
        log("⚠️", `Output tidak valid (attempt ${attempt}):`, errors);
        if (attempt < CONFIG.maxRetries) {
          await sleep(CONFIG.retryDelayMs * attempt);
          lastError = new Error(errors.join("; "));
          continue;
        }
      }

      return content;
    } catch (error) {
      lastError = error;
      log("❌", `Attempt ${attempt} gagal: ${error.message}`);
      if (attempt < CONFIG.maxRetries) {
        await sleep(CONFIG.retryDelayMs * attempt);
      }
    }
  }

  throw lastError || new Error("Gagal generate konten setelah semua retry");
}

// ─── Save & Post-process ──────────────────────────────────────────────────────

function saveContent(content, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, content + "\n");
  log("✅", `Konten disimpan di: ${outputPath}`);
  log("📝", `Preview:\n${content.substring(0, 200)}...`);
}

function runGenerate() {
  log("⏳", "Mengupdate metadata site (diary.json, sitemap, llms.txt)...");
  try {
    execSync("npm run generate", { stdio: "inherit", timeout: 60000 });
    log("✅", "Metadata berhasil diupdate.");
  } catch (err) {
    log("⚠️", `npm run generate gagal: ${err.message}`);
    log(
      "ℹ️",
      "Konten sudah tersimpan, update metadata manual dengan: npm run generate",
    );
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ Error: GEMINI_API_KEY belum di-set di file .env");
    process.exit(1);
  }

  const soulsPath = path.join(__dirname, "prompts/.souls");
  const skillsPath = path.join(__dirname, "prompts/.skills");
  const souls = fs.existsSync(soulsPath)
    ? fs.readFileSync(soulsPath, "utf8")
    : "";
  const skills = fs.existsSync(skillsPath)
    ? fs.readFileSync(skillsPath, "utf8")
    : "";

  if (!souls) log("⚠️", "File .souls tidak ditemukan");
  if (!skills) log("⚠️", "File .skills tidak ditemukan");

  const dateStr = new Date().toISOString().split("T")[0];
  const systemInstruction = buildSystemInstruction(souls, skills, dateStr);
  const genAI = new GoogleGenerativeAI(apiKey);

  // ── Mode: GENERATE ──────────────────────────────────────────────────────────
  if (parsed.mode === "generate") {
    log("✍️", `Mode: GENERATE - topik: "${parsed.topic}"`);

    const userPrompt = buildGeneratePrompt(parsed.topic);
    const content = await generateWithRetry(
      genAI,
      systemInstruction,
      userPrompt,
    );

    const diaryDir = path.join(__dirname, "../diary");
    const outputPath = path.join(diaryDir, generateFilename());
    saveContent(content, outputPath);
    runGenerate();
    log("🎉", "Selesai! Diary baru sudah siap.");
  }

  // ── Mode: REWRITE ───────────────────────────────────────────────────────────
  else if (parsed.mode === "rewrite") {
    const targetPath = path.resolve(parsed.filePath);

    if (!fs.existsSync(targetPath)) {
      log("❌", `File tidak ditemukan: ${targetPath}`);
      process.exit(1);
    }

    const originalContent = fs.readFileSync(targetPath, "utf8");
    log("♻️", `Mode: REWRITE - file: ${parsed.filePath}`);
    if (parsed.hint) log("💡", `Hint: ${parsed.hint}`);

    const userPrompt = buildRewritePrompt(originalContent, parsed.hint);
    const content = await generateWithRetry(
      genAI,
      systemInstruction,
      userPrompt,
    );

    // Backup dulu sebelum overwrite
    const backupPath = targetPath.replace(/\.md$/, `.backup-${Date.now()}.md`);
    fs.copyFileSync(targetPath, backupPath);
    log("💾", `Backup asli tersimpan di: ${backupPath}`);

    saveContent(content, targetPath);
    runGenerate();
    log("🎉", "Selesai! Tulisan sudah direwrite.");
  }
}

main().catch((err) => {
  console.error("❌ Fatal error:", err.message);
  process.exit(1);
});
