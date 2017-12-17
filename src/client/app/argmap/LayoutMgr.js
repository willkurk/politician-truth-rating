/* Contents:
- Class LayoutMgr
- function createArrow
- Class Arrow
- Arrow helper functions
- Drag functions
- class RowMgr - Manages the rows for an ArgMap.
- class Row - Contains the nodes for one row plus row state.
- Extensions to Javascript Array, like last and removeFirstOccurrance
*/
class LayoutMgr { // Manages diagram layout. Rows are numbered 1 and up starting at the bottom.
    static get ROW_GAP()  { return 30; }
    static get SVG_TYPE() { return 'http://www.w3.org/2000/svg'; }
    
    constructor(diagram, argMap) {
        this.diagram = diagram;
        this.argMap = argMap;
        this.myself = this;
        this.rowMgr = new RowMgr(this);
        // Language bug - Error if static constant SVG_TYPE is used in the next line.
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); // For all arrows.
        diagram.appendChild(this.svg);
        this.svg.id = 'arrow-sheet';
        document.body.setAttribute('touch-action', 'none'); // For use of pointer events
        diagram.setAttribute(ArgMapsMgr.ARG_MAP_KEY, this.argMap.instanceID);
        // Arrow functions not used since these listeners will be removed.
        diagram.addEventListener('dragover', this.dragoverEvent, false);
        diagram.addEventListener('drop', this.dropOnEmptyDiagram, false );
    }
    dragoverEvent(event){
        event.preventDefault(); // Allows a drop
    }
    dropOnEmptyDiagram(event, interfaceNode){
        let text, myArgMap;
        if ( typeof event === 'string') { // A manually created event with an interfaceNode.
            text = event;
            myArgMap = argMapsMgr.getArgMapForDiagram(interfaceNode.diagram);
        } else { // A drag and drop from the textbox with no interfaceNode.
            text = event.dataTransfer.getData('Text');
            event.preventDefault(); // Without this Firefox does a search on the dropped text.
            myArgMap = argMapsMgr.getArgMapForEvent(event);
        }
        if (text === ArgMap.CLAIM) {
            if (myArgMap.nodes.length > 0) { 
                alert("Cannot add a Claim since the diagram is not empty.")
            } else {
                if (! interfaceNode) { interfaceNode = createTestClaimInterfaceNode(); }
                myArgMap.layoutMgr._addClaim(interfaceNode); 
            }
        } else {
            alert('Sorry. You can only add a Claim to an empty diagram.');
        }
    }
    dropOnConclusion(event, interfaceNode){ // Can only drop a rule on a conclusion.
        let myArgMap;
        let text, nodeConclusion;
        if ( typeof event === 'string') { // A manually created event with an interfaceNode.
            text = event;
            nodeConclusion = interfaceNode.lowerNode;
            myArgMap = argMapsMgr.getArgMapForDiagram(interfaceNode.diagram);
        } else { // A drag and drop from the textbox with no interfaceNode.
            text = event.dataTransfer.getData('Text');
            event.preventDefault(); // Without this Firefox does a search on the dropped text.
            event.currentTarget.classList.remove('node-drop-highlight');
            myArgMap = argMapsMgr.getArgMapForEvent(event);
            nodeConclusion = myArgMap.getNodeForNodeDiv(event.currentTarget);
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
                    newNode = myArgMap.addNodeRule(nodeConclusion);
                    // Note that interfaceNode.lowerNode is used above, not here.
                    interfaceNode.copyBasicPropertiesToNode(newNode);
                    myArgMap.selectJustOneNode(newNode); 
                    myArgMap.layoutMgr._addNodeToConclusion(newNode, nodeConclusion);
                    nodeConclusion.rule = newNode;
                    createArrow(newNode, nodeConclusion);
                    myArgMap.layoutMgr._switchDropEventsFromConclusionToRule(nodeConclusion, newNode);
                }
                break;
            default:
                alert('Sorry. Please drag and drop a valid node type.');
                break;
        }
    }
    dropOnRule(event, interfaceNode){ // Can only drop IntConclusion, Fact, RClaim on a rule.
        let text, nodeRule, nodeConclusion, myArgMap;
        if ( typeof event === 'string') { // A manually created event with an interfaceNode.
            text = event;
            nodeRule = interfaceNode.lowerNode;
            nodeConclusion = nodeRule.conclusion;
            myArgMap = argMapsMgr.getArgMapForDiagram(interfaceNode.diagram);
        } else { // A drag and drop from the textbox with no interfaceNode.
            text = event.dataTransfer.getData('Text');
            event.preventDefault(); // Without this Firefox does a search on the dropped text.
            event.currentTarget.classList.remove('node-drop-highlight');
            myArgMap = argMapsMgr.getArgMapForEvent(event);
            nodeRule = myArgMap.getNodeForNodeDiv(event.currentTarget);
            nodeConclusion = nodeRule.conclusion;
        }        
        let newNode, arrow;
        switch (text) {
            case ArgMap.CLAIM: case ArgMap.RULE:
                alert('Sorry, you can only add an Intermediate Conclusion, a Fact, or an RClaim to a Rule.')
                break;
            case ArgMap.INTCONCLUSION:
                if (! interfaceNode) { interfaceNode = createTestIntConclusionInterfaceNode(nodeConclusion); }
                newNode = myArgMap.addNodeIntConclusion(nodeConclusion);
                interfaceNode.copyBasicPropertiesToNode(newNode);
                myArgMap.selectJustOneNode(newNode);
                myArgMap.layoutMgr._addNodeToConclusion(newNode, nodeConclusion);
                createArrow(newNode, nodeConclusion.rule);
                myArgMap.layoutMgr._addDropEventsToConclusion(newNode); 
                myArgMap.layoutMgr._addWeightEvent(newNode);
                break;
            case ArgMap.FACT:
                if (! interfaceNode) { interfaceNode = createTestFactInterfaceNode(nodeConclusion);}
                newNode = myArgMap.addNodeFact(nodeConclusion);
                interfaceNode.copyBasicPropertiesToNode(newNode);
                myArgMap.selectJustOneNode(newNode);
                myArgMap.layoutMgr._addNodeToConclusion(newNode, nodeConclusion);
                createArrow(newNode, nodeConclusion.rule);
                myArgMap.layoutMgr._addWeightEvent(newNode);
                break;
            case ArgMap.RCLAIM:
                if (! interfaceNode) { interfaceNode = createTestRClaimInterfaceNode(nodeConclusion);}
                newNode = myArgMap.addNodeRClaim(nodeConclusion);
                interfaceNode.copyBasicPropertiesToNode(newNode);
                myArgMap.selectJustOneNode(newNode);
                myArgMap.layoutMgr._addNodeToConclusion(newNode, nodeConclusion);
                createArrow(newNode, nodeConclusion.rule);
                myArgMap.layoutMgr._addWeightEvent(newNode);
                break;
            default:
                alert('Sorry. Please drag and drop a valid node type.');
                break;
        }
    }
    dropTargetDragenter(event){
        event.preventDefault();
        let node = argMapsMgr.getNodeForEvent(event);
        node.argMap.deselectAllNodes();
        event.currentTarget.classList.add('node-drop-highlight');
        //event.currentTarget.classList.add('node-drop-disable-pointer-events');
    }
    dropTargetDragleave(event){ // Not called if drop occurs.
        event.preventDefault();
        event.currentTarget.classList.remove('node-drop-highlight');
        //event.currentTarget.classList.remove('node-drop-disable-pointer-events');
    }
    weightSelected(event) {
        let node = argMap.getNodeForNodeDiv(this);
        node.weightIndex = node.nodeWeightDiv.options.selectedIndex;
        argMap.claim.calcCL();
    }
    _addWeightEvent(node) {
        node.nodeDiv.addEventListener('change', this.weightSelected, false);
    }
    // Drag and drop private methods
    _addDropEventsToConclusion(node){
        this._addGeneralDropEvents(node);
        node.nodeDiv.addEventListener('drop', this.dropOnConclusion, false);
        //node.nodeDiv.addEventListener('drop', ()=>{ this.dropOnConclusion(event); }, false );
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
        let row = this.rowMgr.createNewTopRow(node)
        node.setRow(row);
        row.addNode(node);
        // Center node on diagram if necessary.
        if (node.centerOnChildWhenAdded) node.offsetCenterX = 0;
        // Now the claim is the drop area. Really any conclusion is a drop area. 
        this.diagram.removeEventListener('dragover', this.dragoverEvent, false);
        this.diagram.removeEventListener('drop', this.dropOnEmptyDiagram, false);
        this._addDropEventsToConclusion(node);
        this.argMap.selectJustOneNode(node);
        node.calcCL();
        this.rowMgr.renumberAllNodes();
    }
    _addNodeToConclusion(node, nodeConclusion) {
        // Create the new row if necessary. 
        let recenterNeeded = false;
        let row;
        let conclusionRowNumber = nodeConclusion.row.number; 
        // If rows have nodes, could search rows to determine a node's row number.
        let newNodeRowNumber = conclusionRowNumber + 1; // For a rule
        if (! node.isRule) { newNodeRowNumber = conclusionRowNumber + 2; } // Not a rule 
        if (newNodeRowNumber > this.rowMgr.numberOfRows) { 
            row = this.rowMgr.createNewTopRow(node)
            recenterNeeded = true;
        } else {
            row = this.rowMgr.getRow(newNodeRowNumber);
        }
        node.setRow(row); 
        row.addNode(node);
        // Center node. 
        if (node.centerOnChildWhenAdded) { 
            if ( node.isRule ) {
                node.offsetCenterX = nodeConclusion.offsetCenterX; 
            } else {
                node.offsetCenterX = nodeConclusion.rule.offsetCenterX;
            }
        }
        if (recenterNeeded) this.rowMgr.verticallyRecenterAllRows(); 
        this.argMap.claim.calcCL();
        this.rowMgr.renumberAllNodes();
    }
    _checkDiagramOverflow() {
        // Check for vertical and horizontal overflow.
        let minTop = 9999, maxBottom = -9999, minLeft = 9999, maxRight = -9999;
        for (let i = 0; i < argMap.nodes.length; i++){
            let node = argMap.nodes[i];
            if ( node.top < minTop ) minTop = node.top;
            if ( node.bottom > maxBottom ) maxBottom = node.bottom;
            if ( node.left < minLeft ) minLeft = node.left;
            if ( node.right > maxRight ) maxRight = node.right;
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
    zoomSmaller(){ this.argMap.zoomLevel -= .1; this._setZoomLevel(); }    
    zoomLarger() { this.argMap.zoomLevel += .1; this._setZoomLevel(); }
    zoomNormal() { this.argMap.zoomLevel  =  1; this._setZoomLevel(); }
    _setZoomLevel() {
        if (this.argMap.zoomLevel > 1) this.argMap.zoomLevel = 1;
        this.diagram.style.transform = 'scale(' + this.argMap.zoomLevel + ', ' + this.argMap.zoomLevel + ')';
    }
} // End class LayoutMgr
function createArrow (upperNode, lowerNode){
    let id = 'arrow' + argMapsMgr.getNextArrowIDNumber();
    let arrow = new Arrow(upperNode, lowerNode, id, upperNode.argMap.layoutMgr.svg);
    lowerNode.upperArrows.push(arrow);
    upperNode.lowerArrow = arrow;           
    upperNode.refreshArrows();
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
function makeNodeDraggable(node) {
    node.nodeDiv.addEventListener('pointerdown',  layoutPointerDown, false);
    node.nodeDiv.addEventListener('pointerup',    layoutPointerUp,   false);
    // To fix browser bug. Pointerup is never called if drag release is not over the node.
    node.nodeDiv.addEventListener('pointerleave', layoutPointerUp,   false);
}
function layoutPointerDown(event) {
    let node = argMapsMgr.getNodeForEvent(event);
//let node = argMap.getNodeForNodeDiv(this);
    node.nodeDiv.addEventListener('pointermove', layoutPointerMove, false);
    this.pointerDownX = event.clientX; // Sets this property on div.node, not class LayoutMgr !!!
    this.pointerDownY = event.clientY; // Not yet used. For move a factual to another rule.
    this.pointerDownOffsetCenterX = node.offsetCenterX;
}
function layoutPointerUp(event) {
//let node = argMap.getNodeForNodeDiv(this);
    let node = argMapsMgr.getNodeForEvent(event);
    node.nodeDiv.removeEventListener('pointermove', layoutPointerMove, false);
}
function layoutPointerMove(event) {
    let node = argMapsMgr.getNodeForEvent(event);
//let node = argMap.getNodeForNodeDiv(this);
    let totalMoveX = event.clientX - this.pointerDownX; // Positive to move right, negative to move left.
    totalMoveX = totalMoveX * (1 / node.argMap.zoomLevel); // A crucial adjustment.
    let newOffsetCenterX = this.pointerDownOffsetCenterX + totalMoveX;
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
    // Zoom may be in effect. If so, diagram is smaller than diagramWrapper. 
    // This kludge causes node.left to go negative, since left is relative to the diagram. 
    // Use getBoundingClientRect() to calc the extra margin available on left and right.
    // Some complexity due to left being scaled and the different scales in diagram and diagramWrapper.
    let trueDiagramWidth = node.argMap.diagram.getBoundingClientRect().width;
    let horizontalScale = trueDiagramWidth / node.argMap.diagram.clientWidth;
    let extraMargin = (node.argMap.diagramWrapper.clientWidth - trueDiagramWidth) / 2;
    extraMargin = extraMargin * ( 1 / horizontalScale ); // Scale it.
    // Keep the left edge of the node inside the padded container.
    if (newLeft + extraMargin < ArgMap.DIAGRAM_PADDING) return;
    // Keep the right edge of the node inside the padded container.
    let maxAllowableRight = node.argMap.diagram.clientWidth - ArgMap.DIAGRAM_PADDING + extraMargin;
    if (newLeft + node.width > maxAllowableRight) return;
    // Done. Update the node offset and refresh the arrows. 
    node.offsetCenterX = newOffsetCenterX;
    node.refreshArrows(); 
    node.argMap.layoutMgr.rowMgr.renumberAllNodes();
}
class RowMgr {
    constructor(layoutMgr) {
        this.layoutMgr = layoutMgr;
        this.rows = [];
    }
    get numberOfRows() { return this.rows.length; }

    createNewTopRow(node) { // For all but claim, done by above, refactor.
        let rowHeight = node.height;
        let rowTop, rowNumber;
        if (this.numberOfRows === 0) { // A claim is being added to an empty diagram.
            rowTop   = (this.layoutMgr.diagram.clientHeight / 2) - (rowHeight / 2);
            rowNumber = 1;
        } else {
            let lastRow = this.rows.last();
            rowTop = lastRow.top - LayoutMgr.ROW_GAP - rowHeight; 
            rowNumber = this.numberOfRows + 1;
        }
        let row = new Row(rowTop, rowHeight, rowNumber);
        this.rows.push(row);
        return row;
    }
    getRow(rowNumber) { // One based
        return this.rows[rowNumber - 1];
    }
    verticallyRecenterAllRows() { // Used when row added or node deleted to keep map centered vertically on diagram.
        // Automatic housecleaning. If top row is empty, delete it.
        let lastRow = this.rows.last();
        if (lastRow.numberOfNodes() === 0) this.rows.pop();
        // NOTE - Delete this old code once fully tested. It was replaced by the above 2 lines.
        // let hightestRowNumber = 0;
        // for (let i = 0; i < this.layoutMgr.argMap.nodes.length; i++){
        //     let node = this.layoutMgr.argMap.nodes[i];
        //     if ( node.row.number > hightestRowNumber ) hightestRowNumber = node.row.number;
        // }
        // if ( hightestRowNumber < this.rows.length ) this.rows.pop();

        // More automatic housecleaning. The diagram may need shrinking or expanding.
        // Prepare to shift
        let rowsTop = this.rows.last().top;
        let rowsBottom = this.rows[0].top + this.rows[0].height;
        let rowsHeight = rowsBottom - rowsTop;
        let diagramHeight = this.layoutMgr.diagram.clientHeight;
        let desiredRowsTop = (diagramHeight - rowsHeight) / 2;
        let rowShift = desiredRowsTop - rowsTop;
        // Shift rows. Must do this before shift nodes.
        for (let i = 0; i < this.rows.length; i++){
            let row = this.rows[i];
            row.top += rowShift;
        }
        // Shift nodes
        for (let i = 0; i < this.layoutMgr.argMap.nodes.length; i++){
            let node = this.layoutMgr.argMap.nodes[i];
            node.top = node.row.top;
            node.refreshArrows();
        }
    }
    renumberAllNodes() { // Sets node.number for all nodes.
        // Start at one, left to right, top to bottom, like reading order.
        let startingNumber = 1;     
        for (let i = this.rows.length - 1; i > -1; i--) {
            let row = this.rows[i];
            row.arrangeNodesOnRowFromLeftToRight();
            startingNumber = row.setNodeNumbersForNodesOnMyRow(startingNumber);
        }
    }
}
class Row { 
    constructor(top, height, number) {
        this.GAP = 30;
        this.top = top;
        this.height = height;
        this.number = number;
        this.nodes = [];
    }
    addNode(node)    { this.nodes.push(node); }
    removeNode(node) { this.nodes.removeFirstOccurrance(node); }
    numberOfNodes()  { return this.nodes.length; }

    arrangeNodesOnRowFromLeftToRight() { // For use in automatic node numbering.
        this.nodes.sort(function (node1, node2) {
            return node1.left - node2.left;
        });
    }
    setNodeNumbersForNodesOnMyRow(startingNumber) { // Does it and returns starting number for next row.
        for (let i = 0; i < this.nodes.length; i++) {
            let node = this.nodes[i];
            node.number = startingNumber++;
        }
        return startingNumber;
    }
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
