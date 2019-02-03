import React, { Component } from 'react';
import {Line} from 'tr-react-konva';

class TRLineSelect extends Component {
	render() {
		return (
			<Line
				x = {0}
				y = {0}
				points = {this.props.line.points}
				lineCap = 'round'
				lineJoin = 'round'
				stroke = 'black'
				strokeWidth = {1}
				dash = {[10, 10]}
				closed = 'true'
			/>
		);
	}
}

export default TRLineSelect;