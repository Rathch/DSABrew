/**
 * Inhalt für `/anleitung` — Anwenderhandbuch (nur Deutsch), statisches HTML.
 */

export const ANLEITUNG_BODY_HTML = `
<div class="legal-prose legal-prose-flow">
  <p class="legal-callout">
    Diese Seite richtet sich an <strong>Autorinnen und Autoren</strong>, die mit DSABrew Scriptorium-nah formatierte
    Abenteuer und Texte schreiben. Es geht um Bedienung, Markdown und die eingebauten Makros — nicht um Server- oder
    Hosting-Administration.
  </p>

  <h2 class="legal-h2">1. Überblick</h2>
  <p>
    DSABrew zeigt links (bzw. oben im schmalen Layout) den <strong>Markdown-Quelltext</strong> und rechts die
    <strong>Vorschau</strong> wie auf einer A4-Seite. Sie schreiben durchgehend in <strong>einer</strong> Datei;
    Seiten entstehen durch <code>\\page</code> bzw. <code>{{page}}</code> — nicht durch mehrere Dateien.
    Im Bearbeitungsmodus wird der Text regelmäßig automatisch gespeichert.
  </p>
  <p>
    <strong>Typischer Ablauf:</strong> Überschriften und Fließtext wie gewohnt in Markdown setzen, Sonderkästen und
    Hintergründe mit den Makros aus Abschnitt 5 einfügen, in der Vorschau prüfen, ob Abstände und Seitenumbrüche passen,
    anschließend <strong>PDF speichern</strong> für eine druckfertige Datei. Über <strong>Teilen</strong> erhalten Sie
    Links für Nur-Lesen oder Bearbeiten (z. B. für Korrektorinnen oder die Spielrunde).
  </p>

  <h2 class="legal-h2">2. Kopfzeile und Navigation</h2>
  <p>
    Die Funktionen in der Kopfzeile ergänzen das Schreiben im Editor: Sie brauchen sie, sobald Sie das Dokument
    weitergeben, drucken oder parallel an einem zweiten Text arbeiten möchten.
  </p>
  <ul>
    <li><strong>Teilen: Nur Ansicht</strong> — kopiert die Leser-URL; Empfänger sehen die Vorschau, bearbeiten aber nicht.</li>
    <li><strong>Teilen: Bearbeiten</strong> — kopiert die Bearbeiten-URL (nur sichtbar, wenn Sie selbst im Edit-Modus sind).</li>
    <li><strong>PDF speichern</strong> — erzeugt aus der <em>aktuell sichtbaren</em> Vorschau ein PDF (Seite für Seite wie auf dem Bildschirm).</li>
    <li><strong>Neues Dokument</strong> — startet ein weiteres Dokument in einem <strong>neuen Tab</strong>; das aktuelle bleibt offen.</li>
    <li><strong>Hell / Dunkel / System</strong> — Darstellung der Oberfläche; die Einstellung bleibt im Browser (<code>dsabrew-theme</code>).</li>
    <li><strong>Scroll koppeln</strong> — bei geteilter Ansicht bewegen sich Editor und Vorschau gemeinsam, sodass Sie Quelltext und Layout gleichzeitig verfolgen können.</li>
  </ul>

  <h2 class="legal-h2">3. Ansicht: Beides, Nur Markdown, Nur Vorschau</h2>
  <p>
    Unter <strong>Ansicht</strong> steuern Sie, wie viel Platz der Editor und die Vorschau bekommen:
    <strong>Beides</strong> zeigt Markdown und A4-Vorschau nebeneinander (ideal zum Formatieren).
    <strong>Nur Markdown</strong> nutzen Sie, wenn Sie sich auf den Rohtext konzentrieren wollen;
    <strong>Nur Vorschau</strong>, wenn Sie das Dokument wie eine PDF-Seite lesen möchten, ohne den Quelltext zu sehen.
  </p>
  <p>
    Auf schmalen Bildschirmen entfällt „Beides“; Sie wechseln dann zwischen den beiden Panels.
    Die zuletzt gewählte Ansicht merkt sich der Browser (<code>dsabrew-hosted-view</code>).
  </p>

  <h2 class="legal-h2">4. Markdown-Werkzeugleiste und Tastenkürzel</h2>
  <p>
    Die Leiste über dem Editor fügt an der Cursorposition (oder um die Markierung) typische Markdown-Konstrukte ein —
    Sie müssen die Zeichenfolgen nicht auswendig kennen. Viele Buttons öffnen zugleich eine <strong>Vorschau des Effekts</strong>
    in einem kleinen Hilfefenster (Tooltip), bevor Sie etwas einfügen.
  </p>
  <p>Tastenkürzel (Strg auf Windows/Linux, Cmd auf dem Mac):</p>
  <ul>
    <li><strong>Strg+B</strong> — Fett (<code>**Text**</code>)</li>
    <li><strong>Strg+I</strong> — Kursiv (<code>*Text*</code>)</li>
    <li><strong>Strg+K</strong> — Link einfügen (<code>[Text](URL)</code>)</li>
  </ul>
  <p>
    Weitere Buttons (Auswahl): Überschriften H1–H4, Listen, Zitat, Code-Block, Tabelle, Bild per externer URL, Trennlinie
    (<code>---</code>), Seitenumbruch (<code>\\page</code>), einspaltige Seite (<code>\\pageSingle</code> bzw.
    <code>{{pageSingle}}</code>) sowie Menüs für die Scriptorium-Makros (Abschnitt 5). Wenn Sie unsicher sind, zuerst
    die Toolbar-Vorlage einfügen und den Platzhaltertext anpassen — so bleibt die Syntax korrekt.
  </p>

  <h2 class="legal-h2">5. Makros und Scriptorium-Elemente</h2>
  <p>
    <strong>Gemeinsame Syntax:</strong> Die meisten Blöcke nutzen doppelte geschweifte Klammern und trennen Felder mit
    einem senkrechten Strich <code>|</code>, z. B. <code>{{gmNote Titel | hier folgt der Fließtext}}</code>.
    Der Text <em>nach</em> dem ersten <code>|</code> ist oft vollwertiges Markdown (Absätze, Listen, Fettung).
    Achten Sie darauf, das Makro nicht vorzeitig zu beenden: ein wörtliches <code>}}</code> im falschen Feld schließt das Makro —
    bei langen Inhalten lieber Absätze und Listen nutzen als geschweifte Klammern im Freitext.
  </p>
  <p>
    <strong>Backslash-Direktiven</strong> (<code>\\page</code>, <code>\\map{…}</code>, <code>\\rauten{…}</code>) stehen wie
    normale Markdown-Zeilen im Quelltext; üblicherweise <strong>eine Direktive pro Zeile</strong>, damit die Aufteilung in Seiten
    klar bleibt. Die Toolbar fügt passende Vorlagen ein; die Button-Tooltips ergänzen diese Seite.
  </p>

  <p><strong>5.1 Seiten und Nummerierung</strong></p>
  <p>
    Jeder Abschnitt zwischen zwei <code>\\page</code>-Markern (bzw. zwischen Dokumentanfang und erstem Umbruch) wird zu
    <strong>einer Vorschau-Seite</strong>. Schreiben Sie also zuerst den Inhalt der Titelseite, dann eine Zeile <code>\\page</code>,
    dann den Inhalt der nächsten Seite — analog zu Kapiteln in einem Textverarbeitungsprogramm, nur mit explizitem Befehl.
  </p>
  <ul>
    <li>
      <strong><code>\\page</code></strong> — neue A4-Seite. Mehrere <code>\\page</code> direkt hintereinander erzeugen bewusst
      <strong>leere Seiten</strong> (z. B. für bewusst freigelassene Rückseiten). Ein komplett leeres Dokument erzeugt dennoch
      genau eine Seite.
    </li>
    <li>
      <strong><code>{{page}}</code></strong> — gleiche Wirkung wie <code>\\page</code>; praktisch, wenn Sie lieber überall die
      gleiche <code>{{…}}</code>-Syntax verwenden möchten.
    </li>
    <li>
      <strong><code>\\pageSingle</code></strong> / <strong><code>{{pageSingle}}</code></strong> — beendet die aktuelle Seite und
      markiert die <em>nächste</em> Seite als <strong>einspaltig</strong>. Nutzen Sie das für breite Tabellen, lange NSC-Kästen
      oder Szenen, die nicht in zwei Spalten gebrochen werden sollen. Die Seite <em>vor</em> dem Makro bleibt zweispaltig (sofern
      nicht schon einspaltig).
    </li>
    <li>
      <strong><code>{{pageNumber N}}</code></strong> — legt fest, mit welcher Zahl die <strong>erste</strong> Seite in der Vorschau
      und im PDF gezählt wird (<code>N</code> = positive Ganzzahl). Jede folgende Seite ist +1. Das ist relevant für
      <strong>Inhaltsverzeichnis</strong>, <strong>Sprungmarken</strong> (<code>#p3-…</code>) und die <strong>automatische
      Hintergrund-Abwechslung</strong> bei fehlendem <code>\\map</code>. Setzen Sie <code>{{pageNumber …}}</code> am besten
      ganz an den Anfang des Dokuments, bevor die erste sichtbare Überschrift steht.
    </li>
  </ul>
  <p>Beispiel für einen einfachen Aufbau (Titelseite, dann Inhalt, dann einspaltige Seite):</p>
  <pre class="legal-snippet">{{pageNumber 1}}
# Name des Abenteuers
\\map{einband hell}

Kurztext oder Stichworte auf dem Einband …

\\page
## 1 Die Ankunft
Hier beginnt der zweispaltige Fließtext …

\\pageSingle
## Anhang A
Breite Tabelle oder langer Block nur in einer Spalte …</pre>

  <p><strong>5.2 Vollflächen-Hintergrund: <code>\\map{…}</code></strong></p>
  <p>
    Schreiben Sie <code>\\map{schlüssel}</code> irgendwo in den <strong>Seiteninhalt</strong> dieser Seite (oft direkt unter
    der Überschrift oder am Seitenanfang). Es gilt immer nur für die Seite, in der das Makro vorkommt — nicht für das ganze
    Dokument. Für eine neue Hintergrundwahl folgt in der Regel ein <code>\\page</code> und auf der neuen Seite ein neues
    <code>\\map{…}</code> oder die automatische Inhaltstextur.
  </p>
  <p>Zulässige <strong>Basisschlüssel</strong> (klein, optional ein zweites Token nur bei Einband):</p>
  <ul>
    <li>
      <strong><code>einband</code></strong> (Alias <strong><code>cover</code></strong>) — Titelseite. Ohne Ergänzung: dunkle
      Variante mit Banner-Texturen. Mit <code>hell</code>, <code>heller</code> oder <code>light</code>: helle Mitte, dunkle
      Schrift wie auf Inhaltsseiten. Mit <code>dunkel</code> oder <code>dark</code>: wie die Standard-Einband-Optik.
      Alternativ <strong>genau eine</strong> Hex-Farbe <code>#rrggbb</code> oder <code>#rgb</code> als zweites Token:
      einfarbiger Hintergrund ohne die Standard-Banner; die Schriftfarbe passt sich der Helligkeit an.
      Mehr als ein Zusatzwort (z. B. <code>einband hell extra</code>) ist ungültig.
    </li>
    <li>
      <strong><code>content-even</code></strong> / <strong><code>content-odd</code></strong> — setzen explizit eine der beiden
      Inhaltstexturen. Praktisch, wenn die automatische Zuordnung zu Ihrer gewünschten Zählung nicht passt oder Sie eine Seite
      „wie gerade“ aussehen lassen wollen, obwohl die Nummer ungerade ist.
    </li>
    <li><strong><code>final</code></strong> — für eine letzte Seite, Rückseite oder Epilog mit passender Grafik.</li>
  </ul>
  <p>
    <strong>Automatik ohne <code>\\map</code>:</strong> Wenn Sie auf einer Seite kein <code>\\map</code> setzen, wählt DSABrew
    abwechselnd die beiden Inhaltshintergründe nach der <strong>angezeigten</strong> Seitenzahl: ungerade Seite wie
    <code>content-even</code>, gerade wie <code>content-odd</code>. So wirken aufeinanderfolgende Textseiten wie im
    Scriptorium-Layout. Sobald Sie einmal ein <code>\\map</code> setzen, gilt genau diese Vorgabe — die Automatik entfällt
    für diese Seite.
  </p>
  <p>
    Bei Tippfehlern im Schlüssel, falsch verschachtelten Klammern oder ungültigen Einband-Kombinationen zeigt die Vorschau
    Warnungen; korrigieren Sie die Zeile und prüfen Sie erneut.
  </p>
  <pre class="legal-snippet">\\map{cover hell}
# Titel

\\page
\\map{content-odd}
## Kapitelstart …

\\page
\\map{final}
## Danksagung</pre>

  <p><strong>5.3 Rauten-Overlay: <code>\\rauten{…}</code></strong></p>
  <p>
    Unabhängig von <code>\\map</code> können Sie eine <strong>Rauten-Textur</strong> über die Seite legen — z. B. für
    dekorative Kapitelseiten. Erlaubt sind nur <strong><code>default</code></strong> (Standard-Dichte) und
    <strong><code>dense</code></strong> (engeres Muster). Schreiben Sie die Zeile auf dieselbe Seite wie den sichtbaren Inhalt;
    Kombination mit <code>\\map{…}</code> ist möglich, sofern beide Zeilen gültig sind.
  </p>
  <pre class="legal-snippet">\\map{content-even}
\\rauten{dense}

### Neues Kapitel
Text …</pre>

  <p><strong>5.4 Fußnoten</strong></p>
  <p>
    Fußnoten sind <strong>pro Seite</strong> gebündelt: Jede Referenz erscheint im Fließtext, die Erklärungen stehen unten auf
    derselben Vorschau-Seite. So bleibt der Druck lesbar, ohne am Dokumentende blättern zu müssen.
  </p>
  <ul>
    <li>
      <strong><code>{{footnote LABEL | INHALT}}</code></strong> — <code>LABEL</code> ist der sichtbare Verweis (z. B.
      <code>*</code>, <code>1</code>, <code>a</code>); <code>INHALT</code> ist der Fußnotentext als <strong>reiner Text</strong>
      (wird in der Vorschau nicht als Markdown interpretiert). Leerzeichen um <code>|</code> sind erlaubt.
    </li>
  </ul>
  <p>
    Setzen Sie die Fußnote <strong>direkt an die Stelle im Satz</strong>, an der die Referenz erscheinen soll. Innerhalb von
    <code>{{readAloudNote …}}</code> / <code>{{gmNote …}}</code> werden Fußnoten ebenfalls unterstützt — nützlich für
    Quellenhinweise in SL-Boxen.
  </p>
  <pre class="legal-snippet">Die Legende der Statue{{footnote 1 | Vergleiche WdW Kapitel …}} ist älter als die Stadt.</pre>

  <p><strong>5.5 Impressum</strong></p>
  <p>
    Das Impressum ist ein <strong>fertig gestalteter Block</strong> (Überschriften, Version, Autor, Disclaimer usw.). Sie
    füllen ihn, indem Sie einzelne Felder setzen und anschließend die Impressum-Seite einbinden — vergleichbar mit
    „Seriendaten“ in einer Vorlage.
  </p>
  <ul>
    <li>
      <strong><code>{{impressumField schlüssel=wert}}</code></strong> — weist einem Feld einen Text zu. Pro Zeile ein Makro
      oder mehrere untereinander; <strong>der letzte Treffer im gesamten Dokument</strong> gewinnt pro Schlüssel (globale
      Überschreibung). Schlüssel können englische API-Namen (<code>authorValue</code>) oder deutsche Kurzformen
      (<code>autor=…</code>) sein — vollständige Liste in <code>web/src/impressum-field-aliases.ts</code>.
    </li>
    <li>
      <strong><code>{{impressumPage}}</code></strong> — muss auf einer <strong>eigenen Seite</strong> stehen, die nur dieses
      Makro (plus optional davor die <code>impressumField</code>-Zeilen) enthalten soll. Alles andere Markdown auf derselben
      Seite wird für den normalen Fließtext <strong>nicht</strong> ausgegeben — planen Sie also: Seitenumbruch, Felder setzen,
      <code>{{impressumPage}}</code>, dann <code>\\page</code> für den eigentlichen Abenteuertext.
    </li>
  </ul>
  <pre class="legal-snippet">\\page
{{impressumField autor=Max Mustermann}}
{{impressumField version=1.0}}
{{impressumPage}}

\\page
## 1 Prolog
…</pre>

  <p><strong>5.6 Inhaltsverzeichnis</strong></p>
  <p>
    <strong><code>{{tocDepthH3}}</code></strong> zieht alle <code>#</code>- bis <code>###</code>-Überschriften aus dem
    <strong>gesamten</strong> Dokument und rendert daraus an der Makro-Position ein klickbares Inhaltsverzeichnis (in der
    Vorschau/PDF wie ein Block über die volle Breite). Typische Platzierung: nach Einband oder Impressum, noch vor dem ersten
    großen Kapitel — oft zusammen mit einer einspaltigen Seite, damit das TOC nicht in zwei Spalten zerfasert.
  </p>
  <pre class="legal-snippet">\\pageSingle
{{tocDepthH3}}

\\page
## 1 Die Reise beginnt
…</pre>

  <p><strong>5.7 Weitere Blöcke — Nutzung im Detail</strong></p>

  <p><strong>Abschnittsverweis</strong> — <code>{{abschnitt N | Anzeigetext}}</code></p>
  <p>
    Für Solo-Abenteuer mit nummerierten Kapiteln: <code>N</code> ist die Kapitelnummer wie in einer H2-Zeile
    <code>## 5. Titel</code> oder <code>## 5 Titel</code>. Der <code>Anzeigetext</code> ist Markdown-Inline für den Link
    (z. B. <code>{{abschnitt 5 | **Kapitel 5** aufrufen}}</code>). Leerer Text → Standard wie „Abschnitt 5“. Verwenden Sie
    dieses Makro <strong>nicht</strong> innerhalb der Körper von Vorlesen-, SL- oder Roulbox-Blöcken — dort wird es nicht
    expandiert. Wenn die Nummer im Dokument nicht vorkommt, sehen Sie einen Platzhalter in der Vorschau.
  </p>

  <p><strong>Vorlesetext</strong> — <code>{{readAloudNote Titel | Inhalt}}</code> (<strong>Alias</strong> <code>vorlesenNote</code>)</p>
  <p>
    Der Block fasst Text, den die Spielleitung laut vorlesen oder nacherzählen soll. Vor dem ersten <code>|</code> steht die
    Überschrift (leer → Standard „Zum Vorlesen oder Nacherzählen:“); danach folgt normaler Markdown-Fließtext mit Absätzen,
    Listen und Hervorhebungen. Ideal für atmosphärische Boxen mitten im zweispaltigen Text — der Kasten nutzt die volle
    Inhaltsbreite der Spaltenlogik wie in der Spezifikation beschrieben.
  </p>
  <pre class="legal-snippet">{{readAloudNote Die Tür | Die Angel *quietscht*. Hinter der Tür liegt nur Dunkelheit.

- Erfolgsprobe: keine Geräusche
- Misslingen: Wache wird aufmerksam}}</pre>

  <p><strong>Meisterinformation</strong> — <code>{{gmNote Titel | Inhalt}}</code> (<strong>Alias</strong> <code>meisterNote</code>)</p>
  <p>
    Gleicher Aufbau wie die Vorlesen-Box, optisch aber dunkel für nur für die SL gedachte Infos (Würfelwahrscheinlichkeiten,
    alternative Szenenverläufe, Metaplot). Nicht für Spielerinnen sichtbar gedacht, wenn Sie das PDF nur der SL geben.
  </p>

  <p><strong>Regelkasten (Roulbox)</strong> — <code>{{roulbox Titel | Untertitel | Inhalt}}</code></p>
  <p>
    Genau <strong>drei</strong> durch <code>|</code> getrennte Teile: großer Titel im Kopf, optionaler Untertitel (kann leer sein:
    <code>Titel | | Inhalt</code>), darunter der eigentliche Regeltext als Markdown. Listen im Inhalt erscheinen mit dem
    stilisierten Augen-Symbol statt normalem Bullet — geeignet für optionale Regeln oder DSA-ähnliche Kasten.
  </p>

  <p><strong>Optional leichter / schwerer</strong> — <code>{{easier | …}}</code> / <code>{{harder | …}}</code></p>
  <p>
    Kurze Hinweiszeilen mit Icon links: der Text nach <code>|</code> ist Markdown. Nutzen Sie sie, um Varianten
    („Für weniger erfahrene Gruppen …“ / „Für harte Modi …“) ohne einen vollen Roulbox-Kasten zu markieren.
  </p>

  <p><strong>Schachfigur inline</strong> — <code>{{ chess | bezeichner }}</code></p>
  <p>
    Setzt eine Figur in den laufenden Satz (z. B. für Rätsel oder Schach-Szenen). Zulässige Bezeichner nach Normalisierung:
    <code>pawn</code>/<code>pown</code>/<code>bauer</code>,
    <code>rook</code>/<code>turm</code>/<code>tower</code>,
    <code>knight</code>/<code>springer</code>/<code>horse</code>,
    <code>bishop</code>/<code>laeufer</code>/<code>laufer</code>,
    <code>queen</code>/<code>dame</code>,
    <code>king</code>/<code>koenig</code>/<code>konig</code>.
    Groß-/Kleinschreibung und Leerzeichen im Namen sind unkritisch; unbekannte Namen zeigen „?“.
  </p>
  <pre class="legal-snippet">Das Feld zeigt: {{ chess | king }} gegen {{ chess | pawn }}.</pre>

  <p><strong>Schwierigkeits-Rauten</strong> — <code>{{ difficulty | … }}</code> (Alias <code>dificulty</code>)</p>
  <p>
    Zeigt eine Reihe von vier Rauten; wie viele gefüllt sind, steuern Sie mit Farbe und Zahl zwischen 0 und 4.
    Erlaubt sind u. a. <code>rot</code>/<code>red</code>/<code>r</code> bzw. <code>grün</code>/<code>green</code>/<code>g</code>
    (Umlaute werden normalisiert) — <strong>Reihenfolge</strong> von Farbwort und Zahl ist egal, z. B. <code>2 grün</code> oder
    <code>grün 2</code>. Optional ein <strong>Label</strong> vor den Rauten: dann zwei <code>|</code> — erst Label
    (Markdown-Inline, <strong>ohne</strong> <code>}</code> im Text), dann der Teil mit Farbe und Zahl.
  </p>
  <pre class="legal-snippet">{{ difficulty | rot 2 }}
{{ difficulty | Soziale Interaktion: | grün 4 }}</pre>

  <p><strong>NSC- / Monsterblock</strong> — <code>{{npcBlock … {{/npcBlock}}</code></p>
  <p>
    Öffnen mit <code>{{npcBlock</code>, dann beliebig viele Zeilen im Format <code>schlüssel=wert</code> (Leerzeichen um
    <code>=</code> erlaubt), schließen mit <code>{{/npcBlock}}</code>. Zeilen mit <code>#</code> am Anfang sind Kommentare.
    Für Lesbarkeit: <strong>ein Attribut pro Zeile</strong>. Name, Eigenschaften (<code>mu</code>, <code>kl</code>, …),
    Kampfwerte und Freitextfelder — siehe Spezifikation für die vollständige Schlüsselliste. Der Block passt optisch zur
    Vorlagengrafik; auf einspaltigen Seiten wird er nicht künstlich über die volle Breite gezogen (siehe technische Layout-Regeln
    in <code>macros.md</code>).
  </p>
  <p>
    <strong>Porträt (<code>portrait</code> / <code>bild</code> / <code>image</code>):</strong> DSABrew bietet <strong>keinen
    Bild-Upload</strong> — Sie binden Porträts ausschließlich über eine <strong>öffentlich erreichbare Bild-URL</strong> ein
    (<code>https://…</code> oder <code>http://…</code>, vollständige Adresse). Optional in Anführungszeichen oder spitzen
    Klammern, z. B. <code>portrait="https://beispiel.de/nsc.png"</code> bzw. <code>portrait=&lt;https://…&gt;</code>. Legen Sie
    die Datei dafür woanders ab (eigener Webspace, Cloud, Bildhosting), kopieren Sie die direkte Linkadresse zum Bild und fügen
    sie hier ein. <strong>Nicht erlaubt</strong> sind u. a. <code>javascript:</code>, <code>data:</code> und URLs mit
    eingebettetem Benutzernamen/Passwort. Ungültige oder unerreichbare Adressen → Warnung und Platzhalter im Kasten.
  </p>
  <pre class="legal-snippet">{{npcBlock
name=Bruder Ignaz
portrait=https://example.com/portraits/ignaz.png
mu=12 kl=13 in=11 ch=10
lep=30 aw=8
talente=Alchimie 8, Heilkunde 5
{{/npcBlock}}</pre>

  <p>
    Ausführliche Verträge (Anker-IDs, volle NPC-Schlüsselliste, Layout, Sicherheit):
    <code>specs/001-dsa-brew-renderer/contracts/macros.md</code> im Repository.
  </p>

  <h2 class="legal-h2">6. Markdown-Grundlagen (Auszug)</h2>
  <p>
    Alles außerhalb der Makros verhält sich wie übliches Markdown: Sie strukturieren den Text mit Überschriften und Listen,
    betonen Wörter und setzen Verweise. <strong>Rohes HTML</strong> im Quelltext wird aus Sicherheitsgründen nicht mitgerendert —
    nutzen Sie dafür die angebotenen Makros und Markdown-Syntax.
  </p>
  <p>
    Ausführlichere Syntax mit Beispielen (extern, englisch):
    <a class="chrome-link" href="https://www.markdownguide.org/basic-syntax/" rel="noopener noreferrer">Markdown Guide — Basic Syntax</a>.
    Nicht jedes dort genannte Detail ist in DSABrew identisch (z. B. automatische Link-Erkennung im Fließtext ist deaktiviert);
    die Grundelemente wie Überschriften, Listen, Links und Tabellen entsprechen jedoch der üblichen Markdown-Nutzung.
  </p>
  <ul>
    <li>
      <strong>Überschriften</strong> <code>#</code> bis <code>####</code> — steuern Größe und Anker (siehe Abschnitt 7).
      Eine <code>#</code>-Überschrift pro Seite wirkt wie ein Titel; <code>##</code>/<code>###</code> gliedern Kapitel und Abschnitte.
    </li>
    <li><strong>Listen</strong> — <code>- Punkt</code> oder nummeriert <code>1. Punkt</code>; eingerückte Zeilen bilden Unterpunkte.</li>
    <li><strong>Zitat</strong> — Zeilen mit <code>&gt;</code> am Anfang für wörtliche Rede oder Hervorhebungen.</li>
    <li>
      <strong>Code</strong> — kurz inline mit <code>\`backticks\`</code>; mehrzeilige Blöcke zwischen Zeilen mit nur
      <code>\`\`\`</code> (z. B. für Würfeltabellen). Code-Blöcke werden in der Vorschau wie Monospace dargestellt.
    </li>
    <li>
      <strong>Links und Bilder</strong> — Verweise: <code>[Beschriftung](https://…)</code>. Bilder im Fließtext:
      <code>![Alternativtext](https://…)</code>. Es gibt <strong>keinen Upload</strong> in DSABrew: Sie verlinken nur eine
      <strong>öffentliche Bild-URL</strong> (HTTPS empfohlen), z. B. Karten oder Illustrationen, die Sie auf einem Server oder
      Bildhosting abgelegt haben. <code>javascript:</code>-Links werden abgewiesen.
    </li>
    <li>
      <strong>Vorschau und PDF:</strong> Die Vorschau lädt das Bild, wenn die URL erreichbar ist. Beim <strong>PDF speichern</strong>
      (html2canvas) brauchen viele fremde Server <strong>CORS</strong>-Header für Bilder (<code>Access-Control-Allow-Origin</code>);
      fehlen sie, kann das Bild in der PDF-Datei ausfallen, obwohl es im Browser noch sichtbar war. Wählen Sie nach Möglichkeit
      einen Host, der Bilder mit CORS für eingebettete Nutzung freigibt, oder stellen Sie die Datei auf einem eigenen Space bereit,
      den Sie so konfigurieren können.
    </li>
    <li>
      <strong>Trennlinie</strong> <code>---</code> in einer eigenen Zeile — optischer Schnitt innerhalb einer Seite (kein
      Seitenumbruch; dafür <code>\\page</code>).
    </li>
    <li>
      <strong>Tabellen</strong> (Pipe-Syntax) — auf zweispaltigen Seiten etwa eine Spalte breit; auf einspaltigen Seiten
      volle Textbreite. Für breite Tabellen lohnt sich <code>\\pageSingle</code> vor dem Tabellenabschnitt.
    </li>
  </ul>

  <h2 class="legal-h2">7. Inhaltsverzeichnis und Anker</h2>
  <p>
    Jede Überschrift erzeugt automatisch eine <strong>Sprungmarke</strong> (<code>id</code>) aus der <strong>angezeigten</strong>
    Seitenzahl und einem Slug aus dem Überschriftentext: Schema <code>p{Seite}-{slug}</code>. Beispiel: steht
    <code>## Orks im Nebel</code> auf der Seite mit Nummer 4, lautet die ID typischerweise <code>p4-orks-im-nebel</code>
    (Umlaute und Sonderzeichen werden im Slug vereinfacht).
  </p>
  <p>
    <strong>So verlinken Sie:</strong> Schreiben Sie an beliebiger Stelle
    <code>[Lesbare Beschriftung](#p4-orks-im-nebel)</code> — in der Vorschau und im PDF führt der Link zu dieser Überschrift.
    Wenn Sie die genaue ID nicht kennen, können Sie kurz in der Browser-Entwicklertools-Ansicht nachsehen oder das vom
    <code>{{tocDepthH3}}</code> erzeugte Inhaltsverzeichnis nutzen und die Ziele daraus übernehmen.
  </p>
  <p>
    <strong>Doppelte Überschriften</strong> auf derselben Seite erhalten bei Bedarf eindeutige IDs mit Suffix
    (<code>-1</code>, <code>-2</code>, …). Rohes HTML (<code>&lt;a id="…"&gt;</code>) wird nicht ausgewertet.
    Das Makro <code>{{tocDepthH3}}</code> (Abschnitt 5.6) listet H1–H3 dokumentweit auf und verlinkt dieselben Anker.
  </p>

  <h2 class="legal-h2">8. Fehler melden und Quellcode</h2>
  <p>
    Anregungen und Fehler: <a class="chrome-link" href="https://github.com/Rathch/DSABrew/issues/new" rel="noopener noreferrer">GitHub Issue</a>.
    Quelltext: <a class="chrome-link" href="https://github.com/Rathch/DSABrew" rel="noopener noreferrer">github.com/Rathch/DSABrew</a>.
  </p>
</div>
`;
