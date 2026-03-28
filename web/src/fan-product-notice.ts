/**
 * Markenhinweis (Ulisses / Significant Fantasy) und Fan-Produkt-Logo für den App-Chrome-Footer.
 * Logo-Quelle: https://myrana.de/wp-content/uploads/2017/06/fan-produkt-logo.png
 * Optional lokal: dieselbe Datei nach `web/public/dsa/fan-produkt-logo.png` legen und
 * `FAN_PRODUKT_LOGO_SRC` auf `/dsa/fan-produkt-logo.png` stellen.
 */
export const FAN_PRODUKT_LOGO_SRC =
  "https://myrana.de/wp-content/uploads/2017/06/fan-produkt-logo.png";

export const ULISSES_MARKEN_HINWEIS =
  "DAS SCHWARZE AUGE, AVENTURIEN, DERE, MYRANOR, THARUN, UTHURIA und RIESLAND sind eingetragene Marken der Significant Fantasy Medienrechte GbR. Ohne vorherige schriftliche Genehmigung der Ulisses Medien und Spiel Distribution GmbH ist eine Verwendung der genannten Markenzeichen nicht gestattet.";

/** Inspiration / Credits (kein Affiliat). */
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
  <aside class="fan-product-notice" aria-label="Markenhinweis, Fan-Produkt und Credits">
    <div class="fan-product-notice__logo-wrap">
      <img class="fan-product-notice__logo" src="${src}" alt="Fan-Produkt zum Rollenspiel Das Schwarze Auge" width="220" height="88" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
    </div>
    <p class="fan-product-notice__text">${escText(ULISSES_MARKEN_HINWEIS)}</p>
    <p class="fan-product-notice__inspiration">Inspiriert von <a href="${hb}" rel="noopener noreferrer" target="_blank">The Homebrewery</a> (NaturalCrit).</p>
  </aside>`;
}
