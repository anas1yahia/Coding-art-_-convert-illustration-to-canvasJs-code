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

// Debouncing variables for real-time updates
let updateTimeout: ReturnType<typeof setTimeout> | null = null;

// Start by checking if there's a selection when the plugin launches
if (figma.currentPage.selection.length > 0) {
  handleSelection(figma.currentPage.selection);
}

// Helper to check if SVG preview tab is active (communicate with UI)
let svgPreviewTabActive = true;

// Listen for selection changes to update the SVG preview
figma.on('selectionchange', () => {
  handleSelection(figma.currentPage.selection);
});

// Add listener for node changes with improved responsiveness
figma.on('documentchange', (event) => {
  const selection = figma.currentPage.selection;
  let shouldUpdate = false;

  // Only update if SVG preview tab is active and we have something selected
  if (!svgPreviewTabActive || selection.length === 0) {
    return;
  }

  // Check if any changes affect the current selection or their visual properties
  for (const change of event.documentChanges) {
    // Log changes for debugging
    console.log('Document change detected:', change.type, change);
    
    // Check for property changes that affect visual appearance
    if (change.type === 'PROPERTY_CHANGE' && 'nodeId' in change) {
      // Get all node IDs that should trigger updates (selection + all descendants + parents)
      const relevantNodeIds = new Set<string>();
      
      // Add selected nodes and their parents
      selection.forEach(node => {
        relevantNodeIds.add(node.id);
        
        // Add parent nodes (for frame background changes)
        let parent = node.parent;
        while (parent && parent.type !== 'PAGE') {
          relevantNodeIds.add(parent.id);
          parent = parent.parent;
        }
        
        // Add all descendant nodes
        const addDescendants = (node: SceneNode) => {
          if ('children' in node && node.children) {
            node.children.forEach(child => {
              relevantNodeIds.add(child.id);
              addDescendants(child);
            });
          }
        };
        addDescendants(node);
      });

      // Check if the changed node is relevant
      if (relevantNodeIds.has(change.nodeId as string)) {
        console.log('Relevant change detected for node:', change.nodeId);
        shouldUpdate = true;
        break;
      }
    }
    
    // Also catch other types of changes that might affect appearance
    if (change.type === 'CREATE' || change.type === 'DELETE') {
      console.log('Structure change detected');
      shouldUpdate = true;
      break;
    }
  }

  // Force update for any document change when something is selected (more aggressive)
  if (event.documentChanges.length > 0 && selection.length > 0) {
    shouldUpdate = true;
  }

  if (shouldUpdate) {
    console.log('Triggering preview update');
    // Clear any pending updates
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
    
    // Update immediately for better responsiveness
    updateTimeout = setTimeout(() => {
      handleSelection(selection);
    }, 10); // Even shorter delay for maximum responsiveness
  }
});

// Handle the selected nodes and extract SVG data
async function handleSelection(selection: readonly SceneNode[]): Promise<void> {
  console.log('handleSelection called with:', selection.length, 'nodes');
  
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
    console.log('Exporting node:', svgNode.name, 'type:', svgNode.type);
    
    // No delay for maximum responsiveness
    const exportSettings: ExportSettings = {
      format: 'SVG',
      svgOutlineText: true,
      svgIdAttribute: true,
      svgSimplifyStroke: true,
      // For frames and groups, ensure backgrounds are included
      ...(svgNode.type === 'FRAME' && {
        useAbsoluteBounds: false
      })
    };
    
    console.log('Starting export with settings:', exportSettings);
    const svgData = await svgNode.exportAsync(exportSettings);
    const svgString = String.fromCharCode.apply(null, svgData as unknown as number[]);
    
    console.log('Export completed, SVG length:', svgString.length);
    
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
figma.ui.onmessage = (msg: { type: string; tab?: string; code?: string }) => {
  if (msg.type === 'tab-changed' && 'tab' in msg) {
    svgPreviewTabActive = msg.tab === 'svg';
    // If switching to SVG tab, immediately update preview
    if (svgPreviewTabActive && figma.currentPage.selection.length > 0) {
      handleSelection(figma.currentPage.selection);
    }
  }
  if (msg.type === 'convert-to-canvas') {
    figma.ui.postMessage({
      type: 'canvas-code',
      code: '// This feature is under development.'
    });
    return;
  } else if (msg.type === 'cancel') {
    figma.closePlugin();
  } else if (msg.type === 'copy-to-clipboard') {
    // Type guard for clipboard
    const clipboard = (figma as unknown as { clipboard?: { writeText: (text: string) => void } }).clipboard;
    if (clipboard && typeof clipboard.writeText === 'function' && msg.code) {
      clipboard.writeText(msg.code);
      figma.notify('Code copied to clipboard!');
    } else {
      figma.notify('Clipboard API not available. Please update Figma or plugin typings.');
    }
  }
};

})();
