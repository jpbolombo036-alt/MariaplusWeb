# Technology Stack

## Language and runtime

- TypeScript and Vue Single-File Components (`.vue`); browser-side SPA.
- `tsconfig.json` targets ES2020, uses `moduleResolution: bundler`, enables `strict`, and sets `noEmit`.
- `package.json` does not declare a Node `engines` range. Vite is the development and production bundler.

## Frameworks and direct dependencies

Versions below are declared ranges in `package.json`; installed versions were observed with `npm ls --depth=0`.

| Package | Declared | Installed | Role |
|---|---:|---:|---|
| `vue` | ^3.5.12 | 3.5.41 | UI framework |
| `vue-router` | ^4.4.5 | 4.6.4 | Client-side routing |
| `pinia` | ^2.2.4 | 2.3.1 | Client state |
| `axios` | ^1.7.7 | 1.20.0 | HTTP client |
| `@zxing/browser` | ^0.2.1 | 0.2.1 | Browser QR/barcode scanning |
| `html2canvas` | ^1.4.1 | 1.4.1 | Browser-side invitation-card rendering |
| `qrcode` | ^1.5.4 | 1.5.4 | QR code generation |
| `vue-advanced-cropper` | ^2.8.9 | 2.8.9 | Image cropping |
| `vite` | ^5.4.8 | 5.4.21 | Dev server and bundler |
| `@vitejs/plugin-vue` | ^5.1.4 | 5.2.4 | Vue SFC support in Vite |
| `typescript` | ^5.6.2 | 5.9.3 | TypeScript compiler |
| `vue-tsc` | ^2.1.6 | 2.2.12 | Vue-aware type checking |
| `tailwindcss` | ^3.4.13 | 3.4.19 | Utility CSS |
| `postcss` | ^8.4.47 | 8.5.26 | CSS transforms |
| `autoprefixer` | ^10.4.20 | 10.5.4 | CSS vendor prefixes |
| `@playwright/test` | ^1.64.1 | 1.64.1 | Browser E2E testing |
| `@types/qrcode` | ^1.5.6 | 1.5.6 | QR package TypeScript types |

The application also loads Inter, Playfair Display, Great Vibes, and Material Symbols from Google Fonts in `index.html`.

## Build, test, and configuration

- `npm run dev`, `npm run build`, and `npm run preview` use Vite.
- `npm run typecheck` runs `vue-tsc --noEmit`.
- `npm run test:unit` uses Node's built-in test runner; `npm run test:e2e` uses Playwright.
- `vite.config.ts` enables `@vitejs/plugin-vue`, aliases `@` to `src`, and sets port 3000.
- `tailwind.config.cjs`, `postcss.config.cjs`, `playwright.config.ts`, and `vercel.json` hold CSS, test, and SPA-hosting configuration.
- `src/api/config.ts` reads `VITE_API_BASE_URL` and `VITE_WHATSAPP_CONTACT`. In the absence of an override, it points at a production Railway API host.
- No deprecated or end-of-life API use was established by this stack inventory.
