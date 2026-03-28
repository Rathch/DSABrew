import "./style.css";
import listBulletUrl from "@media/image1.png?url";
import { DEFAULT_MARKDOWN_DEMO } from "./default-markdown-demo";
import { attachMarkdownToolbar } from "./markdown-toolbar";
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    preview.innerHTML = `<aside class="preview-error" role="alert"><strong>Vorschau fehlgeschlagen</strong><pre>${escapeHtml(msg)}</pre></aside>`;
  }
}

input.addEventListener("input", () => updatePreview(input.value));
printButton.addEventListener("click", () => window.print());
updatePreview(input.value);
