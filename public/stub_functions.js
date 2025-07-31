/**
 * Returns the current project files as an array of objects with path and contents.
 * Assumes texEditor and bibEditor are globally accessible.
 * @returns {Array<{path: string, contents: string}>}
 */
export function getCurrentProjectFiles_stub() {
    if (!window.texEditor || !window.bibEditor) {
        throw new Error("texEditor or bibEditor is not initialized!");
    }

    const tex = window.texEditor.getValue();
    const bib = window.bibEditor.getValue();

    /*
    Example of files array:
    const files = [
        { path: "main.tex", contents: "\\documentclass{article}\\begin{document}Hello\\end{document}" },
        { path: "references.bib", contents: "@book{test, title={Test}}" },
        { path: "images", contents: null }, // directory
        { path: "images/logo.png", contents: BINARY DATA or BASE64 ENCODED DATA },
    ];
    */
    const files = [
        { path: "example.tex", contents: tex },
        { path: "example.bib", contents: bib },
        { path: "pgfmath.sty", contents: `\\RequirePackage{pgfrcs,pgfkeys}\\
\\input{pgfmath.code.tex}\\
\\\\
\\endinput` },
        { path: "pgfrcs.sty", contents: `\\input pgfutil-common.tex\\
\\input pgfutil-latex.def\\
\\\\
\\input{pgfrcs.code.tex}\\
\\\\
\\endinput` },
    ];
    return files;
}

/** * Returns the current project name.
 * This is a stub function that returns a hardcoded project name
 */
export function getCurrentProjectName_stub() {
    return "TexWaller Project";
}