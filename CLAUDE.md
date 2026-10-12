# Tanzania & Zanzibar 2026 — reissite

Eigenaar: Koen (Koenprive). Taal: Nederlands (antwoorden, commitberichten, teksten op de site).
Live: https://tanzania2026.netlify.app — Netlify publiceert automatisch bij elke push naar `main`.

## Standaardwerkwijze (Koen hoeft dit nooit te vragen)
1. Begin altijd met de laatste versie van GitHub (`git pull` / `git fetch` + rebase). Koen past ook vanaf zijn iPhone aan.
2. Maak de wijziging en test hem (Playwright of een syntaxcontrole van het script; op 390 px breed kijken bij zichtbare wijzigingen).
3. Commit met een korte Nederlandse boodschap en **push direct naar `main`**. Geen pull request, geen aparte branch, niet eerst vragen — tenzij Koen zelf om een proefversie vraagt.
4. Meld kort wat er veranderd is en dat het binnen ±1 minuut live staat.
5. Is de pc van Koen gekoppeld (map `C:\prive\zanzibar tanzania site\output tanzania\tanzania-site-snel`), zet dan ook daar de nieuwe versie neer (die map is een kopie; GitHub is de bron).

## Niet doen
- De repository niet privé maken: het gratis Netlify-plan weigert dan pushes die niet van Koen zelf komen ("Unrecognized Git contributor").
- Geen wachtwoorden of API-sleutels in leesbare vorm in de code zetten. De sleutels staan versleuteld in `SEC`; de enige sleutel in platte tekst is de alleen-lezen `JSONBIN_READ_KEY`. Zie `claude/beveiliging.md` in het Claude-project.
- Geen testbestanden laten staan: de hele repo wordt openbaar gepubliceerd.

## Weten
- Alles zit in `index.html` (één bestand) plus `sw.js` (offline-cache), `manifest.json`, iconen en `img/`.
- `sw.js`: bij een wijziging die bezoekers moeten zien, hoeft `VERSIE` alleen omhoog als `sw.js` of de lijst met schilbestanden verandert; `index.html` wordt eerst via het netwerk gehaald.
- Foto's en verhalen staan niet in deze repo maar in imgbb (foto's) en jsonbin (lijst en verhalen).
- Reis: 16 oktober – 2 november 2026, vier reizigers (Koen, Nienke, Maarten, Esther). Vanaf 16 oktober zit Koen in Tanzania, zonder laptop: houd uitleg kort en praktisch, werkt op een iPhone.
