//import { gunzip } from 'pako' // Importa la funzione gunzip dalla libreria paco
//import { parseSyncTex } from "./lib/synctexParser.js"; // Non più necessario qui se pdfSyncObject è già parsato
//import {PDFViewer as pdfjsViewer} from 'pdfjs-dist/web/pdf_viewer.js'

/**
 * --- DEPRECATED --- Recursively searches for a block matching the given coordinates.
 * Now using a flat search on hBlocks.
 * @param {object[]} blocks - The array of blocks to search within.
 * @param {number[]} pos - The [x, y] coordinates in PDF points.
 * @returns {object | null} - The matching block or null if not found.
 */
/*
function findMatchingBlockRecursive(blocks, pos) {
    // ... (previous recursive implementation removed)
}
*/

export async function reverseSyncTeX(pdfSyncObject, pos, page, pageHeight) {
    // Log the received pageHeight IMMEDIATELY upon entry
    console.log(`[manageSynctex ENTRY] Received pageHeight: ${pageHeight}, Type: ${typeof pageHeight}`);
    try {
        const clickX = pos[0];
        const clickY_fromBottom = pos[1]; // Click Y is from bottom (standard PDF)
        console.log(`[manageSynctex] Searching for block at: X=${clickX.toFixed(2)}, Y_fromBottom=${clickY_fromBottom.toFixed(2)} on page: ${page}.`);
        console.log(`[manageSynctex] Assuming SyncTeX 'bottom' is from TOP. Page Height: ${pageHeight?.toFixed(2)}`);

        // Use the pre-indexed blocks for the specific page
        if (!pdfSyncObject || !pdfSyncObject.hBlocksByPage || !pdfSyncObject.hBlocksByPage[page]) {
            console.error(`[manageSynctex] Blocchi indicizzati per pagina ${page} (hBlocksByPage[${page}]) non trovati.`);
            return;
        }
        const pageBlocks = pdfSyncObject.hBlocksByPage[page];
        console.log(`[manageSynctex] Trovati ${pageBlocks.length} blocchi indicizzati per pagina ${page}.`);

        if (pageHeight === undefined || pageHeight === null || pageHeight <= 0) {
             console.error(`[manageSynctex] Altezza pagina non valida ricevuta: ${pageHeight}`);
             return;
        }

        // Convert click Y to be measured from the TOP
        const clickY_fromTop = pageHeight - clickY_fromBottom;
        console.log(`[manageSynctex] Calculated click Y_fromTop: ${clickY_fromTop.toFixed(2)}`);

        let bestMatch = null;
        let minArea = Infinity; // Use smallest area for best match

        // Iterate only through the blocks pre-filtered for this page
        for (const block of pageBlocks) {
            // No need to filter by page anymore
            // if (block.page !== page) { continue; }

            const blockLeft = block.left;
            // SyncTeX block coordinates: 'bottom' is from TOP, 'height' extends DOWNWARDS
            const blockTop_fromTop = block.bottom;
            const blockHeight = block.height || 0;
            const blockBottom_fromTop = blockTop_fromTop + blockHeight;
            const blockWidth = block.width || 0;
            const blockRight = blockLeft + blockWidth;

            // 1. Check if X coordinate is within this block
            const xInBounds = clickX >= blockLeft && clickX <= blockRight;

            // 2. Check if CONVERTED click Y (from TOP) is within the block's vertical bounds (also from TOP)
            const yInBounds = clickY_fromTop >= blockTop_fromTop && clickY_fromTop <= blockBottom_fromTop;

            if (xInBounds && yInBounds) {
                console.log(`  [Candidate Found] File: ${block.file?.path || 'N/A'}:${block.line || 'N/A'}`);
                console.log(`     SyncTeX Block Bounds (from TOP): X=[${blockLeft.toFixed(2)}, ${blockRight.toFixed(2)}], Y_Top=[${blockTop_fromTop.toFixed(2)}, ${blockBottom_fromTop.toFixed(2)}] (W=${blockWidth.toFixed(2)}, H=${blockHeight.toFixed(2)})`);
                console.log(`     Click Coords (converted from TOP): X=${clickX.toFixed(2)}, Y_Top=${clickY_fromTop.toFixed(2)}`);
                console.log(`     ---> X Check: ${xInBounds}, Y Check: ${yInBounds}`);

                // Select the block with the smallest area among matches
                const area = blockWidth * blockHeight;
                if (area < minArea) {
                    minArea = area;
                    bestMatch = block;
                    console.log(`     =======> New Best Match (Smaller Area: ${minArea.toFixed(2)})`);
                }
            }
        }

        if (!bestMatch) {
             console.warn(`[manageSynctex] Nessun blocco trovato per pagina ${page} contenente le coordinate convertite (X=${clickX.toFixed(2)}, Y_fromTop=${clickY_fromTop.toFixed(2)}).`);
            return; // No match found
        }

        console.log("[manageSynctex] Miglior blocco corrispondente trovato (indicizzato, coordinate invertite):", bestMatch);

        // Verifica che il file e il percorso siano definiti
        if (!bestMatch.file || !bestMatch.file.path) {
            console.error("[manageSynctex] Il file o il percorso non è definito nel blocco corrispondente.");
            return;
        }

        // Costruisci la risposta con il file sorgente e la riga
        const sourceFilePath = bestMatch.file.path;
        const lineNumber = bestMatch.line;

        console.log(`[manageSynctex] Reverse SyncTeX Result: Line ${lineNumber}, File: ${sourceFilePath}`);

        return {
            sourceFilePath,
            lineNumber,
        };

    } catch (error) {
        console.error("[manageSynctex] Errore durante la gestione di reverse_synctex:", error);
    }
} 