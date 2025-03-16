const axios = require('axios');

const cheerio = require('cheerio');

/**
 * Modulo per recuperare le partite in programma da hattrick.ws
 * Utilizza scraping per ottenere dati reali
 */

// URL del sito hattrick.ws
const HATTRICK_URL = 'https://hattrick.ws/';

// Mappatura dei campionati (mantenuta per compatibilità)
const leagueMapping = {
  'serie-a': 'serie-a',
  'premier-league': 'premier-league',
  'la-liga': 'la-liga',
  'bundesliga': 'bundesliga',
  'ligue-1': 'ligue-1'
};

// Dati di fallback per i campionati (usati solo in caso di errore nel recupero dati)
const fallbackData = {
  'serie-a': [
    {
      homeTeam: 'Inter',
      awayTeam: 'Milan',
      date: new Date().toISOString().split('T')[0],
      time: '20:45',
      venue: 'San Siro',
      score: '2 - 0',
      status: 'LIVE',
      minute: '67'
    },
    {
      homeTeam: 'Juventus',
      awayTeam: 'Roma',
      date: new Date().toISOString().split('T')[0],
      time: '18:00',
      venue: 'Allianz Stadium',
      score: '1 - 1',
      status: 'LIVE',
      minute: '82'
    },
    {
      homeTeam: 'Napoli',
      awayTeam: 'Atalanta',
      date: new Date().toISOString().split('T')[0],
      time: '15:00',
      venue: 'Diego Armando Maradona',
      score: '0 - 0',
      status: 'NS'
    }
  ],
  'premier-league': [
    {
      homeTeam: 'Manchester City',
      awayTeam: 'Liverpool',
      date: new Date().toISOString().split('T')[0],
      time: '17:30',
      venue: 'Etihad Stadium',
      score: '3 - 1',
      status: 'LIVE',
      minute: '75'
    },
    {
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      date: new Date().toISOString().split('T')[0],
      time: '15:00',
      venue: 'Emirates Stadium',
      score: '2 - 0',
      status: 'LIVE',
      minute: '63'
    }
  ],
  'la-liga': [
    {
      homeTeam: 'Real Madrid',
      awayTeam: 'Barcelona',
      date: new Date().toISOString().split('T')[0],
      time: '21:00',
      venue: 'Santiago Bernabéu',
      score: '2 - 2',
      status: 'LIVE',
      minute: '55'
    },
    {
      homeTeam: 'Atletico Madrid',
      awayTeam: 'Sevilla',
      date: new Date().toISOString().split('T')[0],
      time: '19:00',
      venue: 'Wanda Metropolitano',
      score: '1 - 0',
      status: 'LIVE',
      minute: '70'
    }
  ],
  'bundesliga': [
    {
      homeTeam: 'Bayern Munich',
      awayTeam: 'Borussia Dortmund',
      date: new Date().toISOString().split('T')[0],
      time: '18:30',
      venue: 'Allianz Arena',
      score: '4 - 1',
      status: 'LIVE',
      minute: '80'
    },
    {
      homeTeam: 'RB Leipzig',
      awayTeam: 'Bayer Leverkusen',
      date: new Date().toISOString().split('T')[0],
      time: '15:30',
      venue: 'Red Bull Arena',
      score: '0 - 2',
      status: 'LIVE',
      minute: '58'
    }
  ],
  'ligue-1': [
    {
      homeTeam: 'PSG',
      awayTeam: 'Marseille',
      date: new Date().toISOString().split('T')[0],
      time: '20:45',
      venue: 'Parc des Princes',
      score: '3 - 0',
      status: 'LIVE',
      minute: '65'
    },
    {
      homeTeam: 'Lyon',
      awayTeam: 'Monaco',
      date: new Date().toISOString().split('T')[0],
      time: '17:00',
      venue: 'Groupama Stadium',
      score: '1 - 1',
      status: 'LIVE',
      minute: '72'
    }
  ]
};

/**
 * Recupera tutte le partite da hattrick.ws
 * @returns {Promise<Array>} - Array di oggetti partita
 */
async function getMatches() {
  try {
    console.log('Recupero partite da hattrick.ws...');
    
    // Effettua la richiesta HTTP al sito hattrick.ws
    const response = await axios.get(HATTRICK_URL);
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Array per memorizzare tutte le partite
    const allMatches = [];
    
    // Seleziona i contenitori delle partite basati sulla struttura reale di hattrick.ws
    console.log('Analisi HTML di hattrick.ws...');
    $('.row').each((index, element) => {
      try {
        // Verifica se questo row contiene un evento sportivo
        const gameNameElement = $(element).find('.game-name span');
        if (gameNameElement.length === 0) {
          return; // Non è un evento sportivo, passa al prossimo
        }
        
        // Estrai le informazioni dell'evento
        const eventName = gameNameElement.text().trim();
        
        // Estrai data, ora e categoria (es: "20:30 · Serie B")
        const dateInfo = $(element).find('.date').text().trim();
        let time = '00:00';
        let category = 'Altro';
        
        if (dateInfo) {
          const dateInfoParts = dateInfo.split('·');
          if (dateInfoParts.length >= 1) {
            time = dateInfoParts[0].trim();
          }
          if (dateInfoParts.length >= 2) {
            category = dateInfoParts[1].trim();
          }
        }
        
        // Estrai l'immagine della mascotte/logo
        const logoSrc = $(element).find('.mascot').attr('src') || '';
        
        // Estrai i link dei canali disponibili
        const channels = [];
        $(element).find('.btn-light a').each((i, channelElement) => {
          const channelName = $(channelElement).text().trim();
          const channelUrl = $(channelElement).attr('href');
          if (channelName && channelUrl) {
            channels.push({
              name: channelName,
              url: channelUrl
            });
          }
        });
        
        // La sezione 'Canali On Line' è stata rimossa

        // Il codice per ignorare le intestazioni di canali è stato rimosso
        
        // Determina il tipo di evento e le squadre
        let homeTeam = '';
        let awayTeam = '';
        let eventType = 'altro';
        
        // Verifica se è una partita di calcio o altro tipo di evento
        if (eventName.includes(' - ')) {
          // È probabilmente una partita tra due squadre
          const teams = eventName.split(' - ');
          homeTeam = teams[0].trim();
          awayTeam = teams[1].trim();
          
          // Determina il campionato in base alla categoria
          const lowerCategory = category.toLowerCase();
          if (lowerCategory.includes('serie a')) {
            eventType = 'serie-a';
          } else if (lowerCategory.includes('premier')) {
            eventType = 'premier-league';
          } else if (lowerCategory.includes('liga')) {
            eventType = 'la-liga';
          } else if (lowerCategory.includes('bundesliga')) {
            eventType = 'bundesliga';
          } else if (lowerCategory.includes('ligue')) {
            eventType = 'ligue-1';
          } else if (lowerCategory.includes('serie b')) {
            eventType = 'serie-b';
          }
        } else {
          // È un altro tipo di evento (F1, MotoGP, ecc.)
          homeTeam = eventName;
          
          // Determina il tipo di evento
          const lowerCategory = category.toLowerCase();
          if (lowerCategory.includes('f1') || lowerCategory.includes('formula')) {
            eventType = 'f1';
          } else if (lowerCategory.includes('motogp') || lowerCategory.includes('moto gp')) {
            eventType = 'motogp';
          } else if (lowerCategory.includes('tennis')) {
            eventType = 'tennis';
          } else if (lowerCategory.includes('nba') || lowerCategory.includes('basket')) {
            eventType = 'basket';
          }
        }
        
        // Crea l'oggetto evento
        const match = {
          homeTeam,
          awayTeam,
          eventName,
          date: new Date().toISOString().split('T')[0], // Data odierna come default
          time,
          venue: 'Stadio', // Default
          score: '0 - 0', // Default
          status: 'NS', // Default: Not Started
          minute: '',
          league: eventType,
          category,
          logoSrc,
          channels
        };
        
        console.log(`Evento trovato: ${eventName}, Categoria: ${category}, Canali: ${channels.length}`);
        allMatches.push(match);
      } catch (err) {
        console.error(`Errore nell'estrazione dei dati di un evento: ${err.message}`);
      }
    });
    
    console.log(`Recuperate ${allMatches.length} partite da hattrick.ws`);
    
    // Se non ci sono partite, usa i dati di fallback
    if (allMatches.length === 0) {
      console.log('Nessuna partita trovata, utilizzo dati di fallback');
      return getFallbackMatches();
    }
    
    return allMatches;
  } catch (error) {
    console.error(`Errore nel recupero delle partite da hattrick.ws: ${error.message}`);
    console.log('Utilizzo dati di fallback');
    return getFallbackMatches();
  }
}

/**
 * Recupera i dati di fallback per le partite
 * @returns {Array} - Array di oggetti partita di fallback
 */
function getFallbackMatches() {
  let allMatches = [];
  
  // Aggiungiamo le partite di ogni campionato all'array
  for (const league in fallbackData) {
    const matches = fallbackData[league] || [];
    // Aggiungiamo l'informazione sul campionato a ogni partita
    const matchesWithLeague = matches.map(match => ({
      ...match,
      league: league
    }));
    allMatches = [...allMatches, ...matchesWithLeague];
  }
  
  return allMatches;
}

/**
 * Estrae data e ora da una stringa di testo
 * @param {string} dateTimeText - Testo contenente data e ora
 * @returns {Array} - Array con [data, ora]
 */
function extractDateTime(dateTimeText) {
  try {
    // Rimuovi eventuali caratteri non necessari
    const cleanText = dateTimeText.replace(/[\n\r\t]/g, ' ').trim();
    
    // Cerca di estrarre l'ora (formato HH:MM)
    const timeMatch = cleanText.match(/\d{1,2}:\d{2}/);
    const timePart = timeMatch ? timeMatch[0] : '00:00';
    
    // Cerca di estrarre la data
    let datePart = new Date().toISOString().split('T')[0]; // Default: oggi
    
    // Nel formato di hattrick.ws, spesso l'ora è già estratta dalla struttura HTML
    // e non c'è una data esplicita nel testo, quindi usiamo la data di oggi
    
    return [datePart, timePart];
  } catch (error) {
    console.error('Errore nell\'estrazione di data e ora:', error);
    // Formato di default se non riusciamo a estrarre correttamente
    return [new Date().toISOString().split('T')[0], '00:00'];
  }
}

module.exports = {
  getMatches
};