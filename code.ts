(async () => {
  await figma.loadAllPagesAsync();

// Coding art : convert svg to canvasJs code
// This plugin extracts SVG data from selected Figma elements and converts it to Canvas JS code.

// This file holds the main code for the plugin. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 650, height: 700 });

// Function to check if a node can be exported as SVG
function canExportAsSvg(node: SceneNode): boolean {
  // Vector-based nodes can be exported as SVG
  return node.type === 'VECTOR' ||
         node.type === 'BOOLEAN_OPERATION' ||
         node.type === 'STAR' ||
         node.type === 'LINE' ||
         node.type === 'ELLIPSE' ||
         node.type === 'POLYGON' ||
         node.type === 'RECTANGLE' ||
         node.type === 'FRAME' ||
         node.type === 'COMPONENT' ||
         node.type === 'INSTANCE' ||
         node.type === 'GROUP';
}

// Function to convert SVG path data to Canvas drawing commands
function convertSvgToCanvas(svgData: string): string {
  // Parse SVG string using regex instead of DOMParser
  const widthMatch = svgData.match(/width="([^"]+)"/);
  const heightMatch = svgData.match(/height="([^"]+)"/);
  const viewBoxMatch = svgData.match(/viewBox="([^"]+)"/);
  
  const width = widthMatch ? widthMatch[1] : '400';
  const height = heightMatch ? heightMatch[1] : '300';
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : null;
  
  // Start building Canvas.js code
  let canvasCode = '// Canvas.js code generated from SVG\n' +
    'const canvas = document.getElementById(\'myCanvas\');\n' +
    'const ctx = canvas.getContext(\'2d\');\n\n' +
    '// Set canvas size based on SVG dimensions\n' +
    'canvas.width = ' + width + ';\n' +
    'canvas.height = ' + height + ';\n\n' +
    '// Clear canvas\n' +
    'ctx.clearRect(0, 0, canvas.width, canvas.height);\n\n' +
    '// Set default styles\n' +
    'ctx.fillStyle = \'#000000\';\n' +
    'ctx.strokeStyle = \'#000000\';\n' +
    'ctx.lineWidth = 1;\n\n' +
    '// Drawing functions\n' +
    'function drawPath(pathData) {\n' +
    '  const commands = pathData.split(/(?=[MLHVCSQTAZmlhvcsqtaz])/);\n' +
    '  ctx.beginPath();\n\n' +
    '  let currentX = 0;\n' +
    '  let currentY = 0;\n\n' +
    '  for (const cmd of commands) {\n' +
    '    const type = cmd[0];\n' +
    '    const params = cmd.slice(1).trim().split(/[,\\s]+/).map(Number);\n\n' +
    '    switch (type) {\n' +
    '      case \'M\': // Move to absolute\n' +
    '        currentX = params[0];\n' +
    '        currentY = params[1];\n' +
    '        ctx.moveTo(currentX, currentY);\n' +
    '        break;\n' +
    '      case \'m\': // Move to relative\n' +
    '        currentX += params[0];\n' +
    '        currentY += params[1];\n' +
    '        ctx.moveTo(currentX, currentY);\n' +
    '        break;\n' +
    '      case \'L\': // Line to absolute\n' +
    '        currentX = params[0];\n' +
    '        currentY = params[1];\n' +
    '        ctx.lineTo(currentX, currentY);\n' +
    '        break;\n' +
    '      case \'l\': // Line to relative\n' +
    '        currentX += params[0];\n' +
    '        currentY += params[1];\n' +
    '        ctx.lineTo(currentX, currentY);\n' +
    '        break;\n' +
    '      case \'H\': // Horizontal line to absolute\n' +
    '        currentX = params[0];\n' +
    '        ctx.lineTo(currentX, currentY);\n' +
    '        break;\n' +
    '      case \'h\': // Horizontal line to relative\n' +
    '        currentX += params[0];\n' +
    '        ctx.lineTo(currentX, currentY);\n' +
    '        break;\n' +
    '      case \'V\': // Vertical line to absolute\n' +
    '        currentY = params[0];\n' +
    '        ctx.lineTo(currentX, currentY);\n' +
    '        break;\n' +
    '      case \'v\': // Vertical line to relative\n' +
    '        currentY += params[0];\n' +
    '        ctx.lineTo(currentX, currentY);\n' +
    '        break;\n' +
    '      case \'C\': // Cubic Bezier curve absolute\n' +
    '        ctx.bezierCurveTo(params[0], params[1], params[2], params[3], params[4], params[5]);\n' +
    '        currentX = params[4];\n' +
    '        currentY = params[5];\n' +
    '        break;\n' +
    '      case \'c\': // Cubic Bezier curve relative\n' +
    '        ctx.bezierCurveTo(\n' +
    '          currentX + params[0], currentY + params[1],\n' +
    '          currentX + params[2], currentY + params[3],\n' +
    '          currentX + params[4], currentY + params[5]\n' +
    '        );\n' +
    '        currentX += params[4];\n' +
    '        currentY += params[5];\n' +
    '        break;\n' +
    '      case \'Z\': // Close path\n' +
    '      case \'z\':\n' +
    '        ctx.closePath();\n' +
    '        break;\n' +
    '    }\n' +
    '  }\n' +
    '}\n\n';

  // Process SVG elements using regex
  function processSvgElement(svgString: string) {
    // Extract fill and stroke styles
    const fillMatch = svgString.match(/fill="([^"]+)"/);
    const strokeMatch = svgString.match(/stroke="([^"]+)"/);
    const strokeWidthMatch = svgString.match(/stroke-width="([^"]+)"/);
    
    if (fillMatch && fillMatch[1] !== 'none') {
      canvasCode += 'ctx.fillStyle = \'' + fillMatch[1] + '\';\n';
    }
    if (strokeMatch && strokeMatch[1] !== 'none') {
      canvasCode += 'ctx.strokeStyle = \'' + strokeMatch[1] + '\';\n';
    }
    if (strokeWidthMatch) {
      canvasCode += 'ctx.lineWidth = ' + strokeWidthMatch[1] + ';\n';
    }
    
    // Process paths
    const pathRegex = /<path[^>]*d="([^"]+)"[^>]*>/g;
    let pathMatch;
    while ((pathMatch = pathRegex.exec(svgString)) !== null) {
      canvasCode += 'drawPath(\'' + pathMatch[1] + '\');\n';
      if (fillMatch && fillMatch[1] !== 'none') {
        canvasCode += 'ctx.fill();\n';
      }
      if (strokeMatch && strokeMatch[1] !== 'none') {
        canvasCode += 'ctx.stroke();\n';
      }
    }
    
    // Process rectangles
    const rectRegex = /<rect[^>]*x="([^"]*)"[^>]*y="([^"]*)"[^>]*width="([^"]*)"[^>]*height="([^"]*)"[^>]*>/g;
    let rectMatch;
    while ((rectMatch = rectRegex.exec(svgString)) !== null) {
      const x = rectMatch[1] || '0';
      const y = rectMatch[2] || '0';
      const width = rectMatch[3] || '0';
      const height = rectMatch[4] || '0';
      
      canvasCode += 'ctx.beginPath();\n';
      canvasCode += 'ctx.rect(' + x + ', ' + y + ', ' + width + ', ' + height + ');\n';
      if (fillMatch && fillMatch[1] !== 'none') {
        canvasCode += 'ctx.fill();\n';
      }
      if (strokeMatch && strokeMatch[1] !== 'none') {
        canvasCode += 'ctx.stroke();\n';
      }
    }
    
    // Process circles
    const circleRegex = /<circle[^>]*cx="([^"]*)"[^>]*cy="([^"]*)"[^>]*r="([^"]*)"[^>]*>/g;
    let circleMatch;
    while ((circleMatch = circleRegex.exec(svgString)) !== null) {
      const cx = circleMatch[1] || '0';
      const cy = circleMatch[2] || '0';
      const r = circleMatch[3] || '0';
      
      canvasCode += 'ctx.beginPath();\n';
      canvasCode += 'ctx.arc(' + cx + ', ' + cy + ', ' + r + ', 0, Math.PI * 2);\n';
      if (fillMatch && fillMatch[1] !== 'none') {
        canvasCode += 'ctx.fill();\n';
      }
      if (strokeMatch && strokeMatch[1] !== 'none') {
        canvasCode += 'ctx.stroke();\n';
      }
    }
    
    // Process ellipses
    const ellipseRegex = /<ellipse[^>]*cx="([^"]*)"[^>]*cy="([^"]*)"[^>]*rx="([^"]*)"[^>]*ry="([^"]*)"[^>]*>/g;
    let ellipseMatch;
    while ((ellipseMatch = ellipseRegex.exec(svgString)) !== null) {
      const cx = ellipseMatch[1] || '0';
      const cy = ellipseMatch[2] || '0';
      const rx = ellipseMatch[3] || '0';
      const ry = ellipseMatch[4] || '0';
      
      canvasCode += 'ctx.beginPath();\n';
      canvasCode += 'ctx.ellipse(' + cx + ', ' + cy + ', ' + rx + ', ' + ry + ', 0, 0, Math.PI * 2);\n';
      if (fillMatch && fillMatch[1] !== 'none') {
        canvasCode += 'ctx.fill();\n';
      }
      if (strokeMatch && strokeMatch[1] !== 'none') {
        canvasCode += 'ctx.stroke();\n';
      }
    }
    
    // Process lines
    const lineRegex = /<line[^>]*x1="([^"]*)"[^>]*y1="([^"]*)"[^>]*x2="([^"]*)"[^>]*y2="([^"]*)"[^>]*>/g;
    let lineMatch;
    while ((lineMatch = lineRegex.exec(svgString)) !== null) {
      const x1 = lineMatch[1] || '0';
      const y1 = lineMatch[2] || '0';
      const x2 = lineMatch[3] || '0';
      const y2 = lineMatch[4] || '0';
      
      canvasCode += 'ctx.beginPath();\n';
      canvasCode += 'ctx.moveTo(' + x1 + ', ' + y1 + ');\n';
      canvasCode += 'ctx.lineTo(' + x2 + ', ' + y2 + ');\n';
      if (strokeMatch && strokeMatch[1] !== 'none') {
        canvasCode += 'ctx.stroke();\n';
      }
    }
  }
  
  // Process the SVG
  processSvgElement(svgData);
  
  canvasCode += '\nconsole.log(\'SVG successfully converted to Canvas.js code\');\n';
  
  return canvasCode;
}

// Start by checking if there's a selection when the plugin launches
if (figma.currentPage.selection.length > 0) {
  handleSelection(figma.currentPage.selection);
}

// Listen for selection changes to update the SVG preview
figma.on('selectionchange', () => {
  handleSelection(figma.currentPage.selection);
});

// Add listener for node changes
figma.on('documentchange', (event) => {
  const selection = figma.currentPage.selection;
  let shouldUpdate = false;

  for (const change of event.documentChanges) {
    if (change.type === 'PROPERTY_CHANGE' && 'nodeId' in change) {
      // If the changed node is in the current selection, update
      if (selection.some(node => node.id === change.nodeId)) {
        shouldUpdate = true;
        break;
      }
    }
  }

  if (shouldUpdate) {
    handleSelection(selection);
  }
});

// Handle the selected nodes and extract SVG data
async function handleSelection(selection: readonly SceneNode[]): Promise<void> {
  // Check if there's a valid selection that can be exported as SVG
  const validNodes = selection.filter(node => canExportAsSvg(node));
  
  if (validNodes.length === 0) {
    figma.ui.postMessage({
      type: 'svg-data',
      svg: '<div style="color: rgba(255,255,255,0.6);">Select a vector element to preview</div>'
    });
    return;
  }
  
  try {
    // Export selected node as SVG
    const svgNode = validNodes[0]; // For now, just use the first valid node
    const exportSettings: ExportSettings = {
      format: 'SVG',
      svgOutlineText: true,
      svgIdAttribute: true,
      svgSimplifyStroke: true
    };
    
    const svgData = await svgNode.exportAsync(exportSettings);
    const svgString = String.fromCharCode.apply(null, svgData as unknown as number[]);
    
    // Send SVG data to UI for display
    figma.ui.postMessage({
      type: 'svg-data',
      svg: svgString,
      name: svgNode.name
    });
    
  } catch (error) {
    console.error('Error exporting SVG:', error);
    figma.ui.postMessage({
      type: 'svg-data',
      svg: '<div style="color: #ff5252;">Error exporting SVG</div>'
    });
  }
}

// Handle messages from the UI
figma.ui.onmessage = (msg: { type: string }) => {
  if (msg.type === 'convert-to-canvas') {
    // Get the current selection
    const validNodes = figma.currentPage.selection.filter(node => canExportAsSvg(node));
    
    if (validNodes.length === 0) {
      figma.ui.postMessage({
        type: 'canvas-code',
        code: '// No valid vector elements selected\n// Please select a vector, shape, or group'
      });
      return;
    }
    
    // Export the selected node as SVG and convert to Canvas code
    (async () => {
      try {
        const svgNode = validNodes[0]; // For now, just use the first valid node
        const exportSettings: ExportSettings = {
          format: 'SVG',
          svgOutlineText: true,
          svgIdAttribute: true,
          svgSimplifyStroke: true
        };
        
        const svgData = await svgNode.exportAsync(exportSettings);
        const svgString = String.fromCharCode.apply(null, svgData as unknown as number[]);
        
        // Convert SVG to Canvas code
        const canvasCode = convertSvgToCanvas(svgString);
        
        // Send the Canvas code to the UI
        figma.ui.postMessage({
          type: 'canvas-code',
          code: canvasCode,
          name: svgNode.name
        });
        
      } catch (error) {
        console.error('Error converting SVG to Canvas:', error);
        figma.ui.postMessage({
          type: 'canvas-code',
          code: `// Error converting SVG to Canvas\n// ${error}`
        });
      }
    })();
  } else if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};

})();
