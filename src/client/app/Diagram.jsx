import React from 'react';
import joint from 'jointjs';
import ReactDOM from 'react-dom';
import Argument from './Argument.jsx';
import Element from './Element.jsx';
import Rule from './Rule.jsx'

class Diagram extends React.Component {

  constructor(props) {
    super(props);
    this.graph = new joint.dia.Graph;
    this.argument = this.props.argument;

    this.cells = [];
    for (let rule of this.argument.rules) {
      var rect1 = new joint.shapes.basic.Rect({
        position: { x: 100, y: 30 },
        size: { width: 100, height: 30 },
        attrs: { rect: { fill: 'blue' }, text: { text: rule.from.type + rule.from.desc, fill: 'white' } }
      });
      var rect2 = new joint.shapes.basic.Rect({
        position: { x: 100, y: 30 },
        size: { width: 100, height: 30 },
        attrs: { rect: { fill: 'blue' }, text: { text: rule.to.type + rule.to.desc, fill: 'white' } }
      });
      rect2.translate(300);
      var link = new joint.dia.Link({
          source: { id: rect1.id },
          target: { id: rect2.id }
      });
      this.cells.push({
        "rect1" : rect1,
        "rect2" : rect2,
        "link"  : link});
    }
    
  }

  componentDidMount() {
    this.paper = new joint.dia.Paper({
        el:  ReactDOM.findDOMNode(this.refs.myDiagramDiv),
        width: 600,
        height: 600,
        model: this.graph,
        gridSize: 1
    });

    for (let index in this.cells) {
      var cell = this.cells[index];
      this.graph.addCells([cell.rect1, cell.rect2, cell.link]);
    }

  }

  render() {
    return (
      <div ref="myDiagramDiv">
      </div>
    );
  }

}

export default Diagram;