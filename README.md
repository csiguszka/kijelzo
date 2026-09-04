# Eseménytábla

Helyi, tanulási célú projekt: egy naptár-szerkesztő (mobilon/tableten, fekvő
nézetben) és egy nagy kijelző, ami mindig csak a **mai nap még le nem járt**
eseményeit mutatja, MongoDB-ből.

## Miért nem "csak egy" index.html?

A böngésző biztonsági okokból nem tud közvetlenül, nyers TCP-kapcsolattal
beszélni a MongoDB-vel — erre nincs natív JavaScript API. Ezért a projekt
két részből áll:

- **`index.html`** — a teljes felhasználói felület (naptár, szerkesztő,
  kijelző), egyetlen fájlban, beágyazott CSS-sel és JS-sel. *Ez tartalmazza
  szinte a teljes alkalmazás-logikát.*
- **`server.js`** — egy nagyon kicsi Node.js/Express szerver, ami kiszolgálja
  az `index.html`-t, és 3 egyszerű HTTP végponton keresztül (`GET/POST/DELETE
  /api/events`) továbbítja a kéréseket a helyi MongoDB felé, a hivatalos
  MongoDB Node.js driverrel. Ez a minimális híd, ami nélkül a böngésző
  egyáltalán nem tudná elérni az adatbázist.

## Előfeltételek

- [Node.js](https://nodejs.org/) (LTS verzió)
- Helyileg futó MongoDB a `27017`-es porton, például:
  - natívan telepítve: `mongod`
  - vagy Dockerrel: `docker run -d -p 27017:27017 mongo`

## Telepítés és indítás

```bash
npm install
npm start
```

Ezután nyisd meg a böngészőben: **http://localhost:3000**

## Használat

- A **nagy kijelző** automatikusan a mai nap eseményeit mutatja, a mai
  dátummal és az aktuális idővel a fejlécben. Ha egy esemény véghatárideje
  (pl. 16:00) letelik, magától eltűnik a listáról.
- Ha sok esemény van egy napon, a kijelző több oldalra bontja őket, és
  **15 másodpercenként** lapoz.
- A jobb alsó sarokban lévő **szerkesztő gomb (✎) csak akkor jelenik meg**,
  ha a böngészőablak szélessége nagyobb, mint a magassága (fekvő nézet).
  Ide kattintva nyílik meg a naptár: válassz ki egy napot, majd add meg a
  kezdés/vég időpontot, az esemény nevét és a helyszínt (pl. `14:00`–`16:00`,
  `Sakk`, `Mátyás Király Terem`).

## Testreszabás

Az `index.html` `<script>` blokkjának elején található pár állítható érték:

- `EVENTS_PER_PAGE` — hány esemény férjen egy kijelző-oldalra
- `PAGE_SWITCH_MS` — lapozási időköz (alapból 15000 ms = 15 mp)
- `REFRESH_MS` — milyen gyakran kérdezze le újra a szerverről az eseményeket

A **logó helye** a bal felső sarokban lévő szaggatott keretes doboz
(`#logo-slot`) — cseréld le a tartalmát egy `<img>` tagre, vagy állíts be
neki `background-image`-et CSS-ben.

## Biztonsági megjegyzés

A MongoDB-kapcsolat (`server.js`) szándékosan nincs authentikálva és
titkosítva, mert a projekt kifejezetten **lokális, tanulási célra** készült.
Ne tedd elérhetővé az internet felől ebben a formában — élesben mindenképp
adj hozzá felhasználó/jelszó authentikációt és TLS-t a MongoDB oldalán is.
