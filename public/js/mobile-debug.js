/**
 * Mobile Debug Script per Football Live
 * Questo script aiuta a diagnosticare problemi di compatibilità mobile
 */

document.addEventListener('DOMContentLoaded', function() {
    // Crea un elemento per mostrare informazioni di debug
    function createDebugInfo() {
        // Verifica se è un dispositivo mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Crea un elemento per le informazioni di debug
        const debugDiv = document.createElement('div');
        debugDiv.id = 'mobile-debug-info';
        debugDiv.style.position = 'fixed';
        debugDiv.style.bottom = '10px';
        debugDiv.style.left = '10px';
        debugDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        debugDiv.style.color = 'white';
        debugDiv.style.padding = '10px';
        debugDiv.style.borderRadius = '5px';
        debugDiv.style.fontSize = '12px';
        debugDiv.style.zIndex = '9999';
        debugDiv.style.maxWidth = '80%';
        debugDiv.style.display = 'none'; // Nascosto di default
        
        // Aggiungi informazioni sul dispositivo
        debugDiv.innerHTML = `
            <div><strong>Tipo dispositivo:</strong> ${isMobile ? 'Mobile' : 'Desktop'}</div>
            <div><strong>User Agent:</strong> ${navigator.userAgent}</div>
            <div><strong>Viewport:</strong> ${window.innerWidth}x${window.innerHeight}</div>
            <div><strong>Pixel Ratio:</strong> ${window.devicePixelRatio}</div>
        `;
        
        // Aggiungi un pulsante per mostrare/nascondere le informazioni di debug
        const debugButton = document.createElement('button');
        debugButton.textContent = 'Debug';
        debugButton.style.position = 'fixed';
        debugButton.style.bottom = '10px';
        debugButton.style.left = '10px';
        debugButton.style.backgroundColor = '#1a237e';
        debugButton.style.color = 'white';
        debugButton.style.padding = '5px 10px';
        debugButton.style.borderRadius = '5px';
        debugButton.style.fontSize = '12px';
        debugButton.style.zIndex = '10000';
        debugButton.style.border = 'none';
        
        // Aggiungi evento per mostrare/nascondere le informazioni di debug
        debugButton.addEventListener('click', function() {
            if (debugDiv.style.display === 'none') {
                debugDiv.style.display = 'block';
            } else {
                debugDiv.style.display = 'none';
            }
        });
        
        // Aggiungi gli elementi al body
        document.body.appendChild(debugDiv);
        document.body.appendChild(debugButton);
    }
    
    // Inizializza le informazioni di debug
    createDebugInfo();
});