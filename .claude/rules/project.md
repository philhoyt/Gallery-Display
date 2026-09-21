---
paths:
  - "**/*.php"
  - "**/*.js"
  - "**/*.jsx"
  - "**/*.scss"
  - "**/*.css"
  - "**/block.json"
  - "**/composer.json"
  - "**/package.json"
---
# Project: Gallery Display

- Slug: `gallery-display`
- Text domain: `gallery-display`
- PHP minimum: 7.4
- WP minimum: 6.6
- Distribution: GitHub releases from philhoyt/Gallery-Display (note the capitalisation). Plugin Update Checker is vendored in lib/ and committed; tags are v-prefixed, and .github/workflows/release.yml builds and attaches the zip
- Main file: `gallery-display.php`
- Version constant: `GALLERY_DISPLAY_VERSION`
- Version: 1.2.0 across plugin header, GALLERY_DISPLAY_VERSION, block.json, package.json and readme.txt Stable tag — bump all five together
- Build tooling: @wordpress/scripts 34, ESLint flat config in eslint.config.js
- Tests: `npm run test:unit` (Jest). No PHPUnit suite yet — needs a WP test install
- Preview security: everything reaching src/preview-doc.js goes through src/sanitize.js; see src/preview-doc.test.js
- Zips: wp-scripts plugin-zip ignores .distignore and uses package.json `files`. lib/ must stay listed there or the shipped plugin fatals
- Third-party lib/ is excluded from phpcs (phpcs.xml), ESLint (eslint.config.js) and Stylelint (.stylelintignore)
