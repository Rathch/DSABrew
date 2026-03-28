# Typography Contract: DSABrew ↔ Scriptorium Word Template

**Date**: 2026-03-27  
**Feature**: `specs/001-dsa-brew-renderer/spec.md`  
**Source**: Anknüpfung an die Formatvorlagen aus der DSA5-Scriptorium-Word-Vorlage (Kapitel-/Abschnittsebenen).

Die Web-Ausgabe mappt **Markdown-Überschriften** auf diese Ebenen. **Andalus** ist eine Systemschrift (u. a. Windows); sie kann nicht frei als Webfont eingebettet werden — im CSS wird ein **Font-Stack** `Andalus, …` verwendet. **Gentium** wird über **Google Fonts** als *Gentium Book Plus* eingebunden (Open Font, nah an „Gentium“).

| Word-Vorlage / Ebene | Schrift | Größe | Markdown |
| --- | --- | --- | --- |
| Einband-Titel (optisch wie Referenz: silbrig, Schlagschatten) | Andalus | 23,5 pt (wie Kapitel) | erstes `h1` auf `\map{einband}`-Seite |
| „01 – Kapitel“ | Andalus | 23,5 pt | `#` → `h1` |
| Standard-Fließtext | Gentium | 10 pt | Absätze, Listen, TOC-Einträge |
| „02 – Unterkapitel“ | Andalus | 14 pt | `##` → `h2` |
| „03 – Abschnitt“ | Gentium **Bold** | 13 pt | `###` → `h3` |
| „04 – Unterabschnitt“ | Gentium **Bold** | 10 pt | `####` → `h4` |

## Hinweise

- **H5/H6**: nicht durch die Vorlage abgedeckt; erhalten eine konservative Fortführung (kleiner, Gentium) oder können später ergänzt werden.
- **Druck/PDF**: `pt`-Angaben bleiben für die Zielausgabe sinnvoll; Browser skalieren die Vorschau an die A4-Seite.
