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

Questa build locale e gli artifact della workflow di build sono unsigned: utili per sviluppo e test, non per distribuzione a utenti finali con Gatekeeper attivo.

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
- richiede firma `Developer ID Application` e notarizzazione Apple configurate via secret GitHub

## Firma e notarizzazione macOS

Per distribuire binari macOS che si aprano con Gatekeeper attivo, la release macOS deve essere firmata e notarizzata.

Secret richiesti in GitHub Actions:

- `CSC_LINK`
- `CSC_KEY_PASSWORD`
- `APPLE_API_KEY`
- `APPLE_API_KEY_ID`
- `APPLE_API_ISSUER`

Formato atteso:

- `CSC_LINK`: certificato `Developer ID Application` esportato in `.p12`, codificato nel formato supportato da `electron-builder`
- `CSC_KEY_PASSWORD`: password del `.p12`
- `APPLE_API_KEY`: contenuto del file `.p8` di App Store Connect API key
- `APPLE_API_KEY_ID`: key id della API key
- `APPLE_API_ISSUER`: issuer id della API key

La workflow [release-macos.yml](/home/user/miscellanea/SgranaDati/.github/workflows/release-macos.yml) materializza la chiave `.p8` in un file temporaneo e passa a `electron-builder` le variabili necessarie per notarizzare in automatico.

## Note sul perimetro

- l'app lavora tutta in locale
- `pdf` e `docx` vengono convertiti in testo anonimizzato, non ricostruiti nel formato originale
- i nomi di persona sono il caso più ambiguo: usa i termini custom quando vuoi più controllo
- gli artifact di `build-macos.yml` restano unsigned e possono essere bloccati da Gatekeeper
- gli asset pubblicati da `release-macos.yml` sono pensati per la distribuzione solo dopo configurazione di firma e notarizzazione
