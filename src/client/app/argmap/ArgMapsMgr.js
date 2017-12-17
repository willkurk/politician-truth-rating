/* Contents:
    - class ArgMapsMgr - Manages all the ArgMap instances
*/
let argMapsMgr; // A single global variable

function initArgMapsMgr(){ 
    argMapsMgr = new ArgMapsMgr();
    argMapsMgr.createArgMap(TEST_ARG_MAP_KEY); 
}
class ArgMapsMgr { 
    // Constants
    static get ARG_MAP_KEY() { return 'arg-map-key'; }

    constructor() {
        this.argMaps = new Map();
        this.nextArrowIDNumber = 1;

        // Later these will be from the database:
        this.nodeWeightDescriptions = ['Zero', 'Low 20%', 'Medium 50%', 'High 80%', 'Central 100%'];
        this.nodeWeightValues = [0, .2, .5, .8, 1]; 

        window.addEventListener('resize', this.windowResizeEvent, false );
    }
    // Creates and returns a new ArgMap with instanceID, which must be unique.
    // Returns undefined if the instanceID is already in use.
    // instanceID MUST be a string.
    // For testing the ids are 1, 2, etc. These may correspond to tab indexes.
    createArgMap(instanceID) { 
        if (this.argMaps.has(instanceID)) {
            alert('Error - ArgMapsMgr already has a map with instanceID = ' + instanceID);
            return undefined;
        }
        let newArgMap = new ArgMap(instanceID); 
        this.argMaps.set( instanceID, newArgMap);
        return newArgMap;
    }
    getArgMapForEvent(event) { // Relies on event element attribute arg-map-key
        let key = event.currentTarget.getAttribute(ArgMapsMgr.ARG_MAP_KEY);
        return this.getArgMapForKey(key);
    }
    getArgMapForDiagram(diagram) {
        let key = diagram.getAttribute(ArgMapsMgr.ARG_MAP_KEY);
        return this.getArgMapForKey(key);
    }
    getArgMapForKey(key) {
        let map = this.argMaps.get(key);
        return this.argMaps.get(key);
    }
    getNodeForEvent(event) {
        let argMap = this.getArgMapForEvent(event);
        let node = argMap.getNodeForNodeDiv(event.currentTarget);
        return node;
    }
    getNextArrowIDNumber() {
        return this.nextArrowIDNumber++;
    }
    removeArgMap(instanceID) { // Untested
        return this.argMaps.delete(instanceID);
    }
    getNodeWeightDescriptionForIndex(index) {
        return this.nodeWeightDescriptions[index];
    }    
    getNodeWeightValueForIndex(index) {
        return this.nodeWeightValues[index];
    }
    getDecrementWeightIndex(index) {
        let newIndex = index - 1;
        if (newIndex < 0 ) newIndex = 0;
        return newIndex;
    }
    getIncrementWeightIndex(index) {
        let newIndex = index + 1;
        if (newIndex + 1 > this.nodeWeightValues.length ) newIndex = index; // Avoid off by one error.
        return newIndex;
    }
    windowResizeEvent() {
        argMapsMgr.argMaps.forEach(function(argMap, key) {
            argMap.layoutMgr.horizontallyRecenterAllNodes();
            argMap.layoutMgr.rowMgr.verticallyRecenterAllRows(); 
        });
    }
}
