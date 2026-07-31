# Translation Review Process

This website supports Japanese, English, Russian, Traditional Chinese for Taiwan, Korean, Hindi, French, and German.

## Editorial review passes

The current copy was checked in three separate editorial passes before publication.

### Pass 1: meaning and factual alignment

- Compared every translation with the Japanese source and the intended English meaning.
- Preserved product names, technology names, dates, numbers, and project status.
- Checked that challenges, solutions, and feature lists describe the same product behavior in every language.

### Pass 2: natural wording and regional terminology

- Reworked literal sentence structures into natural phrasing for each language.
- Used Traditional Chinese vocabulary and punctuation appropriate for a Taiwan-facing website.
- Used Hindi as the implementation of the requested “Hindu language” version, because Hindi is the standard language name.
- Kept established programming terms in forms commonly used by technical readers in each language.
- Reviewed menu labels and calls to action for clarity and appropriate length.

### Pass 3: UI consistency and publishing hygiene

- Standardized terminology across navigation, project pages, articles, and contact messages.
- Checked punctuation, capitalization, spacing, and heading hierarchy.
- Checked that every locale links to the equivalent page instead of returning to the home page.
- Checked localized metadata, canonical links, `hreflang`, Open Graph locales, and runtime error messages.

## Automated validation

Run:

```bash
npm run validate
```

The validation script checks:

1. Every localized field contains all eight languages and no empty value.
2. Language paths, HTML language tags, and UI dictionaries are complete and non-conflicting.
3. No unfinished translation markers remain and article heading structures match across languages.

`npm run check` runs the translation validator before JavaScript syntax checks, and every production build runs validation again.

## Important limitation

These translations received three editorial and automated review passes, but they were not independently approved by a separate native-speaking human editor for every language. For legal, medical, contractual, fundraising, or other high-stakes public copy, commission a native professional review before publication.
