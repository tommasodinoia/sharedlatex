import { manageReverseSyncTex } from './synctexManager.js';
import { onclick_compile_latex_ } from './compileManager.js';
import { getEditors } from './editorManager.js';

// Global variable to store the PDF sync object
let pdfSyncObject = null;

// Global variable to track the current file URL
let currentFileURL = null;

// Global variables for UI elements
let texEditor = null;
let bibEditor = null;
let compileButton = null;
let spinnerElement = null;
let workerCheckbox = null;
let preloadCheckbox = null;
let verboseSelect = null;
let driverSelect = null;
let bibtexCheckbox = null;
let autoCheckbox = null;
let previewElement = null;
let elapsedElement = null;
let ubuntuPackageCheckboxes = null;

/**
 * Sets the PDF sync object for use in event handlers
 * @param {Object} syncObject - The parsed SyncTeX object
 */
export function setPdfSyncObject(syncObject) {
  pdfSyncObject = syncObject;
}

/**
 * Gets the current PDF sync object
 * @returns {Object|null} The current PDF sync object
 */
export function getPdfSyncObject() {
  return pdfSyncObject;
}

/**
 * Initializes PDF.js library
 */
function initializePDFjs() {
  if (typeof pdfjsLib !== 'undefined') {
    // Set worker source - use workerSrc property directly
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
    console.log("PDF.js initialized from eventManager");
    
    // Make pdfjsLib globally available
    window.pdfjsLib = pdfjsLib;
  } else {
    console.error("PDF.js failed to load from eventManager");
  }
}

/**
 * Initializes all event listeners for the application
 */
export function initializeEventListeners() {
  // Initialize PDF.js first
  initializePDFjs();
  console.log("PDF.js initialization completed");
  // Initialize UI elements first
  initializeUIElements();
  console.log("UI elements initialization started");
  // Initialize Reverse SyncTeX listener
  initializeReverseSyncTeXListener();
  console.log("Reverse SyncTeX listener initialized");
  // Initialize Compile Button listener
  initializeCompileButton();
  console.log("Compile Button listener initialized");
  // Initialize PDF Viewer Message listener
  initializePdfViewerMessageListener();
  console.log("PDF Viewer Message listener initialized");
}

/**
 * Initializes UI elements
 */
function initializeUIElements() {
  // Initialize all UI elements first
  document.addEventListener("DOMContentLoaded", async () => {
    // Wait for editors to be initialized
    const checkEditors = setInterval(() => {
      const editors = getEditors();
      if (editors.texEditor && editors.bibEditor) {
        clearInterval(checkEditors);
        texEditor = editors.texEditor;
        bibEditor = editors.bibEditor;

        // Initialize UI elements
        compileButton = document.getElementById("compile-button");
        spinnerElement = document.getElementById("spinner");
        workerCheckbox = document.getElementById("worker");
        preloadCheckbox = document.getElementById("preload");
        verboseSelect = document.getElementById("verbose");
        driverSelect = document.getElementById("tex_driver");
        bibtexCheckbox = document.getElementById("bibtex");
        autoCheckbox = document.getElementById("checked_texlive_auto");
        previewElement = document.getElementById("preview");
        elapsedElement = document.getElementById("elapsed");
        ubuntuPackageCheckboxes = {
          recommended: document.getElementById("checked_texlive_ubuntu_recommended"),
          extra: document.getElementById("checked_texlive_ubuntu_extra"),
          science: document.getElementById("checked_texlive_ubuntu_science"),
        };

        if (!compileButton || !texEditor || !bibEditor) {
          console.error("Required elements or editors not initialized!");
          return;
        }
        
        console.log("UI elements initialized successfully");
      }
    }, 100);
  });
}

/**
 * Initializes the Compile Button listener
 */
function initializeCompileButton() {
  // Wait for compile button to be available
  const checkCompileButton = setInterval(() => {
    const button = document.getElementById("compile-button");
    if (button) {
      clearInterval(checkCompileButton);
      button.addEventListener("click", onclick_compile_latex_);
      console.log("Compile button listener added");
    }
  }, 100);
}

/**
 * Initializes the PDF Viewer Message listener
 */
function initializePdfViewerMessageListener() {
  
  // Listener for receiving messages from the iframe
  window.addEventListener('message', (event) => {
    const pdfViewer = document.getElementById('pdfViewer');
    
    // Verify that the message comes from the expected iframe
    if (event.source !== pdfViewer?.contentWindow) {
      return; // Ignore messages from other sources
    }

    // IMPORTANT: Verify origin for security in production!
    // Replace with expected origin, e.g., 'http://localhost:xxxx' or your domain
    // const expectedOrigin = 'http://...';
    // if (event.origin !== expectedOrigin) {
    //     console.warn('Message ignored from unexpected origin:', event.origin);
    //     return;
    // }

    const messageType = event.data?.type;
    if ((messageType === 'pdfProcessed' || messageType === 'pdfLoadError') && currentFileURL) {
      if (messageType === 'pdfProcessed') {
        console.log('[eventManager] Iframe has processed the PDF. Revoking URL:', currentFileURL);
      } else {
        console.warn('[eventManager] Iframe reported a loading error. Revoking URL:', currentFileURL, 'Error:', event.data.error);
      }
      URL.revokeObjectURL(currentFileURL);
      currentFileURL = null; // Reset the variable after revocation
    } else {
      // console.log('[eventManager] Received message from iframe:', event.data);
    }
  });
}

/**
 * Sets the current file URL for tracking
 * @param {string} url - The URL to track
 */
export function setCurrentFileURL(url) {
  currentFileURL = url;
}

/**
 * Gets the current file URL
 * @returns {string|null} The current file URL
 */
export function getCurrentFileURL() {
  return currentFileURL;
}

/**
 * Gets the UI elements
 * @returns {Object} Object containing all UI elements
 */
export function getUIElements() {
  return {
    texEditor,
    bibEditor,
    compileButton: document.getElementById("compile-button"),
    spinnerElement: document.getElementById("spinner"),
    workerCheckbox: document.getElementById("worker"),
    preloadCheckbox: document.getElementById("preload"),
    verboseSelect: document.getElementById("verbose"),
    driverSelect: document.getElementById("tex_driver"),
    bibtexCheckbox: document.getElementById("bibtex"),
    autoCheckbox: document.getElementById("checked_texlive_auto"),
    previewElement: document.getElementById("preview"),
    elapsedElement: document.getElementById("elapsed"),
    ubuntuPackageCheckboxes: {
      recommended: document.getElementById("checked_texlive_ubuntu_recommended"),
      extra: document.getElementById("checked_texlive_ubuntu_extra"),
      science: document.getElementById("checked_texlive_ubuntu_science"),
    }
  };
}

/**
 * Initializes the Reverse SyncTeX listener
 */
function initializeReverseSyncTeXListener() {
  // --- Listener for Reverse SyncTeX ---
  window.addEventListener('message', async (event) => {
    // Do not process messages from ourselves or the wrong iframe
    if (event.source === window || !event.data || event.data.type !== 'reverseSyncTeXRequest') {
      return;
    }

    // IMPORTANT: Verify the origin for security in production!
    // const expectedIframeOrigin = new URL(document.getElementById('pdfViewer').src).origin;
    // if (event.origin !== expectedIframeOrigin) {
    //   console.warn("Message 'reverseSyncTeXRequest' ignored from unexpected origin:", event.origin);
    //   return;
    // }

    const { page, pdfX, pdfY, pageHeight } = event.data;
    console.log(`[eventManager] Received reverseSyncTeXRequest: Page ${page}, X=${pdfX}, Y=${pdfY}, PageHeight=${pageHeight}`);

    manageReverseSyncTex(pdfSyncObject, [pdfX, pdfY], page, pageHeight);
  });
  // --- End Listener for Reverse SyncTeX ---
}
