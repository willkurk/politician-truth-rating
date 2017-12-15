/* Contents:
- Class LayoutMgr
- function createArrow
- Class Row
- Class Arrow
- Arrow helper functions
- Drag functions
- Extensions to Javascript Array, like last and removeFirstOccurrance
*/

import {ArgMap} from "./ArgMap.js"
import {Dragster} from "./Dragster.js"

export class LayoutMgr { // Manages diagram layout. Rows are numbered 1 and up starting at the bottom.
    static get ROW_GAP()  { return 30; }
    static get SVG_TYPE() { return 'http://www.w3.org/2000/svg'; }
    
    constructor(diagram, argMap) {
        this.rows = []; // One Row object per row
        this.diagram = diagram;
        this.argMap = argMap;
        this.zoomLevel = 1;
    //    this.pointerDownX;
    //    this.pointerDownOffsetCenterX;
        // Language bug - Error of static constant is used in the next line.
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); // For all arrows.
        this.nextArrowIDNumber = 1;
        diagram.appendChild(this.svg);
        diagram.addEventListener('dragover', this.dragoverEvent, false);
        diagram.addEventListener('drop', this.dropOnEmptyDiagram, false);
        this.svg.id = 'arrowsheet';
        document.body.setAttribute('touch-action', 'none'); // For use of pointer events
    }
    dragoverEvent(event){
        event.preventDefault(); // Allows a drop
    }
    dropOnEmptyDiagram(event, interfaceNode){
        let text;
        if ( typeof event === 'string') { // A manually created event with an interfaceNode.
            text = event;
        } else { // A drag and drop from the textbox with no interfaceNode.
            text = event.dataTransfer.getData('Text');
            event.preventDefault(); // Without this Firefox does a search on the dropped text.
        }
        if (text === ArgMap.CLAIM) {
            if (this.argMap.nodes.length > 0) {
                alert("Cannot add a Claim since the diagram is not empty.")
            } else {
                if (! interfaceNode) { interfaceNode = createTestClaimInterfaceNode(); }
                this.argMap.layoutMgr._addClaim(interfaceNode);
            }
        } else {
            alert('Sorry. You can only add a Claim to an empty diagram.');
        }
    }
    dropOnConclusion(event, interfaceNode){ // Can only drop rule on a conclusion.
        let text, nodeConclusion;
        if ( typeof event === 'string') { // A manually created event with an interfaceNode.
            text = event;
            nodeConclusion = interfaceNode.lowerNode;
        } else { // A drag and drop from the textbox with no interfaceNode.
            text = event.dataTransfer.getData('Text');
            event.preventDefault(); // Without this Firefox does a search on the dropped text.
            event.currentTarget.classList.remove('node-drop-highlight');
            nodeConclusion = this.argMap.getNodeForNodeDiv(event.currentTarget);
        }        
        let newNode, arrow;
        switch (text) {
            case ArgMap.CLAIM: case ArgMap.INTCONCLUSION: case ArgMap.FACT: case ArgMap.RCLAIM:
                alert('Sorry, you can only add a Rule to a conclusion.')
                break;
            case ArgMap.RULE:
                if ( nodeConclusion.hasRule() ) {
                    alert('Sorry, this conclusion already has a rule.')
                } else { // Add rule
                    if (! interfaceNode) { interfaceNode = createTestRuleInterfaceNode(nodeConclusion); }
                    newNode = this.argMap.addNodeRule(nodeConclusion);
                    // Note that interfaceNode.lowerNode is used above, not here.
                    interfaceNode.copyBasicPropertiesToNode(newNode);
                    this.argMap.selectJustOneNode(newNode);
                    this.argMap.layoutMgr._addNodeToConclusion(newNode, nodeConclusion);
                    nodeConclusion.rule = newNode;
                    createArrow(this.argMap, newNode, nodeConclusion);
                    this.argMap.layoutMgr._switchDropEventsFromConclusionToRule(nodeConclusion, newNode);
                }
                break;
            default:
                alert('Sorry. Please drag and drop a valid node type.');
                break;
        }
    }
    dropOnRule(event, interfaceNode){ // Can only drop IntConclusion, Fact, RClaim on a rule.
        let text, nodeRule, nodeConclusion;
        if ( typeof event === 'string') { // A manually created event with an interfaceNode.
            text = event;
            nodeRule = interfaceNode.lowerNode;
            nodeConclusion = nodeRule.conclusion;
        } else { // A drag and drop from the textbox with no interfaceNode.
            text = event.dataTransfer.getData('Text');
            event.preventDefault(); // Without this Firefox does a search on the dropped text.
            event.currentTarget.classList.remove('node-drop-highlight');
            nodeRule = this.argMap.getNodeForNodeDiv(event.currentTarget);
            nodeConclusion = nodeRule.conclusion;
        }        
        let newNode, arrow;
        switch (text) {
            case ArgMap.CLAIM: case ArgMap.RULE:
                alert('Sorry, you can only add an Intermediate Conclusion, a Fact, or an RClaim to a Rule.')
                break;
            case ArgMap.INTCONCLUSION:
                if (! interfaceNode) { interfaceNode = createTestIntConclusionInterfaceNode(nodeConclusion); }
                newNode = this.argMap.addNodeIntConclusion(nodeConclusion);
                interfaceNode.copyBasicPropertiesToNode(newNode);
                this.argMap.selectJustOneNode(newNode);
                this.argMap.layoutMgr._addNodeToConclusion(newNode, nodeConclusion);
                createArrow(this.argMap, newNode, nodeConclusion.rule);
                this.argMap.layoutMgr._addDropEventsToConclusion(newNode); 
                this.argMap.layoutMgr._addWeightEvent(newNode);
                break;
            case ArgMap.FACT:
                if (! interfaceNode) { interfaceNode = createTestFactInterfaceNode(nodeConclusion);}
                newNode = this.argMap.addNodeFact(nodeConclusion);
                interfaceNode.copyBasicPropertiesToNode(newNode);
                this.argMap.selectJustOneNode(newNode);
                this.argMap.layoutMgr._addNodeToConclusion(newNode, nodeConclusion);
                createArrow(this.argMap, newNode, nodeConclusion.rule);
                this.argMap.layoutMgr._addWeightEvent(newNode);
                break;
            case ArgMap.RCLAIM:
                if (! interfaceNode) { interfaceNode = createTestRClaimInterfaceNode(nodeConclusion);}
                newNode = this.argMap.addNodeRClaim(nodeConclusion);
                interfaceNode.copyBasicPropertiesToNode(newNode);
                this.argMap.selectJustOneNode(newNode);
                this.argMap.layoutMgr._addNodeToConclusion(newNode, nodeConclusion);
                createArrow(this.argMap, newNode, nodeConclusion.rule);
                this.argMap.layoutMgr._addWeightEvent(newNode);
                break;
            default:
                alert('Sorry. Please drag and drop a valid node type.');
                break;
        }
    }
    dropTargetDragenter(event){
        event.preventDefault();
        event.currentTarget.classList.add('node-drop-highlight');
        //event.currentTarget.classList.add('node-drop-disable-pointer-events');
    }
    dropTargetDragleave(event){ // Not called if drop occurs.
        event.preventDefault();
        event.currentTarget.classList.remove('node-drop-highlight');
        //event.currentTarget.classList.remove('node-drop-disable-pointer-events');
    }
    weightSelected(event) {
        let node = this.argMap.getNodeForNodeDiv(this);
        node.weightIndex = node.nodeWeightDiv.options.selectedIndex;
        this.argMap.claim.calcCL();
    }
    _addWeightEvent(node) {
        node.nodeDiv.addEventListener('change', this.weightSelected, false);
    }
    // Drag and drop private methods
    _addDropEventsToConclusion(node){
        this._addGeneralDropEvents(node);
        node.nodeDiv.addEventListener('drop', this.dropOnConclusion, false);
    }
    _switchDropEventsFromConclusionToRule(nodeConclusion, nodeRule){
        // Add drop events to rule, remove drop events from conclusion.
        this._addGeneralDropEvents(nodeRule);
        nodeRule.nodeDiv.addEventListener('drop', this.dropOnRule, false);

        this._removeGeneralDropEvents(nodeConclusion);
        nodeConclusion.nodeDiv.removeEventListener('drop', this.dropOnConclusion);
    }
    _removeDropEventsFromRule(nodeRule){
        this._removeGeneralDropEvents(nodeRule);
        nodeRule.nodeDiv.removeEventListener('drop', this.dropOnRule);
    }
    // Helpers for above methods
    _addGeneralDropEvents(node) {
        // If these lines are run in the event method, 'this' is the DOM element, not this class.
        node.nodeDiv.addEventListener('dragover', this.dragoverEvent, false);
        // node.nodeDiv.addEventListener('dragenter', this.dropTargetDragenter, false);
        // node.nodeDiv.addEventListener('dragleave', this.dropTargetDragleave, false);

        // Dragsterize one of the dropzones - 
        new Dragster( node.nodeDiv );
        node.nodeDiv.addEventListener('dragster:enter', this.dropTargetDragenter, false);
        node.nodeDiv.addEventListener('dragster:leave', this.dropTargetDragleave, false);          
    }
    _removeGeneralDropEvents(node) {
        node.nodeDiv.removeEventListener('dragover', this.dragoverEvent);
        // node.nodeDiv.removeEventListener('dragenter', this.dropTargetDragenter);
        // node.nodeDiv.removeEventListener('dragleave', this.dropTargetDragleave);
        node.nodeDiv.removeEventListener('dragster:enter', this.dropTargetDragenter);
        node.nodeDiv.removeEventListener('dragster:leave', this.dropTargetDragleave); 
    }
    // Other private methods
    _addClaim(interfaceNode) { // Should combine this with _addNodeToConclusion(). TO DO
        let node = this.argMap.addNodeClaim();
        interfaceNode.copyBasicPropertiesToNode(node);
        // Create the new row
        let rowHeight = node.height; 
        let rowTop   = (this.diagram.clientHeight / 2) - (rowHeight / 2);
        let row = new Row(rowTop, rowHeight, 1);
        this.rows.push(row); 
        node.setRow(row);
        // Center node on diagram if necessary.
        if (node.centerOnChildWhenAdded) node.offsetCenterX = 0;
        // Now the claim is the drop area. Really any conclusion is a drop area. 
        diagram.removeEventListener('dragover', this.dragoverEvent, false);
        diagram.removeEventListener('drop', this.dropOnEmptyDiagram, false);
        this._addDropEventsToConclusion(node);
        this.argMap.selectJustOneNode(node);
        node.calcCL();
    }
    _addNodeToConclusion(node, nodeConclusion) {
        // Create the new row if necessary. 
        let recenterNeeded = false;
        let row;
        let conclusionRowNumber = nodeConclusion.row.number; 
        // If rows have nodes, could search rows to determine a node's row number.
        let newNodeRowNumber = conclusionRowNumber + 1; // For a rule
        if (! node.isRule) { newNodeRowNumber = conclusionRowNumber + 2; } // Not a rule 
        if (newNodeRowNumber > this.rows.length){ 
            // Create new row
            let rowHeight = node.height;
            let lastRow = this.rows.last();
            let rowTop = lastRow.top - LayoutMgr.ROW_GAP - rowHeight; 
            row = new Row(rowTop, rowHeight, this.rows.length + 1);
            this.rows.push(row);
            recenterNeeded = true;
        } else {
            row = this.rows[newNodeRowNumber - 1];
        }
        node.setRow(row); 
        // Center node. 
        if (node.centerOnChildWhenAdded) { 
            if ( node.isRule ) {
                node.offsetCenterX = nodeConclusion.offsetCenterX; 
            } else {
                node.offsetCenterX = nodeConclusion.rule.offsetCenterX;
            }
        }
        if (recenterNeeded) this.verticallyRecenterAllRows(); 
        this.argMap.claim.calcCL();
    }
    _checkDiagramOverflow() {
        // Check for vertical and horizontal overflow.
        let minTop = 9999, maxBottom = -9999, minLeft = 9999, maxRight = -9999;
        for (let i = 0; i < this.argMap.nodes.length; i++){
            let node = this.argMap.nodes[i];
            if ( node.top < minTop ) minTop = node.top;
            if ( node.bottom > maxBottom ) maxBottom = node.bottom;
            if ( node.left < minLeft ) minLeft = node.left;
            if ( node.right > maxRight ) maxRight = node.right;
        }    
        // transform: scale(2, 2);
        // transform-origin: center center;
    }
    // NOTE - Need RowMgr to handle all this, especially once node heights can change after added.
    // Will need for each row to have its nodes for much easier operation.
    verticallyRecenterAllRows() { // Used when row added or node deleted to keep map centered vertically on diagram.
        // Automatic housecleaning. If top row is empty, delete it.
        let hightestRowNumber = 0;
        for (let i = 0; i < this.argMap.nodes.length; i++){
            let node = this.argMap.nodes[i];
            if ( node.row.number > hightestRowNumber ) hightestRowNumber = node.row.number;
        }
        if ( hightestRowNumber < this.rows.length ) this.rows.pop();
        // More automatic housecleaning. The diagram may need shrinking or expanding.
//        this._checkDiagramOverflow();
        // Prepare to shift
        let rowsTop = this.rows.last().top;
        let rowsBottom = this.rows[0].top + this.rows[0].height;
        let rowsHeight = rowsBottom - rowsTop;
        let diagramHeight = this.diagram.clientHeight;
        let desiredRowsTop = (diagramHeight - rowsHeight) / 2;
        let rowShift = desiredRowsTop - rowsTop;
        // Shift rows. Must do this before shift nodes.
        for (let i = 0; i < this.rows.length; i++){
            let row = this.rows[i];
            row.top += rowShift;
        }
        // Shift nodes
        for (let i = 0; i < this.argMap.nodes.length; i++){
            let node = this.argMap.nodes[i];
            node.top = node.row.top;
            node.refreshArrows();
        }
    }
    horizontallyRecenterAllNodes() { // Considering the fartherest left and right node edges.
        let diagramWidth = this.diagram.clientWidth;
        // Determine minLeft and maxRight, and then the horizontalShift needed.
        let minLeft = 9999, maxRight = -9999;
        for (let i = 0; i < this.argMap.nodes.length; i++){
            let node = this.argMap.nodes[i];
            if ( node.left < minLeft ) minLeft = node.left;
            if ( node.right > maxRight ) maxRight = node.right;
        }
        let horizontalShift = (diagramWidth/2) - ((maxRight + minLeft) / 2);
        horizontalShift = roundToDiagramGrid(horizontalShift);
        if (horizontalShift === 0) return;
        // Shift nodes by changing the left of each node, then update offsetCenterX.
        let diagramCenter = diagramWidth / 2;
        for (let i = 0; i < this.argMap.nodes.length; i++){
            let node = this.argMap.nodes[i];
            let newLeft = node.left + horizontalShift;
            let centeredLeft = diagramCenter - (node.width / 2);
            let newOffsetCenterX = newLeft - centeredLeft;
            node.offsetCenterX = newOffsetCenterX;
            node.refreshArrows();
        }

    }
    // Zoom feature
    zoomIn()     { this.zoomLevel -= .1; this._setZoomLevel(); }    
    zoomOut()    { this.zoomLevel += .1; this._setZoomLevel(); }
    zoomNormal() { this.zoomLevel  =  1; this._setZoomLevel(); }
    _setZoomLevel() {
        this.diagram.style.transform = 'scale(' + this.zoomLevel + ', ' + this.zoomLevel + ')';  
        // Much more to do here....
        
        
    }
} // End class LayoutMgr
function createArrow (argMap,upperNode, lowerNode){
    let id = 'arrow' + argMap.layoutMgr.nextArrowIDNumber++;
    let arrow = new Arrow(upperNode, lowerNode, id, argMap.layoutMgr.svg);
    lowerNode.upperArrows.push(arrow);
    upperNode.lowerArrow = arrow;           
    upperNode.refreshArrows();
}
class Row { // May later have nodes on the row, for collision detection and layout. 
    constructor(top, height, number) {
        this.GAP = 30;
        this.top = top;
        this.height = height;
        this.number = number;
    }
}
class Arrow {
    static get COLOR() { return 'gray' }
    //static get COLOR() { return 'SlateGray' }
    //static get COLOR() { return 'navy' } // Best with light photo background

    constructor(upperNode, lowerNode, id, svg) {
        this.upperNode = upperNode;
        this.lowerNode = lowerNode;
        this.id = id; // For updating the elements used for this arrow. Unique to each instance.
        this.arrowheadID = this.id + 'a';
        this.svg = svg; // A single svg contains all the arrows.
        //this.GAP = 30; // Really need ONE PLACE for this.
    }
    refresh() {
        let line = document.getElementById(this.id);
        if (line) { this.svg.removeChild(line); }
        line = document.createElementNS(LayoutMgr.SVG_TYPE, 'line');
        //line.id = this.id;
        let x1, x2, y1, y2;

        if (this.upperNode.isRule) {
            // Draw vertical line and arrowhead connecting rule to its conclusion. 
            // We remove the elements if they already exist, and then create them.
            // First draw the line. This is the arrow shaft. 
            const ARROWHEAD_LENGTH = 15;
            const ONE_HALF_ARROWHEAD_WIDTH = 7;
            x1 = calculateCenterX(this.upperNode); // Rule center
            y1 = calculateCenterY(this.upperNode); // Rule center
            x2 = x1; 
            y2 = calculateTopY(this.lowerNode) - ARROWHEAD_LENGTH; 
            // Then do the arrowhead. First prepare the element.
            let arrowhead = document.getElementById(this.arrowheadID);
            if (arrowhead) { this.svg.removeChild(arrowhead); }
            arrowhead = document.createElementNS(LayoutMgr.SVG_TYPE, 'polygon');
            arrowhead.id = this.arrowheadID;
            // Now determine the three points making up the arrowhead. 5 top left, 6 top right, 7 lower tip.
            let x5 = x1 - ONE_HALF_ARROWHEAD_WIDTH;
            let y5 = y2;
            let x6 = x1 + ONE_HALF_ARROWHEAD_WIDTH;
            let y6 = y5;
            let x7 = x1;
            let y7 = calculateTopY(this.lowerNode);
            arrowhead.setAttribute('points', x5 + ',' + y5 + ' ' + x6 + ',' + y6 + ' ' + x7 + ',' + y7 );
            arrowhead.style.fill = Arrow.COLOR;
            this.svg.appendChild(arrowhead);

        } else {
            // Draw line connecting two node centers.
            x1 = calculateCenterX(this.upperNode);
            y1 = calculateCenterY(this.upperNode);
            x2 = calculateCenterX(this.lowerNode);
            y2 = calculateCenterY(this.lowerNode);
        }
        line.setAttribute('id', this.id);
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', Arrow.COLOR);
        line.style.strokeWidth = 4;
        this.svg.appendChild(line);
    }
    removeHTML() { // This replicates code from above, could be refactored.
        let line = document.getElementById(this.id);
        if (line) { this.svg.removeChild(line); }
        if (this.upperNode.isRule) {
            let arrowhead = document.getElementById(this.arrowheadID);
            if (arrowhead) { this.svg.removeChild(arrowhead); }
        }
    }
} // End class Arrow

// Arrow helper functions
function calculateCenterX(node) { return node.left + (node.width / 2); }
function calculateCenterY(node) { return node.top + (node.height / 2); }
function calculateTopY(node)    { return node.top; }

// Node drag functions. Basic concept from https://codepen.io/terabaud/pen/rmJoee.
// makeNodeDraggable should be a class method, not an isolated function.
var pointer = {};
var moveListener;

export function makeNodeDraggable(node, argMap) {
    moveListener = (function(event) {layoutPointerMove(event, argMap)})

    node.nodeDiv.addEventListener('pointerdown',  (function(event) {layoutPointerDown(event, argMap)}), false);
    node.nodeDiv.addEventListener('pointerup',    (function(event) {layoutPointerUp(event, argMap)}),   false);
    // To fix browser bug. Pointerup is never called if drag release is not over the node.
    node.nodeDiv.addEventListener('pointerleave', (function(event) {layoutPointerUp(event, argMap)}),   false);
}


function layoutPointerDown(event, argMap) {
    let node = argMap.getNodeForNodeDiv(event.currentTarget);
    node.nodeDiv.addEventListener('pointermove', moveListener, false);
    pointer.pointerDownX = event.clientX; // Sets this property on div.node, not class LayoutMgr !!!
    pointer.pointerDownY = event.clientY; // Not yet used. For move a factual to another rule.
    pointer.pointerDownOffsetCenterX = node.offsetCenterX;
}
function layoutPointerUp(event, argMap) {
    let node = argMap.getNodeForNodeDiv(event.currentTarget);
    node.nodeDiv.removeEventListener('pointermove', moveListener, false);
}
function layoutPointerMove(event, argMap) {
    let node = argMap.getNodeForNodeDiv(event.currentTarget);
    let totalMoveX = event.clientX - pointer.pointerDownX; // Positive to move right, negative to move left.
    let newOffsetCenterX = pointer.pointerDownOffsetCenterX + totalMoveX;
    // Is this a big enough move to do, considering grid snap?
    let newLeft = node.calculateNewLeftForNewOffsetCenterX(newOffsetCenterX);
    if (newLeft === node.left) return;
    // Prevent rule lower arrow from not pointing to its conclusion.
    const EXTRA = 30; // Don't let the arrow go closer than this to a nodes left or right.
    if (node.isRule) {
        let arrowX = newLeft + ( node.width / 2);
        let tooFarLeft = node.conclusion.left + EXTRA - arrowX;
        let tooFarRight = arrowX - (node.conclusion.right - EXTRA);
        if (tooFarLeft > 0 || tooFarRight > 0) return;
    }
    if (node.isConclusion) {
        if ( node.hasRule() ) {
            let arrowX = node.rule.centerX;
            let tooFarLeft = arrowX - (newLeft + node.width - EXTRA);
            let tooFarRight = newLeft + EXTRA - arrowX;
            if (tooFarLeft > 0 || tooFarRight > 0) return;               
        }
    }
    // Keep the left edge of the node inside the padded container.
    if (newLeft < ArgMap.DIAGRAM_PADDING) return;
    // Keep the right edge of the node inside the padded container.
    let diagramWidth = argMap.diagram.clientWidth;
    let maxAllowableRight = diagramWidth - ArgMap.DIAGRAM_PADDING;
    if (newLeft + node.width > maxAllowableRight) return;
    // Done. Update the node offset and refresh the arrows. 
    node.offsetCenterX = newOffsetCenterX;
    node.refreshArrows(); 
}
// ===== LIBRARY =====
// Methods added to array
Array.prototype.last = function () { // Helps readibility.
    return this[this.length - 1];
}
Array.prototype.removeFirstOccurrance = function (item) { // Very handy.
    this.splice( this.indexOf( item ), 1 );
}
// These are not used:
Array.prototype.atOneBased = function (index) { // A one based method, to reduce bugs. 
    return this[index = 1];
}
Array.prototype.first = function () { // Helps readibility. 
    return this[0];
}
// Library
function elementHasClass(element, className) {
    return (' ' + element.className + ' ').indexOf(' ' + className + ' ') > -1;
}
