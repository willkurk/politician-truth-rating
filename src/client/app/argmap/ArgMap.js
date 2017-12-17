/* Contents: 
- Global variables
- initArgMap(diagramID) - Mandatory, initializes the argument map. 
- class ArgMap - Manages one argument map.
- class Node - The all-important nodes/boxes that appear on the argument map.
    - class NodeConclusion extends Node - An intermedidate conclusion or a claim (final conclusion).
        This class contains zero to one NodeRules and zero to many NodeConclusions and NodeLeafs.
        This mechanism allows the claim node to hold the entire well structured node tree. 
        - class NodeClaim extends NodeConclusion
        - class NodeIntConclusion extends NodeConclusion
    - class NodeRule extends Node - A rule.
    - class NodeLeaf extends Node - A fact or RClaim node. These are tree leafs.
        - class NodeFact extends NodeLeaf
        - class NodeRClaim extends NodeLeaf
- Misc functions
- Various test functions
*/
class ArgMap { // Manages one argument map. One instance per map.
    // Constants
    static get GRID()           { return 10; }
    static get DIAGRAM_PADDING(){ return 10; }
    // The five types of nodes:
    static get CLAIM()          { return 'Claim'; } // Used as node name shown.
    static get RULE()           { return 'Rule'; }  // Used as node name shown.
    static get FACT()           { return 'Fact'; }  // Used as node name shown.
    static get INTCONCLUSION()  { return 'IntConclusion'; } // Not used as node name shown.
    static get RCLAIM()         { return 'RClaim'; }        // Not used as node name shown.

    constructor(instanceID) { // 'diagram' is from early work. A better word is 'map' but that's an ES6 method.
        this.instanceID = instanceID;
        this.interface = new ArgMapInterface(instanceID, this);
        this.diagramWrapper = document.getElementById('diagram-wrapper');
        this.diagramWrapper.setAttribute(ArgMapsMgr.ARG_MAP_KEY, this.instanceID);
        this.diagram = document.createElement('div');
        this.diagram.id = 'diagram-sheet';
        this.diagram.setAttribute(ArgMapsMgr.ARG_MAP_KEY, this.instanceID);
        this.diagramWrapper.appendChild(this.diagram);
        this.diagramWrapper.setAttribute('tabindex', 0); // So can receive focus, so can receive key down events.
        this.nodes = [];
        this.claim = null;
        this.layoutMgr = new LayoutMgr(this.diagram, this);
        this.zoomLevel = 1;

        // Use arrow functions for event registration to get a clean 'this' in the event handler.
        // These listeners cannot be removed. That's okay because they are permanent.
        this.diagramWrapper.addEventListener('mousedown', ()=>{ this.diagramMousedownEvent(); }, false );
        //this.diagramWrapper.addEventListener('keydown',   ()=>{ this.diagramKeydownEvent(event); }, false );
        this.diagramWrapper.addEventListener('keydown', this.diagramKeydownEvent, false );
    }
    // Factory methods. Later delete methods will be added.
    addNodeClaim() {
        if (this.claim) {
            alert("Cannot add a second claim. A diagram can have only one claim.");
            return null;
        }
        this.claim = this._prepareNewNode( new NodeClaim(this) );
        return this.claim;
    }
    addNodeIntConclusion(conclusion) {
        return this._prepareNewNode( new NodeIntConclusion(this, conclusion) );
    }
    addNodeRule(conclusion) {
        return this._prepareNewNode( new NodeRule(this, conclusion) );
    }
    addNodeFact(conclusion) {
        return this._prepareNewNode( new NodeFact(this, conclusion) );
    }
    addNodeRClaim(conclusion) {
        return this._prepareNewNode( new NodeRClaim(this, conclusion) );
    }
    // Other methods
    deselectAllNodes() {
        for (let i = 0; i < this.nodes.length; i++){
            this.nodes[i].deselectNode();
        }
    }
    selectJustOneNode(node) {
        this.deselectAllNodes();
        node.selectNode();
    }
    diagramMousedownEvent(){
        this.deselectAllNodes(); // Relies on event.stopPropagation() in Node.mousedownEvent().
    }
    diagramKeydownEvent(event){
        let myArgMap = argMapsMgr.getArgMapForEvent(event);
        let node;
		if (event.key) {
            //console.log('event.key = ' + event.key);
			switch (event.key) { 
				case 'Delete': case 'Del': // Del is for Edge. 
                    node = myArgMap.getFirstSelectedNode();
                    myArgMap.deleteNode(node);
                    break;
                case '-': // - key to zoom smaller. Can't use control since that affects page.
                    if (! event.ctrlKey) myArgMap.layoutMgr.zoomSmaller();
                    break;
                case '=': // + key to zoom larger
                    if (! event.ctrlKey) myArgMap.layoutMgr.zoomLarger();
                    break;
                case '0': // 0 key to zoom normal
                    if (! event.ctrlKey) myArgMap.layoutMgr.zoomNormal();
                    break; 
                case 'ArrowUp': case 'ArrowDown': case 'Up': case 'Down': // Up and Down are for Edge.
                    node = myArgMap.getFirstSelectedNode();
                    if (node) {
                        let newIndex;
                        if (event.key === 'ArrowUp' || event.key === 'Up') {
                            newIndex = argMapsMgr.getIncrementWeightIndex(node.weightIndex);
                        } else {
                            newIndex = argMapsMgr.getDecrementWeightIndex(node.weightIndex);
                        }
                        node.weightIndex = newIndex;
                        myArgMap.claim.calcCL();
                    }
                    break;                 
			}
		}
    }
    deleteNode(node) { // Deletes the node, returning true for success or false for failure.
        if (node) {
            // Can only delete a leaf on the tree, to make things much simpler.
            if (! node.isTreeLeaf() ) {
                // If not the claim, remove this node's arrow from lower node.
                if (! node.isClaim){
                    let lowerNode = node.lowerArrow.lowerNode;
                    lowerNode.upperArrows.removeFirstOccurrance( node.lowerArrow );
                    node.lowerArrow.removeHTML();
                    // Remove node from its conclusion
                    if (node.isRule){
                        lowerNode.rule = null;
                    } else {
                        lowerNode.lowerArrow.lowerNode.removeFactual(node); 
                    }
                }
                // If a rule is deleted, shift drag events to its conclusion.
                if (node.isRule){
                    this.layoutMgr._addDropEventsToConclusion(node.conclusion);
                    this.layoutMgr._removeDropEventsFromRule(node);
                }
                // Remove node from argMap's collection
                this.nodes.removeFirstOccurrance(node);
                // Remove node from the html
                this.diagram.removeChild( node.nodeDiv );
                // Remove events
                node.nodeDiv.removeEventListener('mousedown', node.nodeMousedownEvent);
                // And finally
                if (node.isClaim) { 
                    this.clearDiagram(); 
                } else {
                    node.row.removeNode(node);
                    this.layoutMgr.rowMgr.verticallyRecenterAllRows(); // For automatic delete of top row if empty.
                    this.claim.calcCL();
                    this.layoutMgr.rowMgr.renumberAllNodes();
                }
                return true;
            } else {
                alert('Sorry, you can only delete leafs on the diagram tree.');
                return false;
            }
        } else {
            return false; 
        }
    }
    clearDiagram() {
        this.diagram.innerHTML = '';
        this.claim = null;
        this.nodes = [];
        this.layoutMgr = new LayoutMgr(this.diagram, this); // Resets it
    }
    getFirstSelectedNode() { // Returns the first selected node or false if none are selected.
        for (let i = 0; i < this.nodes.length; i++){
            let node = this.nodes[i];
            let classNames = node.nodeDiv.className; // For readability.
            if ( classNames.includes('selected') ) { return node; }
        }
        return false;
    }
    getNodeForNodeDiv(nodeTarget) { // Could be done with a map, but this is fine.
        for (let i = 0; i < this.nodes.length; i++){
            let node = this.nodes[i];
            if ( nodeTarget === node.nodeDiv ) { return node; }
        }
        alert('Error - Cannot find nodeDiv for nodeTarget: ' + nodeTarget.nodeBodyText );
        return null;
    }
    // Private methods
    _prepareNewNode(node){
        this.diagram.appendChild(node.nodeDiv);
        this.nodes.push(node);
        makeNodeDraggable(node); // In LayoutMgr.
        return node;
    }
} // End class ArgMap
class Node { 
    static get SELECTED_CLASS()  { return 'node-selected'; }

    constructor(nodeArgMap) {
        this.argMap = nodeArgMap;
        this.isConclusion, this.isTypeLeaf; // Type leafs are Fact and RClaim.
        this.isClaim, this.isIntConclusion, this.isRule, this.isFact, this.isRClaim;
        this.nodeDiv            = document.createElement('div');
        this.nodeHeader         = document.createElement('div');
        this.nodeWeightDiv      = document.createElement('div');
        this.nodeNameDiv        = document.createElement('div');
        this.nodeCL             = document.createElement('div');
        this.nodeBodyText       = document.createElement('div');
        this.nodeBodyDatabase   = document.createElement('div');
        this.nodeType_; // One of the constants in ArgMap. Currently this is not changeable. Not yet used.
        this.row;
        this.upperArrows = [];
        this.lowerArrow; // A Claim has no lower arrow.
        this.confidenceLevel_ = undefined; // Undefined if none.
        this.centerOnChildWhenAdded = true; // Default
        this.offsetCenterX_ = 0; // Default
        this.weightIndex_   = -1;  // Required for Fact, RClaim, IntConclusion. -1 for no weight.
        this.name_;
        this.number_ = 22;
    }
    init() {
        // Setup HTML structure beginning with node class
        this.nodeDiv.className = 'node';
        this.width = 300; // The default. Later the user can resize nodes with the mouse.
        this.top   = 10;  // Default
        this.nodeDiv.style.left  = '10px'; // Default
        this.nodeDiv.setAttribute(ArgMapsMgr.ARG_MAP_KEY, this.argMap.instanceID);
            // node-header
            if (this.isRule) { 
                this.nodeHeader.className = 'node-header node-is-rule';
            } else {
                this.nodeHeader.className = 'node-header node-is-factual'; 
            }
            this.nodeDiv.appendChild(this.nodeHeader);
                // Node weight. Rules have no weight since only one rule. Claims have no weight.
                if (this.isIntConclusion || this.isTypeLeaf) {
                    this.nodeWeightDiv.className = 'node-weight';
                    this.nodeHeader.appendChild(this.nodeWeightDiv);
                }
                // node-name
                this.nodeNameDiv.className = 'node-name';
                if (this.isClaim) this.nodeNameDiv.classList.add("node-name-claim");
                this.nodeHeader.appendChild(this.nodeNameDiv);
                // node-cl
                this.nodeCL.className = 'node-cl';
                if (this.isClaim) this.nodeCL.classList.add("node-cl-claim"); 
                this.nodeHeader.appendChild(this.nodeCL);
            // node-body-text
            this.nodeBodyText.className = 'node-body-text';
            this.nodeDiv.appendChild(this.nodeBodyText);
            // node-body-database
            this.nodeBodyDatabase.className = 'node-body-database';
            this.nodeBodyDatabase.style.display = 'none'; // Show only if contains text.
            this.nodeDiv.appendChild(this.nodeBodyDatabase);
        // Events. Arrow function used since this is a permanent event.
        this.nodeDiv.addEventListener('mousedown', this.nodeMousedownEvent, false );
    } // End init

    nodeMousedownEvent(event) { 
        let node = argMapsMgr.getNodeForEvent(event);
        node.argMap.deselectAllNodes();
        node.nodeDiv.classList.add(Node.SELECTED_CLASS);
        event.stopPropagation();
        node.argMap.diagramWrapper.focus(); // Set focus to the diagram so it can receive key events, like delete.
    }
    selectNode() {
        this.nodeDiv.classList.add(Node.SELECTED_CLASS);
    }
    deselectNode() {
        this.nodeDiv.classList.remove(Node.SELECTED_CLASS);
    }
    refreshArrows() { 
        for (let i = 0; i < this.upperArrows.length; i++){
            this.upperArrows[i].refresh();
        }
        if (this.lowerArrow) { this.lowerArrow.refresh(); }
    }
    isTreeLeaf() {
        return this.upperArrows.length > 0;
    }
    // Private methods
    _addOption(selector, description){
        let option = document.createElement('option');
        option.text = description;
        selector.add(option);
    }
    _updateNumberAndName() {
        let prefix = ''; // So weight doesn't run into the number/name.
        if (this.isIntConclusion || this.isRClaim) prefix = '&nbsp;';
        this.nodeNameDiv.innerHTML = prefix + this.number_ + ' ' + this.name_;
    }
    // General getters and setters
    get NodeType() { return this.nodeType_; } // No setter so can't be changed.

    get name(){ return this.name_; }
    set name(text) { 
        this.name_ = text;
        this._updateNumberAndName();
    }
    get number() { return this.number_; }
    set number(newNumber) {
        this.number_ = newNumber;
        this._updateNumberAndName();
    }
    get bodyText(){ return this.nodeBodyText.innerHTML; }
    set bodyText(text){ this.nodeBodyText.innerHTML = text; }

    get bodyDatabase(){ return this.nodeBodyDatabase.innerHTML; }
    set bodyDatabase(text){ 
        this.nodeBodyDatabase.innerHTML = text; 
        if ( text.length > 0 ) {
            this.nodeBodyDatabase.style.display = 'block';
            this.nodeBodyText.style.borderRadius = '0 0 0 0'; // 'none' will not work.
        } else {
            this.nodeBodyDatabase.style.display = 'none';
            this.nodeBodyText.style.borderRadius = '0 0 5px 5px'; // Synch with style.
        }
    }
    get confidenceLevel(){ return this.confidenceLevel_; }
    set confidenceLevel(cl){ 
        if (cl === undefined) {
            this.nodeCL.innerHTML = '?';
        } else {
            this.nodeCL.innerHTML = 'CL ' + Math.round(cl * 100) + '%';   
        }
        this.confidenceLevel_ = cl;
    }
    setRow(row) { 
        this.row = row;
        this.top = this.row.top;
     }
    get top() { return removePX(this.nodeDiv.style.top); }
    set top(top) { this.nodeDiv.style.top = top + 'px'; }

    get left() { return removePX(this.nodeDiv.style.left); } 
    // Set left should never be used except for development. Use set offsetCenterX instead.
    //set left(left) { this.nodeDiv.style.left = left + 'px'; }

    get right() { return this.left + this.nodeDiv.clientWidth; }
    get bottom() { return this.top + this.height; }

    get centerX() { return this.left + (this.width / 2);  }

    // offsetCenterX is how far a node's center is offset from the left or right of center of the diagram. 
    // Zero is perfectly centered. If offset < 0 then it's to the left of the center of the diagram. 
    // offsetCenterX allows a map to be easily horizontally centered in a diagram of any width
    // and described how the nodes are arranged with respect to each other.
    get offsetCenterX() { return this.offsetCenterX_; }
    set offsetCenterX(x) { 
        this.offsetCenterX_ = x;
        this.nodeDiv.style.left = this.calculateNewLeftForNewOffsetCenterX(x) + 'px';
    }
    calculateNewLeftForNewOffsetCenterX(x) {
        // Calculate left for a centered node
        let diagramCenter = this.argMap.diagram.clientWidth / 2;
        let centeredLeft = diagramCenter - (this.nodeDiv.clientWidth / 2);
        // Now calculate the offset left
        return roundToDiagramGrid(centeredLeft + x);
    }
    get height() { return this.nodeDiv.clientHeight; }; // May need to consider padding and border
    get width()  { return this.nodeDiv.clientWidth; };
    set width(width) { this.nodeDiv.style.width = width + 'px'; }

    get weightIndex() { return this.weightIndex_; }
    set weightIndex(index) { 
        this.weightIndex_ = index;
        this.nodeWeightDiv.innerHTML = argMapsMgr.getNodeWeightDescriptionForIndex(index);
    }
} // End class Node

// The node classes
class NodeConclusion extends Node {
    constructor(nodeArgMap) {
        super(nodeArgMap); 
        this.rule = null;
        this.factuals = [];
        this.isConclusion = true;
        this.init();
    }
    addFactual(factual) { this.factuals.push(factual); }
    removeFactual(factual) { 
        this.factuals.removeFirstOccurrance(factual);
    }
    hasRule() {
        return ! (this.rule === undefined || this.rule === null);
    }
    calcCL() { // Calculate and set CL for this node. Return the Cl or undefined if unable to calculate.
        if (! this.rule || this.factuals.length === 0) return this._setCLToUndefined();
        // First get all my factuals to set their CL if a conclusion.
        let numberOfFactuals = this.factuals.length;
        for (let i = 0; i < numberOfFactuals; i++){
            let factual = this.factuals[i];
            if (factual.isConclusion) factual.calcCL(); // Facts and RClaims already have a CL.
        }
        // Determine weight adjustment, so that the sum of the weights = 1. Also check non zero count.
        let totalWeights = 0;
        let nonZeroWeightsCount = 0; // Number of factuals with non-zero weights.
        for (let i = 0; i < numberOfFactuals; i++){
            let factual = this.factuals[i];
            let weight = argMapsMgr.getNodeWeightValueForIndex(factual.weightIndex);
            totalWeights += weight;
            if (weight > 0) nonZeroWeightsCount++;
        }
        if (totalWeights === 0) return this._setCLToUndefined(); // All weights are zero which makes no sense.
        if (nonZeroWeightsCount < 2) return this._setCLToUndefined(); // Min of 2 non-zero weights required.
        let weightAdjustment = 1 / totalWeights; // We have avoided dividing by zero.
        // Now calc the CL. This is the weighted average of my factuals' CL times my rule CL.
        let cl = 0;
        for (let i = 0; i < numberOfFactuals; i++){
            let factual = this.factuals[i];
            let weight = argMapsMgr.getNodeWeightValueForIndex(factual.weightIndex);
            if (weight === 0) continue; // We know that at least one weight > 0.
            if (factual.confidenceLevel === undefined) return this._setCLToUndefined();
            cl += ( factual.confidenceLevel * weight * weightAdjustment );
        }
        this.confidenceLevel = cl * this.rule.confidenceLevel;
        return this.confidenceLevel;
    }
    _setCLToUndefined() {
        this.confidenceLevel = undefined;
        return this.confidenceLevel;
    }
}
class NodeClaim extends NodeConclusion {
    constructor(nodeArgMap) {
        super(nodeArgMap); 
        this.nodeType = ArgMap.CLAIM;
        this.isClaim = true;
        this.init();
    }
}
class NodeIntConclusion extends NodeConclusion {
    constructor(nodeArgMap, conclusion) {
        super(nodeArgMap); 
        this.nodeType = ArgMap.INTCONCLUSION;
        this.isIntConclusion = true;
        conclusion.addFactual(this);
        this.init();
    }
}
class NodeRule extends Node {
    constructor(nodeArgMap, conclusion) {
        super(nodeArgMap); 
        this.nodeType = ArgMap.RULE;
        this.isRule = true;
        this.arrowsvg;
        this.conclusion = conclusion;
        conclusion.rule = this;
        this.init();
        this.ARROWHEAD_WIDTH = 14;
        this.EXTRA_LENGTH = 30; // to handle variations in node heights.
    }
}
class NodeLeaf extends Node {
    constructor(nodeArgMap) {
        super(nodeArgMap); 
        this.isTypeLeaf = true;
    }
}
class NodeFact extends NodeLeaf {
    constructor(nodeArgMap, conclusion) {
        super(nodeArgMap); 
        this.nodeType = ArgMap.FACT;
        this.isFact = true;
        conclusion.addFactual(this);
        this.init();
    }
}
class NodeRClaim extends NodeLeaf {
    constructor(nodeArgMap, conclusion) {
        super(nodeArgMap); 
        this.nodeType = ArgMap.RCLAIM;
        this.isRClaim = true;
        conclusion.addFactual(this);
        this.init();
    }
}
// Other classes

// Misc functions
function calcArrowLeft(node){
    let arrowLeft = node.left;
    let width = node.nodeDiv.clientWidth;
    arrowLeft = parseInt(arrowLeft) + (width / 2) - (node.ARROWHEAD_WIDTH / 2); 
    return arrowLeft;
}
function removePX(item){ // Removes 'px' from end of top, left, etc.
    return parseInt(item.substring( 0, item.length - 2 ));
}
// function roundToIncrement(number, increment) {
//     return -Math.round(-number / increment) * increment;
// }
function roundToDiagramGrid(number) {
    return -Math.round(-number / ArgMap.GRID) * ArgMap.GRID;
}
