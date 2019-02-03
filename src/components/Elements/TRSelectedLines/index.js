import React, { Component } from 'react';
import {Group} from 'tr-react-konva';
import Const from '../../Util/const.js';
import Utils from '../../Util/utils.js';

class TRSelectedLines extends Component {

	componentDidUpdate() {
		const group = this.refs.group,
			selectedLines = this.props.selectedLines;
		if (selectedLines.length > 0) {
			selectedLines.map(function(line, i){
				//Marked line is selected
				this.markLineSelected(line);
				this.props.resetEndPosition();
				let shapeLayer = line.getLayer();
				line.moveTo(group);
				shapeLayer.draw();
				return line
			}, this);
		}
		else {
			this.finishSelectMove();
		}
	}

	finishSelectMove = () => {
		const group = this.refs.group,
			stage = group.getStage(),
			layer = stage.findOne('.' + Const.KONVA.NEW_LINES_CONTAINER_NAME),
			distance = this.props.getEndPosition(),
			children = group.getChildren();
			
			if (children.length > 0) {
				children.map(function(line, i){
					let newPos = {
						x: line.getX() + distance.x,
						y: line.getY() + distance.y
					};
					setTimeout(() => {
					    line.setPosition(newPos);
						line.moveTo(layer);
				    	this.markLineUnSelected(line);
					}, 10);

					return line
				}, this);
				setTimeout(() => {
		    		layer.getStage().batchDraw();
				}, 10);
			}
	}

	markLineSelected = (line) => {
		if (Utils.isLine(line)) {
			line.shadowBlur(5);
			line.shadowOffset({x:1, y:2});
			line.shadowColor("black");
			line.shadowOpacity(0.5);
		}
	};

	markLineUnSelected = (line) => {
		if (Utils.isLine(line)) {	
			line.shadowBlur(0);
			line.shadowOffset({x:0, y:0});
			line.shadowColor("black");
			line.shadowOpacity(0);
		}
	}
	
	render() {
		return (
			<Group
				ref='group'
				x={0}
				y={0}
			/>
		);
	}
}

export default TRSelectedLines;