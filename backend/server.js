const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini API
const genAI = new GoogleGenerativeAI('AIzaSyCMzJIEOuR3ba0HzApg5N0icNeQfa6ZZjs');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Store conversation history per session
const conversationHistories = new Map();

// Database setup
const dbPath = path.join(__dirname, 'fragrances.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error(err.message);
  else console.log('Connected to SQLite database');
});

// Initialize database
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS fragrances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    price REAL NOT NULL,
    bottleSize TEXT NOT NULL,
    image TEXT NOT NULL,
    occasion TEXT,
    season TEXT,
    notes TEXT,
    niche_level INTEGER
  )`, (err) => {
    if (err) console.error(err);
    
    // Check if table is empty
    db.get("SELECT COUNT(*) as count FROM fragrances", (err, row) => {
      if (row.count === 0) {
        insertSampleData();
      }
    });
  });
});

// Sample fragrance data
const sampleFragrances = [
  { name: 'Bleu de Chanel', brand: 'Chanel', price: 120, bottleSize: '100ml', image: 'https://fimgs.net/mdimg/perfume/o.9099.jpg', occasion: 'office, casual', season: 'year-round', notes: 'bergamot, incense, wood', niche_level: 2 },
  { name: 'Dior Sauvage', brand: 'Dior', price: 110, bottleSize: '100ml', image: 'https://fimgs.net/mdimg/perfume/o.31861.jpg', occasion: 'casual, office', season: 'year-round', notes: 'apple, ambroxan, vanilla', niche_level: 2 },
  { name: 'Creed Aventus', brand: 'Creed', price: 350, bottleSize: '100ml', image: 'https://fimgs.net/mdimg/perfume/o.9828.jpg', occasion: 'casual, date night', season: 'summer, fall', notes: 'pineapple, coconut, oak, musk', niche_level: 4 },
  { name: 'Tom Ford Black Orchid', brand: 'Tom Ford', price: 180, bottleSize: '100ml', image: 'https://fimgs.net/mdimg/perfume/o.1018.jpg', occasion: 'evening, date night', season: 'fall, winter', notes: 'black truffle, black orchid, rum', niche_level: 3 },
  { name: 'Versace Eros', brand: 'Versace', price: 95, bottleSize: '100ml', image: 'https://fimgs.net/mdimg/perfume/o.16657.jpg', occasion: 'casual, sport', season: 'summer', notes: 'mint, apple, amber, musk', niche_level: 2 },
  { name: 'Guerlain Gentleman', brand: 'Guerlain', price: 130, bottleSize: '100ml', image: 'https://fimgs.net/mdimg/perfume/social.46040.jpg', occasion: 'office, casual, formal', season: 'year-round', notes: 'iris, iris root, vetiver, ambroxan', niche_level: 3 },
  { name: 'Prada L\'Homme', brand: 'Prada', price: 115, bottleSize: '100ml', image: 'https://fimgs.net/mdimg/perfume/o.39029.jpg', occasion: 'office, casual', season: 'spring, summer', notes: 'iris, dry iris, amber, cedar', niche_level: 3 },
  { name: 'Calvin Klein Obsession', brand: 'Calvin Klein', price: 85, bottleSize: '125ml', image: 'https://fimgs.net/mdimg/perfume/o.249.jpg', occasion: 'casual, evening', season: 'year-round', notes: 'cardamom, amber, sunflower', niche_level: 1 },
  { name: 'Yves Saint Laurent La Nuit', brand: 'YSL', price: 95, bottleSize: '100ml', image: 'https://fimgs.net/mdimg/perfume/o.5521.jpg', occasion: 'evening, date night', season: 'fall, winter', notes: 'mandarin, opoponax, leather, vanilla', niche_level: 3 },
  { name: 'Dolce & Gabbana Light Blue', brand: 'D&G', price: 105, bottleSize: '100ml', image: 'https://fimgs.net/mdimg/perfume/social.1068.jpg', occasion: 'casual, office', season: 'spring, summer', notes: 'Granny Smith apple, lemon, musks', niche_level: 1 },
  { name: 'Jean Paul Gaultier Le Beau', brand: 'JPG', price: 125, bottleSize: '75ml', image: 'https://fimgs.net/mdimg/perfume-thumbs/375x500.55785.jpg', occasion: 'casual, date night', season: 'summer', notes: 'pineapple, bergamot, vanilla, cashmeran', niche_level: 2 },
  { name: 'Armani Code', brand: 'Giorgio Armani', price: 110, bottleSize: '100ml', image: 'https://fimgs.net/mdimg/perfume/o.75126.jpg', occasion: 'office, casual', season: 'year-round', notes: 'almond, lemon, ambroxan, leather', niche_level: 2 },
  { name: 'Chanel No. 5', brand: 'Chanel', price: 140, bottleSize: '50ml', image: 'https://fimgs.net/mdimg/perfume/o.40069.jpg', occasion: 'evening, formal', season: 'year-round', notes: 'aldehydes, neroli, jasmine, rose, sandalwood', niche_level: 4 },
  { name: 'Hermès Eau de Merveilles', brand: 'Hermès', price: 160, bottleSize: '100ml', image: 'https://fimgs.net/mdimg/perfume-thumbs/375x500.9.jpg', occasion: 'casual, evening', season: 'year-round', notes: 'galbanum, neroli, amber, vanilla, musk', niche_level: 3 },
  { name: 'Lancôme La Vie est Belle', brand: 'Lancôme', price: 130, bottleSize: '75ml', image: 'https://fimgs.net/mdimg/perfume/o.14982.jpg', occasion: 'casual, evening', season: 'year-round', notes: 'patchouli, praline, iris, jasmine', niche_level: 2 }
];

function insertSampleData() {
  const stmt = db.prepare(`INSERT INTO fragrances (name, brand, price, bottleSize, image, occasion, season, notes, niche_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  sampleFragrances.forEach(frag => {
    stmt.run(frag.name, frag.brand, frag.price, frag.bottleSize, frag.image, frag.occasion, frag.season, frag.notes, frag.niche_level);
  });
  stmt.finalize();
  console.log('Sample data inserted');
}

// Helper function to get all fragrances with metadata
function getAllFragrances() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM fragrances', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Chat endpoint for Gemini
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('Received message:', message);
    console.log('Initializing Gemini model...');

    // Test simple API call
    console.log('Calling model.generateContent()...');
    const result = await model.generateContent(message);
    console.log('Got result from API');
    
    const responseText = result.response.text();
    console.log('Extracted text from response');

    console.log('API Response:', responseText);

    res.json({
      response: responseText,
      sessionId: 'test'
    });

  } catch (error) {
    console.error('Chat API Error - Full Details:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', JSON.stringify(error, null, 2));
    
    res.status(500).json({ 
      error: error.message,
      details: error.toString(),
      fullError: JSON.stringify(error, null, 2)
    });
  }
});


app.get('/api/fragrances', (req, res) => {
  db.all('SELECT * FROM fragrances', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/fragrances/:id', (req, res) => {
  db.get('SELECT * FROM fragrances WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(row);
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
