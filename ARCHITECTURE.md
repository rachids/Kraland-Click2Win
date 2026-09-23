# ARCHITECTURE.md — Kraland Click2Win

How the code is organised, and how to extend it.

Code, identifiers, comments and documentation are in **English**.
Everything the player reads is in **French** and lives in `src/data/`.

---

## 1. Layers

Dependencies point in exactly one direction:

```
config → data → core → systems → ui → main
```

A module may import from the layers to its left, never to its right.

```
index.html                   Entry page. Loads one module: /src/main.js
css/kraland.css              Stylesheet, copied verbatim from the real Kraland

src/
├── main.js                  Composition root — the only file that wires everything
│
├── config/
│   └── assets.js            Every external (kraland.org) URL, in one place
│
├── data/                    WHAT EXISTS. No logic, no DOM.
│   ├── balance.js           Starting values, growth rates, loop timing, roll rules
│   ├── strings.js           Every French string the player sees
│   ├── mules.js             Passive income buildings
│   ├── pioches.js           One-shot click upgrades
│   ├── regen.js             Health regeneration upgrades
│   ├── fonctions.js         Political jobs that can be usurped
│   ├── ordres.js            One-off actions
│   └── index.js             Re-exports + id → entry lookup maps
│
├── core/                    ENGINE PRIMITIVES. Pure, DOM-free, game-agnostic.
│   ├── state.js             createInitialState() → a plain serializable object
│   ├── events.js            Pub/sub bus + the EVENTS name registry
│   ├── game.js              State + bus + system registry
│   ├── loop.js              Delta-time loop, safe in throttled background tabs
│   ├── math.js              roundToDecimals, clamp, addClamped, rollDie, isValidCost
│   └── format.js            prettify() — the one place numbers become strings
│
├── systems/                 THE RULES. Pure functions over state. DOM-free.
│   ├── economy.js           Click income, passive production, regeneration
│   ├── shop.js              Costs and purchase rules for mules/pioches/régen
│   ├── ordres.js            Auto-Soutien, luxury meal, +PdV max
│   └── usurpation.js        Stealing political jobs
│
└── ui/                      PIXELS AND CLICKS. The only layer allowed to touch the DOM.
    ├── dom.js               Native replacements for the jQuery calls the game used
    ├── tabs.js              Native replacement for jQuery UI's .tabs()
    ├── stats-view.js        The numeric readouts
    ├── shop-view.js         Generic purchasable-card list (used three times)
    ├── ordres-view.js       Generic menu + order cards (used twice)
    ├── result-view.js       The post-action result panel
    └── click-effect.js      The floating "+N FK" animation

tests/                       Vitest. Runs in plain Node, with no DOM at all.
```

### The DOM boundary is enforced, not just documented

`eslint.config.js` forbids `document` and `window` inside `core/`, `systems/`, `data/` and
`config/`. The test suite runs in a Node environment with no DOM, so any accidental DOM
access fails the build rather than slipping through.

---

## 2. The key pieces

### State (`core/state.js`)

A plain object literal — no classes, no closures, no methods:

```js
{ money: 500, moneyPerClick: 1, health: 25, maxHealth: 25,
  mulePurchases: {}, ownedPioches: [], usurpedFonctions: [], … }
```

It stays `structuredClone`-able and `JSON.stringify`-able. Saves and prestige resets are
out of scope today, but this property is what makes them small additions later.

### Costs are derived, never stored

A price is a **pure function of content data and a purchase counter**:

```js
getMuleCost(state, 'PCCDI'); // 100, then 115, then 132…
```

The UI calls this to decide what to print. Nothing ever reads a price back out of the page
(the original did: `parseInt($('#' + mule.type).html())`).

### The loop (`core/loop.js`)

Driven by real elapsed time, not by a tick count:

```js
const deltaSeconds = Math.min((now() - lastTickMs) / 1000, maxDeltaSeconds);
if (deltaSeconds > 0) onTick(deltaSeconds);
```

Browsers throttle background tabs, so a fixed `perSecond / 30` per tick under-produced by
about 30× when the tab was hidden. Production is now correct however aggressively the
browser throttles. The delta is capped at 60 s so a suspended machine grants no windfall —
**there is no offline progress**.

Rendering is throttled separately (~10 Hz) and `setText` skips unchanged values.

### The event bus (`core/events.js`)

Systems `emit`, views `on`. Neither imports the other. Every event name lives in the
`EVENTS` constant. This is the seam that lets a new system talk to the UI without any
existing file learning about it.

---

## 3. How to add new content

No code changes — just data.

**A new mule:** add an entry to `src/data/mules.js`.

```js
{
  id: 'BOTNET',                                   // stable, never translated
  name: 'BotNet',                                 // French
  description: 'Un virus codé pour cliquer sur Kraland.',
  perSecondModifier: 500,
  baseCost: 48000,
}
```

It appears in the shop, prices itself, escalates at 15% and is purchasable immediately.
The same applies to `pioches.js`, `regen.js` and `fonctions.js`.

**A new ordre** needs one extra step, because each has bespoke rules:

1. Add the entry to `src/data/ordres.js` with a new `action` id in `ORDRE_ACTIONS`.
2. Write the handler in `src/systems/ordres.js` and add it to the `handlers` map in
   `executeOrdre`.

**New French copy** goes in `src/data/strings.js` — never inline in logic.

**A broken kraland.org image** is fixed in `src/config/assets.js` (or, for the four CSS
`url()` values, in `css/kraland.css`, which `assets.js` mirrors for the inventory).

---

## 4. How a new system plugs in

The planned features — **Careers, Political system, Upgrades, Prestige** — are each a data
module, a system module, a view module, and a few lines in `main.js`.
**No file under `src/core/` needs to change.**

### Worked example: Prestige

**1. State.** Add the fields in `createInitialState()`:

```js
prestigePoints: 0,
prestigeCount: 0,
```

The state object is plain, so nothing else notices.

**2. Data.** `src/data/prestige.js` holds the thresholds and multipliers;
the French copy goes in `strings.js`.

**3. System.** `src/systems/prestige.js` exports pure functions over state:

```js
export function getPrestigeGain(state) { … }

export function canPrestige(state) { … }

export function performPrestige(game) {
  const earned = getPrestigeGain(game.state);
  const carried = { prestigePoints: game.state.prestigePoints + earned,
                    prestigeCount: game.state.prestigeCount + 1 };
  Object.assign(game.state, createInitialState(), carried); // reset, keep the meta-progress
  game.events.emit(EVENTS.PRESTIGE_PERFORMED, { earned });
}
```

Add `PRESTIGE_PERFORMED: 'prestige:performed'` to the `EVENTS` registry.

**4. Multipliers.** Cost and production functions already take `state`, so a prestige
multiplier is one extra factor inside `getMuleCost` / `advanceProduction` — no call site
changes.

**5. View.** `src/ui/prestige-view.js` renders a panel and calls `performPrestige(game)`.
If it is a list of buyable things, reuse `createShopView` instead of writing a new view.

**6. Wire it up** in `main.js`:

```js
game.registerSystem(createPrestigeSystem());
const prestigeView = createPrestigeView({ … });
game.events.on(EVENTS.PRESTIGE_PERFORMED, () => resultView.render(…));
views.push(prestigeView);
```

If the system needs per-frame work, give it a `tick(game, deltaSeconds)` and the loop picks
it up automatically.

**7. Test it.** `tests/prestige.test.js`, in plain Node, no DOM.

### Why the other three are the same shape

| Feature              | Data                | System                                               | View                          |
| -------------------- | ------------------- | ---------------------------------------------------- | ----------------------------- |
| **Careers**          | `data/carrieres.js` | XP gain + level thresholds; emits `carriere:changed` | New tab, or reuse `shop-view` |
| **Political system** | `data/politique.js` | Laws/elections over `state.politicalPower`           | Reuse `ordres-view`           |
| **Upgrades**         | `data/upgrades.js`  | Buy-once multipliers (same shape as pioches)         | Reuse `shop-view` verbatim    |
| **Prestige**         | `data/prestige.js`  | Reset + meta-currency                                | Small dedicated panel         |

`ordres-view.js` and `shop-view.js` are deliberately generic: they render any list of
`{ id, name, description }` with a cost function, which is why Upgrades needs no new view
code at all.

---

## 5. Conventions

- **ES modules only.** No globals, no inline event handlers.
- **`const` by default**, `let` when reassigned, never `var`.
- **Content ids are stable and never translated** (`PCCDI`, `citoyen`). They appear in state
  and in `data-*` attributes. Display names live beside them and are French.
- **Event delegation** over per-element listeners, so re-rendering never rebinds anything.
- **`textContent` by default.** `innerHTML` only for the static French copy that genuinely
  contains markup (`<strong>`, `<em>`, `<a>`, `<img>`), which is author-written, never user
  input.
- **No magic numbers** in logic — they belong in `data/balance.js`.
- **JSDoc on every exported function.**
- **One rounding helper.** All rounding goes through `roundToDecimals`; see its doc comment
  for the `Math.round(x, 1)` history.

---

## 6. Deliberate non-goals

These were excluded on purpose; the code is shaped so each stays cheap to add.

- **Saves / persistence** — state is already a plain serializable object.
- **Big numbers** — all formatting funnels through `core/format.js`.
- **Offline progress** — explicitly not wanted; the loop caps its delta.
- **HTML/CSS modernisation** — the markup is a faithful copy of the real Kraland and was
  changed only as much as loading ES modules and fixing `http://` URLs required.
