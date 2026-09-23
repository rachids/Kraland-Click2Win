# REFACTOR_PLAN.md — Kraland Click2Win

> Plan de modernisation du code. Rédigé avant le refactoring, tenu à jour pendant.
> Le code, les commentaires et la documentation sont en anglais.
> **Tous les textes visibles par le joueur restent en français** et vivent dans des modules de données.

---

## 1. Codebase review (before state)

Snapshot of `master` @ `5dfca3a`. ~1 900 lines total, of which ~1 800 are first-party
(the rest is HTML/CSS), plus 106 KB of vendored jQuery.

| File                        | Lines | Role |
| --------------------------- | ----: | ---- |
| `index.php`                 |   277 | Static HTML page (no PHP at all), loads 7 `<script>` tags |
| `css/kraland.css`           |   901 | Stylesheet copied from the real Kraland |
| `js/jquery2.js`             |     4 | Vendored jQuery **2.1.4** (minified, 84 KB) |
| `js/jquery-ui.js`           |     5 | Vendored jQuery UI **1.11.4** (22 KB) — build contains only `core.js, widget.js, tabs.js` |
| `js/jeu/incrementalObject.js` | 275 | Generic "incremental engine": `Game`, `EntitySet`, `Entity` constructor functions |
| `js/jeu/sets.js`            |    37 | All content definitions (mules, pioches, fonctions, ordres, régen) as bare globals |
| `js/jeu/kraland.js`         |   181 | Bootstrap, DOM generation via string concat, render loop, `prettify`, `randeaume` |
| `js/jeu/ordres.js`          |   166 | All player actions (buy / ordre / usurpation) |
| `js/ui/helpers.js`          |    23 | Floating `+N FK` click animation |

### 1.1 Structure

There is no module system. Seven scripts are concatenated into one global scope by
`<script>` tags, in a load order that is load-bearing (`sets.js` must run before
`kraland.js`, which must run before the `$(document).ready` handler fires).

Responsibilities are fully entangled:

- `incrementalObject.js` mixes state, mutators **and** DOM (`Game.prototype.init` binds a
  jQuery click handler; `increaseScorePerClick` calls `moneyIncrementAnimation`).
- `kraland.js` mixes bootstrap, content wiring, HTML string templating, the render loop and
  number formatting.
- `ordres.js` mixes price lookup (from the DOM!), game rules, random rolls, French copy and
  DOM updates in every single function.
- `sets.js` mixes numeric balance, French copy and CSS class names in the same object literals.

### 1.2 Game loop

```js
function play() { setInterval(function () { incrementalGame(); }, 1000 / game.getFPS()); }
```

`fps` is fixed at 30 and production is `score += pointsPerSecond / fps` **per tick**.
This is a fixed-tick loop: it assumes 30 ticks really happen every second.
Browsers throttle background tabs to ~1 timer callback per second (and Chrome will drop
heavily-throttled tabs to 1/minute), so a backgrounded tab currently produces **~1/30th** of
its nominal income. `incrementalGame()` also re-renders every DOM readout 30×/second.

### 1.3 State management

State lives in closure variables inside the `Game` constructor (`score`, `pp`, `pdv`, …)
behind hand-written getters/setters. Content lives in `game.sets`, which is an **array used
as a hash map** (`this.sets[name] = …` on a `[]`) — same trick again in `EntitySet.entities`.
`.length` is therefore meaningless and the code carries a hand-maintained counter and a
`size()` helper that loops over `Object.keys` to work around it.

The state object is not serializable (closures + functions), which blocks the future save
system even though saving is out of scope today.

### 1.4 DOM / UI logic

100 % of rendering is jQuery string concatenation with **inline `onclick` attributes** built
into the HTML (`onclick=\"buyMule('" + i + "')\"`), which requires the handlers to be global
functions and makes the entity name part of an HTML attribute.

### 1.5 Game data

Balance numbers, French descriptions, CSS class names and the *name of the JS function to
call* (`fnName: "autoSoutien"`) are all mixed into the same objects in `sets.js`.

---

## 2. Known problems — verification results

Every item from the brief was checked against the code. **All 7 confirmed.**

### 2.1 Obsolete vendored jQuery — CONFIRMED

jQuery 2.1.4 (2015) and jQuery UI 1.11.4 (2015). See §4 for the full inventory and
replacement map. Both files are deleted.

### 2.2 `http://` asset URLs — CONFIRMED (11 occurrences, 8 distinct URLs)

Mixed-content blocking kills all of these when the page is served over HTTPS. Full list in §5.

### 2.3 Accidental globals — CONFIRMED

Verified empirically by diffing `Object.getOwnPropertyNames(window)` before/after running
`init()` in a jsdom harness. Six variables are created **without any declaration keyword**:

| Variable        | Created in                          |
| --------------- | ----------------------------------- |
| `i`             | `kraland.js` (5 × `for (i in …)`) and `incrementalObject.js` `Game.size()` |
| `mules_list`    | `kraland.js:17`                     |
| `pioches_list`  | `kraland.js:28`                     |
| `regen_list`    | `kraland.js:39`                     |
| `ce_list`       | `kraland.js:57`                     |
| `ordres_list`   | `kraland.js:78`                     |
| `delimiter`     | `kraland.js:157`, inside `prettify` |

`delimiter` was missed by the brief's list — it is assigned inside `prettify()` where the
sibling variables on the same `var` statement *are* declared, so it reads as declared but is
not (the `var` chain is broken by a `;` on the previous line).

On top of that, **every** top-level `var` and `function` in all five files is a global by
construction (≈ 50 more names: `game`, `delimiters`, `init`, `play`, `prettify`, `randeaume`,
`gtfo`, `buyMule`, `m1Options`, `f1Options`, …). ES modules are strict-mode + module-scoped,
so all of this disappears; the implicit ones would have thrown `ReferenceError` under strict
mode, which is why they must be found before the port, not after.

### 2.4 Suspicious calculations — CONFIRMED

#### a. `Math.round(value, 1)` — the phantom second argument

`Math.round()` takes exactly one argument; the `1` is silently ignored. 6 occurrences:

| Location                    | Expression |
| --------------------------- | ---------- |
| `kraland.js:106` `#perSecond`   | `Math.round(10 * pointsPerSecond, 1) / 10` |
| `kraland.js:107` `#perClick`    | `Math.round(10 * pointsPerClick, 1) / 10` |
| `kraland.js:110` `#pdv_value`   | `Math.round(100 * pdv, 1) / 100` |
| `kraland.js:111` `#pdvmax_value`| `Math.round(100 * pdvMax, 1) / 100` |
| `kraland.js:112` `#pdvpersecond`| `Math.round(100 * pdvPerSecond, 1) / 100` |
| `ordres.js:56` `autoSoutien` chance | `Math.round(10 * (…), 1) / 10` |

Two more call sites use the *same* idiom written correctly (no stray argument), which is
strong evidence the author's intent was simply "round to 1 / 2 decimals":
`kraland.js:108` (`Math.round(10 * pp) / 10`) and `kraland.js:138` (`Math.round(10 * chance) / 10`).

**Decision — preserve the current effective behaviour exactly.** `Math.round(x, 1) === Math.round(x)`,
so the effective behaviour *is* "multiply, round to nearest integer, divide" — i.e. round to
N decimals. All 8 call sites collapse to one helper, `roundToDecimals(value, decimals)`, whose
JSDoc records the ambiguity. Only one of the 6 buggy sites (`autoSoutien`'s `chance`) feeds
back into gameplay; the other 5 are display-only. **Output is bit-for-bit identical.**

> ⚠️ Ambiguity recorded: if the author actually meant `toFixed(1)`-style *string* formatting,
> the displayed values would differ (`0.1` vs `0.10`). We keep today's numeric behaviour.

#### b. Health regeneration overshoot — CONFIRMED

```js
if (pdv < pdvMax)                      { pdv += pdvPerSecond / fps; }  // ← no clamp
else if (pdv + pdvPerSecond / fps >= pdvMax) { pdv += (pdvMax - pdv); }
```

The first branch is taken whenever `pdv < pdvMax` and adds the full increment, so `pdv`
lands **above** `pdvMax`. The `else if` only fires on the *next* tick, clamping back down —
so the overshoot is real but transient (one frame of `PdV > PdV Max` on screen). Fixed with a
single `Math.min`. The magnitude is tiny at 30 fps but becomes visible with delta-time ticks
in a throttled tab, where one tick can be a full second.

#### c. Other numeric edge cases found

| # | Issue | Verdict |
| - | ----- | ------- |
| 1 | **`pdv` can go negative.** `addToPDV` clamps the upper bound only. In `autoSoutien`'s critical failure, `costPDV` (5) is paid first, then a random 1–4 penalty is applied with no floor. | **Fixed** — clamped to `[0, pdvMax]`. |
| 2 | **`score` can go negative.** `getScore()` returns `Math.ceil(score)` but `addToScore` subtracts from the *raw* float, so `addToScore(-getScore())` (usurpation critical failure) leaves `score` at ≈ `-0.3`. `Math.ceil(-0.3)` is `-0`, which prints as `"0"` — the bug is invisible but real. | **Fixed** — clamped to `≥ 0`. Display is unchanged (`-0` and `0` both stringify to `"0"`). |
| 3 | **`buyFacteurChance` is type-broken.** `var cout = $('#bakchich').html()` is a **string**: `cout <= getScore()` is a string↔number comparison and `cout += Math.floor(cout * 1.80)` concatenates (`"10000"` → `"1000018000"`). | Dead code (the `CHANCE` set is commented out in `kraland.js`). **Removed**; the `facteurChance` stat itself is kept and still displayed/used. |
| 4 | **Float drift on `pdvPerSecond`.** Régen upgrades add `0.01 / 0.05 / 0.5 / 1`; `0.01 + 0.05` is not exact in binary FP. | **Not a bug in practice** — the display already rounds to 2 decimals and the drift is ~1e-17. Left alone deliberately (changing it would change balance). Flagged here only. |
| 5 | **No `NaN` guards.** Today `NaN` can only enter through the DOM price parsing, which §2.5 removes. | Resolved by §2.5. Purchases additionally assert a finite, positive cost. |
| 6 | `game.size()` / `EntitySet.length` hand-rolled counters over array-as-hashmap. | Removed — real arrays. |

### 2.5 Prices parsed back out of the DOM — CONFIRMED (4 call sites)

```js
var cout = parseInt($('#' + mule.type).html());   // reads "1300 FK" back out of a <strong>
```

Also in `buyPioche`, `buyRegen` and `ajoutPdvMax` (`parseInt($('.AjouterPDVMax').html())`),
plus the string-typed `buyFacteurChance`. The DOM is the **single source of truth for
prices** today: escalating costs are written back into `innerHTML` and re-read on the next
purchase. Consequences: prices are un-testable, a stray DOM edit is a cheat code, and
`parseInt` silently yields `NaN` if a node is missing.

**Fix:** costs become pure functions of content data + a purchase counter held in state
(`mulePurchases`, `regenPurchases`, `pdvMaxPurchases`). The escalation formulas
(`cost += floor(cost * 0.15)` for mules, `× 0.40` for régen, and the `pdvMax` power curve)
are reproduced **iteratively**, step by step, because `Math.floor` at each step makes them
non-closed-form — this guarantees the exact same integer sequence as before. The UI only
renders `getMuleCost(state, id)`. A unit test asserts the sequences and that no purchase
function touches the DOM.

### 2.6 Global functions, no tests / lint / build / docs — CONFIRMED

Addressed by §3 (architecture), §7 (tooling) and the new `ARCHITECTURE.md` + README.

### 2.7 Obsolete HTML/CSS layout — CONFIRMED, OUT OF SCOPE

`#right { position: absolute }`, `<table>`-based stat panels, `align="middle"`, `<a name>`
anchors, vendor-prefixed `-khtml-user-select`. Per the brief the HTML/CSS is a faithful copy
of the real Kraland and is **not** restyled. Only the minimal changes in §6 are made.

---

## 3. Target architecture

Layered, one direction of dependency: **data → core → systems → ui → main**.
Nothing below `ui/` may touch the DOM; nothing in `ui/` may contain a game rule.

```
index.html                  # entry (was index.php), single <script type="module">
css/kraland.css             # untouched except http → https
src/
├── main.js                 # composition root: builds state, registers systems + views, starts loop
├── config/
│   └── assets.js           # ← EVERY external (kraland.org) URL, the single place to edit
├── data/                   # content definitions — no logic, no DOM
│   ├── balance.js          #   starting values, growth rates, tick rate, caps (no magic numbers)
│   ├── strings.js          #   all French UI copy + message builders
│   ├── mules.js  pioches.js  regen.js  fonctions.js  ordres.js
│   └── index.js            #   re-exports + id→entry lookup maps
├── core/                   # engine primitives — pure, DOM-free, framework-free
│   ├── state.js            #   createInitialState() → plain serializable object
│   ├── events.js           #   ~40-line pub/sub bus
│   ├── game.js             #   Game container: state + bus + system registry
│   ├── loop.js             #   delta-time loop (background-tab safe)
│   ├── math.js             #   roundToDecimals, clamp, addClamped, rollD100…
│   └── format.js           #   prettify() — the one place numbers become strings
├── systems/                # game rules — pure functions over state, DOM-free
│   ├── economy.js          #   click income, per-second production, the tick
│   ├── shop.js             #   mule / pioche / régen costs + purchase rules
│   ├── ordres.js           #   auto-soutien, repas, +PdV max
│   └── usurpation.js       #   fonction usurpation
└── ui/                     # rendering + input — the only layer allowed to touch the DOM
    ├── dom.js              #   el(), on(), delegate(), show/hide/fade (jQuery replacements)
    ├── tabs.js             #   native replacement for jQuery UI .tabs()
    ├── stats-view.js  shop-view.js  ordres-view.js  result-view.js  click-effect.js
tests/                      # Vitest, runs in plain Node — no browser, no jsdom
```

### Module responsibilities

| Layer | May import | May touch DOM | Purpose |
| ----- | ---------- | ------------- | ------- |
| `config/` | — | no | External URLs, isolated so the owner fixes 404s in one file |
| `data/`   | `config/` | no | What exists in the game and what it costs/says |
| `core/`   | `data/` | no | Reusable primitives with no game rules baked in |
| `systems/`| `core/`, `data/` | no | The rules. Take `(state, …)`, mutate state, return a result object |
| `ui/`     | everything | **yes** | Turn state into pixels and clicks into system calls |
| `main.js` | everything | yes | Wiring only. Adding a feature = adding a line here |

### Extension points for the planned features

Careers, Political system, Upgrades and Prestige are **not implemented**, but each can be
added as `data/<feature>.js` + `systems/<feature>.js` + `ui/<feature>-view.js` and **one
registration line in `main.js`** — no edit to anything under `core/`. The seams that make
this work:

1. **`createInitialState()` is a plain object literal.** A feature adds its own top-level
   key. It stays `structuredClone`-able, so save/load and prestige-reset are drop-in later.
2. **System registry.** `game.registerSystem({ id, init?, tick? })`. `loop.js` calls every
   registered `tick(game, deltaSeconds)`; it knows nothing about economy or careers.
3. **Pub/sub bus.** Systems `emit`, views `on`. A new system publishes `carriere:changed`;
   existing views are untouched. Events are namespaced `domain:verb`.
4. **Data-driven views.** `shop-view.js` renders any list of `{ id, name, description, cost }`,
   so an Upgrades tab reuses it with a new data file.
5. **Cost curves are pure functions of a counter** — Prestige multipliers slot in as an extra
   argument without rewriting purchase logic.

`ARCHITECTURE.md` documents each of these with a worked "how to add Prestige" example.

---

## 4. jQuery / jQuery UI inventory and replacement map

The vendored jQuery UI build declares its contents in its banner:
`Includes: core.js, widget.js, tabs.js`. Confirmed empirically in a jsdom harness —
`$.ui` exposes exactly `version, keyCode, ie, plugin, tabs`.
**`tabs` is the only jQuery UI widget available, and the only one used.**
No dialog, no tooltip, no draggable, no progressbar, no effects.

### 4.1 Every jQuery call site, and its replacement

| # | jQuery used | Where | Native replacement |
| - | ----------- | ----- | ------------------ |
| 1  | `$(document).ready(fn)` | `kraland.js:124` | `<script type="module">` is deferred by default — just call it |
| 2  | `$("#id")` / `$(".cls")` / `$('span[data-ordre=x]')` | ~30 sites | `document.querySelector` / `querySelectorAll` |
| 3  | `$(el).on("click", fn)` | `incrementalObject.js:159` | `addEventListener('click', fn)` |
| 4  | `$(document).on('click', '.loadOrder', fn)` (delegation) | `kraland.js:128` | `addEventListener` on a container + `event.target.closest('.loadOrder')` |
| 5  | **inline `onclick="buyMule('…')"`** (12 generated handlers) | `kraland.js`, generated HTML | Removed. `data-action` / `data-id` attributes + one delegated listener per tab |
| 6  | `.html(string)` (read) | `ordres.js` ×4 | **Deleted** — prices now come from state (§2.5) |
| 7  | `.html(string)` (write) | ~10 sites | `textContent` for plain values; `innerHTML` only for the French copy that genuinely contains `<strong>` / `<br>` / `<a>` markup, which is trusted static data |
| 8  | `.append(htmlString)` | 5 sites, builds the whole UI | `insertAdjacentHTML('beforeend', …)` for static content templates, and `document.createElement` + `textContent` for anything interpolated |
| 9  | `.data("ordre")` | `kraland.js:129` | `element.dataset.ordre` |
| 10 | `.css('top' / 'left', …)` | `helpers.js` | `element.style.top` / `.left` |
| 11 | `.hide()` | `kraland.js:131`, `gtfo()` | `element.style.display = 'none'` (identical to what jQuery does) |
| 12 | `.fadeIn()` | `kraland.js:132` | `style.display = 'block'` + Web Animations API opacity `0 → 1` |
| 13 | `.fadeOut()` | `ordres.js:78`, `ordres.js:21` | WAAPI opacity `1 → 0`, then `style.display = 'none'` in `finished` |
| 14 | `.animate({top:'-=50px', opacity:0}, {duration:750, complete})` | `helpers.js` | WAAPI `el.animate([...], {duration:750, easing:'ease-in-out'})` + `finished.then(() => el.remove())` |
| 15 | `$("<div class='x'></div>")` (element creation) | `helpers.js` | `document.createElement('div')` + `classList.add` |
| 16 | `.remove()` | `helpers.js` | `element.remove()` |
| 17 | `.each()` | — | `for…of` / `forEach` |
| 18 | **`$("#tabs").tabs()`** (jQuery UI) | `kraland.js:126` | `src/ui/tabs.js`, ~50 lines (see §4.2) |
| 19 | `$.ajax` / `$.get` | **not used anywhere** | n/a (no `fetch` needed — the game is fully client-side) |

### 4.2 jQuery UI `tabs()` — what it actually does, and the native version

Verified by instrumenting the real widget in jsdom. It:
1. adds `ui-tabs ui-widget ui-widget-content ui-corner-all` to `#tabs`;
2. adds `ui-tabs-nav ui-helper-reset …` + `role="tablist"` to the `<ul>`;
3. per tab: `role="tab"`, `tabindex`, `aria-controls`, `aria-labelledby`, `aria-selected`, `aria-expanded`, `ui-state-default ui-corner-top`, and `ui-tabs-active ui-state-active` on the selected one;
4. per panel: `ui-tabs-panel ui-widget-content ui-corner-bottom`, `aria-hidden`, and inline `display:none` on the hidden ones;
5. handles click + arrow-key navigation.

**`css/kraland.css` contains zero `ui-*` rules** (`grep -c 'ui-' css/kraland.css` → `0`),
because the jQuery UI *theme* stylesheet was never vendored. Every class in (1)–(4) is
therefore visually inert. The native replacement reproduces (4) — the only visually
load-bearing part — plus the ARIA attributes and keyboard navigation, and skips the dead
`ui-*` classes.

> ⚠️ **One deliberate visual change** (listed in §8): because `ui-state-active` has no CSS,
> the active tab is currently indistinguishable from the inactive ones. The Kraland
> stylesheet ships `.sl li.on` / `.sl li.on a` rules (white background, bold, dark border)
> that were written for exactly this purpose and are currently dead code. The native
> `tabs.js` applies `.on`, restoring the intended active-tab highlight. This is treated as
> fixing a regression caused by shipping jQuery UI without its theme, not as a restyle.

### 4.3 Features deliberately *not* ported

None. There is no jQuery UI widget in use without a native equivalent, so nothing is
degraded and nothing needs flagging.

---

## 5. External assets (hotlinked from kraland.org & friends)

Per the brief: **not downloaded, not replaced, not removed** — only `http://` → `https://`,
and all centralised in `src/config/assets.js`.

> **All URLs below are UNVERIFIED and MAY RETURN 404.** Kraland has shipped a new version
> since this game was written. The sandbox running this refactor has **no outbound network
> access to these hosts** (`curl` to `img.kraland.org` and `www.kraland.org` both fail to
> connect), so reachability could not be checked — as allowed by the brief.

| # | URL (after `https://` fix) | Used for | Referenced from |
| - | -------------------------- | -------- | --------------- |
| 1 | `https://dichra.free.fr/kraland/sims/img/redstar.jpg` | Player avatar (40×40) | `index.html` |
| 2 | `https://img.kraland.org/2/star.gif` | XP icon (16×16) | `index.html` |
| 3 | `https://img.kraland.org/2/heart.gif` | PdV icon (16×16) | `index.html` |
| 4 | `https://img.kraland.org/2/cyb/f1.png` | Empire flag (20×13) | `index.html` |
| 5 | `https://img.kraland.org/2/s1.gif` | Gender icon (15×15) | `index.html` |
| 6 | `https://img.kraland.org/2/money.gif` | Money icon (16×16) | `index.html` **and** `src/ui/click-effect.js` |
| 7 | `https://img.kraland.org/2/map/4/3074.gif` | Mine image on the clicker | `index.html` |
| 8 | `https://img.kraland.org/s/4C.gif` | The `★` in the nickname “red★staw” | `index.html` **and** `src/data/fonctions.js` (PREMIER ELU description) |
| 9 | `https://img.kraland.org/2/mat/21/2112.gif` | **Custom cursor** on `#clicker` | `css/kraland.css:345` |
| 10 | `https://www.kramages.org/css/1/checkbox.gif` | `span.checkbox` background | `css/kraland.css:275` |
| 11 | `https://www.kramages.org/css/1/radio.gif` | `span.radio` background | `css/kraland.css:285` |
| 12 | `https://www.kramages.org/css/1/select.gif` | `span.select` background | `css/kraland.css:296` |
| 13 | `http://games.adultswim.com/robot-unicorn-attack-twitchy-online-game.html` | Joke hyperlink in the *Citoyen* description | `src/data/fonctions.js` |

Notes:

- #9–#12 are **CSS `url()`** values. They cannot live in a JS module without restructuring
  the stylesheet, which is out of scope, so they are fixed in place in `css/kraland.css` and
  mirrored in `assets.js` under `CSS_ASSET_URLS` (documentation only) so the list stays in
  one place.
- #13 is an outbound *hyperlink*, not a sub-resource, so it is not mixed content and cannot
  be blocked. It is listed for completeness and switched to `https://` anyway; Adult Swim
  retired its Flash games, so this one is almost certainly dead.

---

## 6. HTML / CSS changes (exhaustive)

Scope is JavaScript; these are the only markup/style edits, all of them required.

1. **`index.php` → `index.html`.** The file contains no PHP whatsoever, and Vite requires an
   `.html` entry point.
2. Replace the 7 `<script src>` tags with a single `<script type="module" src="/src/main.js">`.
3. `http://` → `https://` on the 7 `<img>` tags in the HTML and the 4 `url()` values in the CSS.
4. Remove `<div id="clicker">`'s dependency on a global handler — no inline handler existed in
   the static HTML, but all *generated* `onclick=` attributes are gone (§4.1 #5).
5. Add `<meta name="viewport">` and `<html lang="fr">` — two lines, required for the page to be
   correct at all and zero visual impact at desktop widths.

No selector, no rule, no layout technique is changed. `css/kraland.css` diff = 4 lines.

---

## 7. Tooling

- **Vite 8** — dev server + build. Zero-config for a static multi-asset page; `base: './'`
  so the build works from a subdirectory (GitHub Pages).
- **Node 24 (Active LTS)** — pinned in `.nvmrc` and `engines`.
- **ESLint 10** flat config + `eslint-config-prettier`; `no-undef`, `no-var`,
  `prefer-const`, `eqeqeq` are the rules that matter here.
- **Prettier 3**.
- **Vitest 5** — unit tests for `core/` + `systems/`, running in plain Node with no jsdom,
  which is the proof that the logic layer really is DOM-free.
- **GitHub Actions** — `install → lint → format:check → test → build` on push and PR.

No other runtime dependency. The shipped bundle has **zero** third-party code (down from 106 KB).

---

## 8. Behaviour changes (complete list)

Everything else — balance, formulas, French copy, layout — is byte-identical.

| # | Change | Why | Risk |
| - | ------ | --- | ---- |
| 1 | **Rounding**: 8 call sites collapse into `roundToDecimals()`. `Math.round(x, 1)` → `Math.round(x)`. | The 2nd argument was always ignored; effective behaviour preserved exactly. | **None** — provably identical output. |
| 2 | **PdV clamped to `pdvMax`** in regeneration. | Bug 2.4b. Removes a 1-frame `PdV > PdV Max` flicker. | None. |
| 3 | **PdV clamped to ≥ 0.** | Bug 2.4c#1 — critical failure on *Auto-Soutien* could push PdV negative. | Very low. Makes a failure slightly less punishing in a rare edge case. |
| 4 | **Score clamped to ≥ 0.** | Bug 2.4c#2 — `score` could settle at ≈ `-0.3`. Displayed value is unchanged (`-0` → `"0"`). | None. |
| 5 | **Prices come from state, not the DOM.** | Requirement §2.5. Sequences reproduced iteratively and unit-tested. | None — identical integers. |
| 6 | **Delta-time game loop.** Production is `perSecond × elapsedSeconds` instead of `perSecond / 30` per tick. | Requirement: keep earning in a background tab. Identical while the tab is focused; **correct instead of ~30× too slow** when throttled. | Low, and intended. `dt` is capped at 60 s per tick so a suspended laptop does not grant offline progress. |
| 7 | **Render decoupled from simulation.** The DOM is refreshed ~10×/s (and only for values that changed) instead of 30×/s. | Perf; 30 full re-renders per second of 10 nodes was wasteful. | None visually. |
| 8 | **Active tab is now highlighted** via the stylesheet's existing `.sl li.on` rules. | §4.2 — the highlight is currently dead because jQuery UI's theme CSS was never vendored. | Visual change, deliberate, flagged. |
| 9 | **Thousands separator** emitted as the literal character `U+202F` instead of the HTML entity `&#8239;`. | Same glyph; required to use `textContent` instead of `innerHTML` for plain numbers. | None — renders identically. |
| 10 | **Click animation** uses `transform: translateY()` (WAAPI) instead of animating `top` (jQuery). | `.animate` is gone. Same 750 ms, same 50 px rise, same fade-out. | None visually; smoother. |
| 11 | **`buyFacteurChance()` deleted.** | Dead + type-broken (2.4c#3). Its `CHANCE` set was already commented out on `master`. | None — unreachable code. |
| 12 | Tab panels/orders keyboard-accessible (`role`, `aria-*`, arrow keys). | Free with the native tabs rewrite. | None. |

---

## 9. Assumptions

1. **`index.php` is pure HTML.** Verified — zero `<?php`. Renaming to `.html` loses nothing.
2. **`Math.round(x, 1)` meant "round to 1 decimal".** Both readings collapse to the same
   numbers, so this assumption is free; recorded because the author was unsure.
3. **The active-tab highlight is desired** (§4.2). This is the single judgement call where
   "preserve visuals" and "the CSS obviously intends this" conflict. Reverting is a one-line
   change in `src/ui/tabs.js`.
4. **French copy containing markup stays HTML.** Several descriptions embed `<strong>`,
   `<em>`, `<br/>`, `<a>` and an `<img>`. These are static, author-written, non-user data, so
   they are injected with `innerHTML`. Anything interpolated from state uses `textContent`
   or is numeric.
5. **No save/load, no big numbers** — out of scope. State is kept a plain
   `structuredClone`-able object and all number→string conversion is funnelled through
   `core/format.js`, so both are additive changes later.
6. **The `PIOCHES` escalation is intentionally absent** — a pioche is bought once and its
   card disappears. Preserved.
7. **`fps: 30` is no longer a simulation parameter** but it is kept in `balance.js` as the
   *tick interval* so the numbers in the file still read like the original.
8. **No network access** in this environment, so the kraland.org URLs in §5 are unverified.

---

## 10. Ordered steps

1. ✅ Review the whole codebase; verify every reported problem (§1, §2).
2. ✅ Add tooling: `package.json`, `.nvmrc`, Vite, ESLint, Prettier, Vitest, `.gitignore`.
3. ✅ Write this plan.
4. ✅ `config/assets.js` + `data/strings.js` — centralise URLs and French copy.
5. ✅ `data/*.js` — port the content out of `sets.js`, splitting balance from copy.
6. ✅ `core/*.js` — `state`, `events`, `game`, `loop`, `math`, `format`.
7. ✅ `systems/*.js` — `economy`, `shop`, `ordres`, `usurpation` as pure rules.
8. ✅ `ui/*.js` — `dom`, `tabs`, and the five views; no inline handlers, full delegation.
9. ✅ `main.js`, `index.html`; delete `js/` including both vendored jQuery files.
10. ✅ Unit tests for state, costs, purchase rules, PdV clamping, rounding, the tick.
11. ✅ CI workflow; make lint + format + test + build green.
12. ✅ `ARCHITECTURE.md` + README section.
13. ✅ Open the PR from `refactor` into `master`.
