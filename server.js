/*
 * Apró híd-szerver a böngésző (index.html) és a MongoDB között.
 *
 * MIÉRT KELL EZ?
 * A böngésző nem tud közvetlenül kapcsolódni a MongoDB-hez (nincs erre
 * natív JavaScript API), ezért ez a szerver szolgálja ki az index.html
 * fájlt, és egyszerű HTTP/JSON végpontokat ad, amiket az oldal fetch()-
 * csel hív. Ez a szerver kapcsolódik a MongoDB-hez a hivatalos driverrel.
 *
 * FIGYELEM - BIZTONSÁG:
 * A lenti kapcsolati string authentikáció és TLS NÉLKÜL csatlakozik a
 * MongoDB-hez ("mongodb://localhost:27017"). Ez szándékos, mert a feladat
 * kifejezetten lokális, tanulási célú futtatásra készült. Éles vagy
 * hálózaton (interneten) elérhető használat előtt mindenképp adj hozzá
 * felhasználó/jelszó authentikációt és TLS-t!
 */

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const PORT = process.env.PORT || 3000;
const DB_NAME = 'esemenynaptar';
const COLLECTION = 'events';

const app = express();
app.use(express.json());
app.use(express.static(__dirname)); // az index.html kiszolgálása

let db;

// Összes esemény lekérése (a szűrést - pl. "csak a mai nap" - a kliens
// oldali JS végzi, ez egy tanulási projektben egyszerűbbé teszi a dolgot).
app.get('/api/events', async (req, res) => {
  try {
    const events = await db.collection(COLLECTION)
      .find({})
      .sort({ date: 1, startTime: 1 })
      .toArray();
    res.json(events);
  } catch (err) {
    console.error('Hiba az események lekérésekor:', err);
    res.status(500).json({ error: 'Nem sikerült lekérni az eseményeket.' });
  }
});

// Új esemény létrehozása
app.post('/api/events', async (req, res) => {
  try {
    const { date, startTime, endTime, title, location } = req.body || {};
    if (!date || !startTime || !endTime || !title) {
      return res.status(400).json({ error: 'Hiányzó kötelező mező (dátum, kezdés, vég, esemény neve).' });
    }
    const doc = {
      date: String(date),
      startTime: String(startTime),
      endTime: String(endTime),
      title: String(title).slice(0, 200),
      location: location ? String(location).slice(0, 200) : '',
    };
    const result = await db.collection(COLLECTION).insertOne(doc);
    res.status(201).json({ _id: result.insertedId, ...doc });
  } catch (err) {
    console.error('Hiba az esemény mentésekor:', err);
    res.status(500).json({ error: 'Nem sikerült elmenteni az eseményt.' });
  }
});

// Esemény törlése azonosító alapján
app.delete('/api/events/:id', async (req, res) => {
  try {
    await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(req.params.id) });
    res.status(204).end();
  } catch (err) {
    console.error('Hiba az esemény törlésekor:', err);
    res.status(500).json({ error: 'Nem sikerült törölni az eseményt.' });
  }
});

async function start() {
  try {
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`Kapcsolódva a MongoDB-hez: ${MONGO_URL} (adatbázis: ${DB_NAME})`);
  } catch (err) {
    console.error('Nem sikerült kapcsolódni a MongoDB-hez.');
    console.error('Ellenőrizd, hogy fut-e a MongoDB lokálisan (pl. "mongod" parancs, vagy Docker).');
    console.error(err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Szerver fut: http://localhost:${PORT}`);
  });
}

start();
