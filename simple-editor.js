// Simple Code Editor for Figma Plugin
// A lightweight, dependency-free code editor with syntax highlighting

class SimpleCodeEditor {
  constructor(elementId, options = {}) {
    this.element = document.getElementById(elementId);
    if (!this.element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    this.options = {
      value: options.value || '',
      lineNumbers: options.lineNumbers !== false,
      tabSize: options.tabSize || 2,
      theme: options.theme || 'dark'
    };

    this.setupEditor();
  }

  setupEditor() {
    // Create wrapper for line numbers and editor
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.display = 'flex';
    wrapper.style.background = '#1e1f28';
    wrapper.style.borderRadius = '0 0 12px 12px';
    wrapper.style.overflow = 'hidden';

    // Create line numbers container
    if (this.options.lineNumbers) {
      const lineNumbers = document.createElement('div');
      lineNumbers.className = 'line-numbers';
      lineNumbers.style.width = '45px';
      lineNumbers.style.padding = '24px 10px 24px 0';
      lineNumbers.style.textAlign = 'right';
      lineNumbers.style.color = '#6c7986';
      lineNumbers.style.fontFamily = "'Fira Mono', 'Consolas', monospace";
      lineNumbers.style.fontSize = '14px';
      lineNumbers.style.lineHeight = '22.4px';
      lineNumbers.style.userSelect = 'none';
      lineNumbers.style.background = 'rgba(22,24,30,0.8)';
      lineNumbers.style.borderRight = '1px solid rgba(201,209,217,0.08)';
      wrapper.appendChild(lineNumbers);
    }

    // Create textarea for editing
    const textarea = document.createElement('textarea');
    textarea.className = 'fallback-editor';
    textarea.style.flex = '1';
    textarea.style.background = 'transparent';
    textarea.style.color = '#e3e6eb';
    textarea.style.fontFamily = "'Fira Mono', 'Consolas', monospace";
    textarea.style.fontSize = '14px';
    textarea.style.lineHeight = '22.4px';
    textarea.style.padding = '24px 20px';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.overflow = 'auto';
    textarea.style.width = '100%';
    textarea.style.height = '100%';
    textarea.style.marginLeft = this.options.lineNumbers ? '45px' : '0';
    textarea.style.position = 'absolute';
    textarea.style.left = '0';
    textarea.style.top = '0';

    // Add scrollbar styling
    const style = document.createElement('style');
    style.textContent = `
      .fallback-editor::-webkit-scrollbar {
        width: 8px;
        background: rgba(60,60,70,0.18);
      }
      .fallback-editor::-webkit-scrollbar-thumb {
        background: rgba(80,80,100,0.32);
        border-radius: 4px;
      }
      .fallback-editor::-webkit-scrollbar-thumb:hover {
        background: rgba(80,80,100,0.42);
      }
    `;
    document.head.appendChild(style);

    // Set initial value
    textarea.value = this.options.value;

    // Add event listeners
    textarea.addEventListener('input', () => {
      this.updateLineNumbers();
      this.highlightSyntax();
    });

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const spaces = ' '.repeat(this.options.tabSize);
        textarea.value = textarea.value.substring(0, start) + spaces + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + this.options.tabSize;
      }
    });

    wrapper.appendChild(textarea);
    this.element.appendChild(wrapper);

    // Store references
    this.textarea = textarea;
    this.lineNumbers = this.options.lineNumbers ? wrapper.querySelector('.line-numbers') : null;

    // Initialize
    this.updateLineNumbers();
    this.highlightSyntax();
  }

  updateLineNumbers() {
    if (!this.lineNumbers) return;

    const lines = this.textarea.value.split('\n');
    this.lineNumbers.innerHTML = lines
      .map((_, i) => `<div>${i + 1}</div>`)
      .join('');
  }

  highlightSyntax() {
    // Basic syntax highlighting using regex
    const code = this.textarea.value;
    const highlighted = code
      .replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>')
      .replace(/\b(const|let|var|function|return|if|else|switch|case|break|for|while|do|try|catch|finally|throw|new|this|class|extends|super|import|export|default|async|await)\b/g, '<span class="keyword">$1</span>')
      .replace(/\b(true|false|null|undefined)\b/g, '<span class="keyword">$1</span>')
      .replace(/(["'`])(.*?)\1/g, '<span class="string">$1$2$1</span>')
      .replace(/\b(\d+(\.\d+)?)\b/g, '<span class="number">$1</span>')
      .replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '<span class="property">$1</span>:');

    // Create a temporary div to hold the highlighted code
    const temp = document.createElement('div');
    temp.innerHTML = highlighted;
    
    // Update the textarea's value while preserving cursor position
    const cursorPos = this.textarea.selectionStart;
    this.textarea.value = code;
    this.textarea.selectionStart = this.textarea.selectionEnd = cursorPos;
  }

  getValue() {
    return this.textarea.value;
  }

  setValue(value) {
    this.textarea.value = value;
    this.updateLineNumbers();
    this.highlightSyntax();
  }

  refresh() {
    this.updateLineNumbers();
    this.highlightSyntax();
  }
} 