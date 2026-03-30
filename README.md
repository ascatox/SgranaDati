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

## CI Windows

Il repository include [build-windows.yml](/home/user/miscellanea/SgranaDati/.github/workflows/build-windows.yml), che su GitHub Actions:

- installa le dipendenze con `npm ci`
- esegue `npm run dist:win`
- carica l'installer come artifact

## Note sul perimetro

- l'app lavora tutta in locale
- `pdf` e `docx` vengono convertiti in testo anonimizzato, non ricostruiti nel formato originale
- i nomi di persona sono il caso più ambiguo: usa i termini custom quando vuoi più controllo
