# Kraland Click2Win (v2.0)

Et si le jeu [Kraland.org](https://www.kraland.org) était en version incremental game.
Une joie pour les Sims, un enfer pour les Master ès RP.

Réalisé avec de véritables morceaux de clavier.

---

## Running the game

Requires **Node 24** (Active LTS) — pinned in [`.nvmrc`](.nvmrc) and in the `engines` field
of `package.json`. With [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm use          # picks up .nvmrc
npm install
npm run dev      # http://localhost:5173
```

### Scripts

| Script                 | What it does                                           |
| ---------------------- | ------------------------------------------------------ |
| `npm run dev`          | Vite dev server with hot reload                        |
| `npm run build`        | Production build into `dist/`                          |
| `npm run preview`      | Serve the production build locally                     |
| `npm run lint`         | ESLint over the whole repo                             |
| `npm run lint:fix`     | ESLint with autofix                                    |
| `npm run format`       | Rewrite files with Prettier                            |
| `npm run format:check` | Fail if anything is unformatted (this is what CI runs) |
| `npm test`             | Run the unit tests once                                |
| `npm run test:watch`   | Run the unit tests in watch mode                       |

### Testing

[Vitest](https://vitest.dev) covers the game logic: state, cost and production
calculations, purchase rules, health-regeneration clamping, the rounding helpers and the
game tick.

The tests run in **plain Node with no DOM and no jsdom**, which is the practical proof that
the logic layer is free of rendering concerns. ESLint enforces the same boundary by banning
`document` and `window` inside `src/core/`, `src/systems/`, `src/data/` and `src/config/`.

```bash
npm test
```

### Building

```bash
npm run build     # → dist/
npm run preview
```

The build is a static site: drop `dist/` on any web server. `base` is relative, so it works
from a sub-path (GitHub Pages included).

---

## Project layout

```
index.html        Entry page
css/kraland.css   Stylesheet, copied verbatim from the real Kraland
src/
├── main.js       Composition root
├── config/       External (kraland.org) asset URLs — one file to fix broken hotlinks
├── data/         Game content: balance numbers and every French string
├── core/         Engine: state, event bus, delta-time loop, math, formatting
├── systems/      Game rules, as pure functions over state
└── ui/           Rendering and input — the only layer that touches the DOM
tests/            Unit tests
```

Vanilla JavaScript, ES modules, **zero runtime dependencies** — jQuery and jQuery UI were
removed in v2.0.

📖 **[ARCHITECTURE.md](ARCHITECTURE.md)** — layer responsibilities, how to add new content,
and how a new system (Careers, Prestige, …) plugs in.
📋 **[REFACTOR_PLAN.md](REFACTOR_PLAN.md)** — the v1 → v2 modernisation: findings, the
jQuery replacement map, behaviour changes and the external-asset inventory.

### A note on external images

Every image and cursor is hotlinked from kraland.org and friends, and Kraland has shipped a
new version since this game was written, so **some of them may 404**. They all live in
[`src/config/assets.js`](src/config/assets.js) (plus four `url()` values in
`css/kraland.css`, mirrored in the same file), so fixing a broken asset means editing one
place.

---

Basé sur https://github.com/Aldo111/incremental-game-engine-js
