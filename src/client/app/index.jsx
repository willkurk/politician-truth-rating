import React from 'react';
import {render} from 'react-dom';
import Diagram from './Diagram.jsx';
import Argument from './Argument.jsx';
import Element from './Element.jsx';
import Rule from './Rule.jsx';

class App extends React.Component {
  
  constructor(props) {
    super(props);
  
    var element1 = new Element("Fact", "1 + 1 = 2");
    var element2 = new Element("Premise", "2 + 2 = 4");
    var rule = new Rule("Math", element1, element2);

    var elements = [element1, element2];
    var rules = [rule];

    this.argument = new Argument(elements, rules);

  }

  render() {
    return (
        <div>
          <Diagram argument={this.argument} />
	</div>
	
	
    );
  }
}

render(<App/>, document.getElementById('app'));

