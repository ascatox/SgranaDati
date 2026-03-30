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

## Note sul perimetro

- l'app lavora tutta in locale
- `pdf` e `docx` vengono convertiti in testo anonimizzato, non ricostruiti nel formato originale
- i nomi di persona sono il caso più ambiguo: usa i termini custom quando vuoi più controllo
