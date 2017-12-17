/* Contents:
- class ArgMapInterface
- class InterfaceNode
*/
class ArgMapInterface { 
    // The interface for external use of the argument map system. 
    // Ideally all eternal calls use the interface, except for node methods. This allows updating
    // an existing node, depending on what happens in the text.
    // Problem: Returns a Node, not an InterfaceNode. This breaks encapsulation of the map module. 
    // Solve by returning the InterfaceNode and modifying that class to serve as a full fascade
    // for what the rest of the app needs. Don't yet know if this is overkill or problematic. 
    constructor(argMapKey, argMap) {
        this.argMap = argMap;
    }
    addNode(interfaceNode) { // Returns new node if okay or false if not.
        // Check to see the node has been properly prepared.
        if (! interfaceNode.integrityIsOkay() ) { return false; }

        interfaceNode.diagram = this.argMap.diagram; // CHANGE LATER =====================

        switch (interfaceNode.nodeType) { 
            case ArgMap.CLAIM: 
                this.argMap.layoutMgr.dropOnEmptyDiagram(ArgMap.CLAIM, interfaceNode);
                return this.argMap.getFirstSelectedNode();
            case ArgMap.RULE:
                this.argMap.layoutMgr.dropOnConclusion(ArgMap.RULE, interfaceNode);
                return this.argMap.getFirstSelectedNode();    
            case ArgMap.INTCONCLUSION: case ArgMap.FACT: case ArgMap.RCLAIM:
                this.argMap.layoutMgr.dropOnRule(interfaceNode.nodeType, interfaceNode);
                return this.argMap.getFirstSelectedNode();   
            default:
                return false;         
        }
    }
    deleteNode(node) { // Returns true or false, depending on success of the delete.
        // *********** To do
    }
    getClaimNode() { // The root of the tree. Returns null if none.
        return argMap.claim;
    }
    clearDiagram() {
        argMap.clearDiagram();
    }
} // End ArgMapInterface

class InterfaceNode { // Used to add nodes to the argument map. They are then discarded.
    constructor(nodeType) {
        this.nodeType =  nodeType;  // Claim, Rule, IntConclusion, Fact, or RClaim
        this.confidenceLevel = undefined;  // Reqwuired for Fact, RClaim, Rule.
        this.weightIndex     = -1;  // Required for Fact, RClaim, IntConclusion. -1 for no weight.
        this.bodyText        = '';  // Required for all
        this.bodyDatabase    = '';  // Required for Fact, RClaim
        this.offsetCenterX_  =  0;  // Default
        this.centerOnChildWhenAdded = true; // Default
        this.lowerNode;   // A Conclusion or Rule, required for all types except Claim.
        this.width = 300; // Default
        this.diagram; 
    }
    get offsetCenterX() { return this.offsetCenterX_; }
    set offsetCenterX(x) {
        this.offsetCenterX_ = x;
        this.centerOnChildWhenAdded = false;
    }
    copyBasicPropertiesToNode(node) { // Copies basic properties from itself to the node
        node.nodeType_ = this.nodeType;
        node.name = this.nodeType; // Here we take advantage of what the node type constants are.
        // The non-breaking space allows long weight descriptions to not bump into the node name.
        if (node.nodeType === ArgMap.INTCONCLUSION) { node.name = 'Int Conclusion'; }
        if (node.nodeType === ArgMap.RCLAIM)        { node.name = 'Reusable Claim'; }
        node.confidenceLevel = this.confidenceLevel;
        node.weightIndex = this.weightIndex;
        node.bodyText = this.bodyText;
        node.bodyDatabase = this.bodyDatabase;
        node.offsetCenterX = this.offsetCenterX_;
        node.centerOnChildWhenAdded = this.centerOnChildWhenAdded;
        node.width = this.width;
    }
    integrityIsOkay() { // Returns true if okay, false if not. A valid nodeType is not checked.
        // Required properties
        if (! this.nodeType) {
            alert('The nodeType is required in InterfaceNode.');
            return false;
        }
        if (this.nodeType === ArgMap.FACT || this.nodeType === ArgMap.RCLAIM || this.nodeType === ArgMap.RULE) {
            if (! this.confidenceLevel) {
                alert('The confidenceLevel is required in InterfaceNode for Fact, RClaim, and Rule.');
                return false;
            }
        }            
        if (this.nodeType === ArgMap.FACT || this.nodeType === ArgMap.RCLAIM || this.nodeType === ArgMap.INTCONCLUSION) {
            if (this.weightIndex < 0) {
                alert('The weight is required for Fact, RClaim, and IntConclusion in InterfaceNode.');
                return false;
            }
        }
        if (! this.bodyText) {
            alert('The bodyText is required in InterfaceNode.');
            return false;
        }   
        if (this.nodeType === ArgMap.FACT || this.nodeType === ArgMap.RCLAIM ) {
            if (! this.bodyDatabase) {
                alert('The bodyDatabase is required for Fact, RClaim, and IntConclusion in InterfaceNode.');
                return false;
            }
        }
        if (this.nodeType != ArgMap.CLAIM && ! this.lowerNode ) {
            alert('The lowerNode is required for all node types except Claim.');
            return false;
        }
        return true;
    }
} // End class InterfaceNode 
