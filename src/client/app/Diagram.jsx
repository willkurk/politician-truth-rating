import React from 'react';
import joint from 'jointjs';
import ReactDOM from 'react-dom';

class Diagram extends React.Component {

  constructor(props) {
    super(props);
    this.graph = new joint.dia.Graph;
    
    this.rect = new joint.shapes.basic.Rect({
        position: { x: 100, y: 30 },
        size: { width: 100, height: 30 },
        attrs: { rect: { fill: 'blue' }, text: { text: 'my box', fill: 'white' } }
    });
    this.rect2 = this.rect.clone();
    this.rect2.translate(300);
    this.link = new joint.dia.Link({
        source: { id: this.rect.id },
        target: { id: this.rect2.id }
    });

    
  }

  componentDidMount() {
    this.paper = new joint.dia.Paper({
        el:  ReactDOM.findDOMNode(this.refs.myDiagramDiv),
        width: 600,
        height: 200,
        model: this.graph,
        gridSize: 1
    });

    this.graph.addCells([this.rect, this.rect2, this.link]);

  }

  render() {
    return (
      <div ref="myDiagramDiv">
      </div>
    );
  }

}

export default Diagram;