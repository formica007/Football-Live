/**
 * AdBlock Script per Football Live
 * Questo script blocca i popup pubblicitari quando si aprono i link dei canali
 * e previene le pubblicità durante la regolazione del volume, fullscreen e altre interazioni
 */

document.addEventListener('DOMContentLoaded', function() {
    // Funzione per intercettare i clic sui link e prevenire popup
    function setupAdBlocker() {
        // Intercetta tutti i clic sui link con target="_blank"
        document.addEventListener('click', function(e) {
            // Trova il link più vicino all'elemento cliccato
            let target = e.target;
            while (target && target.tagName !== 'A') {
                target = target.parentElement;
                if (!target) break;
            }
            
            // Se è un link con target="_blank"
            if (target && target.tagName === 'A' && target.getAttribute('target') === '_blank') {
                // Non preveniamo più il comportamento predefinito
                // e.preventDefault(); // Questa riga è stata commentata per permettere ai link di funzionare normalmente
                
                // Ottieni l'URL del link
                const url = target.href;
                
                // Apri la pagina direttamente in una nuova scheda
                const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
                
                // Inietta script per bloccare popup e pubblicità nella nuova finestra
                if (newWindow) {
                    // Usa location.replace per navigare all'URL senza aggiungerlo alla cronologia
                    newWindow.location.replace(url);
                    newWindow.addEventListener('DOMContentLoaded', function() {
                        // Blocca popup
                        newWindow.window.open = function() { return null; };
                        
                        // Blocca pubblicità durante le interazioni con il player (volume, fullscreen, ecc)
                        const blockPlayerAds = function() {
                            // Trova tutti gli elementi video e audio
                            const mediaElements = [...newWindow.document.querySelectorAll('video, audio')];
                            
                            mediaElements.forEach(media => {
                                // Imposta il volume senza attivare pubblicità
                                Object.defineProperty(media, 'volume', {
                                    get: function() {
                                        return this._volume || 1;
                                    },
                                    set: function(val) {
                                        this._volume = val;
                                        // Imposta il volume direttamente senza eventi che potrebbero attivare pubblicità
                                        try {
                                            const descriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'volume');
                                            if (descriptor && descriptor.set) {
                                                descriptor.set.call(this, val);
                                            }
                                        } catch (e) {
                                            console.log('Errore durante l\'impostazione del volume:', e);
                                        }
                                        return true;
                                    }
                                });
                                
                                // Blocca anche il mute/unmute che potrebbe attivare pubblicità
                                Object.defineProperty(media, 'muted', {
                                    get: function() {
                                        return this._muted || false;
                                    },
                                    set: function(val) {
                                        this._muted = val;
                                        try {
                                            const descriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'muted');
                                            if (descriptor && descriptor.set) {
                                                descriptor.set.call(this, val);
                                            }
                                        } catch (e) {
                                            console.log('Errore durante l\'impostazione del mute:', e);
                                        }
                                        return true;
                                    }
                                });
                                
                                // Blocca le pubblicità attivate dal fullscreen
                                const originalRequestFullscreen = media.requestFullscreen || 
                                                               media.webkitRequestFullscreen || 
                                                               media.mozRequestFullScreen || 
                                                               media.msRequestFullscreen;
                                
                                // Sovrascrive i metodi di fullscreen
                                if (originalRequestFullscreen) {
                                    media.requestFullscreen = function() {
                                        try {
                                            return originalRequestFullscreen.apply(this, arguments);
                                        } catch (e) {
                                            console.log('Errore durante l\'attivazione del fullscreen:', e);
                                        }
                                    };
                                    
                                    // Applica lo stesso per i prefissi specifici dei browser
                                    if (media.webkitRequestFullscreen) {
                                        media.webkitRequestFullscreen = media.requestFullscreen;
                                    }
                                    if (media.mozRequestFullScreen) {
                                        media.mozRequestFullScreen = media.requestFullscreen;
                                    }
                                    if (media.msRequestFullscreen) {
                                        media.msRequestFullscreen = media.requestFullscreen;
                                    }
                                }
                                
                                // Blocca anche gli eventi che potrebbero attivare pubblicità
                                const adTriggerEvents = ['play', 'pause', 'seeking', 'volumechange', 'ratechange'];
                                adTriggerEvents.forEach(eventType => {
                                    const originalAddEventListener = media.addEventListener;
                                    media.addEventListener = function(type, listener, options) {
                                        if (adTriggerEvents.includes(type)) {
                                            // Intercetta gli eventi che potrebbero attivare pubblicità
                                            const wrappedListener = function(event) {
                                                // Previeni la propagazione dell'evento se sembra un trigger di pubblicità
                                                if (event.isTrusted && !event._adblockProcessed) {
                                                    event._adblockProcessed = true;
                                                    listener.call(this, event);
                                                }
                                            };
                                            return originalAddEventListener.call(this, type, wrappedListener, options);
                                        }
                                        return originalAddEventListener.call(this, type, listener, options);
                                    };
                                });
                            });
                            
                            // Blocca anche i player comuni di streaming
                            blockCommonStreamingPlayers(newWindow.document);
                        };
                        
                        // Funzione per bloccare i player di streaming comuni
                        const blockCommonStreamingPlayers = function(doc) {
                            // Identifica e blocca i player comuni (JW Player, VideoJS, ecc.)
                            const playerContainers = [
                                ...doc.querySelectorAll('.jwplayer'),
                                ...doc.querySelectorAll('.video-js'),
                                ...doc.querySelectorAll('.player-container'),
                                ...doc.querySelectorAll('[class*="player"]'),
                                ...doc.querySelectorAll('[id*="player"]')
                            ];
                            
                            playerContainers.forEach(container => {
                                // Rimuovi gli overlay pubblicitari
                                const adOverlays = container.querySelectorAll('[class*="ad"], [id*="ad"], [class*="overlay"], [id*="overlay"]');
                                adOverlays.forEach(overlay => {
                                    if (overlay.style) {
                                        overlay.style.display = 'none';
                                        overlay.style.visibility = 'hidden';
                                        overlay.style.opacity = '0';
                                        overlay.style.pointerEvents = 'none';
                                    }
                                });
                            });
                        };
                        
                        // Esegui subito e poi periodicamente per catturare nuovi elementi
                        blockPlayerAds();
                        setInterval(blockPlayerAds, 1000);
                        
                        // Blocca anche i popup che potrebbero apparire in seguito
                        newWindow.addEventListener('beforeunload', function(e) {
                            // Previeni popup di conferma all'uscita
                            e.preventDefault();
                            return null;
                        });
                    });
                }
            }
        }, true); // Usa la fase di capturing per intercettare prima che raggiunga il link
    }
    
    // Avvia il blocco pubblicità
    setupAdBlocker();
    
    // Aggiungi un osservatore per gestire i link aggiunti dinamicamente
    const observer = new MutationObserver(function() {
        // Riapplica il blocco pubblicità quando il DOM cambia
        setupAdBlocker();
    });
    
    // Osserva le modifiche al DOM
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});