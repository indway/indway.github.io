# Changelog
All notable changes to the **indway** project will be documented in this file.

## [1.3.0] - 2026-04-27
### Added
- **AI Content Generator Workflow**: Developed a CLI-based script leveraging the Gemini API to programmatically generate Markdown diary entries, steered by custom `.skills` and `.souls` system prompts.
- **Public Repository Identity**: Restructured and translated `README.md` to English to clearly convey the lab's pragmatic, anti-perfectionism philosophy.

### Changed
- **Frontmatter Parsing**: Improved custom parser in `generate-diary.js` to automatically strip quotation marks from YAML frontmatter strings.
- **Data Standardization**: Standardized all `diary/*.md` frontmatters for cleaner parsing pipeline.

## [1.2.0] - 2026-04-27
### Added
- **indway GitCMS (v1.0)**: A custom, browser-based editor at `/editor` to manage diary entries and `content.js` via the GitHub API. Features secure token-based access and direct commit workflow.
- **Exclusive Diary Reader**: Implemented Medium-inspired topography for diary entries using Lora (Serif) and Inter (Sans-Serif) for high readability.
- **Reading Time Calculation**: Automatic "min read" estimation for every diary entry.
- **Professional Identity**: Added "Expertise" tags and "Hiring Badge" (Open to Remote) to the main landing page to attract freelance opportunities.
- **Improved Diary Index**: Redesigned `diary/index.html` to perfectly match the main site's design system and theme toggling.

### Changed
- **Optimized Diary Generator**: `diary.json` now only stores metadata (slug, title, date, excerpt, tags) to keep the initial load light. Full content is fetched on-demand.
- **Project Structure**: Modularized all JavaScript into the `scripts/` folder for better maintainability.

## [1.1.0] - 2026-04-26
### Added
- **Automation Pipeline**: Created GitHub Actions to automatically generate `sitemap.xml`, `llms.txt`, and `diary.json` on every push.
- **SEO & AI Context**: Added `sitemap.xml` generator and `llms.txt` for better indexing by search engines and AI assistants.
- **Frontmatter Support**: Diary entries now support YAML frontmatter for custom metadata.

## [1.0.0] - 2026-04-25
### Initial Release
- Core landing page with terminal-style aesthetic.
- Glassmorphism product modals.
- Language detection (ID/EN/MS/AR) and theme switching.
- Initial diary system.
