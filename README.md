# SgranaDati

App desktop locale per anonimizzare documenti prima di inviarli a sistemi AI.

## Cosa fa

- importa documenti in batch
- estrae testo da `txt`, `md`, `csv`, `json`, `log`, `html`, `xml`, `docx`, `pdf`
- sostituisce PII comuni con placeholder stabili come `[EMAIL_1]`, `[PHONE_2]`
- permette termini custom per nomi cliente, aziende e codici interni
- esporta file anonimizzati e `manifest.json`

## Regole incluse

- email
- telefoni
- codici fiscali
- partite IVA
- IBAN
- carte
- CAP / ZIP / postal code
- date opzionali
- indirizzi opzionali
- euristica opzionale per nomi propri

## Avvio

```bash
npm install
npm start
```

## Prova su Windows

Da sorgente:

```powershell
git clone https://github.com/ascatox/SgranaDati.git
cd SgranaDati
npm install
npm start
```

Build installer `.exe` su Windows:

```powershell
npm install
npm run dist:win
```

L'output finisce in `dist/` con installer NSIS.

## Prova su macOS

Da sorgente:

```bash
git clone https://github.com/ascatox/SgranaDati.git
cd SgranaDati
npm install
npm start
```

Build pacchetto macOS:

```bash
npm install
npm run dist:mac
```

L'output finisce in `dist/` con:

- un file `.dmg`
- un file `.zip`

## CI Windows

Il repository include [build-windows.yml](/home/user/miscellanea/SgranaDati/.github/workflows/build-windows.yml), che su GitHub Actions:

- installa le dipendenze con `npm ci`
- esegue `npm run dist:win`
- carica l'installer come artifact

Per avere file scaricabili direttamente dalla pagina GitHub `Releases`, il repository include anche [release-windows.yml](/home/user/miscellanea/SgranaDati/.github/workflows/release-windows.yml).

Per macOS, il repository include anche:

- [build-macos.yml](/home/user/miscellanea/SgranaDati/.github/workflows/build-macos.yml)
- [release-macos.yml](/home/user/miscellanea/SgranaDati/.github/workflows/release-macos.yml)

Flusso consigliato:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Quel workflow:

- si attiva sui tag `v*`
- esegue `npm run dist:win:release`
- pubblica automaticamente l'installer `.exe` nella Release GitHub del tag

Il workflow macOS:

- si attiva sugli stessi tag `v*`
- esegue `npm run dist:mac:release`
- pubblica automaticamente gli asset `.dmg` e `.zip` nella stessa Release GitHub

## Note sul perimetro

- l'app lavora tutta in locale
- `pdf` e `docx` vengono convertiti in testo anonimizzato, non ricostruiti nel formato originale
- i nomi di persona sono il caso più ambiguo: usa i termini custom quando vuoi più controllo
- le build macOS generate in CI non sono notarizzate: Gatekeeper puo richiedere l'apertura manuale
