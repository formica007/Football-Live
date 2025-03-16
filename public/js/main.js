document.addEventListener('DOMContentLoaded', function() {
    // Update the date display but keep it hidden initially
    updateDateDisplay();
    // Hide date display and refresh time initially
    const currentDate = document.getElementById('current-date');
    currentDate.style.display = 'none';
    const refreshTime = document.querySelector('.refresh-time');
    refreshTime.style.display = 'none'; // Nascosto inizialmente
    // Hide matches container initially
    const matchesContainer = document.getElementById('matches-container');
    matchesContainer.style.display = 'none';
    
    // Cache DOM elements
    const pinForm = document.getElementById('pin-form');
    const pinInput = document.getElementById('pin');
    const loginBtn = document.getElementById('login-btn');
    const attemptsCounter = document.getElementById('attempts-left');
    const welcomeMessage = document.getElementById('welcome-message');
    const welcomeDeveloper = document.getElementById('welcome-developer');
    const blockPopup = document.getElementById('block-popup');
    const blockDiv = document.getElementById('blocked');
    const blockTimer = document.getElementById('block-timer');
    // matchesContainer is already declared above, so we don't redeclare it here
    const matchesList = document.getElementById('matches-list');
    const lastUpdate = document.getElementById('last-update');

    // Variables
    let attempts = parseInt(localStorage.getItem('attempts')) || 0;
    let blockEnd = parseInt(localStorage.getItem('blockEnd')) || 0;
    const blockDuration = 30 * 60 * 1000; // 30 minutes
    let currentLeague = null;
    let updateInterval = null;

    // Check if user is blocked
    if (Date.now() < blockEnd) {
        startBlockTimer();
    } else {
        attemptsCounter.innerText = 5 - attempts;
    }

    // Event listeners
    loginBtn.addEventListener('click', checkPin);
    pinInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkPin();
        }
    });
 
    // Functions
    function checkPin() {
        const pin = pinInput.value;
        // Add console log for debugging
        console.log('Attempting to validate PIN:', pin);
        const currentDate = document.getElementById('current-date');

        // Check if the PIN is the developer PIN (20855) even when blocked
        if (pin === "20855") {
            localStorage.removeItem('attempts');
            localStorage.removeItem('blockEnd');
            welcomeMessage.style.display = 'none';
            welcomeDeveloper.style.display = 'block';
            blockDiv.style.display = 'none';
            blockPopup.style.display = 'none';
            pinForm.classList.add('hidden');
            document.body.classList.add('logged-in');
            currentDate.style.display = 'block'; // Show date after login
            refreshTime.style.display = 'block'; // Show refresh time after login
            loadAllMatches(); // Carica automaticamente tutte le partite
            
            setTimeout(() => {
                welcomeDeveloper.classList.add('fade-out');
                setTimeout(() => {
                    welcomeDeveloper.style.display = 'none';
                }, 500);
            }, 3000);
            return;
        }

        if (Date.now() < blockEnd) {
            blockPopup.style.display = 'block';
            setTimeout(() => { blockPopup.style.display = 'none'; }, 3000);
            return;
        }

        // Send PIN to server for validation
        fetch('/api/check-pin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pin })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (data.userType === 'developer') {
                    localStorage.removeItem('attempts');
                    localStorage.removeItem('blockEnd');
                    welcomeMessage.style.display = 'none';
                    welcomeDeveloper.style.display = 'block';
                    blockDiv.style.display = 'none';
                    blockPopup.style.display = 'none';
                    pinForm.classList.add('hidden');
                    document.body.classList.add('logged-in');
                    currentDate.style.display = 'block'; // Show date after login
                    refreshTime.style.display = 'block'; // Show refresh time after login
                    localStorage.setItem('attempts', 0);
                    loadAllMatches(); // Carica automaticamente tutte le partite
                    
                    setTimeout(() => {
                        welcomeDeveloper.classList.add('fade-out');
                        setTimeout(() => {
                            welcomeDeveloper.style.display = 'none';
                        }, 500);
                    }, 3000);
                } else {
                    welcomeMessage.innerHTML = 'Benvenuto';
                    welcomeMessage.style.display = 'block';
                    pinForm.classList.add('hidden');
                    document.body.classList.add('logged-in');
                    currentDate.style.display = 'block'; // Show date after login
                    refreshTime.style.display = 'block'; // Show refresh time after login
                    localStorage.setItem('attempts', 0);
                    loadAllMatches(); // Carica automaticamente tutte le partite
                    
                    setTimeout(() => {
                        welcomeMessage.classList.add('fade-out');
                        setTimeout(() => {
                            welcomeMessage.style.display = 'none';
                        }, 500);
                    }, 3000);
                }
            } else {
                attempts++;
                localStorage.setItem('attempts', attempts);
                attemptsCounter.innerText = 5 - attempts;
                
                if (attempts >= 5) {
                    blockEnd = Date.now() + blockDuration;
                    localStorage.setItem('blockEnd', blockEnd);
                    startBlockTimer();
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
    


    function startBlockTimer() {
        blockDiv.style.display = 'block';
        const interval = setInterval(() => {
            const timeLeft = blockEnd - Date.now();
            if (timeLeft <= 0) {
                clearInterval(interval);
                localStorage.removeItem('attempts');
                localStorage.removeItem('blockEnd');
                location.reload();
            } else {
                const minutes = Math.floor(timeLeft / 60000);
                const seconds = Math.floor((timeLeft % 60000) / 1000);
                blockTimer.innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            }
        }, 1000);
    }

    function loadAllMatches() {
        if (updateInterval) {
            clearInterval(updateInterval);
        }
        
        updateMatches();
        matchesContainer.style.display = 'block';
        
        updateInterval = setInterval(updateMatches, 60 * 1000); // Update every minute
    }

    async function updateMatches() {
        matchesList.innerHTML = '<div class="loading">Caricamento partite...</div>';

        try {
            const response = await fetch('/api/matches');
            const matches = await response.json();
            displayMatches(matches);
            lastUpdate.textContent = new Date().toLocaleTimeString();
        } catch (error) {
            console.error('Errore nell\'aggiornamento delle partite:', error);
            matchesList.innerHTML = `
                <div class="error-message">
                    Errore nel caricamento delle partite.<br>
                    ${error.message}<br>
                    Riprova più tardi.
                </div>
            `;
        }
    }
    
    function updateDateDisplay() {
        const todayDate = document.getElementById('today-date');
        const options = { day: 'numeric', month: 'long' };
        const formattedDate = new Date().toLocaleDateString('it-IT', options);
        todayDate.textContent = formattedDate;
        
        // Update date every day at midnight
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const timeUntilMidnight = tomorrow - now;
        
        setTimeout(updateDateDisplay, timeUntilMidnight);
    }

    function displayMatches(matches) {
        matchesList.innerHTML = '';

        // Aggiungiamo prima la sezione dedicata per i canali online
        const onlineChannelsCard = document.createElement('div');
        onlineChannelsCard.className = 'online-channels-card';
        onlineChannelsCard.innerHTML = `
            <div class="details">
                <a class="game-name" href="" title=""><span>Canali OnLine</span></a>
                <div class="hd-warning">*  I Canali HD FUNZIONANO SOLO CON CHROME DA PC SCARICANDO UN ESTENSIONE CHE LEGGE IL PLAYER (CERCARE QUESTO ID NELLO STORE E SCARICARE L'ESTENSIONE: opmeopcambhfimffbomjgemehjkbbmji)</div>
                
                <div class="channel-buttons-grid">
                    <button class="btn btn-light" type="button"><a href="https://hattrick.ws/sport24hd.htm" target="_blank">Sky Sport 24 HD*</a></button>
                    <button class="btn btn-light" type="button"><a href="https://hattrick.ws/unohd.htm" target="_blank">Sky Sport Uno HD*</a></button>
                    <button class="btn btn-light" type="button"><a href="https://hattrick.ws/uno.htm" target="_blank">Sky Sport Uno</a></button>
                    <button class="btn btn-light" type="button"><a href="https://hattrick.ws/calciohd.htm" target="_blank">Sky Sport Calcio HD*</a></button>
                    <button class="btn btn-light" type="button"><a href="https://hattrick.ws/calcio.htm" target="_blank">Sky Sport Calcio</a></button>
                    <button class="btn btn-light" type="button"><a href="https://hattrick.ws/arenahd.htm" target="_blank">Sky Sport Arena HD*</a></button>
                    <button class="btn btn-light" type="button"><a href="https://hattrick.ws/arena.htm" target="_blank">Sky Sport Arena</a></button>
                    <button class="btn btn-light" type="button"><a href="https://hattrick.ws/maxhd.htm" target="_blank">Sky Sport Max HD*</a></button>
                    <button class="btn btn-light" type="button"><a href="https://hattrick.ws/max.htm" target="_blank">Sky Sport Max</a></button>
                    <button class="btn btn-light" type="button"><a href="https://hattrick.ws/f1hd.htm" target="_blank">Sky Sport F1 HD*</a></button>
                    <button class="btn btn-light" type="button"><a href="https://hattrick.ws/f1.htm" target="_blank">Sky Sport F1</a></button>
                    <button class="btn btn-light" type="button"><a href="https://hattrick.ws/motogphd.htm" target="_blank">Sky Sport Moto GP HD*</a></button>
                    <button class="btn btn-light" type="button"><a href="https://hattrick.ws/motogp.htm" target="_blank">Sky Sport Moto GP</a></button>
                    <button class="btn btn-light" type="button"><a href="https://hattrick.ws/dazn1hd.htm" target="_blank">Dazn 1 HD*</a></button>
                    <button class="btn btn-light" type="button"><a href="https://hattrick.ws/tennishd.htm" target="_blank">Sky Tennis HD*</a></button>
                    <button class="btn btn-light" type="button"><a href="https://hattrick.ws/tennis.htm" target="_blank">Sky Tennis</a></button>
                    <button class="btn btn-light" type="button"><a href="https://hattrick.ws/nbahd.htm" target="_blank">Sky NBA HD*</a></button>
                    <button class="btn btn-light" type="button"><a href="https://hattrick.ws/nba.htm" target="_blank">Sky NBA</a></button>
                    <button class="btn btn-light" type="button"><a href="https://hattrick.ws/skyunohd.htm" target="_blank">Sky Uno HD*</a></button>
                    <button class="btn btn-light" type="button"><a href="https://hattrick.ws/skyuno.htm" target="_blank">Sky Uno</a></button>
                </div>
            </div>
        `;
        matchesList.appendChild(onlineChannelsCard);
        
        // Ensure links open in a new tab with their original behavior

        if (!matches || matches.length === 0) {
            const noMatchesDiv = document.createElement('div');
            noMatchesDiv.className = 'loading';
            noMatchesDiv.textContent = 'Nessuna partita in programma oggi';
            matchesList.appendChild(noMatchesDiv);
            return;
        }

        // Raggruppa gli eventi per categoria
        const eventsByCategory = {};
        
        matches.forEach(match => {
            // Ignora completamente gli eventi della categoria 'Canali On Line'
            // o eventi che contengono 'Canali On Line' nel nome della squadra di casa o ospite
            if ((match.category && match.category.toLowerCase().trim().includes('canali on')) ||
                (match.homeTeam && match.homeTeam.toLowerCase().trim().includes('canali on')) ||
                (match.awayTeam && match.awayTeam.toLowerCase().trim().includes('canali on')) ||
                (match.eventName && match.eventName.toLowerCase().trim().includes('canali on'))) {
                return; // Salta questo evento completamente
            }
            
            const category = match.category || 'Altro';
            if (!eventsByCategory[category]) {
                eventsByCategory[category] = [];
            }
            eventsByCategory[category].push(match);
        });

        // Crea un elemento per ogni evento, raggruppati per categoria
        Object.keys(eventsByCategory).forEach(category => {
            // Aggiungi gli eventi di questa categoria
            eventsByCategory[category].forEach(event => {
                const eventCard = document.createElement('div');
                eventCard.className = 'match-card';
                
                // Determina se è una partita tra due squadre o un altro tipo di evento
                const isMatch = event.awayTeam && event.awayTeam.trim() !== '';
                
                // Crea il contenuto HTML in base al tipo di evento
                let eventHtml = '';
                
                if (isMatch) {
                    // È una partita tra due squadre
                    eventHtml = `
                        <div class="match-card-container">
                            <div class="match-card-side-info">
                                ${category === 'Serie A' ? 
                                `<div class="event-category">
                                    ${event.logoSrc ? `<img src="${event.logoSrc}" class="event-logo" alt="${category}">` : ''}
                                    <span>${category}</span>
                                </div>
                                <div class="event-teams">
                                    <span class="team-name">${event.homeTeam} vs ${event.awayTeam}</span>
                                </div>
                                <div class="event-time">${event.time || 'TBD'}</div>` : 
                                `<div class="event-teams">
                                    <span class="team-name">${event.homeTeam}</span>
                                    <span class="vs">vs</span>
                                    <span class="team-name">${event.awayTeam}</span>
                                </div>
                                <div class="event-category">
                                    ${event.logoSrc ? `<img src="${event.logoSrc}" class="event-logo" alt="${category}">` : ''}
                                    <span>${category}</span>
                                </div>
                                <div class="event-time">${event.time || 'TBD'}</div>`}
                                ${event.channel ? `<div class="event-channel">${event.channel}</div>` : ''}
                            </div>
                            <div class="match-card-main-content">
                                <div class="event-header">
                                </div>
                            </div>
                        </div>
                    `;
                    
                    // Aggiungi i link dei canali se disponibili
                    if (event.channels && event.channels.length > 0) {
                        const channelsSection = document.createElement('div');
                        channelsSection.className = 'event-channels';
                        channelsSection.innerHTML = `
                            <h4>Canali disponibili:</h4>
                            <div class="channel-buttons">
                                ${event.channels.map(channel => 
                                    `<a href="${channel.url}" target="_blank" class="channel-button">${channel.name}</a>`
                                ).join('')}
                            </div>
                        `;
                        eventCard.appendChild(channelsSection);
                    }
                } else {
                    // È un evento singolo
                    eventHtml = `
                        <div class="match-card-container">
                            <div class="match-card-side-info">
                                <div class="event-category">
                                    ${event.logoSrc ? `<img src="${event.logoSrc}" class="event-logo" alt="${category}">` : ''}
                                    <span>${category}</span>
                                </div>
                                <div class="event-name">${event.eventName || event.homeTeam}</div>
                                <div class="event-time">${event.time || 'TBD'}</div>
                                ${event.channel ? `<div class="event-channel">${event.channel}</div>` : ''}
                            </div>
                            <div class="match-card-main-content">
                            </div>
                        </div>
                    `;
                    
                    // Aggiungi i link dei canali se disponibili
                    if (event.channels && event.channels.length > 0) {
                        const channelsSection = document.createElement('div');
                        channelsSection.className = 'event-channels';
                        channelsSection.innerHTML = `
                            <h4>Canali disponibili:</h4>
                            <div class="channel-buttons">
                                ${event.channels.map(channel => 
                                    `<a href="${channel.url}" target="_blank" class="channel-button">${channel.name}</a>`
                                ).join('')}
                            </div>
                        `;
                        eventCard.appendChild(channelsSection);
                    }
                }
                
                eventCard.innerHTML = eventHtml;
                matchesList.appendChild(eventCard);
                
                // Aggiungi i link dei canali se disponibili
                if (event.channels && event.channels.length > 0) {
                    const channelsSection = document.createElement('div');
                    channelsSection.className = 'event-channels';
                    channelsSection.innerHTML = `
                        <h4>Canali disponibili:</h4>
                        <div class="channel-buttons-centered">
                            ${event.channels.map(channel => 
                                `<a href="${channel.url}" target="_blank" class="channel-button-large">${channel.name}</a>`
                            ).join('')}
                        </div>
                    `;
                    eventCard.appendChild(channelsSection);
                }
            });
        });

       }
});
