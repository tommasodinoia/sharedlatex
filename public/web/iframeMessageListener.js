console.log("[iframeMessageListener.js] Script caricato.");

window.addEventListener("message", event => {
  // IMPORTANTE: Per sicurezza, verifica sempre l'origine del messaggio.
  // Sostituisci 'http://tuo-dominio-o-origine.com' con l'origine effettiva
  // da cui ti aspetti di ricevere messaggi (es. l'URL di index3.html).
  // Per sviluppo locale, potrebbe essere 'http://localhost:xxxx' o 'null' se apri il file direttamente.
  // const expectedOrigin = 'http://tuo-dominio-o-origine.com';
  // if (event.origin !== expectedOrigin) {
  //   console.warn(`[iframeMessageListener.js] Messaggio ignorato da origine non attesa: ${event.origin}`);
  //   return;
  // }

  // Controlla il tipo di messaggio e la presenza di fileURL
  if (event.data?.type === 'loadPDF' && event.data.fileURL) {
    console.log("[iframeMessageListener.js] Messaggio 'loadPDF' ricevuto:", event.data);
    const { fileURL, filename } = event.data;

    // Verifica che l'URL sia una stringa e inizi con 'blob:' o 'data:'
    if (typeof fileURL === 'string' && (fileURL.startsWith('blob:') || fileURL.startsWith('data:'))) {
      // Assicurati che PDFViewerApplication sia disponibile
      // PDFViewerApplication è solitamente reso globale da viewer.mjs
      if (window.PDFViewerApplication) {
        console.log("[iframeMessageListener.js] Chiamata a PDFViewerApplication.open con URL:", fileURL);
        
        // Prepara i parametri per l'apertura del PDF
        const openParams = { url: fileURL };
        
        // Se è fornito un filename, configuralo
        if (filename) {
          // Imposta il titolo del documento prima dell'apertura
          console.log("[iframeMessageListener.js] Impostazione del filename:", filename);
        }
        
        window.PDFViewerApplication.open(openParams)
          .then(() => {
            console.log("[iframeMessageListener.js] PDF da postMessage caricato con successo.");
            
            // Imposta il titolo e il filename per i download dopo che il PDF è stato caricato
            if (filename && window.PDFViewerApplication.appConfig) {
              window.PDFViewerApplication.setTitle(filename);
              
              // Imposta il filename per i download usando la funzione dedicata
              setupDownloadFilename(filename);
              
              // Imposta anche il titolo del documento del browser
              if (window.parent !== window) {
                // Se siamo in un iframe, aggiorna anche il titolo della pagina parent
                window.parent.document.title = `TexWaller - ${filename}`;
              }
            }
            
            // Invia conferma al parent per revocare l'URL
            if (event.source) {
              event.source.postMessage({ type: 'pdfProcessed' }, event.origin); // Usa event.origin per sicurezza
              console.log("[iframeMessageListener.js] Messaggio 'pdfProcessed' inviato al parent.");
            }
          })
          .catch(err => {
            console.error("[iframeMessageListener.js] Errore durante PDFViewerApplication.open:", err);
            // Invia notifica di errore al parent, ma indica comunque di revocare l'URL
            if (event.source) {
              event.source.postMessage({ type: 'pdfLoadError', error: err.message }, event.origin);
              console.log("[iframeMessageListener.js] Messaggio 'pdfLoadError' inviato al parent.");
            }
          });
      } else {
        console.error("[iframeMessageListener.js] PDFViewerApplication non trovato sulla window.");
      }
    } else {
      console.error("[iframeMessageListener.js] fileURL non valido o non è una stringa blob/data:", fileURL);
    }
  } else {
    // Puoi aggiungere qui la gestione per altri tipi di messaggi se necessario
    // console.log("[iframeMessageListener.js] Messaggio ricevuto di tipo diverso o senza fileURL:", event.data);
  }
});

// --- NUOVA LOGICA PER GESTIRE I CLICK SULLE PAGINE ---

function setupPageClickListeners() {
    if (!window.PDFViewerApplication || !window.PDFViewerApplication.eventBus) {
        console.error("[iframeMessageListener.js] PDFViewerApplication o EventBus non disponibili per i listener di click.");
        return;
    }
    console.log("[iframeMessageListener.js] Impostazione dei listener di click per le pagine.");
    const eventBus = window.PDFViewerApplication.eventBus;

    eventBus.on('pagerendered', event => {
        // event.source è il PDFPageView
        // event.source.div è il div contenitore della pagina
        // event.pageNumber è il numero della pagina (1-based)
        const pageDiv = event.source.div;
        const pageNumber = event.pageNumber;
        const pageView = event.source;

        // Controlla se il listener è già stato aggiunto per evitare duplicati
        if (pageDiv && !pageDiv.dataset.clickListenerAdded) {
            console.log(`[iframeMessageListener.js] Aggiungo listener click alla pagina ${pageNumber}`);
            pageDiv.dataset.clickListenerAdded = 'true'; // Marca come aggiunto

            pageDiv.addEventListener('dblclick', async (clickEvent) => {
                console.log(`[iframeMessageListener.js] Pagina ${pageNumber} cliccata (dblclick)!`);

                // 1. Ottenere coordinate del click relative al div della pagina (CSS Pixel)
                const rect = pageDiv.getBoundingClientRect();
                const cssX = clickEvent.clientX - rect.left;
                const cssY = clickEvent.clientY - rect.top;
                console.log(`[iframeMessageListener.js] Coordinate click (relative a div, CSS pixel): x=${cssX.toFixed(2)}, y=${cssY.toFixed(2)}`);

                // 2. Ottenere il viewport CORRENTE associato a questa vista di pagina
                const currentViewport = pageView.viewport;
                if (!currentViewport) {
                    console.error(`[iframeMessageListener.js] Viewport corrente non disponibile per la pagina ${pageNumber}`);
                    return;
                }

                // 2b. Ottenere l'altezza REALE (non scalata) della pagina PDF in punti
                let unscaledPageHeight = null;
                try {
                    const pdfPage = pageView.pdfPage; // Get the underlying PDFPage object
                    if (!pdfPage) {
                         console.error(`[iframeMessageListener.js] Oggetto pdfPage non disponibile per la pagina ${pageNumber}`);
                         return;
                    }
                    const unscaledViewport = pdfPage.getViewport({ scale: 1 }); // Get viewport at 100% scale
                    unscaledPageHeight = unscaledViewport.height;
                    console.log(`[iframeMessageListener.js] Altezza REALE pagina ${pageNumber}: ${unscaledPageHeight.toFixed(2)} punti PDF`);
                } catch (error) {
                    console.error(`[iframeMessageListener.js] Errore nell'ottenere l'altezza reale della pagina:`, error);
                    return;
                }
                
                if (unscaledPageHeight === null) {
                    console.error(`[iframeMessageListener.js] Impossibile determinare l'altezza reale della pagina ${pageNumber}`);
                    return;
                }

                // 3. Convertire le coordinate CSS Pixel (relative al div) in coordinate PDF (punti) usando il viewport CORRENTE
                const pdfCoords = currentViewport.convertToPdfPoint(cssX, cssY);
                const pdfX = pdfCoords[0];
                const pdfY_fromBottom = pdfCoords[1]; // Y misurata dal basso (standard PDF)

                console.log(`[iframeMessageListener.js] Coordinate click (PDF points, Y from bottom): Pagina ${pageNumber}, x=${pdfX.toFixed(2)}, y=${pdfY_fromBottom.toFixed(2)}`);

                // 4. Inviare messaggio alla pagina genitore CON altezza pagina REALE
                const targetOrigin = '*';
                window.parent.postMessage({
                    type: 'reverseSyncTeXRequest',
                    page: pageNumber,
                    pdfX: pdfX,
                    pdfY: pdfY_fromBottom, // Invia Y standard (dal basso)
                    pageHeight: unscaledPageHeight // AGGIUNTO: Invia l'altezza REALE (non scalata)
                }, targetOrigin);
                console.log(`[iframeMessageListener.js] Messaggio 'reverseSyncTeXRequest' inviato al parent con origine ${targetOrigin} (include altezza REALE pageHeight).`);
            });

            // Aggiungi uno stile per indicare che la pagina è cliccabile (opzionale)
            pageDiv.style.cursor = 'pointer';
        }
    });

    // Potresti voler resettare lo stato 'data-click-listener-added' se il documento viene chiuso/cambiato
    // Ascoltando eventi come 'closed' o 'documentinit'
    eventBus.on('documentloaded', () => {
        console.log("[iframeMessageListener.js] Nuovo documento caricato, resetto gli stati dei listener click (se necessario)...");
        // Se le pagine vengono distrutte e ricreate correttamente, potremmo non aver bisogno di resettare manualmente.
        // Ma per sicurezza, potresti fare un querySelectorAll qui per rimuovere vecchi attributi se necessario.
    });
}

// Funzione per attendere che PDFViewerApplication sia inizializzato
function tryInitializePageClicks() {
    if (window.PDFViewerApplication && window.PDFViewerApplication.initializedPromise) {
        console.log("[iframeMessageListener.js] PDFViewerApplication trovato, attendo initializedPromise...");
        window.PDFViewerApplication.initializedPromise.then(setupPageClickListeners).catch(err => {
           console.error("[iframeMessageListener.js] Errore durante l'attesa di initializedPromise:", err);
        });
    } else {
        // Riprova dopo un breve ritardo se PDFViewerApplication non è ancora pronto
        // console.log("[iframeMessageListener.js] PDFViewerApplication non ancora pronto, riprovo l'impostazione dei listener di click...");
        setTimeout(tryInitializePageClicks, 150); // Riprova dopo 150ms
    }
}

// Avvia il controllo per l'inizializzazione
tryInitializePageClicks();

// Funzione per override del download filename
function setupDownloadFilename(filename) {
  if (!window.PDFViewerApplication || !filename) return;
  
  // Aspetta che PDFViewerApplication sia completamente inizializzato
  const setupDownload = () => {
    try {
      // Override della funzione di download
      if (window.PDFViewerApplication.downloadManager) {
        const originalDownload = window.PDFViewerApplication.downloadManager.download;
        
        window.PDFViewerApplication.downloadManager.download = function(data, url, originalFilename) {
          // Usa il nostro filename personalizzato invece di quello originale
          return originalDownload.call(this, data, url, filename);
        };
        
        console.log("[iframeMessageListener.js] Download filename override impostato:", filename);
      }
      
      // Imposta anche il campo _contentDispositionFilename
      window.PDFViewerApplication._contentDispositionFilename = filename;
      
    } catch (error) {
      console.warn("[iframeMessageListener.js] Errore nell'impostazione del download filename:", error);
    }
  };
  
  // Se PDFViewerApplication è già pronto, esegui subito
  if (window.PDFViewerApplication.downloadManager) {
    setupDownload();
  } else {
    // Altrimenti aspetta che sia pronto
    const checkReady = setInterval(() => {
      if (window.PDFViewerApplication.downloadManager) {
        clearInterval(checkReady);
        setupDownload();
      }
    }, 100);
    
    // Timeout dopo 5 secondi
    setTimeout(() => {
      clearInterval(checkReady);
    }, 5000);
  }
}