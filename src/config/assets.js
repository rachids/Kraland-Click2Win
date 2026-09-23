/**
 * @file Single source of truth for every EXTERNAL asset URL used by the game.
 *
 * All of these are hotlinked from kraland.org (and two other third-party hosts).
 * They are intentionally NOT vendored into this repository.
 *
 * ⚠️ UNVERIFIED — MAY RETURN 404.
 * Kraland has shipped a new version since this game was written, so some of these
 * assets have probably moved or disappeared. They were deliberately left untouched
 * apart from the `http://` → `https://` upgrade (plain HTTP sub-resources are blocked
 * as mixed content when the page is served over HTTPS).
 *
 * To fix a broken asset, edit it HERE and nowhere else.
 *
 * @see REFACTOR_PLAN.md §5 for the full annotated list.
 */

/** Base URL of the Kraland image CDN. Change this once if the whole CDN moves. */
const KRALAND_IMG = 'https://img.kraland.org';

/**
 * External images referenced from JavaScript.
 * @type {Readonly<Record<string, string>>}
 */
export const ASSET_URLS = Object.freeze({
  /** Money icon (16×16), shown in the floating "+N FK" click feedback. */
  moneyIcon: `${KRALAND_IMG}/2/money.gif`,
  /** The star glyph inside the nickname "red★staw". */
  redstawStar: `${KRALAND_IMG}/s/4C.gif`,
});

/**
 * External images referenced from `index.html`.
 * Listed here for documentation and inventory purposes only — the `<img>` tags in the
 * HTML carry these URLs literally, because the markup is a faithful copy of the real
 * Kraland page and restructuring it is out of scope.
 * @type {Readonly<Record<string, string>>}
 */
export const HTML_ASSET_URLS = Object.freeze({
  /** Player avatar (40×40), hosted on a third-party free host. */
  avatar: 'https://dichra.free.fr/kraland/sims/img/redstar.jpg',
  /** XP icon (16×16). */
  xpIcon: `${KRALAND_IMG}/2/star.gif`,
  /** Health ("PdV") icon (16×16). */
  healthIcon: `${KRALAND_IMG}/2/heart.gif`,
  /** Empire flag (20×13). */
  empireFlag: `${KRALAND_IMG}/2/cyb/f1.png`,
  /** Gender icon (15×15). */
  genderIcon: `${KRALAND_IMG}/2/s1.gif`,
  /** Money icon (16×16). */
  moneyIcon: `${KRALAND_IMG}/2/money.gif`,
  /** Map tile used as the mine illustration on the clicker. */
  mineTile: `${KRALAND_IMG}/2/map/4/3074.gif`,
  /** The star glyph inside the nickname "red★staw". */
  redstawStar: `${KRALAND_IMG}/s/4C.gif`,
});

/**
 * External images referenced from `css/kraland.css` via `url()`.
 * Mirrored here so the complete inventory lives in one file; the stylesheet keeps the
 * literal URLs because moving them into JS would mean restructuring the CSS, which is
 * out of scope. Keep both in sync when fixing a broken asset.
 * @type {Readonly<Record<string, string>>}
 */
export const CSS_ASSET_URLS = Object.freeze({
  /** Custom mining-pick cursor on `#clicker` — `css/kraland.css` line ~345. */
  clickerCursor: `${KRALAND_IMG}/2/mat/21/2112.gif`,
  /** `span.checkbox` background — `css/kraland.css` line ~275. */
  checkbox: 'https://www.kramages.org/css/1/checkbox.gif',
  /** `span.radio` background — `css/kraland.css` line ~285. */
  radio: 'https://www.kramages.org/css/1/radio.gif',
  /** `span.select` background — `css/kraland.css` line ~296. */
  select: 'https://www.kramages.org/css/1/select.gif',
});

/**
 * External hyperlinks embedded in French flavour text.
 * These are navigation targets, not sub-resources, so they are never blocked as mixed
 * content — but they are listed here so the inventory is exhaustive.
 * @type {Readonly<Record<string, string>>}
 */
export const EXTERNAL_LINKS = Object.freeze({
  /** Joke link in the "Citoyen" usurpation description. Almost certainly dead (Flash). */
  robotUnicornAttack: 'https://games.adultswim.com/robot-unicorn-attack-twitchy-online-game.html',
});
