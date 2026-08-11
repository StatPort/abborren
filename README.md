# Abborren Backyard Ultra 2026

Statisk webbapp för anmälan, statistik, resultat och polls till Abborren Backyard Ultra.
Hostas på GitHub Pages: https://statport.github.io/abborren/

## Kom igång lokalt

```
python3 -m http.server 8000
```

Öppna http://localhost:8000/index.html — logga in med användarnamn `abborren`, lösenord `backyard`.

## Koppla på Firebase

Så länge `js/firebase-config.js` har platshållarvärden körs appen i lokalt testläge
(all data sparas i webbläsarens localStorage istället för i molnet).

För att koppla på riktig delad lagring:

1. Gå till din Firebase-konsol → Project settings → General → Your apps → SDK setup and configuration.
2. Kopiera `firebaseConfig`-objektet och klistra in värdena i `js/firebase-config.js`.
3. Skapa en Firestore-databas (Build → Firestore Database → Create database) om du inte redan har en.
4. Sätt säkerhetsregler som tillåter läsning/skrivning för `signups` och `pollVotes`
   (appen har ingen egen backend-autentisering utöver den delade inloggningen).

## Mappstruktur

- `index.html` — inloggning
- `home.html` — förstasidan med de fem knapparna
- `pages/` — anmälan, statistik, om oss, resultat, polls
- `css/style.css` — delad styling (bakgrund, IBM Plex Mono, knappar)
- `js/` — auth, databaslager (db.js), fanfar, sidlogik
- `assets/img/` — logga, bakgrund, trumpetgrafik som används i appen
- `assets/source/` — originalbilder och skript som användes för att ta fram assets/img
