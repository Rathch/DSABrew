/**
 * Toolbar für den Markdown-Editor: fügt Syntax ein bzw. markiert Auswahl — vergleichbar mit CKEditor/TinyMCE,
 * aber weiterhin reines Markdown für DSABrew.
 */

function dispatchInput(textarea: HTMLTextAreaElement): void {
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function wrapSelection(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  emptyPlaceholder: string
): void {
  const { selectionStart: start, selectionEnd: end, value } = textarea;
  const selected = value.slice(start, end);
  const inner = selected || emptyPlaceholder;
  const replacement = before + inner + after;
  textarea.value = value.slice(0, start) + replacement + value.slice(end);
  if (!selected) {
    const pos = start + before.length;
    const len = emptyPlaceholder.length;
    textarea.setSelectionRange(pos, pos + len);
  } else {
    textarea.setSelectionRange(start, start + replacement.length);
  }
  textarea.focus();
  dispatchInput(textarea);
}

function insertAtCursor(textarea: HTMLTextAreaElement, text: string): void {
  const { selectionStart: start, selectionEnd: end, value } = textarea;
  textarea.value = value.slice(0, start) + text + value.slice(end);
  const pos = start + text.length;
  textarea.setSelectionRange(pos, pos);
  textarea.focus();
  dispatchInput(textarea);
}

/** Zeilen, die die aktuelle Auswahl (oder Cursorzeile) schneiden. */
function getLineRange(value: string, selStart: number, selEnd: number): { start: number; end: number } {
  let lineStart = value.lastIndexOf("\n", selStart - 1) + 1;
  let lineEnd = value.indexOf("\n", Math.max(selEnd - 1, 0));
  if (lineEnd === -1) {
    lineEnd = value.length;
  }
  if (selEnd > selStart && value[selEnd - 1] === "\n") {
    lineEnd = selEnd - 1;
  }
  return { start: lineStart, end: lineEnd };
}

function transformSelectedLines(
  textarea: HTMLTextAreaElement,
  mapLine: (line: string, index: number) => string
): void {
  const { selectionStart: selStart, selectionEnd: selEnd, value } = textarea;
  const { start: blockStart, end: blockEnd } = getLineRange(value, selStart, selEnd);
  const block = value.slice(blockStart, blockEnd);
  const lines = block.split("\n");
  const next = lines.map((line, i) => mapLine(line, i)).join("\n");
  textarea.value = value.slice(0, blockStart) + next + value.slice(blockEnd);
  const len = next.length;
  textarea.setSelectionRange(blockStart, blockStart + len);
  textarea.focus();
  dispatchInput(textarea);
}

function setHeadingLevel(textarea: HTMLTextAreaElement, level: 1 | 2 | 3 | 4): void {
  const prefix = `${"#".repeat(level)} `;
  transformSelectedLines(textarea, (line) => {
    const t = line.replace(/^#{1,6}\s+/, "").trimEnd();
    return prefix + t;
  });
}

function toggleBulletList(textarea: HTMLTextAreaElement): void {
  transformSelectedLines(textarea, (line) => {
    const t = line.replace(/^(\s*[-*]|\s*\d+\.)\s+/, "").trimEnd();
    if (line.trim() === "") {
      return line;
    }
    return `- ${t}`;
  });
}

function toggleOrderedList(textarea: HTMLTextAreaElement): void {
  let n = 1;
  transformSelectedLines(textarea, (line) => {
    const t = line.replace(/^(\s*[-*]|\s*\d+\.)\s+/, "").trimEnd();
    if (line.trim() === "") {
      return line;
    }
    const row = `${n}. ${t}`;
    n += 1;
    return row;
  });
}

function toggleBlockquote(textarea: HTMLTextAreaElement): void {
  transformSelectedLines(textarea, (line) => {
    if (line.trim() === "") {
      return line;
    }
    const t = line.replace(/^>\s*/, "");
    return `> ${t}`;
  });
}

function insertCodeBlock(textarea: HTMLTextAreaElement): void {
  const start = textarea.selectionStart;
  const fence = "```\n\n```";
  insertAtCursor(textarea, fence);
  const inner = start + "```\n".length;
  textarea.setSelectionRange(inner, inner);
}

function insertLink(textarea: HTMLTextAreaElement): void {
  const url = window.prompt("Link-Ziel (URL):", "https://");
  if (url === null) {
    return;
  }
  const { selectionStart, selectionEnd, value } = textarea;
  const selected = value.slice(selectionStart, selectionEnd);
  if (selected.length > 0) {
    const link = `[${selected}](${url})`;
    textarea.value = value.slice(0, selectionStart) + link + value.slice(selectionEnd);
    textarea.setSelectionRange(selectionStart, selectionStart + link.length);
    textarea.focus();
    dispatchInput(textarea);
    return;
  }
  const label = window.prompt("Link-Text:", "Text");
  if (label === null) {
    return;
  }
  insertAtCursor(textarea, `[${label || "Text"}](${url})`);
}

const ACTIONS: {
  id: string;
  label: string;
  title: string;
  run: (ta: HTMLTextAreaElement) => void;
}[] = [
  {
    id: "bold",
    label: "B",
    title: "Fett (Strg+B)",
    run: (ta) => wrapSelection(ta, "**", "**", "Text")
  },
  {
    id: "italic",
    label: "I",
    title: "Kursiv (Strg+I)",
    run: (ta) => wrapSelection(ta, "*", "*", "Text")
  },
  {
    id: "strike",
    label: "S",
    title: "Durchgestrichen",
    run: (ta) => wrapSelection(ta, "~~", "~~", "Text")
  },
  {
    id: "code",
    label: "</>",
    title: "Code",
    run: (ta) => wrapSelection(ta, "`", "`", "code")
  },
  {
    id: "link",
    label: "🔗",
    title: "Link (Strg+K)",
    run: insertLink
  },
  { id: "sep1", label: "|", title: "", run: () => {} },
  {
    id: "h1",
    label: "H1",
    title: "Überschrift 1",
    run: (ta) => setHeadingLevel(ta, 1)
  },
  {
    id: "h2",
    label: "H2",
    title: "Überschrift 2",
    run: (ta) => setHeadingLevel(ta, 2)
  },
  {
    id: "h3",
    label: "H3",
    title: "Überschrift 3",
    run: (ta) => setHeadingLevel(ta, 3)
  },
  {
    id: "h4",
    label: "H4",
    title: "Überschrift 4",
    run: (ta) => setHeadingLevel(ta, 4)
  },
  { id: "sep2", label: "|", title: "", run: () => {} },
  {
    id: "ul",
    label: "• Liste",
    title: "Aufzählung",
    run: toggleBulletList
  },
  {
    id: "ol",
    label: "1. Liste",
    title: "Nummerierte Liste",
    run: toggleOrderedList
  },
  {
    id: "quote",
    label: "„ Zitat",
    title: "Zitat",
    run: toggleBlockquote
  },
  {
    id: "fence",
    label: "{ }",
    title: "Code-Block",
    run: insertCodeBlock
  },
  { id: "sep3", label: "|", title: "", run: () => {} },
  {
    id: "hr",
    label: "—",
    title: "Trennlinie (---) — Scriptorium-Grafik in der Vorschau",
    run: (ta) => insertAtCursor(ta, "\n\n---\n\n")
  },
  {
    id: "page",
    label: "Seite",
    title: "Seitenumbruch (\\page)",
    run: (ta) => insertAtCursor(ta, "\n\\page\n")
  },
  {
    id: "pageAlias",
    label: "{{page}}",
    title: "Seitenumbruch (Alias)",
    run: (ta) => insertAtCursor(ta, "\n{{page}}\n")
  },
  {
    id: "pageSingle",
    label: "1 Spalte",
    title: "Seite ohne Zweispaltigkeit (\\pageSingle / {{pageSingle}}) — folgende Seite einspaltig",
    run: (ta) => insertAtCursor(ta, "\n\\pageSingle\n")
  },
  { id: "sep4", label: "|", title: "", run: () => {} },
  {
    id: "readAloudNote",
    label: "Vorlesen",
    title: "Pergament-Box ({{readAloudNote Titel | Text}})",
    run: (ta) =>
      insertAtCursor(
        ta,
        "\n\n{{readAloudNote Zum Vorlesen oder Nacherzählen: |\nHier *kursiver* Vorlesetext.\n}}\n\n"
      )
  },
  {
    id: "gmNote",
    label: "SL-Info",
    title: "Meister-Box ({{gmNote Titel | Text}})",
    run: (ta) =>
      insertAtCursor(ta, "\n\n{{gmNote Meisterinformation: |\nGeheime Infos für die Spielleitung.\n}}\n\n")
  },
  {
    id: "roulbox",
    label: "Regel",
    title: "Regel-Kasten ({{roulbox Titel | Untertitel | Markdown}}; Untertitel leer: Titel | | Text)",
    run: (ta) =>
      insertAtCursor(
        ta,
        "\n\n{{roulbox Regeltitel | Optionaler Untertitel |\nFließtext mit **Zwischenüberschrift** und Liste:\n\n- Punkt eins\n- Punkt zwei\n}}\n\n"
      )
  },
  {
    id: "easier",
    label: "Leichter",
    title: "Optional leichter ({{easier | Markdown}})",
    run: (ta) =>
      insertAtCursor(
        ta,
        "\n\n{{easier |\n*Leichter-Symbol:* Zur Erleichterung einer Szene kannst du die Vorschläge der so markierten Abschnitte übernehmen.\n}}\n\n"
      )
  },
  {
    id: "harder",
    label: "Schwerer",
    title: "Optional schwerer ({{harder | Markdown}})",
    run: (ta) =>
      insertAtCursor(
        ta,
        "\n\n{{harder |\n*Schwerer-Symbol:* Braucht die Gruppe mehr Herausforderung? Mit den Hinweisen der so markierten Abschnitte kannst du eine Situation erschweren.\n}}\n\n"
      )
  },
  {
    id: "chess",
    label: "Figur",
    title: "Schachfigur inline ({{ chess | pawn }} — pawn, rook, knight, bishop, queen, king …)",
    run: (ta) => insertAtCursor(ta, "{{ chess | pawn }}")
  },
  {
    id: "difficulty",
    label: "Rauten",
    title:
      "Schwierigkeit 0–4 ({{ difficulty | rot 2 }}, {{ difficulty | Kapitel: | grün 3 }} mit optionalem Text vor den Rauten)",
    run: (ta) => insertAtCursor(ta, "{{ difficulty | Kampf: | grün 2 }}")
  },
  {
    id: "npcBlock",
    label: "NSC",
    title:
      "NSC-/Monster-Kasten ({{npcBlock … {{/npcBlock}}); gleiche Syntax wie Renderer — optional einzeilig, empfohlen mehrzeilig",
    run: (ta) =>
      insertAtCursor(
        ta,
        `

{{npcBlock
name=Lorem-Riese / NSC
portrait=/dsa/portrait.png
groesse=2,00 Schritt
gewicht=100 Stein
mu=12 kl=11 in=10 ch=9 ff=10 ge=11 ko=12 kk=11
lep=110 ini=11+1W6 aw=7 rs=3 sk=1 zk=0 gs=11
angriff1=AT 13 TP 1W6+3 RW mittel
angriff2=AT 11 TP 1W6+2 RW kurz
aktionen=2
sonderfertigkeiten=Lorem I, Ipsum II
talente=Schwimmen 3, Klettern 2
{{/npcBlock}}

`
      )
  }
];

function isSeparator(id: string): boolean {
  return id.startsWith("sep");
}

/**
 * Baut die Toolbar unter `container` und verdrahtet `textarea`.
 */
export function attachMarkdownToolbar(
  container: HTMLElement,
  textarea: HTMLTextAreaElement
): void {
  container.classList.add("md-toolbar");
  container.setAttribute("role", "toolbar");
  container.setAttribute("aria-label", "Markdown-Formatierung");

  for (const action of ACTIONS) {
    if (isSeparator(action.id)) {
      const sep = document.createElement("span");
      sep.className = "md-toolbar-sep";
      sep.setAttribute("aria-hidden", "true");
      container.appendChild(sep);
      continue;
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "md-toolbar-btn";
    btn.id = `md-tool-${action.id}`;
    btn.textContent = action.label;
    btn.title = action.title;
    btn.addEventListener("click", () => action.run(textarea));
    container.appendChild(btn);
  }

  textarea.addEventListener("keydown", (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) {
      return;
    }
    if (e.key === "b" || e.key === "B") {
      e.preventDefault();
      wrapSelection(textarea, "**", "**", "Text");
    } else if (e.key === "i" || e.key === "I") {
      e.preventDefault();
      wrapSelection(textarea, "*", "*", "Text");
    } else if (e.key === "k" || e.key === "K") {
      e.preventDefault();
      insertLink(textarea);
    }
  });
}
