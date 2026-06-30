# Nordcode

Hjemmeside for **Nordcode** — et dansk digitalt studie, der bygger hjemmesider, apps og diverse digitale løsninger.

En hurtig, responsiv one-pager bygget i ren HTML, CSS og JavaScript — uden build-trin og uden afhængigheder, så den er nem at hoste hvor som helst.

## Indhold

| Fil | Beskrivelse |
| --- | --- |
| `index.html` | Sidens struktur og indhold |
| `styles.css` | Design, layout og animationer |
| `script.js` | Menu, scroll-effekter og kontaktformular |

## Afsnit

- **Hero** — kort introduktion og call-to-action
- **Ydelser** — hjemmesider, apps og diverse digitalt
- **Arbejde** — udvalgte (eksempel-)projekter
- **Proces** — sådan arbejder vi i fire trin
- **Om os** — studiets værdier
- **Kontakt** — formular (demo) og e-mail

## Kør lokalt

Åbn `index.html` direkte i en browser, eller start en lokal server:

```bash
python3 -m http.server 8000
# åbn http://localhost:8000
```

## Tilpas

- **Tekst & projekter:** rediger direkte i `index.html`. Skift eksempel-cases i afsnittet *Arbejde* ud med jeres egne.
- **Farver:** justér variablerne i `:root` øverst i `styles.css` (`--accent`, `--accent-2` m.fl.).
- **E-mail:** opdater adressen `csgogammer38@gmail.com` i `index.html`.
- **Kontaktformular:** sender ikke noget endnu — den viser kun en bekræftelse. Forbind den til en tjeneste som Formspree, Netlify Forms eller din egen backend, når I er klar.

## Hosting

Statisk side — kan lægges direkte på GitHub Pages, Netlify, Vercel, Cloudflare Pages eller en hvilken som helst webserver.
