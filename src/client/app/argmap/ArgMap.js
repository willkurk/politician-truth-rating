/* Contents: 
- Global variables
- initArgMap(diagramID) - Mandatory, initializes the argument map. 
- class ArgMap - Container for the entire argument map system.
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

Various to dos:
Bug - If drag starts on the weight, the dropdown stays and the node moves. Looks terrible!
Need to check to see if the weight is selected when starting the drag. 
Bug - In Edge, can't change weight.
Bug - In Firefox, select a weight starts a drag. 
The above bugs point to the need to use our own select element. There are probably plenty to choose from.


Bug - If diagram resized, the first drag causes a node to jump to a new position. The offsetCenterX
needs to be adjusted when diagram width changes. Do with horizontalRecenter.

Zoom bug - When dragging, the mouse point relative to the node moves. This cause user to fall off the node.
Solve by translating the event point to the zoomed size. 

Setup a single global object that contains 
all globals, like constants and one or more argMgr instances to support multiple maps.
    - Need a way, given an event, to get the argMap for that event. Go up event.path to div#diagram.
    Then use that to lookup the associated argMap, using a mapOfDiagrams. Awkward but works. 
    - Thus the global should not be argMap but argAnalysisApp with these methods:
        .addArgMap(argMap)
        .removeArgMap(argMap)
        .argMapForEvent(event)
        .argMapInterface()
        .CLAIM, .RULE, etc and name the global variable PPKB to avoid conflicts and be readable.
    - Within classes like LayoutMgr, pass its argMap in the constructor. Then save, possibly with
    var to avoid use of all those "this" uses, which clutter up a program. 
    - This refactoring would be a great task to discuss with William first.
    - But we need a way for the ArgMap component to hide itself from external use, except through
    ArgMapInterface. The above approach exposes all of argMap. Could solve this with
    PPKB.argMapRegistry, PPKB.argMapInterface, and the constants as the ONLY properties or methods of PPKB
    until futher components are added, like PPKB.textEditor. Confusing....

Automatic row height resizing, depending on a row's nodes. Currently the first node on a new row defines
the row's height. 

Consider using Array.atOneBased() in certain situations to reduce bugs, improve readability.

Better looking error dialog. There should be some great reusable ones or good examples.

Node numbers are automatically assigned as nodes are added. However, we may discover we don't need node numbers.
When the diagram grows too big to fit on the page, it automatically shrinks using transform. Implement zoom at the same time. Create a unit test that causes auto shrink.

Eventually we'll need a right click menu, but that may not be an ArgMap responsiblity.
What gesture is best for selecting facts, RClaims, and rules from the database? Double click?

Solve the "how big should a node be on the screen" problem by going with a default and letting
the user adjust the size of a node with the mouse by dragging on node edges.

BROWSER TESTING - Fine on Chrome (59% market share), Firefox (13% market share), Edge (4% market share). 
IE (13% market share, discontinued in 2015) doesn't support Javascript classes. 
Not tested on Safari (3% market share).
*/

import {LayoutMgr} from "./LayoutMgr.js"
import {createSampleArgumentMap} from "./ArgMapUnitTest.js"
import {makeNodeDraggable} from "./LayoutMgr.js"

let argMap; // A single global variable
export function initArgMap(diagram){
    argMap = new ArgMap(diagram);
    createSampleArgumentMap(argMap);
    console.log('init');
}
export class ArgMap { // Manages the entire argument diagram. The entry point class.
    // Constants
    static get GRID()           { return 10; }
    static get DIAGRAM_PADDING(){ return 10; }
    static get CLAIM()          { return 'Claim'; } // These values could be anything, like 1, 2, 3, 4, 5.
    static get RULE()           { return 'Rule'; }
    static get INTCONCLUSION()  { return 'IntConclusion'; }
    static get FACT()           { return 'Fact'; }
    static get RCLAIM()         { return 'RClaim'; }

    constructor(diagram) {
        this.diagram = diagram; // document.getElementById(diagramID);
        this.diagram.setAttribute("tabindex", 0); // So can receive focus, so can receive key down events.
        this.diagram.addEventListener('mousedown', this.mapMousedownEvent, false);
        this.diagram.addEventListener('keydown',   this.mapKeydownEvent,   false);
        this.nodes = [];
        this.claim = null;
        this.layoutMgr = new LayoutMgr(this.diagram,this);
    }
    // Factory methods. Later delete methods will be added.
    addNodeClaim() {
        if (this.claim) {
            alert("Cannot add a second claim. A diagram can have only one claim.");
            return null;
        }
        this.claim = this._prepareNewNode( new NodeClaim() );
        return this.claim;
    }
    addNodeIntConclusion(conclusion) {
        return this._prepareNewNode( new NodeIntConclusion(conclusion) );
    }
    addNodeRule(conclusion) {
        return this._prepareNewNode( new NodeRule(conclusion) );
    }
    addNodeFact(conclusion) {
        return this._prepareNewNode( new NodeFact(conclusion) );
    }
    addNodeRClaim(conclusion) {
        return this._prepareNewNode( new NodeRClaim(conclusion) );
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
    mapMousedownEvent(){
        argMap.deselectAllNodes(); // Relies on event.stopPropagation() in Node.mousedownEvent().
    }
    mapKeydownEvent(event){
		if (event.keyCode) {
			switch (event.keyCode) { // See http://keycode.info/ but has errors.
				case 46: // Delete key 
                    let node = argMap.getFirstSelectedNode();
                    argMap.deleteNode(node);
                    break;
                case 189: // - key to zoom smaller. Can't use control since that affects page.
                    if (! event.ctrlKey) argMap.layoutMgr.zoomIn();
                    break;
                case 187: // + key to zoom larger
                    if (! event.ctrlKey) argMap.layoutMgr.zoomOut();
                    break;
                case 48: // 0 key to zoom normal
                    if (! event.ctrlKey) argMap.layoutMgr.zoomNormal();
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
                    this.layoutMgr.verticallyRecenterAllRows(); // For automatic delete of top row if empty.
                    argMap.claim.calcCL();
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
        makeNodeDraggable(node, this); // In LayoutMgr.
        return node;
    }
} // End class ArgMap
class Node { 
    constructor() {
        this.isConclusion, this.isTypeLeaf; // Type leafs are Fact and RClaim.
        this.isClaim, this.isIntConclusion, this.isRule, this.isFact, this.isRClaim;
        this.nodeDiv            = document.createElement('div');
        this.nodeHeader         = document.createElement('div');
        this.nodeWeightDiv      = document.createElement('select');
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
    }
    init() {
        // Setup HTML structure beginning with node class
        this.nodeDiv.className = 'node';
        this.width = 300; // The default. Later the user can resize nodes with the mouse.
        this.top   = 10;  // Default
        this.nodeDiv.style.left  = '10px'; // Default
            // node-header
            if (this.isRule) { 
                this.nodeHeader.className = 'node-header node-is-rule';
            } else {
                this.nodeHeader.className = 'node-header node-is-factual'; 
            }
            this.nodeDiv.appendChild(this.nodeHeader);
                // Node weight with options. Rules have no weight since only one rule.
                if (this.isIntConclusion || this.isTypeLeaf) {
                    this.nodeWeightDiv.className = 'node-weight';
                        this._addOption(this.nodeWeightDiv, 'Zero');
                        this._addOption(this.nodeWeightDiv, 'Low');
                        this._addOption(this.nodeWeightDiv, 'Medium');
                        this._addOption(this.nodeWeightDiv, 'High');
                        this._addOption(this.nodeWeightDiv, 'Central');
                    this.nodeWeightDiv.selectedIndex = 2; // Default
                    this.nodeHeader.appendChild(this.nodeWeightDiv);
                }
                // node-name
                this.nodeNameDiv.className = 'node-name';
                this.nodeHeader.appendChild(this.nodeNameDiv);
                // node-cl
                this.nodeCL.className = 'node-cl';
                this.nodeHeader.appendChild(this.nodeCL);
            // node-body-text
            this.nodeBodyText.className = 'node-body-text';
            this.nodeDiv.appendChild(this.nodeBodyText);
            // node-body-database
            this.nodeBodyDatabase.className = 'node-body-database';
            this.nodeBodyDatabase.style.display = 'none'; // Show only if contains text.
            this.nodeDiv.appendChild(this.nodeBodyDatabase);
        // Events
        this.nodeDiv.addEventListener('mousedown', this.nodeMousedownEvent, false);
    } // End init

    nodeMousedownEvent(event){ 
        argMap.deselectAllNodes();
        this.className = 'node node-selected'; // Wow, here "this" is the div element, not this instance.
        event.stopPropagation();
        argMap.diagram.focus(); // Set focus to the diagram so it can receive key events, like delete.
    }
    selectNode() {
        this.nodeDiv.className = 'node node-selected';
    }
    deselectNode() {
        this.nodeDiv.className = 'node';
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
    // General getters and setters
    nodeDiv(){ return this.nodeDiv; }
    get NodeType() { return this.nodeType_; }

    get name(){ return this.nodeNameDiv.innerHTML; }
    set name(text){ this.nodeNameDiv.innerHTML = text; }

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
        let diagramCenter = argMap.diagram.clientWidth / 2;
        let centeredLeft = diagramCenter - (this.nodeDiv.clientWidth / 2);
        // Now calculate the offset left
        return roundToDiagramGrid(centeredLeft + x);
    }
    get height() { return this.nodeDiv.clientHeight; }; // May need to consider padding and border
    get width()  { return this.nodeDiv.clientWidth; };
    set width(width) { this.nodeDiv.style.width = width + 'px'; }

    get weightIndex() { return this.nodeWeightDiv.selectedIndex; }
    set weightIndex(index)   { this.nodeWeightDiv.selectedIndex = index; }

} // End class Node

// The node classes
class NodeConclusion extends Node {
    constructor() {
        super(); 
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
        let x = this.rule;
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
        // Determine weight adjustment, so that the sum of the weights = 1. 
        let totalWeights = 0;
        for (let i = 0; i < numberOfFactuals; i++){
            let factual = this.factuals[i];
            totalWeights += this._getWeightForFactual(factual);
        }
        if (totalWeights === 0) return this._setCLToUndefined(); // All weights are zero which makes no sense.
        let weightAdjustment = 1 / totalWeights; // We have avoided dividing by zero.
        // Now calc the CL. This is the weighted average of my factuals' CL times my rule CL.
        let cl = 0;
        for (let i = 0; i < numberOfFactuals; i++){
            let factual = this.factuals[i];
            let weight = this._getWeightForFactual(factual);
            if (weight === 0) continue; // We know that at least one weight > 0.
            if (factual.confidenceLevel === undefined) return this._setCLToUndefined();
            cl += ( factual.confidenceLevel * weight * weightAdjustment );
        }
        this.confidenceLevel = cl * this.rule.confidenceLevel;
        return this.confidenceLevel;
    }
    _getWeightForFactual(factual) { 
        // Weights. Later these will be from the database since configurable.
        const WEIGHTS = [0, .2, .5, .8, 1]; // Zero, low, medium, high, central.
        return WEIGHTS[factual.weightIndex]; 
    }
    _setCLToUndefined() {
        this.confidenceLevel = undefined;
        return this.confidenceLevel;
    }
}
class NodeClaim extends NodeConclusion {
    constructor() {
        super(); 
        this.nodeType = ArgMap.CLAIM;
        this.isClaim = true;
        this.init();
    }
}
class NodeIntConclusion extends NodeConclusion {
    constructor(conclusion) {
        super(); 
        this.nodeType = ArgMap.INTCONCLUSION;
        this.isIntConclusion = true;
        conclusion.addFactual(this);
        this.init();
    }
}
class NodeRule extends Node {
    constructor(conclusion) {
        super(); 
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
    constructor() {
        super(); 
        this.isTypeLeaf = true;
    }
}
class NodeFact extends NodeLeaf {
    constructor(conclusion) {
        super(); 
        this.nodeType = ArgMap.FACT;
        this.isFact = true;
        conclusion.addFactual(this);
        this.init();
    }
}
class NodeRClaim extends NodeLeaf {
    constructor(conclusion) {
        super(); 
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
