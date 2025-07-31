import { 
    persistProjectAndWorkbenchToFirestore, 
    getCurrentProjectFiles,
    workbench,
    currentProject,
    mainTexFile,
    createProjectInFirestore
} from './projectManager.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { db } from './firebase-config.js';
import { getEditors } from './editorManager.js';  // Add this import

// Add to top-level after imports
function setupContextMenuHandlers() {
    // Handle context menu cleanup
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.context-menu')) {
            const menu = document.querySelector('.context-menu');
            const explorer = document.querySelector('.file-explorer');
            if (menu) {
                menu.remove();
                explorer.classList.remove('context-active');
            }
        }
    });

    // Handle explorer mouse leave
    document.querySelector('.file-explorer').addEventListener('mouseleave', (e) => {
        if (!document.querySelector('.context-menu')) {
            e.currentTarget.classList.remove('context-active');
        }
    });
}

// Keep only this one definition of getFolderStates at the top level
export function getFolderStates() {
    const states = {};  // Changed from new Map()
    const folders = document.querySelectorAll('.folder');
    
    folders.forEach(folder => {
        const folderName = folder.querySelector('.file-item span:last-child').textContent;
        const isExpanded = folder.querySelector('ul').style.display === 'block';
        states[folderName] = isExpanded;  // Changed from states.set()
    });
    
    return states;
}

// Add these functions before renderFileExplorer

// Update applyFolderStates to work with plain object
function applyFolderStates(states) {
    const folders = document.querySelectorAll('.folder');
    
    folders.forEach(folder => {
        const folderName = folder.querySelector('.file-item span:last-child').textContent;
        const shouldBeExpanded = states[folderName];
        
        if (shouldBeExpanded) {
            const itemContent = folder.querySelector('.file-item');
            const subUl = folder.querySelector('ul');
            const chevron = folder.querySelector('.codicon-chevron-right');
            
            itemContent.classList.add('expanded');
            subUl.style.display = 'block';
            chevron.style.transform = 'rotate(90deg)';
        }
    });
}

// Add this function after your existing code
async function renameFileOrFolder(oldPath, newName, isFolder) {
    const states = getFolderStates();
    const currentFiles = getCurrentProjectFiles();
    
    if (isFolder) {
        // Rename folder in explorer tree
        const folderContent = currentProject.currentProjectTree[oldPath];
        delete currentProject.currentProjectTree[oldPath];
        currentProject.currentProjectTree[newName] = folderContent;
    } else {
        // Rename file in current project
        if (currentFiles) {
            const content = currentFiles[oldPath];
            delete currentFiles[oldPath];
            currentFiles[newName] = content;
        }
    }
    
    await updateUIAfterChange(states);
}

// Add these helper functions first
function isDescendant(draggedPath, targetPath) {
    return targetPath.startsWith(draggedPath + '/');
}

function getItemPath(element) {
    const pathParts = [];
    let current = element;
    
    while (current && !current.classList.contains('file-tree')) {
        if (current.classList.contains('file-item')) {
            pathParts.unshift(current.querySelector('span:last-child').textContent);
        }
        current = current.parentElement;
    }
    
    return pathParts.join('/');
}

// Add the moveItem function
async function moveItem(sourcePath, targetPath, isFolder) {
    const states = getFolderStates();
    const currentFiles = getCurrentProjectFiles();
    
    if (isFolder) {
        // Move folder in explorer tree
        const sourceContent = currentProject.currentProjectTree[sourcePath];
        if (sourceContent) {
            delete currentProject.currentProjectTree[sourcePath];
            
            if (!currentProject.currentProjectTree[targetPath]) {
                currentProject.currentProjectTree[targetPath] = {};
            }
            currentProject.currentProjectTree[targetPath][sourcePath] = sourceContent;
        }
    } else {
        // Move file within current project
        if (currentFiles) {
            // Get source file content from current location
            let sourceContent;
            if (currentProject.currentProjectTree[sourcePath]) {
                sourceContent = currentProject.currentProjectTree[sourcePath];
                delete currentProject.currentProjectTree[sourcePath];
            } else {
                // Look for file in subfolders
                for (const folder in currentProject.currentProjectTree) {
                    if (currentProject.currentProjectTree[folder] && 
                        currentProject.currentProjectTree[folder][sourcePath]) {
                        sourceContent = currentProject.currentProjectTree[folder][sourcePath];
                        delete currentProject.currentProjectTree[folder][sourcePath];
                        break;
                    }
                }
            }

            if (sourceContent) {
                // Move to new location
                if (targetPath === "Projects") {
                    currentProject.currentProjectTree[sourcePath] = sourceContent;
                } else {
                    if (!currentProject.currentProjectTree[targetPath]) {
                        currentProject.currentProjectTree[targetPath] = {};
                    }
                    currentProject.currentProjectTree[targetPath][sourcePath] = sourceContent;
                }

                // Update current project's file structure
                currentFiles[sourcePath] = sourceContent;
            }
        }
    }
    
    // Save changes and update UI
    await updateUIAfterChange(states);
}

// Add the moveFile function
function moveFile(sourcePath, targetPath, currentFiles) {
    // Parse paths
    const sourcePathParts = sourcePath.split('/').filter(Boolean);
    const fileName = sourcePathParts.pop();
    const sourceFolder = sourcePathParts.join('/');
    
    // Get content and remove from source
    let fileContent = null;
    
    if (sourceFolder) {
        if (currentProject.currentProjectTree[sourceFolder]?.[fileName]) {
            fileContent = currentProject.currentProjectTree[sourceFolder][fileName];
            delete currentProject.currentProjectTree[sourceFolder][fileName];
            
            // Clean up empty folders
            if (Object.keys(currentProject.currentProjectTree[sourceFolder]).length === 0) {
                delete currentProject.currentProjectTree[sourceFolder];
            }
        }
    } else {
        if (currentProject.currentProjectTree[fileName]) {
            fileContent = currentProject.currentProjectTree[fileName];
            delete currentProject.currentProjectTree[fileName];
        }
    }

    // Add to target
    currentProject.currentProjectTree[targetPath] = currentProject.currentProjectTree[targetPath] || {};
    currentProject.currentProjectTree[targetPath][fileName] = fileContent;
}

// Modify the renderFileExplorer function to handle UI state
export function renderFileExplorer(container, savedState = {}) {
    container.innerHTML = "";

    // Update Projects header to Current Project
    const projectsHeader = document.createElement("div");
    projectsHeader.className = "section-header";
    projectsHeader.textContent = "CURRENT PROJECT";
    
    // Add context menu for the header
    projectsHeader.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showContextMenu(e, true);
    });
    
    container.appendChild(projectsHeader);

    const ul = document.createElement("ul");
    ul.className = "file-tree";

    // Get the tree structure safely, using currentProject from module scope
    const projectTree = currentProject?.currentProjectTree || {};
    createTree(projectTree, ul);
    
    container.appendChild(ul);

    function createTree(obj, parentUl) {
        // Separate folders and files
        const entries = Object.entries(obj);
        const folders = entries.filter(([_, value]) => typeof value === 'object');
        const files = entries.filter(([_, value]) => typeof value !== 'object');
        
        // Process folders first
        for (const [key, value] of folders) {
            const li = document.createElement("li");
            li.className = "folder";
            
            const itemContent = document.createElement("div");
            itemContent.className = "file-item";
            itemContent.draggable = true;
            
            // Add drag event listeners for folders
            itemContent.addEventListener('dragstart', (e) => {
                e.stopPropagation();
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    path: getItemPath(itemContent),
                    isFolder: true
                }));
                itemContent.classList.add('dragging');
            });
            
            itemContent.addEventListener('dragend', () => {
                itemContent.classList.remove('dragging');
            });
            
            itemContent.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const targetPath = getItemPath(itemContent);
                
                itemContent.classList.add('drag-over');
            });
            
            itemContent.addEventListener('dragleave', () => {
                itemContent.classList.remove('drag-over');
            });
            
            itemContent.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                itemContent.classList.remove('drag-over');
                
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                const targetPath = getItemPath(itemContent);
                
                // Prevent dropping into descendant or directly under Projects
                if (data.isFolder && isDescendant(data.path, targetPath)) {
                    return;
                }
                
                // Move the item
                moveItem(data.path, targetPath, data.isFolder);
            });
            
            const chevron = document.createElement("span");
            chevron.className = "codicon codicon-chevron-right";
            
            const label = document.createElement("span");
            label.textContent = key;
            
            itemContent.appendChild(chevron);
            itemContent.appendChild(label);
            
            const subUl = document.createElement("ul");
            subUl.style.display = "none";
            
            li.appendChild(itemContent);
            li.appendChild(subUl);
            
            // When creating folder items, check saved state
            const folderPath = getItemPath(itemContent);
            if (savedState[folderPath]) {
                subUl.style.display = "block";
                itemContent.classList.add("expanded");
                chevron.style.transform = "rotate(90deg)";
            }

            addFolderClickHandler(itemContent, subUl, chevron);
            
            // Add context menu for folders
            itemContent.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                e.stopPropagation();
                showContextMenu(e, true);
            });
            
            li.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                e.stopPropagation();
                showContextMenu(e, true);
            });
            
            createTree(value, subUl);
            parentUl.appendChild(li);
        }
        
        // Then process files
        for (const [key, value] of files) {
            const li = document.createElement("li");
            const itemContent = document.createElement("div");
            itemContent.className = "file-item";
            itemContent.draggable = true;
            
            // Add drag event listeners for files
            itemContent.addEventListener('dragstart', (e) => {
                e.stopPropagation();
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    path: getItemPath(itemContent),
                    isFolder: false
                }));
                itemContent.classList.add('dragging');
            });
            
            itemContent.addEventListener('dragend', () => {
                itemContent.classList.remove('dragging');
            });
            
            const fileIcon = document.createElement("span");
            if (key.endsWith('.tex')) {
                fileIcon.className = "codicon codicon-file-code";
                if (key === mainTexFile && key in (getCurrentProjectFiles() || {})) {
                    itemContent.classList.add('main-tex');
                }
            } else if (key.endsWith('.bib')) {
                fileIcon.className = "codicon codicon-references";
            } else {
                fileIcon.className = "codicon codicon-file";
            }
            
            const label = document.createElement("span");
            label.textContent = key;
            
            itemContent.appendChild(fileIcon);
            itemContent.appendChild(label);
            itemContent.addEventListener("click", () => {
                const folderPath = getItemPath(itemContent.parentElement.parentElement);
                const folder = folderPath === 'Projects' ? null : folderPath;
                handleFileClick(key, folder);
            });
            
            // Add context menu for files
            itemContent.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                e.stopPropagation();
                showContextMenu(e, false);
            });
            
            li.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                e.stopPropagation();
                showContextMenu(e, false);
            });
            
            li.appendChild(itemContent);
            parentUl.appendChild(li);
        }
    }

    // Add Create Project item after the tree
    const createProjectItem = document.createElement("div");
    createProjectItem.className = "create-project-item";
    createProjectItem.innerHTML = `
        <span class="codicon codicon-new-folder"></span>
        <span>Create Project</span>
    `;
    
    // Update the create project click handler
    createProjectItem.addEventListener("click", async () => {
        const newProjectName = prompt("Enter project name:");
        if (!newProjectName || newProjectName.trim() === "") return;
    
        try {
            // 1. Move current Projects content to Workbench
            Object.assign(workbench, currentProject.currentProjectTree);

            // 2. Clear Projects structure
            currentProject.currentProjectTree = {};

            // Ensure currentProject.currentProjectTree is initialized
            if (!currentProject.currentProjectTree) {
                currentProject.currentProjectTree = {};
            }

            // 3. Create new project
            await createProjectInFirestore(newProjectName.trim());
            const states = getFolderStates();
            
            // 4. Add new project as a folder under Projects
            currentProject.currentProjectTree[newProjectName] = {};            

            // 5. Make sure the Projects folder is expanded
            states['Projects'] = true;
            
            // 6. Update UI and persist both trees to Firebase
            await Promise.all([
                // Update UI
                renderFileExplorer(document.getElementById('file-tree'), currentProject.currentProjectTree),
                // render workbench
                applyFolderStates(states),
                
                // Persist Projects tree
                setDoc(doc(db, "global", "uiState"), {
                    currentProject,
                    expandedFolders: Object.entries(states)
                        .filter(([_, expanded]) => expanded)
                        .map(([name]) => name),
                    workbench,
                    lastModified: new Date().toISOString()
                }, { merge: false })
            ]);
    
            alert(`Project '${newProjectName}' created successfully!`);
        } catch (error) {
            console.error("Error creating project:", error);
            alert("Failed to create project. Please try again.");
        }
    });
    
    container.appendChild(createProjectItem);
    
    // Add divider
    const divider = document.createElement("div");
    divider.className = "section-divider";
    container.appendChild(divider);
    
    // Add Workbench section
    renderWorkbenchTree(container);
}

// Add this function after your existing code
function showContextMenu(e, isFolder) {
    e.preventDefault();
    
    const explorer = document.querySelector('.file-explorer');
    explorer.classList.add('context-active');
    
    // Remove any existing context menus
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }

    // Find the clicked element
    const targetElement = e.target.closest('.file-item') || e.target.closest('.section-header');
    if (!targetElement) return;

    // Check if this is the CURRENT PROJECT header
    const isCurrentProjectHeader = targetElement.classList.contains('section-header') && 
                                 targetElement.textContent === "CURRENT PROJECT";

    // Create menu
    const menu = document.createElement('div');
    menu.className = 'context-menu';

    if (isCurrentProjectHeader) {
        // Add create folder option
        const createFolderItem = document.createElement('div');
        createFolderItem.className = 'context-menu-item';
        createFolderItem.innerHTML = '<span class="codicon codicon-new-folder"></span>Create Folder';
        
        createFolderItem.onclick = () => {
            const newFolderName = prompt("Enter folder name:");
            if (newFolderName) {
                handleCreateFolder("Projects", newFolderName);
            }
            explorer.classList.remove('context-active');
            menu.remove();
        };
        menu.appendChild(createFolderItem);
        
        // Add upload file option
        const uploadItem = document.createElement('div');
        uploadItem.className = 'context-menu-item';
        uploadItem.innerHTML = '<span class="codicon codicon-cloud-upload"></span>Upload File';
        
        uploadItem.onclick = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '*';
            input.onchange = (e) => {
                handleFileUpload(e);
                explorer.classList.remove('context-active');
                menu.remove();
            };
            input.click();
        };
        menu.appendChild(uploadItem);
    } else {
        // ... rest of your existing showContextMenu code ...
        // Skip context menu for Projects root
        const folderName = targetElement.querySelector('span:last-child').textContent;
        if (folderName === 'Projects') return;

        // Update the folder handling section in showContextMenu
        if (isFolder) {
            const folderPath = targetElement.querySelector('span:last-child').textContent;
            
            // Add create folder option
            const createFolderItem = document.createElement('div');
            createFolderItem.className = 'context-menu-item';
            createFolderItem.innerHTML = '<span class="codicon codicon-new-folder"></span>Create Folder';
            
            createFolderItem.onclick = () => {
                const newFolderName = prompt("Enter folder name:");
                if (newFolderName) {
                    handleCreateFolder(folderPath, newFolderName);
                }
                explorer.classList.remove('context-active');
                menu.remove();
            };
            
            menu.appendChild(createFolderItem);
            
            // Add existing upload item after create folder
            const uploadItem = document.createElement('div');
            uploadItem.className = 'context-menu-item';
            uploadItem.innerHTML = '<span class="codicon codicon-cloud-upload"></span>Upload File';
            
            uploadItem.onclick = () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '*';

                // Change this part to use the proper handleFileUpload function
                input.onchange = (e) => {
                    handleFileUpload(e, folderPath);
                    explorer.classList.remove('context-active');
                    menu.remove();
                };
                
                input.click();
            };
            
            menu.appendChild(uploadItem);
            
            // Add delete option for all folders (including root)
            const deleteItem = document.createElement('div');
            deleteItem.className = 'context-menu-item';
            deleteItem.innerHTML = '<span class="codicon codicon-trash"></span>Delete Folder';
            
            deleteItem.onclick = () => {
                const folderContent = currentProject.currentProjectTree[folderPath];
                if (Object.keys(folderContent).length === 0) {
                    const states = getFolderStates();
                    delete currentProject.currentProjectTree[folderPath];
                    // If root folder was deleted, create a new empty root
                    if (folderPath === "Projects") {  // Changed from Project
                        currentProject.currentProjectTree["New Project"] = {};
                    }
                    renderFileExplorer(document.getElementById('file-tree'), currentProject.currentProjectTree);
                    applyFolderStates(states);
                } else {
                    alert(`Folder "${folderPath}" is not empty`);
                }
                explorer.classList.remove('context-active');
                menu.remove();
            };
            menu.appendChild(deleteItem);

            // Add rename option for all folders (including root)
            const renameItem = document.createElement('div');
            renameItem.className = 'context-menu-item';
            renameItem.innerHTML = '<span class="codicon codicon-edit"></span>Rename';
            
            renameItem.onclick = () => {
                const newName = prompt("Enter new folder name:", folderPath);
                if (newName && newName !== folderPath) {
                    renameFileOrFolder(folderPath, newName, true);
                }
                explorer.classList.remove('context-active');
                menu.remove();
            };
            menu.appendChild(renameItem);
        } else {
            // File context menu
            const fileName = targetElement.querySelector('span:last-child').textContent;
            const currentFiles = getCurrentProjectFiles();
            const isRootTexFile = fileName.endsWith('.tex') && 
                                 fileName in (currentFiles || {});
            
            // Add "Set as Main Tex File" option only for root .tex files
            if (isRootTexFile) {
                const setMainTexItem = document.createElement('div');
                setMainTexItem.className = 'context-menu-item main-tex-option';
                const isCurrentMain = fileName === mainTexFile;
                
                setMainTexItem.innerHTML = `
                    <span class="codicon codicon-file-code"></span>
                    ${isCurrentMain ? 'Main Tex File' : 'Set as Main Tex File'}
                `;
                
                if (!isCurrentMain) {
                    setMainTexItem.onclick = async () => {
                        const states = getFolderStates();
                        mainTexFile = fileName;
                        await updateMainTexFileInFirestore(currentProject, fileName);  // Add this line
                        renderFileExplorer(document.getElementById('file-tree'), currentProject.currentProjectTree);
                        applyFolderStates(states);  // Restore states after re-render
                        explorer.classList.remove('context-active');
                        menu.remove();
                    };
                    menu.appendChild(setMainTexItem);
                }
            }
            
            // Add existing menu items (rename, delete, etc.)
            const renameItem = document.createElement('div');
            renameItem.className = 'context-menu-item';
            renameItem.innerHTML = '<span class="codicon codicon-edit"></span>Rename';
            
            renameItem.onclick = () => {
                const newName = prompt("Enter new file name:", fileName);
                if (newName && newName !== fileName) {
                    renameFileOrFolder(fileName, newName, false);
                }
                explorer.classList.remove('context-active');
                menu.remove();
            };
            
            menu.appendChild(renameItem);

            const deleteItem = document.createElement('div');
            deleteItem.className = 'context-menu-item';
            deleteItem.innerHTML = '<span class="codicon codicon-trash"></span>Delete File';
            
            deleteItem.onclick = () => {
                handleDeleteFile(fileName);
                explorer.classList.remove('context-active');
                menu.remove();
            };

            menu.appendChild(deleteItem);
        }
    }

    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;
    document.body.appendChild(menu);
}

// In the file upload handler
function handleFileUpload(e, folderPath = null) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const content = e.target.result || "";
        const states = getFolderStates();
        
        if (!currentProject) {
            console.warn('No project selected');
            return;
        }
        
        // Initialize project if it doesn't exist
        if (!currentProject.currentProjectTree) {
            currentProject.currentProjectTree = {};
        }

        // Store file in correct location based on folderPath
        if (folderPath) {
            // Ensure folder exists
            if (!currentProject.currentProjectTree[folderPath]) {
                currentProject.currentProjectTree[folderPath] = {};
            }
            // Add file to folder
            currentProject.currentProjectTree[folderPath][file.name] = content;
        } else {
            // Add file to root level
            currentProject.currentProjectTree[file.name] = content;
        }

        // Keep folder expanded if we're uploading to a folder
        if (folderPath) {
            states[folderPath] = true;
        }
        
        // Update UI and persist changes
        await updateUIAfterChange(states);
        
        console.log(`File uploaded: ${file.name} in folder: ${folderPath || 'root'}`);
    };
    
    reader.readAsText(file);
}

async function saveFolderStates(states) {
    if (!currentProject) return;

    // Save expandedFolders in global uiState
    const expandedFolders = Object.entries(states)
        .filter(([_, expanded]) => expanded)
        .map(([name]) => name);

    const uiStateRef = doc(db, "global", "uiState");
    await setDoc(uiStateRef, {
        expandedFolders
    }, { merge: true });
}

// Update folder click handler
function addFolderClickHandler(content, subUl, chevron) {
    content.addEventListener("click", async (e) => {
        e.stopPropagation();
        const isExpanded = subUl.style.display !== "none";
        subUl.style.display = isExpanded ? "none" : "block";
        content.classList.toggle("expanded");
        chevron.style.transform = isExpanded ? "rotate(0)" : "rotate(90deg)";
        
        const states = getFolderStates();
        await saveFolderStates(states);
    });
}

// Add this function to handle file loading
async function handleFileClick(fileName, folder = null) {
    if (!currentProject) {
        console.warn('No project selected');
        return;
    }

    let content = null;
    
    // Get file content based on location
    if (folder) {
        content = currentProject.currentProjectTree[folder]?.[fileName];
    } else {
        content = currentProject.currentProjectTree[fileName];
    }

    // Load content into appropriate editor
    if (content) {
        const { texEditor, bibEditor } = getEditors();
        const editor = fileName.endsWith('.tex') ? texEditor : bibEditor;
        
        if (editor) {
            editor.setValue(content || ""); // Ensure we never set undefined
            editor.focus();
            
            // Update current file indicator in UI
            document.querySelectorAll('.file-item').forEach(item => {
                item.classList.remove('current-file');
            });
            const fileItem = getFileElement(fileName, folder);
            if (fileItem) {
                fileItem.classList.add('current-file');
            }
        } else {
            console.warn(`No editor available for file type: ${fileName}`);
        }
    } else {
        console.warn(`No content found for file: ${fileName} in ${folder || 'root'}`);
    }
}

// Update updateUIAfterChange to include state saving
async function updateUIAfterChange(states) {
    // First update UI
    renderFileExplorer(document.getElementById('file-tree'));
    applyFolderStates(states);

    // Then persist everything to Firebase
    try {
        const expandedFolders = Object.entries(states)
            .filter(([_, expanded]) => expanded)
            .map(([name]) => name);

        await Promise.all([
            persistProjectAndWorkbenchToFirestore(),
            saveFolderStates(states),
            setDoc(doc(db, "global", "uiState"), {
                currentProject,
                expandedFolders,
                workbench,
                lastModified: new Date().toISOString()
            }, { merge: false })
        ]);
    } catch (error) {
        console.error("Error persisting changes:", error);
    }
}

// Update delete handling in context menu
async function handleDeleteFile(fileName) {
    const states = getFolderStates();
    let fileDeleted = false;

    // Check for files in folders
    for (const folder in currentProject.currentProjectTree) {  // Changed from Project
        if (typeof currentProject.currentProjectTree[folder] === 'object' &&  // Changed from Project
            currentProject.currentProjectTree[folder].hasOwnProperty(fileName)) {  // Changed from Project
            delete currentProject.currentProjectTree[folder][fileName];  // Changed from Project
            fileDeleted = true;
            break;
        }
    }

    if (fileDeleted) {
        await updateUIAfterChange(states);
    }
}

// Update create folder handling
async function handleCreateFolder(folderPath, newFolderName) {
    const states = getFolderStates();
    
    if (folderPath === "Projects") {
        currentProject.currentProjectTree[newFolderName] = {};
    } else if (currentProject.currentProjectTree[folderPath]) {
        currentProject.currentProjectTree[folderPath][newFolderName] = {};
    }
    
    states[folderPath] = true; // Ensure parent folder stays expanded
    await updateUIAfterChange(states);
}

// Add to existing exports
export { setupContextMenuHandlers };

// Add this helper function after other utility functions
function getFileElement(fileName, folder = null) {
    const files = document.querySelectorAll('.file-item');
    return Array.from(files).find(item => {
        const label = item.querySelector('span:last-child').textContent;
        
        // For files at project root level
        if (!folder) {
            const projectName = currentProject;
            const parentFolder = item.closest('li').parentElement.parentElement;
            const folderLabel = parentFolder?.querySelector('.file-item span:last-child')?.textContent;
            return label === fileName && folderLabel === projectName;
        }
        
        // For files in subfolders
        const folderItem = item.closest('li').parentElement.parentElement;
        const folderName = folderItem?.querySelector('.file-item span:last-child')?.textContent;
        return label === fileName && folderName === folder;
    });
}

// Gestione dei tab nel supportpane
document.querySelectorAll('#tabs .tab').forEach(tab => {
  tab.addEventListener('click', () => {
    // Rimuovi la classe "active" da tutti i tab
    document.querySelectorAll('#tabs .tab').forEach(t => t.classList.remove('active'));

    // Aggiungi la classe "active" al tab cliccato
    tab.classList.add('active');

    // Nascondi tutti i contenuti dei tab
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Mostra il contenuto del tab selezionato
    const tabName = tab.getAttribute('data-tab');
    document.getElementById(tabName).classList.add('active');
  });
});

const resizeHandle = document.getElementById("resize-handle");
const supportPane = document.getElementById("supportpane");
let isResizing = false;
let startY = 0;
let startHeight = 0;

resizeHandle.addEventListener("mousedown", (e) => {
  isResizing = true;
  startY = e.clientY; // Registra la posizione iniziale del mouse
  startHeight = supportPane.offsetHeight; // Registra l'altezza iniziale del supportpane
  document.body.style.cursor = "ns-resize"; // Cambia il cursore
  e.preventDefault(); // Previeni comportamenti indesiderati
});

document.addEventListener("mousemove", (e) => {
  if (!isResizing) return;

  const deltaY = e.clientY - startY; // Calcola la differenza di movimento del mouse
  const newHeight = startHeight - deltaY; // Calcola la nuova altezza

  // Imposta la nuova altezza rispettando i limiti
  if (newHeight >= 100 && newHeight <= window.innerHeight * 0.7) {
    supportPane.style.height = `${newHeight}px`;
  }
});

document.addEventListener("mouseup", () => {
  if (isResizing) {
    isResizing = false;
    document.body.style.cursor = "default"; // Ripristina il cursore
  }
});

function createReadonlyTree(obj, parentEl) {
    const ul = document.createElement("ul");
    
    if (!obj) {
        parentEl.appendChild(ul);
        return;
    }
    
    // Separate folders and files
    const entries = Object.entries(obj);
    const folders = entries.filter(([_, value]) => typeof value === 'object');
    const files = entries.filter(([_, value]) => typeof value !== 'object');
    
    // Process folders first
    folders.forEach(([key, value]) => {
        const li = document.createElement("li");
        const itemContent = document.createElement("div");
        itemContent.className = "file-item";
        
        itemContent.innerHTML = `
            <span class="codicon codicon-chevron-right"></span>
            <span class="codicon codicon-folder"></span>
            <span>${key}</span>
        `;
        
        // Create subfolder
        const subUl = document.createElement("ul");
        subUl.style.display = "none";
        createReadonlyTree(value, subUl);
        
        // Add expand/collapse functionality
        itemContent.addEventListener("click", () => {
            const chevron = itemContent.querySelector(".codicon-chevron-right");
            subUl.style.display = subUl.style.display === "none" ? "block" : "none";
            chevron.style.transform = subUl.style.display === "none" ? "" : "rotate(90deg)";
        });
        
        li.appendChild(itemContent);
        li.appendChild(subUl);
        ul.appendChild(li);
    });
    
    // Then process files
    files.forEach(([key, value]) => {
        const li = document.createElement("li");
        const itemContent = document.createElement("div");
        itemContent.className = "file-item";
        
        itemContent.innerHTML = `
            <span class="codicon codicon-file"></span>
            <span>${key}</span>
        `;
        
        // Add click handler for files
        itemContent.addEventListener("click", () => {
            showFilePreviewModal(key, value);
        });
        
        li.appendChild(itemContent);
        ul.appendChild(li);
    });
    
    parentEl.appendChild(ul);
}

// Add the modal function
function showFilePreviewModal(fileName, content) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${fileName}</h3>
                <span class="modal-close codicon codicon-close"></span>
            </div>
            <div class="modal-body">
                ${content || 'No content available'}
            </div>
        </div>
    `;
    
    // Close modal when clicking outside or on close button
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-close')) {
            modal.remove();
        }
    });
    
    document.body.appendChild(modal);
}

function renderWorkbenchTree(container) {
    const workbenchHeader = document.createElement("div");
    workbenchHeader.className = "section-header";
    workbenchHeader.textContent = "WORKBENCH";
    
    const workbenchTree = document.createElement("div");
    workbenchTree.className = "file-tree readonly";
    createReadonlyTree(workbench, workbenchTree);
    
    container.appendChild(workbenchHeader);
    container.appendChild(workbenchTree);
}
