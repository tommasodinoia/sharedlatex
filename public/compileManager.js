import { initializeSynctex } from './synctexManager.js';
import { parseSyncTex } from "./lib/synctexParser.js";
import { resetFromLogs, manageCompilationLog } from './compilationLogManager.js';
import { getCurrentProjectFiles_stub, getCurrentProjectName_stub } from "./stub_functions.js";
import { initializeEventListeners, setPdfSyncObject, setCurrentFileURL, getUIElements } from "./eventManager.js";


const paths_list = Array.from(document.head.getElementsByTagName("link"))
  .filter((link) => link.rel === "busytex")
  .map((link) => [link.id, link.href]);

const texlive_data_packages_js = paths_list
  .filter(([id, href]) => id.startsWith("texlive_"))
  .map(([id, href]) => href);

const paths = { ...Object.fromEntries(paths_list), texlive_data_packages_js };
const texmf_local = ["./texmf", "./.texmf"];

let worker = null;




// Export the necessary functions
export async function onclick_compile_latex_() {
  console.log('[onclick_compile_latex_] Compile button clicked');
  // Get UI elements from eventManager
  const {
    texEditor,
    bibEditor,
    compileButton,
    spinnerElement,
    workerCheckbox,
    preloadCheckbox,
    verboseSelect,
    driverSelect,
    bibtexCheckbox,
    autoCheckbox,
    previewElement,
    elapsedElement,
    ubuntuPackageCheckboxes
  } = getUIElements();
  
  if (!compileButton) {
    console.error("Compile button not initialized!");
    return;
  }

  if (compileButton.classList.contains("compiling")) {
    // Handle stop compilation
    terminate();
    compileButton.classList.remove("compiling");
    compileButton.innerText = "Compile";
    if (spinnerElement) {
      spinnerElement.style.display = "none";
    }
    return;
  }

  // Reset decorations and clear log-related tabs
  resetFromLogs([texEditor, bibEditor]);

  // Start compilation
  compileButton.classList.add('compiling');
  compileButton.innerText = "Stop compilation";

  if (spinnerElement) {
    spinnerElement.style.display = 'block';
  }

  //const use_worker = workerCheckbox.checked;
  const use_preload = preloadCheckbox.checked;
  const use_verbose = verboseSelect.value;
  const use_driver = driverSelect.value;
  const use_bibtex = bibtexCheckbox.checked;
  const use_auto = autoCheckbox.checked;

  
  let data_packages_js = null;
  if (!use_auto) {
    data_packages_js = [];
    for (const [key, checkbox] of Object.entries(ubuntuPackageCheckboxes)) {
      if (checkbox.checked)
        data_packages_js.push(
          texlive_data_packages_js.find((path) => path.includes(key))
        );
    }
  }
  

  let tic = performance.now();
  const reload = worker == null;


  
  if (reload) {
    // If the worker is off we create it
    worker = new Worker(paths.busytex_worker_js);
    // This message instantiates the WASM module in the worker 
    worker.postMessage({
      ...paths,
      texmf_local: texmf_local,
      preload_data_packages_js: paths.texlive_data_packages_js.slice(0, 1),
      data_packages_js: paths.texlive_data_packages_js,
    });
  }
  

  tic = performance.now();
  //console.warn(tic);
  /*
  const tex = texEditor.getValue();
  const bib = bibEditor.getValue();
  const files = [
    { path: "example.tex", contents: tex },
    { path: "example.bib", contents: bib },
  ];
  */

  //worker.postMessage({ action: 'TEST_ADD_CIAO' });

  //worker.postMessage({ action: 'FS_LIST', listPath: '/home/web_user' });

  /* This message runs the compilation process in the worker */
  worker.postMessage({
    files: getCurrentProjectFiles_stub(),
    main_tex_path: "example.tex",
    verbose: use_verbose,
    bibtex: use_bibtex,
    driver: use_driver,
    data_packages_js: data_packages_js,
  });

  //worker.postMessage({ action: 'FS_LIST', listPath: '/home/web_user' });

  worker.onmessage = async ({ data: { pdf, log, exit_code, logs, print, synctex, contents, exception } }) => {
    // Reset the PDF sync object
    setPdfSyncObject(null);

    if (pdf) {
      const pdfBlob = new Blob([pdf], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      console.log("PDF URL:", pdfUrl);

      // Set the current file URL for tracking in eventManager
      setCurrentFileURL(pdfUrl);

      const pdfViewer = document.getElementById('pdfViewer');

      // Define sendMessage function here
      const sendMessage = () => {
        // Ottieni il nome del progetto corrente per il PDF
        const projectName = getCurrentProjectName_stub();
        const customFilename = `${projectName}.pdf`;
        
        // Crea un URL con il filename incluso come fragment
        const urlWithFilename = `${pdfUrl}#${customFilename}`;
        
        pdfViewer.contentWindow.postMessage({ 
          type: 'loadPDF', 
          fileURL: urlWithFilename,
          filename: customFilename 
        }, '*');
        console.log('PostMessage sent to iframe with URL:', urlWithFilename, 'and filename:', customFilename);
      };

      // Check if iframe is ready before sending the message
      if (pdfViewer.contentWindow && pdfViewer.contentWindow.location.href !== 'about:blank') {
        sendMessage();
      } else {
        // If the iframe is not ready, wait for the onload event
        console.log("Iframe not ready yet, waiting for onload...");
        pdfViewer.onload = () => {
          console.log("Iframe loaded, sending postMessage...");
          sendMessage();
          // Remove the handler to avoid multiple calls
          pdfViewer.onload = null;
        };
        // If the iframe had no src or was about:blank, ensure it loads viewer.html
        if (pdfViewer.src === 'about:blank' || !pdfViewer.src) {
          pdfViewer.src = './web/viewer.html';
        }
      }

      elapsedElement.innerText =
        ((performance.now() - tic) / 1000).toFixed(2) + " sec";
      if (spinnerElement) {
        spinnerElement.style.display = "none"; // Hide the spinner
      }
      compileButton.classList.remove("compiling");
      compileButton.innerText = "Compile";
      console.log("Compilation successful");
    }
    // Handle SyncTeX data
    if (synctex && synctex.byteLength > 0) {
      console.log("[compileManager] SyncTeX data received from worker.");
      const pdfSyncObject = initializeSynctex(synctex, parseSyncTex);
      setPdfSyncObject(pdfSyncObject);
    } else if (synctex) {
      console.warn("[compileManager] SyncTeX data received but empty.");
    }

    if (print) {
      console.log(print);
    }

    if (log) {
      // Use manageCompilationLog to handle the LaTeX log
      //TODO:
    }

    if (typeof exit_code === "number" && Array.isArray(logs) && exit_code !== 0) {
      terminate();
      const pdflatex_log_index = logs.length === 2 ? 0 : logs.length - 1;
      const log = logs[pdflatex_log_index]?.log || "";
      //bibEditor.setValue(log);

      manageCompilationLog(log, { texEditor, bibEditor });
    }

    if (contents) {
      console.warn("[Busytex Worker] File system contents:", contents);
      // Handle the file system contents here
    }
    if (exception) {
      console.error("[Busytex Worker] Exception:", exception);
      // Handle the exception here
    }

  };
}


export function terminate() {
  // Get UI elements from eventManager
  const { compileButton, spinnerElement } = getUIElements();
  
  //if (worker !== null) worker.terminate();
  //worker = null;
  if (compileButton) {
    compileButton.classList.remove("compiling");
    compileButton.innerText = "Compile";
  }
  if (spinnerElement) {
    spinnerElement.style.display = "none";
  }
}


