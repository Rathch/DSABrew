# Sicherheitsrichtlinie (Security Policy)

Wir nehmen Sicherheitslücken in **DSABrew** ernst und danken für verantwortungsvolle Offenlegung (responsible disclosure).

## Unterstützte Versionen

Sicherheitsupdates werden in der Regel für die **aktuelle Hauptentwicklungslinie** im Repository bereitgestellt. Bitte nutze die **neueste veröffentlichte Version** (Tags/Releases auf GitHub) und halte Abhängigkeiten aktuell.

| Bereich        | Unterstützung |
| -------------- | --------------- |
| Aktuelle Releases / `master` | Ja              |
| Ältere Releases ohne Wartung | Nur nach Absprache |

Konkrete Versionszahlen können sich ändern — bei Zweifeln bitte vor einer öffentlichen Meldung kurz prüfen, ob das Problem in der aktuellen Version noch besteht.

## Schwachstellen melden

**Bitte keine Sicherheitsdetails in öffentlichen Issues, Pull Requests oder Diskussionen posten**, damit andere Nutzer nicht unnötig gefährdet werden.

Empfohlener Weg:

1. **GitHub „Private vulnerability reporting“** (falls im Repository unter *Settings → Security* aktiviert): dort eine vertrauliche Meldung einreichen.
2. Alternativ: **[Security advisories](https://github.com/Rathch/DSABrew/security/advisories)** für dieses Repository nutzen (je nach Berechtigung und GitHub-Funktionen).

Wenn keine der Optionen für dich erreichbar ist, kannst du den Maintainer über die auf dem GitHub-Profil oder im Repository sichtbaren Kontaktmöglichkeiten **privat** anschreiben — ohne technische Exploit-Details in der ersten Zeile der öffentlichen Vorschau.

### Was hilfreich in einer Meldung ist

- Kurze Beschreibung des Problems und der **Auswirkung** (z. B. XSS, Datenleck, Umgehung von Schutzmaßnahmen).
- **Betroffene Komponente** (z. B. `web/`, `server/`, Renderer, API) und **Version** oder Commit-Hash.
- **Schritte zur Reproduktion** (minimal, nachvollziehbar).
- Optional: Vorschlag für eine **Abschwächung** oder Patch-Idee — ohne Druck.

### Was wir uns vorbehalten

- Wir bestätigen den Eingang, sobald es der Aufwand erlaubt (in der Regel innerhalb weniger Werktage).
- Wir koordinieren eine **vertrauliche** Bearbeitung und ein **zeitlich angemessenes** öffentliches Advisory nach Behebung, sofern sinnvoll.
- **Öffentliche Anerkennung** (Credit) ist möglich, sofern du das wünschst — bitte im Vorfeld angeben.

## Nicht im Scope (typisch)

- Probleme, die nur bei **absichtlich unsicher konfiguriertem** Betrieb auftreten (ohne dokumentierte Unterstützung).
- Reine **Themen ohne sicherheitsrelevante Auswirkung** (z. B. reine Schönheitsfehler), sofern nicht anders belegt.
- **Social Engineering** oder reiner Zugang zu Testsystemen ohne Bezug zum Projektcode.

## Weitere Hinweise

- Das Projekt steht unter der **GNU General Public License v3.0**; siehe `LICENSE`.
- Für allgemeine Fragen und Bugs ohne Sicherheitsbezug sind die üblichen **Issues** vorgesehen — Sicherheitsrelevantes bitte wie oben **privat** melden.

Danke, dass du zur Sicherheit von DSABrew beiträgst.
