import React from 'react';
import {render} from 'react-dom';
import Diagram from './Diagram.jsx';
import Argument from './Argument.jsx';
import Element from './Element.jsx';
import Rule from './Rule.jsx';

class App extends React.Component {
  
  constructor(props) {
    super(props);
  
    var fact1 = new Element(1,"Fact", "The TV ad \"2012 Obama vs Romney - Democrat - Video 3 - Firms\" said \"I am Barack Obama and I approve this message.\" (B)");
    var fact2 = new Element(2,"Fact", "The TV ad \"2012 Obama vs Romney - Democrat - Video 3 - Firms\" said \"I am Barack Obama and I approve this message.\" (B)");
    
    var ic1 = new Element(3,"IC", "We live in a socially dependent world. No single person can thrive without the support of a much larger group, which provides the infrastructure needed for the group to thrive.");
    var mc1 = new Element(6,"MC", "We're all in this together, i.e. the people and the government are working together.");
    
    var rule1 = new Rule(4,"List of independent reasons - Comprehensive, meaning an attempt was made to include cases of all important types of reasons. ", [fact1], ic1);
    var rule2 = new Rule(5,"Very high proof of assertion was found.", [fact2,ic1], mc1);

    var elements = [fact1,fact2,ic1,mc1];
    var rules = [rule1,rule2];

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

