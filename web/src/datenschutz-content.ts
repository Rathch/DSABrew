/**
 * Inhalt der Seite /datenschutz (statisches HTML, kein Nutzer-Input).
 * Hinweis: Kein Ersatz für individuelle Rechtsberatung.
 */

export const DATENSCHUTZ_BODY_HTML = `
<div class="landing-legal-body landing-datenschutz">
  <p class="landing-datenschutz__note">
    Stand: März 2026. Die folgenden Hinweise beschreiben, welche Daten im Zusammenhang mit dieser Web-Anwendung
    <strong>DSABrew</strong> typischerweise anfallen — abhängig davon, ob Sie nur die Oberfläche laden oder die API
    zum Anlegen und Bearbeiten von Dokumenten nutzen.
  </p>

  <h2 class="landing-datenschutz__h2">1. Verantwortlicher</h2>
  <p>
    Verantwortlich für diese Anwendung im Sinne der Datenschutz-Grundverordnung (DSGVO), soweit hier personenbezogene
    Daten verarbeitet werden:
  </p>
  <address class="landing-impressum landing-impressum--inline">
    <p class="landing-impressum__name">Christian Rath-Ulrich</p>
    <p class="landing-impressum__addr">Ernst-Mühlendyckstr 2<br />51143 Köln</p>
    <p class="landing-impressum__contact">
      E-Mail: <a href="mailto:kontakt@rath-ulrich.de">kontakt@rath-ulrich.de</a>
    </p>
  </address>
  <p>
    Sofern DSABrew bei einem <strong>anderen Anbieter</strong> betrieben wird, ist der jeweilige Betreiber der
    erreichbaren Installation Verantwortlicher; die dortigen Hinweise gelten zusätzlich.
  </p>

  <h2 class="landing-datenschutz__h2">2. Aufruf der Web-Oberfläche (ohne API)</h2>
  <p>
    Beim Laden der Seite verarbeitet Ihr Browser die ausgelieferten Dateien. Es werden <strong>keine
    Analyse- oder Marketing-Cookies</strong> durch DSABrew gesetzt.
  </p>
  <p>
    <strong>Webschriftarten (Google Fonts):</strong> Die Oberfläche kann Schriftarten von
    <a href="https://fonts.google.com/" rel="noopener noreferrer">Google Fonts</a> nachladen. Dabei kann Google
    (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland) unter anderem Ihre IP-Adresse und technische
    Metadaten erhalten. Weitere Informationen:
    <a href="https://policies.google.com/privacy" rel="noopener noreferrer">Google-Datenschutzerklärung</a>.
  </p>
  <p>
    <strong>Lokaler Speicher (localStorage):</strong> In Ihrem Browser können rein technische Einstellungen
    (z.&nbsp;B. Darstellungsmodus bei schmalen Fenstern, Kopplung des Scrollens) gespeichert werden. Diese Daten
    verlassen Ihr Endgerät nicht automatisch und dienen nur der Bedienung der App. Wenn Sie den unteren Hinweis
    „Keine Cookies, kein Tracking“ mit <strong>Verstanden</strong> schließen, wird nur lokal gespeichert, dass der
    Hinweis nicht erneut angezeigt werden soll — weiterhin <strong>ohne Cookies</strong>.
  </p>

  <h2 class="landing-datenschutz__h2">3. Nutzung der API (Dokumente anlegen, lesen, speichern)</h2>
  <p>Wenn Sie über die Anwendung ein Dokument erzeugen oder unter einem Link aufrufen, verarbeitet der Server u.&nbsp;a.:</p>
  <ul>
    <li>
      <strong>Dokumentinhalt (Markdown)</strong> sowie technische Kennungen (zufällige „Slugs“ / Token für Ansicht
      und Bearbeitung), Zeitstempel (Erstellung, letzte Änderung) und ein technisches Flag, ob vom Standardtext abgewichen
      wurde. Personenbezogene Daten entstehen hier nur, wenn <strong>Sie</strong> solche Angaben in den Text eintragen.
    </li>
    <li>
      <strong>IP-Adresse</strong> und ggf. weitere Verbindungsdaten zum <strong>Missbrauchsschutz</strong>
      (Begrenzung der Häufigkeit von Anfragen, z.&nbsp;B. beim Anlegen oder Speichern von Dokumenten).
    </li>
    <li>
      <strong>Server-Logdateien</strong> (typischerweise u.&nbsp;a. Zeitstempel, angefragte Ressource, IP-Adresse),
      soweit der eingesetzte Server bzw. das Hosting sie schreibt — genaue Dauer und Inhalt richten sich nach der
      Konfiguration des Betreibers.
    </li>
  </ul>
  <p>
    Nicht bearbeitete Standard-Dokumente können nach einer konfigurierten Frist automatisch gelöscht werden
    (Ressourcenschonung). Geänderte Inhalte bleiben gespeichert, bis sie gelöscht werden oder der Betreiber sie entfernt.
  </p>

  <h2 class="landing-datenschutz__h2">4. Zwischenablage („Teilen“)</h2>
  <p>
    Wenn Sie einen Freigabe-Link kopieren, wird dieser <strong>nur auf Ihre ausdrückliche Aktion hin</strong> in die
    Zwischenablage Ihres Geräts gelegt. Dabei findet keine automatische Übermittlung an uns statt.
  </p>

  <h2 class="landing-datenschutz__h2">5. Weitergabe an Dritte</h2>
  <p>
    Eine Veräußerung Ihrer Daten erfolgt nicht. Außerhalb des hier Beschriebenen können allein <strong>Ihr Browser</strong>
    (z.&nbsp;B. Google beim Font-Abruf) sowie <strong>Ihr Hosting-/Server-Anbieter</strong> technisch bedingt Daten
    verarbeiten.
  </p>

  <h2 class="landing-datenschutz__h2">6. Ihre Rechte</h2>
  <p>
    Sie haben nach Maßgabe der DSGVO Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
    Datenübertragbarkeit sowie Widerspruch gegen bestimmte Verarbeitungen. Außerdem besteht ein Beschwerderecht bei einer
    Datenschutz-Aufsichtsbehörde, z.&nbsp;B. der für Ihren Wohnort zuständigen Behörde.
  </p>
  <p>
    Zur Ausübung Ihrer Rechte wenden Sie sich an die oben genannte Kontaktadresse. Bitte beachten Sie: Ohne
    Benutzerkonto ist eine Zuordnung von Daten oft nur möglich, wenn Sie konkrete Angaben machen (z.&nbsp;B. betroffene
    Links oder Inhalte).
  </p>
</div>
`;
