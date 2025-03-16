const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const hattrickScraper = require('./scraper/hattrick-scraper');
const app = express();
const port = process.env.PORT || 3000;

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Users data (in a real app, this would be in a database)
const users = {
  "0921": true,
  "5678": true,
  "9012": true,
  "20855": "developer"
};

// Nessuna mappatura dei campionati necessaria qui
// I dati di fallback sono ora gestiti direttamente nel modulo hattrick-scraper

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

// API endpoint to check PIN
app.post('/api/check-pin', (req, res) => {
  const { pin } = req.body;
  
  if (users[pin] === "developer") {
    return res.json({ success: true, userType: 'developer' });
  }
  
  if (users[pin]) {
    return res.json({ success: true, userType: 'user' });
  }
  
  return res.json({ success: false });
});

// API endpoint to get all matches
app.get('/api/matches', async (req, res) => {
  try {
    // Recupera tutti i dati dal modulo hattrick-scraper
    const matches = await hattrickScraper.getMatches();
    res.json(matches);
  } catch (error) {
    console.error(`Errore nel recupero delle partite: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});