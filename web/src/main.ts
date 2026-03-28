import "./style.css";
import { DEFAULT_IMPRESSUM_DATA } from "./impressum-config";
import { attachMarkdownToolbar } from "./markdown-toolbar";
import { renderDocument } from "./renderer";

/** `{{impressumField key=value}}` — Wert darf kein `}` enthalten (Makrosyntax). */
function impressumField(key: string, value: string): string {
  if (value.includes("}")) {
    throw new Error(`impressumField ${key}: value must not contain "}"`);
  }
  return `{{impressumField ${key}=${value}}}`;
}

const D = DEFAULT_IMPRESSUM_DATA;

/** Impressum-Seite: alle aktuellen Defaults aus `DEFAULT_IMPRESSUM_DATA` als Makros (eine Disclaimer-Zeile). */
const IMPRESSUM_PAGE_BLOCK = [
  impressumField("projectTitle", D.projectTitle),
  impressumField("version", D.versionNumber),
  impressumField("datum", D.versionDate),
  impressumField("auflage", D.versionEdition),
  impressumField("autor", D.authorValue),
  impressumField("kontakt", D.contactValue),
  impressumField("illustration", D.illustrationsValue),
  impressumField("lektorat", D.lektoratValue),
  impressumField("disclaimer", D.disclaimerBody),
  impressumField("copyrightprefix", D.copyrightLinePrefix),
  impressumField("copyrightjahr", D.copyrightYear),
  impressumField("copyrightname", D.copyrightHolder),
  impressumField("footerCreditsPrefix", D.footerCreditsPrefix),
  impressumField("footerWordTemplateLabel", D.footerWordTemplateLabel),
  impressumField("footerWordTemplateUrl", D.footerWordTemplateUrl),
  impressumField("footerCreditsSuffix", D.footerCreditsSuffix),
  "{{impressumPage}}"
].join("\n");

/** FR-013 / FR-013a: fünf Seiten mit Default-Hintergründen (Einband, Impressum, Inhalt, Rückseite). */
const DEFAULT_NEW_DOCUMENT = `# Einband
\\map{einband}
{{pageNumber 1}}

{{tocDepthH3}}

\\page
${IMPRESSUM_PAGE_BLOCK}

\\page
# Inhalt (Seite 3, image12)
{{footnote PART 2 | BORING STUFF}}

## Makro-Beispiele (direkt testen)

### Vorlesen (Pergament)
{{readAloudNote Zum Vorlesen oder Nacherzählen: |
Der Nebel liegt *schwer* über dem Moor. Irgendwo krächzt ein Rabe.
}}

### Meisterinformation (dunkel)
{{gmNote Meisterinformation: |
Hinter der Tür wartet nichts — die Geräusche kommen aus dem Schornstein (Fallenprobe INI).
}}

### NSC / Monster
{{npcBlock name=Demo-Monster / NSC portrait=/dsa/portrait.png groesse=2,00 Schritt gewicht=100 Stein mu=10 kl=10 in=10 ch=10 ff=10 ge=10 ko=10 kk=10 lep=100 ini=10+1W6 aw=6 rs=2 sk=0 zk=0 gs=10 angriff1=AT 14 TP 1W6+4 RW mittel angriff2=AT 10 TP 2W6+2 RW kurz aktionen=1 sonderfertigkeiten=Demo1, Demo2 talente=Schwimmen 2, Klettern 4 {{/npcBlock}}}

\\page
# Inhalt (Seite 4, image17)

\\page
# Rückseite
\\map{final}`;

const initialMarkdown = DEFAULT_NEW_DOCUMENT;

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app root element");
}

app.innerHTML = `
  <main class="layout">
    <section class="editor">
      <h1>DSABrew Renderer</h1>
      <div id="md-toolbar" class="md-toolbar-wrap"></div>
      <textarea id="markdown-input" spellcheck="false"></textarea>
      <button id="print-btn" class="print-btn" type="button">Print / PDF</button>
    </section>
    <section class="preview" id="preview"></section>
  </main>
`;

const input = document.querySelector<HTMLTextAreaElement>("#markdown-input");
const preview = document.querySelector<HTMLElement>("#preview");
const printButton = document.querySelector<HTMLButtonElement>("#print-btn");
const toolbarRoot = document.querySelector<HTMLElement>("#md-toolbar");

if (!input || !preview || !printButton || !toolbarRoot) {
  throw new Error("Failed to initialize app UI");
}

input.value = initialMarkdown;
attachMarkdownToolbar(toolbarRoot, input);

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function updatePreview(markdown: string): void {
  try {
    const result = renderDocument(markdown);
    preview.innerHTML = result.pages
      .map((page) => {
        const chrome = page.pageChromeClasses ? ` ${page.pageChromeClasses}` : "";
        const footerClass = page.bookFooter ? " a4-page--with-book-footer" : "";
        const footerHtml = page.bookFooter
          ? page.bookFooter.numberOnLeft
            ? `<footer class="book-footer-strip book-footer-strip--odd" aria-label="Fußzeile">
  <div class="book-footer-cluster book-footer-cluster--start" aria-hidden="true"></div>
  <span class="book-footer-title">${escapeHtml(page.bookFooter.title)}</span>
  <div class="book-footer-cluster book-footer-cluster--end book-footer-cluster--num-slot">
    <span class="book-footer-num">${page.bookFooter.pageNumber}</span>
  </div>
</footer>`
            : `<footer class="book-footer-strip book-footer-strip--even" aria-label="Fußzeile">
  <div class="book-footer-cluster book-footer-cluster--start book-footer-cluster--num-slot">
    <span class="book-footer-num">${page.bookFooter.pageNumber}</span>
  </div>
  <span class="book-footer-title">${escapeHtml(page.bookFooter.title)}</span>
  <div class="book-footer-cluster book-footer-cluster--end" aria-hidden="true"></div>
</footer>`
          : `<div class="page-number">${page.displayPageNumber}</div>`;
        return `
      <article class="a4-page${chrome}${footerClass}">
        <div class="page-body">${page.renderedHtml}</div>
        ${footerHtml}
      </article>
    `;
      })
      .join("");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    preview.innerHTML = `<aside class="preview-error" role="alert"><strong>Vorschau fehlgeschlagen</strong><pre>${escapeHtml(msg)}</pre></aside>`;
  }
}

input.addEventListener("input", () => updatePreview(input.value));
printButton.addEventListener("click", () => window.print());
updatePreview(input.value);
