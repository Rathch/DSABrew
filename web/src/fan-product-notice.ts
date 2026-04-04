/**
 * Trademark notice (Ulisses / Significant Fantasy) and fan-product logo for the app chrome footer.
 * Asset: `web/public/fan-produkt-logo.png` → `/fan-produkt-logo.png` (Vite public root).
 */
export const FAN_PRODUKT_LOGO_SRC = "/fan-produkt-logo.png";

export const ULISSES_MARKEN_HINWEIS =
  "DAS SCHWARZE AUGE, AVENTURIEN, DERE, MYRANOR, THARUN, UTHURIA und RIESLAND sind eingetragene Marken der Significant Fantasy Medienrechte GbR. Ohne vorherige schriftliche Genehmigung der Ulisses Medien und Spiel Distribution GmbH ist eine Verwendung der genannten Markenzeichen nicht gestattet.";

/** Inspiration / credits (not affiliate). */
export const HOMEBREWERY_URL = "https://homebrewery.naturalcrit.com/";

function escAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function fanProductNoticeHtml(): string {
  const src = escAttr(FAN_PRODUKT_LOGO_SRC);
  const hb = escAttr(HOMEBREWERY_URL);
  return `
  <aside class="fan-notice" aria-label="Markenhinweis, Fan-Produkt und Credits">
    <div class="fan-notice__bar">
      <div class="fan-notice__col fan-notice__col--logo">
        <img class="fan-notice__img" src="${src}" alt="Fan-Produkt zum Rollenspiel Das Schwarze Auge" width="220" height="88" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
      </div>
      <span class="fan-notice__sep" aria-hidden="true"></span>
      <p class="fan-notice__legal">${escText(ULISSES_MARKEN_HINWEIS)}</p>
      <span class="fan-notice__sep" aria-hidden="true"></span>
      <p class="fan-notice__credit">Inspiriert von <a class="chrome-link" href="${hb}" rel="noopener noreferrer" target="_blank">The Homebrewery</a> (NaturalCrit).</p>
    </div>
  </aside>`;
}
