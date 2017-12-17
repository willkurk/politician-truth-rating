/* Contents:
- function clearSampleDiagram()
- function runArgMapUnitTest()
- functions for creating the five basic types of test nodes.
- function runHorizontaRecenterTest()
*/
const TEST_ARG_MAP_KEY = '1';

function clearSampleDiagram() {
    argMapsMgr.getArgMapForKey(TEST_ARG_MAP_KEY).clearDiagram();
}
function createSampleArgumentMap() { 
    clearSampleDiagram();
    let interface = argMapsMgr.getArgMapForKey(TEST_ARG_MAP_KEY).interface;
    let interfaceNode;

    // Add Claim
    let claimNode = interface.addNode( createTestClaimInterfaceNode() );

    // Add Rule to Claim
    interfaceNode = createTestRuleInterfaceNode(claimNode);
    let rule1Node = interface.addNode( interfaceNode );

    // Add IntConclusion to Rule, move it to the left
    interfaceNode = createTestIntConclusionInterfaceNode(rule1Node);
    interfaceNode.offsetCenterX = -180;
    let intConclusion1Node = interface.addNode( interfaceNode );

    // Add Fact to the Rule, move it to the right
    interfaceNode = createTestFactInterfaceNode(rule1Node);
    interfaceNode.offsetCenterX =130;
    interface.addNode( interfaceNode );

    // Add Rule to the IntConclusion, do not move, looks fine where it is.
    interfaceNode = createTestRuleInterfaceNode(intConclusion1Node);
    let rule2Node = interface.addNode( interfaceNode );

    // Add RClaim to above rule, move it to the left
    interfaceNode = createTestRClaimInterfaceNode(rule2Node);
    interfaceNode.offsetCenterX = -250;
    interface.addNode( interfaceNode );

    // Add Fact to above rule, move it to the right
    interfaceNode = createTestFactInterfaceNode(rule2Node);
    interfaceNode.offsetCenterX = 60;
    interface.addNode( interfaceNode );
}
// Create the five basic types of test nodes
function createTestClaimInterfaceNode() {
    let node = new InterfaceNode('Claim');
    node.bodyText = "This is a claim. What we have here are multiple lines of text. I'm draggable. " +
        "A claim is the most important node in an argument and can often be very long. " +
        'It may include statements like "And therefore, my worthy opponent is not to be trusted."' ;
    node.confidenceLevel = .75;
    node.width = 500; // More than the default of 300.
    return node;
}
function createTestRuleInterfaceNode(conclusion) {
    let node = new InterfaceNode('Rule');
    node.bodyText  = "This is a rule.";
    node.bodyDatabase = "This is the rule in the database.";
    node.confidenceLevel = .75;
    node.lowerNode = conclusion;
    return node;
}
function createTestIntConclusionInterfaceNode(rule) {
    let node = new InterfaceNode('IntConclusion');
    node.bodyText  = "This is a rather long intermediate conclusion, one that will not hold up under analysis.";
    node.confidenceLevel = 1;
    node.lowerNode = rule;
    node.weightIndex = 2; 
    return node;
}
function createTestFactInterfaceNode(conclusion) {
    let node = new InterfaceNode('Fact');
    node.bodyText  = "This is a fact in the original text. It may have plenty of text.";
    node.bodyDatabase = "This is the fact in the database.";
    node.confidenceLevel = .8;
    node.lowerNode = conclusion;
    node.weightIndex = 3; 
    return node;
}
function createTestRClaimInterfaceNode(conclusion) {
    let node = new InterfaceNode('RClaim');
    node.bodyText  = "This is a reusable claim, as referred to in the original text.";
    node.bodyDatabase = "This is the text in the database.";
    node.confidenceLevel = .65;
    node.lowerNode = conclusion;
    node.weightIndex = 1; 
    return node;
}
// Other
function runHorizontaRecenterTest() {
    argMapsMgr.getArgMapForKey(TEST_ARG_MAP_KEY).layoutMgr.horizontallyRecenterAllNodes();
}
// Not used
// function showBkgPhoto() {
//     argMap.diagram.style.backgroundImage = "url('ThreeScientistsProblems.jpg')";
//     setStandardPhotoProperties();
// }
// function showDimBkgPhoto() {
//     argMap.diagram.style.backgroundImage = "url('ThreeScientistsProblems_Dim50.jpg')";
//     setStandardPhotoProperties();
// }
// function showSuperDimBkgPhoto() {
//     argMap.diagram.style.backgroundImage = "url('ThreeScientistsProblems_DimLightBlue.jpg')";
//     setStandardPhotoProperties();
// }
// function hideBkgPhoto() {
//     argMap.diagram.style.backgroundImage = 'none';
// }
// function setStandardPhotoProperties() {
//     argMap.diagram.style.backgroundPosition = 'center top'; 
//     argMap.diagram.style.backgroundSize = 'cover';
// }