import { initializeEventListeners } from './eventManager.js';
import { loadProjectAndWorkbenchFromFirestore, } from './projectManager.js';
import { initializeEditor } from './editorManager.js';
import { renderFileExplorer, setupContextMenuHandlers } from './uiManager.js';


// Load projects and initialize UI
async function initApp() {
    try {
        const uiState = await loadProjectAndWorkbenchFromFirestore();
        await initializeEditor();
        renderFileExplorer(document.getElementById('file-tree'), uiState);
        setupContextMenuHandlers();



    } catch (error) {
        console.error("Error initializing app:", error);
    }
}
// Start the application

// Await initApp, then initialize event listeners
(async () => {
  await initApp();
  initializeEventListeners();
  console.log("Event listeners initialized from main.js");
})();
