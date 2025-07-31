// supportPaneManager.js
// Support functions for managing decorations and the support pane

/**
 * Removes all decorations from a Monaco editor (texEditor or bibEditor)
 * @param {monaco.editor.IStandaloneCodeEditor} editor - The Monaco editor instance
 */
export function removeDecoration(editor) {
  if (!editor) return;
  // If you saved the IDs of the decorations when you created them (recommended approach)
  let decorationIds = [];
  decorationIds = editor.deltaDecorations(decorationIds, []);

  // If you did not save the IDs and need to remove all decorations
  // you can create a new empty array for the decorations
  if (!decorationIds || decorationIds.length === 0) {
    // Get all IDs from the old decorations from the model
    const model = editor.getModel();
    if (model && model.getAllDecorations) {
      const allDecorations = model.getAllDecorations();
      decorationIds = allDecorations.map(d => d.id);
    } else {
      decorationIds = [];
    }
    // Remove all decorations
    decorationIds = editor.deltaDecorations(decorationIds, []);
  }
}

/**
 * Applies decorations and populates a tab with errors or warnings.
 * @param {Array} issues - Array of objects containing error or warning information.
 * @param {HTMLElement} tabElement - The HTML element of the tab to populate.
 * @param {monaco.editor.IStandaloneCodeEditor} editor - The Monaco editor instance.
 * @param {string} className - The CSS class for the decoration style.
 * @param {string} color - The color for the decoration preview.
 */
export function populateErrorsAndWarnings(issues, tabElement, editor, className, color) {
  if (!issues || !Array.isArray(issues) || !tabElement || !editor) return;

  tabElement.innerHTML = ""; // Clear previous content

  const decorations = issues.map((issue) => {
    const item = document.createElement("div");
    item.className = "item"; // Use the CSS class for items
    if (issue.line === null) {
      item.textContent = `${className === 'error-line' ? 'Error' : 'Warning'} in file ${issue.file}: ${issue.message}`;
    } else {
      item.textContent = `${className === 'error-line' ? 'Error' : 'Warning'} in file ${issue.file} at line ${issue.line}: ${issue.message}`;
    }
    tabElement.appendChild(item);

    // Add a listener to move the cursor
    if (issue.line != null) {
      item.addEventListener("click", () => {
        editor.setPosition({ lineNumber: issue.line, column: 1 }); // Move the cursor
        editor.revealLineInCenter(issue.line); // Center the line in the editor
      });

      // Add decoration for the error or warning
      return {
        range: new monaco.Range(issue.line, 1, issue.line, 1),
        options: {
          isWholeLine: true,
          className: className, // CSS class for the style
          overviewRuler: {
            color: color, // Color for the preview
            position: monaco.editor.OverviewRulerLane.Full, // Position in the preview
          },
        },
      };
    }
  }).filter(Boolean); // Filter out undefined

  // Apply the decorations to the editor
  editor.deltaDecorations([], decorations);
}

/**
 * Populates the "Typesetting" tab with typesetting issues.
 * @param {Array} typesettingIssues - Array of objects containing typesetting issues.
 * @param {HTMLElement} typesettingTab - The HTML element of the "Typesetting" tab.
 */
export function populateTypesetting(typesettingIssues, typesettingTab) {
  if (!typesettingIssues || !Array.isArray(typesettingIssues) || !typesettingTab) return;

  typesettingTab.innerHTML = ""; // Clear previous content

  typesettingIssues.forEach((issue) => {
    const typesettingItem = document.createElement("div");
    typesettingItem.className = "item"; // Use the CSS class for items
    typesettingItem.textContent = `Typesetting issue: ${issue.message}`;
    typesettingTab.appendChild(typesettingItem);
  });
}

/**
 * Populates the "Info" tab with the log content formatted in HTML.
 * @param {string} log - The log content to format.
 * @param {HTMLElement} infoTab - The HTML element of the "Info" tab.
 */
export function populateInfo(log, infoTab) {
  if (!log || !infoTab) return;

  infoTab.innerHTML = ""; // Clear previous content

  const formattedLog = log
    .split("\n")
    .map((line) => `${line}<br>`) // Format each line of the log as a paragraph
    .join("");

  infoTab.innerHTML = formattedLog;
}

/**
 * Clears the content of the log-related tabs: errors, warnings, info, and typesetting.
 */
export function clearLogTabs() {
  const errorsTab = document.getElementById("errors");
  const warningsTab = document.getElementById("warnings");
  const infoTab = document.getElementById("info");
  const typesettingTab = document.getElementById("typesetting");

  if (errorsTab) {
    errorsTab.innerHTML = ""; // Clear the content of the errors tab
  }
  if (warningsTab) {
    warningsTab.innerHTML = ""; // Clear the content of the warnings tab
  }
  if (infoTab) {
    infoTab.innerHTML = ""; // Clear the content of the info tab
  }
  if (typesettingTab) {
    typesettingTab.innerHTML = ""; // Clear the content of the typesetting tab
  }
}

/**
 * Resets the editor decorations and clears log-related tabs.
 * @param {Array<string>} editors - Array of editor instances to remove decorations from.
 */
export function resetFromLogs(editors) {
  if (Array.isArray(editors)) {
    editors.forEach(editor => {
      if (editor) {
        removeDecoration(editor);
      }
    });
  }
  clearLogTabs();
}

/**
 * Manages the compilation log by analyzing it and updating the support pane.
 * @param {string} log - The LaTeX log content.
 * @param {Object} editors - An object containing the texEditor and bibEditor.
 */
export function manageCompilationLog(log, editors) {
  analyzeLatexLog(log).then(result => {
    if (result) {
      // Make the supportpane visible
      const supportPane = document.getElementById("supportpane");
      supportPane.style.display = "block"; // Change display to block

      // Populate the "Errors" tab and add red decorations
      populateErrorsAndWarnings(result.errors, document.getElementById("errors"), editors.texEditor, "error-line", "rgba(255, 0, 0, 0.8)");

      // Populate the "Warnings" tab and add yellow decorations
      populateErrorsAndWarnings(result.warnings, document.getElementById("warnings"), editors.texEditor, "warning-line", "rgba(255, 255, 0, 0.8)");

      // Populate the "Typesetting" tab with typesetting content
      populateTypesetting(result.typesetting, document.getElementById("typesetting"));

      // Populate the "Info" tab with log content formatted in HTML
      populateInfo(log, document.getElementById("info"));

      console.log("Support pane updated with LaTeX log results.");
    }
  }).catch(error => {
    console.error("Error analyzing LaTeX log:", error);
  });
}

/*
* Analyzes the LaTeX log using the latex-log-parser library.
* @param {string} log - The LaTeX log content to analyze.
* @returns {Promise} - A Promise that resolves with the analysis result.
*/

export function analyzeLatexLog(log) {
  return new Promise((resolve, reject) => {
    require(['lib/latex-log-parser'], function (LatexParser) {
      try {
        // Parser options
        const options = {
          ignoreDuplicates: true, // Ignore duplicate messages
        };

        // Analyze the LaTeX log
        const result = LatexParser.parse(log, options);

        // Show the result
        console.log("THIS IS THE PARSER RESULT");
        console.log('Errors:', result.errors);
        console.log('Warnings:', result.warnings);
        console.log('Typesetting issues:', result.typesetting);
        console.log('All messages:', result.all);

        // Resolve the Promise with the result
        resolve(result);
      } catch (error) {
        console.error('Error analyzing LaTeX log:', error);
        reject(error); // Reject the Promise with the error
      }
    });
  });
}