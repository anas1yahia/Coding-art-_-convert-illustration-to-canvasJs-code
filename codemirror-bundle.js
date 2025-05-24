// CodeMirror Bundle for Figma Plugin
// This bundles the initialization to ensure it works in Figma's restricted environment

(function() {
  'use strict';
  
  // Wait for DOM to be ready
  function initializeCodeMirrorWhenReady() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeCodeMirrorEditor);
    } else {
      initializeCodeMirrorEditor();
    }
  }
  
  function initializeCodeMirrorEditor() {
    const editorElement = document.getElementById('code-editor');
    if (!editorElement) {
      console.error('Code editor element not found');
      return;
    }
    
    // Ensure CodeMirror is available
    if (typeof CodeMirror === 'undefined') {
      console.error('CodeMirror is not defined');
      // Try to call fallback if it exists
      if (typeof window.createFallbackEditor === 'function') {
        window.createFallbackEditor();
      }
      return;
    }
    
    try {
      // Create CodeMirror instance
      const editor = CodeMirror(function(elt) {
        editorElement.parentNode.replaceChild(elt, editorElement);
      }, {
        value: `// Canvas drawing example
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#2979ff';
ctx.fillRect(20, 20, 120, 80);
ctx.strokeStyle = '#00c853';
ctx.lineWidth = 4;
ctx.strokeRect(20, 20, 120, 80);
ctx.beginPath();
ctx.arc(80, 60, 30, 0, 2 * Math.PI);
ctx.fillStyle = '#ffb300';
ctx.fill();`,
        mode: 'javascript',
        theme: 'monokai',
        lineNumbers: true,
        lineWrapping: false,
        indentUnit: 2,
        tabSize: 2,
        indentWithTabs: false,
        matchBrackets: true,
        autoCloseBrackets: true,
        styleActiveLine: true,
        scrollbarStyle: 'native',
        readOnly: false,
        autofocus: true
      });
      
      // Store editor instance globally
      window.codeEditor = editor;
      
      // Create API wrapper for compatibility
      window.monacoEditor = {
        getValue: function() { return editor.getValue(); },
        setValue: function(value) { editor.setValue(value); },
        refresh: function() { editor.refresh(); }
      };
      
      // Force a refresh after a short delay to ensure proper rendering
      setTimeout(function() {
        editor.refresh();
      }, 100);
      
      console.log('CodeMirror editor initialized successfully');
    } catch (error) {
      console.error('Failed to initialize CodeMirror:', error);
      if (typeof window.createFallbackEditor === 'function') {
        window.createFallbackEditor();
      }
    }
  }
  
  // Initialize when this script loads
  initializeCodeMirrorWhenReady();
  
  // Also expose the function globally in case we need to call it later
  window.initializeCodeMirrorEditor = initializeCodeMirrorEditor;
})(); 