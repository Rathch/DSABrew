import "./style.css";
import listBulletUrl from "@media/image1.png?url";
import { DEFAULT_MARKDOWN_DEMO } from "./default-markdown-demo";
import { attachMarkdownToolbar } from "./markdown-toolbar";
import { exportPreviewToPdf } from "./pdf-export";
import { renderDocument } from "./renderer";

document.documentElement.style.setProperty(
  "--dsa-list-bullet-url",
  `url(${JSON.stringify(listBulletUrl)})`
);

const initialMarkdown = DEFAULT_MARKDOWN_DEMO;

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
      <button id="pdf-btn" class="print-btn" type="button">PDF speichern</button>
    </section>
    <section class="preview" id="preview"></section>
  </main>
`;

const input = document.querySelector<HTMLTextAreaElement>("#markdown-input");
const preview = document.querySelector<HTMLElement>("#preview");
const pdfButton = document.querySelector<HTMLButtonElement>("#pdf-btn");
const toolbarRoot = document.querySelector<HTMLElement>("#md-toolbar");

if (!input || !preview || !pdfButton || !toolbarRoot) {
  throw new Error("Failed to initialize app UI");
}

input.value = initialMarkdown;
attachMarkdownToolbar(toolbarRoot, input);

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Inhaltsverzeichnis: Anker (#p{Seite}-{slug}) liegen in der scrollbaren Vorschau — ohne diesen Handler
 * scrollt der Browser oft nur das Dokument, nicht `.preview`.
 */
function scrollPreviewToElementById(id: string, behavior: ScrollBehavior): void {
  const el = document.getElementById(id);
  if (!el || !preview.contains(el)) {
    return;
  }
  el.scrollIntoView({ behavior, block: "start" });
}

let firstPreviewDone = false;

function updatePreview(markdown: string): void {
  try {
    const result = renderDocument(markdown);
    preview.innerHTML = result.pages
      .map((page) => {
        const chrome = page.pageChromeClasses ? ` ${page.pageChromeClasses}` : "";
        const singleCol = page.singleColumn ? " a4-page--single-column" : "";
        const footerClass = page.bookFooter ? " a4-page--with-book-footer" : "";
        const footerParity =
          page.bookFooter != null
            ? page.displayPageNumber % 2 === 0
              ? "book-footer-strip--even"
              : "book-footer-strip--odd"
            : "";
        const hidePageNumber = page.mapKey === "final";
        const footerHtml = page.bookFooter
          ? `<footer class="book-footer-strip ${footerParity}" aria-label="Fußzeile">
  <div class="book-footer-cluster book-footer-cluster--start book-footer-cluster--num-slot">
    <span class="book-footer-num">${String(page.bookFooter.pageNumber).padStart(2, "0")}</span>
  </div>
  <span class="book-footer-title">${escapeHtml(page.bookFooter.title)}</span>
  <div class="book-footer-cluster book-footer-cluster--end" aria-hidden="true"></div>
</footer>`
          : hidePageNumber
            ? ""
            : `<div class="page-number page-number--${page.displayPageNumber % 2 === 0 ? "even" : "odd"}">${String(page.displayPageNumber).padStart(2, "0")}</div>`;
        return `
      <article class="a4-page${chrome}${singleCol}${footerClass}">
        <div class="page-body">${page.renderedHtml}</div>
        ${footerHtml}
      </article>
    `;
      })
      .join("");
    if (!firstPreviewDone) {
      firstPreviewDone = true;
      const hash = window.location.hash;
      if (hash.length > 1) {
        const id = decodeURIComponent(hash.slice(1));
        requestAnimationFrame(() => scrollPreviewToElementById(id, "auto"));
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    preview.innerHTML = `<aside class="preview-error" role="alert"><strong>Vorschau fehlgeschlagen</strong><pre>${escapeHtml(msg)}</pre></aside>`;
  }
}

preview.addEventListener("click", (e: MouseEvent) => {
  if (e.button !== 0) {
    return;
  }
  if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
    return;
  }
  const target = e.target as Element | null;
  const link = target?.closest("a");
  if (!link || !preview.contains(link) || !link.classList.contains("toc-line")) {
    return;
  }
  const href = link.getAttribute("href");
  if (!href || !href.startsWith("#") || href.length < 2) {
    return;
  }
  const id = decodeURIComponent(href.slice(1));
  if (!id) {
    return;
  }
  const el = document.getElementById(id);
  if (!el || !preview.contains(el)) {
    return;
  }
  e.preventDefault();
  scrollPreviewToElementById(id, "smooth");
  const path = `${window.location.pathname}${window.location.search}`;
  try {
    window.history.replaceState(null, "", `${path}${href}`);
  } catch {
    /* ignore */
  }
});

window.addEventListener("hashchange", () => {
  const h = window.location.hash;
  if (h.length > 1) {
    scrollPreviewToElementById(decodeURIComponent(h.slice(1)), "smooth");
  }
});

input.addEventListener("input", () => updatePreview(input.value));

pdfButton.addEventListener("click", async () => {
  const prevLabel = pdfButton.textContent;
  pdfButton.disabled = true;
  pdfButton.textContent = "PDF wird erstellt…";
  try {
    await exportPreviewToPdf(preview, {
      onProgress: (cur, tot) => {
        pdfButton.textContent = `PDF… Seite ${cur}/${tot}`;
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    window.alert(`PDF-Export fehlgeschlagen:\n${msg}`);
  } finally {
    pdfButton.disabled = false;
    pdfButton.textContent = prevLabel ?? "PDF speichern";
  }
});

updatePreview(input.value);
