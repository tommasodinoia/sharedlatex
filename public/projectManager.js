import { collection, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { db } from './firebase-config.js';

// Add this line near the top after imports
const workbenchRef = collection(db, "workbench");

// Module-level variables
export let currentProjectTree = {};  // UI representation
export let workbench = [
    {
        "Project 1": {
            "file11.tex": "\\documentclass{article}\n\\begin{document}\nThis is file 11\n\\end{document}",
            "file12.tex": "\\documentclass{article}\n\\begin{document}\nThis is file 12\n\\end{document}"
        }
    },
    {
        "Project 2": {
            "file21.tex": "\\documentclass{article}\n\\begin{document}\nThis is file 21\n\\end{document}",
            "file22.tex": "\\documentclass{article}\n\\begin{document}\nThis is file 22\n\\end{document}"
        }
    }
];
export let expandedFolders = [];

export let currentProject = null;
export let mainTexFile = "main.tex";

export async function createProjectInFirestore(projectName) {
    // Validate project name
    if (!projectName?.trim() || (workbench && Object.keys(workbench).includes(projectName))) {
        throw new Error('Invalid or duplicate project name');
    }

    // Move previous currentProject into workbench under its name
    if (currentProject && currentProject.name) {
        if (Array.isArray(workbench)) {
            workbench = Object.assign({}, ...workbench);
        }
        // Extract the actual file tree from the nested structure
        const prevName = currentProject.name;
        const prevTree = currentProject.currentProjectTree[prevName] || {};
        workbench[prevName] = prevTree;

        // Remove any top-level files that were part of the previous currentProjectTree
        if (currentProject.currentProjectTree) {
            for (const fileName of Object.keys(currentProject.currentProjectTree)) {
                if (workbench.hasOwnProperty(fileName)) {
                    delete workbench[fileName];
                }
            }
        }
    } else {
        if (Array.isArray(workbench)) {
            workbench = Object.assign({}, ...workbench);
        }
    }

    currentProject = {
        name: projectName,
        createdAt: new Date().toISOString(),
        currentProjectTree: {
            [projectName]: {
                [mainTexFile]: "\\documentclass{article}\n\\begin{document}\n\\end{document}",
                "references.bib": "% Add your bibliography entries here"
            }
        },
        mainTexFile,
        uiState: {
            expandedFolders: ['Projects']
        }
    };
    currentProjectTree = currentProject.currentProjectTree;

    // Save the new current project to the global uiState document
    const uiStateRef = doc(db, "global", "uiState");
    // Fetch current uiState
    const uiStateDoc = await getDoc(uiStateRef);
    let uiState = uiStateDoc.exists() ? uiStateDoc.data() : {};
    uiState.currentProject = currentProject;
    uiState.workbench = workbench;
    uiState.expandedFolders = ['Projects'];
    uiState.lastModified = new Date().toISOString();
    await setDoc(uiStateRef, uiState, { merge: true });

    return currentProject;
}

export async function loadProjectAndWorkbenchFromFirestore() {
    try {
        workbench = {};
        currentProjectTree = {};
        currentProject = null;

        let uiState = {}; // Default UI state

        // Load UI state from global collection
        const uiStateDoc = await getDoc(doc(db, "global", "uiState"));

        // Get saved UI state or create default
        if (uiStateDoc.exists()) {
            uiState = uiStateDoc.data();
            currentProject = uiState.currentProject || null;
            currentProjectTree = uiState.currentProject ? currentProject.currentProjectTree : {};
            workbench = uiState.workbench || {};
            expandedFolders = uiState.expandedFolders || [];
        } else {
            // Create default UI state if it doesn't exist
            uiState = {
                currentProject: null,
                expandedFolders: [],
                workbench: {},
                lastModified: new Date().toISOString()
            };
            await setDoc(doc(db, "global", "uiState"), uiState);
        }

        console.log("Loaded currentProject:", currentProject, "workbench:", workbench, "uiState:", uiState);

        return uiState;
    } catch (error) {
        console.error("Error loading projects:", error);
        throw error;
    }
}

// Save both file structure and UI state
export async function persistProjectAndWorkbenchToFirestore(uiState = {}) {
    try {
        // Save global UI state with project structure and workbench
        const uiStateRef = doc(db, "global", "uiState");
        // Fetch current uiState
        const uiStateDoc = await getDoc(uiStateRef);
        let globalState = uiStateDoc.exists() ? uiStateDoc.data() : {};
        globalState.currentProject = currentProject;
        globalState.expandedFolders = uiState.expandedFolders || [];
        globalState.workbench = workbench;
        globalState.lastModified = new Date().toISOString();
        await setDoc(uiStateRef, globalState, { merge: true });
    } catch (error) {
        console.error("Error saving structure:", error);
        throw error; // Propagate error for handling
    }
}

// Add getter for file structure
export function getCurrentProjectFiles() {
    return currentProject ? currentProject.currentProjectTree : null;
}

// Add getter for current project name
export function getCurrentProjectName() {
    return currentProject ? currentProject.name : 'Untitled_Project';
}

// Add getter for main TEX file name
export function getMainTexFileName() {
    if (!currentProject || !currentProject.currentProjectTree) {
        return 'example.tex';
    }
    
    // Find the first .tex file, or return a default
    for (const fileName in currentProject.currentProjectTree) {
        if (fileName.endsWith('.tex')) {
            return fileName;
        }
    }
    return 'example.tex';
}

export async function switchProject(projectName) {
    // Find the project in workbench or global uiState
    const uiStateRef = doc(db, "global", "uiState");
    const uiStateDoc = await getDoc(uiStateRef);
    if (!uiStateDoc.exists()) {
        console.error("No global uiState found");
        return;
    }
    const uiState = uiStateDoc.data();
    let foundProject = null;
    if (uiState.currentProject && uiState.currentProject.name === projectName) {
        foundProject = uiState.currentProject;
    } else if (uiState.workbench && uiState.workbench[projectName]) {
        foundProject = uiState.workbench[projectName];
    }
    if (!foundProject) {
        console.error(`Project ${projectName} not found`);
        return;
    }

    currentProject = foundProject;
    mainTexFile = foundProject.mainTexFile || "main.tex";
    currentProjectTree = foundProject.currentProjectTree;

    // Update UI state in Firestore
    await setDoc(uiStateRef, {
        currentProject,
        lastModified: new Date().toISOString()
    }, { merge: true });

    return getCurrentProjectFiles();
}

// Add this export if not already present
export function analyzeLatexLog(log) {
  return new Promise((resolve, reject) => {
    require(['lib/latex-log-parser'], function (LatexParser) {
      try {
        const options = { ignoreDuplicates: true };
        const result = LatexParser.parse(log, options);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  });
}