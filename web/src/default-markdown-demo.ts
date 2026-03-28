import { DEFAULT_IMPRESSUM_DATA } from "./impressum-config";

/** `{{impressumField key=value}}` — Wert darf kein `}` enthalten (Makrosyntax). */
function impressumField(key: string, value: string): string {
  if (value.includes("}")) {
    throw new Error(`impressumField ${key}: value must not contain "}"`);
  }
  return `{{impressumField ${key}=${value}}}`;
}

const D = DEFAULT_IMPRESSUM_DATA;

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

/**
 * Standard-Markdown beim App-Start: alle Makros + typische Markdown-Elemente.
 * **Bei neuen Makros:** hier ein kurzes Lorem-Beispiel ergänzen; bei Bedarf neue \`\\page\`-Abschnitte.
 */
export const DEFAULT_MARKDOWN_DEMO = `# Abenteuerliche Beschreibung

## EINBAND (Demo)
\\map{einband}
{{pageNumber 1}}

Lorem ipsum dolor sit amet, consectetur adipiscing elit. **Fett**, *kursiv*, [externer Link](https://example.com). Kurzer Einbandtext.

\\page
${IMPRESSUM_PAGE_BLOCK}

\\page
\\map{content-even}
# Markdown-Referenz

{{tocDepthH3}}

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.

## Überschrift Ebene Zwei

Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Fußnote im Fließtext.{{footnote FN-1 | Lorem ipsum Fußnotentext — erläuternd und kurz.}}

### Überschrift Ebene Drei

Weitere *Lorem*-Absätze mit **Kontrast** und \`Inline-Code\`.

#### Überschrift Ebene Vier

Kleinere Überschrift für feine Struktur.

> Blockzitat: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum euismod nisl at lacus tincidunt.

Horizontale Linie (Trennlinie-Grafik):

---

Ungeordnete Liste:

- Erster Punkt mit Lorem
- Zweiter Punkt
  - Unterpunkt (eingerückt)
- Dritter Punkt

Geordnete Liste:

1. Schritt eins (Lorem)
2. Schritt zwei
3. Schritt drei

Code-Block:

\`\`\`text
// Lorem-Beispiel
function lorem(ipsum: string): string {
  return ipsum + " dolor";
}
\`\`\`

\\page
\\map{content-odd}
# Makros — Vorlesen und Meister

## Anker Linkziel

Absatz als Ziel für interne Sprünge (Lorem ipsum).

{{readAloudNote Vorlesen (Lorem): |
*Lorem ipsum* dolor sit amet. Zweiter Absatz mit **Hervorhebung** und einem Listenbeispiel:

- Alpha
- Beta
}}

{{vorlesenNote Kurz-Vorlesen: |
Nur ein kurzer *vorlesenNote*-Alias-Block mit Lorem.
}}

{{gmNote Meisterinformation (Lorem): |
Hintergrund für die SL: *Lorem ipsum* — Geheimnis, Falle oder Hinweis. Horizontale Trennung im Kasten:

---

Zweiter Absatz im Meister-Block.
}}

{{meisterNote Notiz (Alias meisterNote): |
Kurzer *meisterNote*-Test mit Lorem ipsum.
}}

{{easier |
*Leichter-Symbol:* Zur Erleichterung einer bestimmten Szene kannst du die Vorschläge der so markierten Abschnitte übernehmen.
}}

{{harder |
*Schwerer-Symbol:* Deine Heldengruppe braucht eine größere Herausforderung? Mit den Hinweisen der so markierten Abschnitte kannst du eine Situation erschweren.
}}

Beispiel Schachfiguren im Fließtext: {{ chess | pown }} Bauer, {{ chess | rook }} Turm, {{ chess | knight }} Springer, {{ chess | bishop }} Läufer.

Schwierigkeit (vier Rauten, rot = vergeben mit Bild 6 / leer mit 5; grün = vergeben mit Bild 3 / leer mit 5): {{ difficulty | rot 2 }} {{ difficulty | grün 4 }} Mit Beschriftung: {{ difficulty | Kampf: | grün 4 }}

Interner Link zurück zur ersten Inhaltsseite: [zur Markdown-Referenz](#p3-markdown-referenz)

\\page
\\map{content-even}
# NSC / Monster (Demo)

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

\\page
\\map{final}
# RÜCKSEITE (Abschluss)

## Abschlusstext

Dieser Bereich liegt in der Vorschau **links neben der Karte** und **unter dem Logo** (Padding an \`page-bg-final\`). Lorem ipsum dolor sit amet — Abschlussseite mit \`\\map{final}\`. **Keine Seitenzahl** auf der Rückseite.

Interner Sprung: [zu „Anker Linkziel“ auf Seite 4](#p4-anker-linkziel)
`;
