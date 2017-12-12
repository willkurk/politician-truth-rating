import React from 'react';
import ReactDOM from 'react-dom';
import $ from "jquery";

class Diagram extends React.Component {

  constructor(props) {
    super(props);
    
    
  }

  componentDidMount() {
    initArgMap(this.refs.myDiagramDiv);
  }

  render() {
    return (
      <div ref="myDiagramDiv">
      </div>
    );
  }

}

export default Diagram;