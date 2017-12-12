/* Contents:
- class ArgMapInterface
- class InterfaceNode
*/

class ArgMapInterface { 
    // The interface for external use of the argument map system. 
    // Ideally all eternal calls use the interface, except for node methods. This allows updating
    // an existing node, depending on what happens in the text.

    addNode(interfaceNode) { // Returns new node if okay or false if not.
        // Check to see the node has been properly prepared.
        if (! interfaceNode.integrityIsOkay() ) { return false; }
        
        if ( interfaceNode.nodeType === ArgMap.CLAIM ) {
            argMap.layoutMgr.dropOnEmptyDiagram('Claim', interfaceNode);
            return argMap.getFirstSelectedNode();

        } else if ( interfaceNode.nodeType === ArgMap.RULE ) {
            argMap.layoutMgr.dropOnConclusion('Rule', interfaceNode);
            return argMap.getFirstSelectedNode();

        } else if ( interfaceNode.nodeType === ArgMap.INTCONCLUSION ) {
            argMap.layoutMgr.dropOnRule('IntConclusion', interfaceNode);
            return argMap.getFirstSelectedNode();

        } else if ( interfaceNode.nodeType === ArgMap.FACT ) {
            argMap.layoutMgr.dropOnRule('Fact', interfaceNode);
            return argMap.getFirstSelectedNode();

        } else if ( interfaceNode.nodeType === ArgMap.RCLAIM ) {
            argMap.layoutMgr.dropOnRule('RClaim', interfaceNode);
            return argMap.getFirstSelectedNode();

        } else {
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
}
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
    }
    get offsetCenterX() { return this.offsetCenterX_; }
    set offsetCenterX(x) {
        this.offsetCenterX_ = x;
        this.centerOnChildWhenAdded = false;
    }
    copyBasicPropertiesToNode(node) { // Copies basic properties from itself to the node
        node.nodeType_ = this.nodeType;
        node.name = this.nodeType; // Here we take advantage of what the node type constants are.
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
    integrityIsOkay() { // Returns true if okay, false if not. Data types are not checked.
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
}
