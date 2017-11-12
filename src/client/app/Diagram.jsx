import React from 'react';
import joint from 'jointjs';
import ReactDOM from 'react-dom';
import Argument from './Argument.jsx';
import Element from './Element.jsx';
import Rule from './Rule.jsx'
import $ from "jquery";

joint.shapes.html = {};
joint.shapes.html.JTable = joint.shapes.basic.Generic.extend({
    markup: '<g class="rotatable"><g class="scalable"><rect class="main"/><rect class = "header"/></g><text class = "headerText"/><text class = "mainText"/><text class = "confText"/></g>',

    defaults: joint.util.deepSupplement({
        type: 'html.JTable',
        attrs: {
            '.main': { fill: 'white', stroke: 'black', 'follow-scale': true, width: 100, height: 70 },
            '.header': { fill: 'white', stroke: 'black', 'follow-scale': true, width: 100, height: 15 },
            '.headerText': { 'font-size': 16, 'ref-x': .5, 'ref-y': .14, ref: 'rect', 'y-alignment': 'middle', 'x-alignment': 'middle' },
            '.mainText': { 'font-size': 14, 'ref-x': .5, 'ref-y': .5, ref: 'rect', 'y-alignment': 'middle', 'x-alignment': 'middle' },
            '.confText': { 'font-size': 15, 'ref-x': .9, 'ref-y': .14, ref: 'rect', 'y-alignment': 'middle', 'x-alignment': 'middle' }
        }
    }, joint.shapes.basic.Generic.prototype.defaults)
});
var frame;
joint.shapes.html.JTableView = joint.dia.ElementView.extend({

        template: [
            '<div class="html-JTable">',
            '<select><option value="" selected disabled hidden>Select Weight</option><option>low</option><option>medium</option><option>high</option></select>',
            '</div>'
        ].join(''),

        initialize: function() {
            _.bindAll(this, 'updateBox');
            joint.dia.ElementView.prototype.initialize.apply(this, arguments);
            this.$box = $(_.template(this.template)());
            // Prevent paper from handling pointerdown.
            this.$box.find('input,select').on('mousedown click', function(evt) {
                evt.stopPropagation();
            });
            this.$box.find('select').on('change', _.bind(function(evt) {
                this.model.set('select', $(evt.target).val());
            }, this));
            this.$box.find('select').val(this.model.get('select'));
            // Update the box position whenever the underlying model changes.
            this.model.on('change', this.updateBox, this);
            // Remove the box when the model gets removed from the graph.
            this.model.on('remove', this.removeBox, this);

            this.$box.css({
              "position": "absolute",
              "pointer-events": "none"
            })

            this.$box.find('select').css({
              "position": "absolute",
              "pointer-events": "auto",
              "top": "1px",
              "left": "1px"
            })

            this.updateBox();
        },
        render: function() {
            joint.dia.ElementView.prototype.render.apply(this, arguments);
            this.paper.$el.prepend(this.$box);
            this.updateBox();
            return this;
        },
        updateBox: function() {
            var frameBox = frame.getBoundingClientRect();
            // Set the position and dimension of the box so that it covers the JointJS element.
            var bbox = this.model.getBBox();
            // Example of updating the HTML with a data stored in the cell model.
            this.$box.css({
                width: bbox.width,
                height: bbox.height,
                left: frameBox.x + bbox.x,
                top: frameBox.y + bbox.y,
                transform: 'rotate(' + (this.model.get('angle') || 0) + 'deg)'
            });
        },
        removeBox: function(evt) {
            this.$box.remove();
        }
    });

class Diagram extends React.Component {

  constructor(props) {
    super(props);
    this.graph = new joint.dia.Graph;
    this.argument = this.props.argument;
    this.cells = [];
    var elements = {};
    var links = [];
    for (let rule of this.argument.rules) {
      if (!elements[rule.id] ) {
        elements[rule.id] = new joint.shapes.html.JTable({
          position: { x: 100, y: 100 },
          size: { width: 300, height: 100 },
          attrs: { '.main': { fill: 'white' }, 
                ".headerText": { text: "Rule", fill: 'black' }, 
                ".mainText": { text: rule.name, fill: 'black' },
                ".confText": { text: "", fill: 'black' },
          "frame": this.refs.myDiagramDiv}   
        });
      }

      for (var i = 0; i < rule.from.length; i++) {
        if (!elements[rule.from[i].id] ) {
          elements[rule.from[i].id] = new joint.shapes.html.JTable({
            position: { x: 100, y: 100 },
            size: { width: 300, height: 100 },
            attrs: { '.main': { fill: 'white' }, 
                ".headerText": { text: rule.from[i].type, fill: 'black' }, 
                ".mainText": { text: rule.from[i].desc, fill: 'black' },
                ".confText": { text: "100%", fill: 'black' },
                "frame": this.refs.myDiagramDiv}
          });
          
        }
        links.push(new joint.dia.Link({
            source: { id: elements[rule.from[i].id].id},
            target: { id: elements[rule.id].id }
          }));  
      }

      if (!elements[rule.to.id] ) {
        elements[rule.to.id] = new joint.shapes.html.JTable({
          position: { x: 100, y: 170 },
          size: { width: 300, height: 100 },
          attrs: { '.main': { fill: 'white' }, 
                ".headerText": { text: rule.to.type, fill: 'black' }, 
                ".mainText": { text: rule.to.desc, fill: 'black' },
                ".confText": { text: "100%", fill: 'black' },
                "frame": this.refs.myDiagramDiv}
        });
      }
      
      links.push(new joint.dia.Link({
            source: { id: elements[rule.id].id},
            target: { id: elements[rule.to.id].id }
          }));
    }
    this.cells = $.map(elements, function(value, index) {
      return [value];
    });
    this.cells = this.cells.concat(links);
    
  }

  componentDidMount() {
    frame = this.refs.myDiagramDiv;
    this.paper = new joint.dia.Paper({
        el:  ReactDOM.findDOMNode(this.refs.myDiagramDiv),
        width: 1000,
        height: 1000,
        model: this.graph,
        gridSize: 1
    });

    this.graph.addCells(this.cells);
    joint.layout.DirectedGraph.layout(this.graph, { setLinkVertices: false });
  }

  render() {
    return (
      <div ref="myDiagramDiv">
      </div>
    );
  }

}

export default Diagram;