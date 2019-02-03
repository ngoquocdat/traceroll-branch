import React from 'react';
import {Group} from 'tr-react-konva';
import {TRLineSelect, TRSelectedLines} from './../';
import Const from '../../Util/const';

// check if line has a part or full inside select area
// pointX, pointY: point of line
// vs: points of line selection
function inside(pointX, pointY, vs) {
	let x = pointX, y = pointY;
	let xi, yi, xj, yj, intersect;

	let inside = false;
	for (let i = 0, n = vs.length, j = n - 2, k = n - 1; i < k; i += 2) {
		xi = vs[i]; yi = vs[i+1];
		xj = vs[j]; yj = vs[j+1];

		intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
		if (intersect){
			inside = !inside;
		}
		j = i;
	}
	return inside;
}

function lineCross(pointX1, pointY1, pointX2, pointY2, vs) {
	let x1 = pointX1, y1 = pointY1,
		x2 = pointX2, y2 = pointY2;
	let xi, yi, xj, yj;
	let a1, b1, c1, a2, b2, c2, t1, t2;
	a1 = y1 - y2;
	b1 = x2 - x1;
	c1 = -(a1*x1 + b1*y1);
	let inside = false;
	for (let i = 0, n = vs.length, j = n - 2, k = n - 1; i < k; i += 2) {
		xi = vs[i]; yi = vs[i+1];
		xj = vs[j]; yj = vs[j+1];

		a2 = yi - yj;
		b2 = xj - xi;
		c2 = -(a2*xi + b2*yi);

		t1 = (x1*a2 + y1*b2 + c2)*(x2*a2 + y2*b2 + c2);
		t2 = (xi*a1 + yi*b1 + c1)*(xj*a1 + yj*b1 + c1);

		if (t1 < 0 && t2 < 0)
		{
			return true;
		}

		j = i;
	}
	return inside;
}

export function linesInsidePolygon(arrlines, polygon) {
	let selectedLine = [],
		line,
		attrs,
		points,
        rect,
        x,
        y
	let checkArr = new Array(arrlines.length).fill(false);
	for(let i = 0, n = arrlines.length; i < n; i++) {
		line = arrlines[i];
		attrs = line.attrs;
		points = attrs.points;
        rect = attrs.rect
        x = line.getX()
        y = line.getY()

        if (line.className === 'Image') {
            x -= rect.x
            y -= rect.y
        }
		for (let j = 0, k = points.length; j < k - 1; j += 2) {
			if (inside(points[j] + x, points[j+1] + y, polygon)) {
				checkArr[i] = true;
				selectedLine.push(line);
				break;
			}
		}
	}

	for(let i = 0, n = arrlines.length; i < n; i++) {
		if (!checkArr[i]) {
			line = arrlines[i];
			attrs = line.attrs;
			points = attrs.points;
			rect = attrs.rect
            x = line.getX()
			y = line.getY()
			
			if (line.className === 'Image') {
                x -= rect.x
                y -= rect.y
			}
			for (let j = 0, k = points.length; j < k - 1; j += 4) {
				if (lineCross(points[j] + x, points[j+1] + y, 
									points[j+2] + x, points[j+3] + y, polygon)) {
					selectedLine.push(line);
					break;
				}
			}
		}
	}

	return selectedLine;
}

class TRSelectMoveGroup extends React.Component {
	constructor(props){
		super(props);

		this.hasDrag = false
		this.isFirstDrag = true
		this.endPos = {x: 0, y: 0}
		this.pointerStart = {x: 0, y: 0}
		this.pointerEnd = {x: 0, y: 0}
		this.isOnGroup = false
	}

	componentWillMount() {
		window.addEventListener('mouseup', this.handleWindowMouseUp);
	}

	handleMouseDown = (e) => {
		this.isOnGroup = true;
		const stage = this.group.getStage(),
			scale = stage.scaleX();

		let pointerPos = {
			x: stage.getPointerPosition().x / scale - stage.x(),
			y: stage.getPointerPosition().y / scale - stage.y()
		}

		if (this.isFirstDrag) {
			this.pointerStart = pointerPos;
		} else {
			let pointerChange = {
				x: this.pointerEnd.x - pointerPos.x,
				y: this.pointerEnd.y - pointerPos.y
			}
			let pointerStart = this.pointerStart;
			this.pointerStart = {
				x: pointerStart.x - pointerChange.x,
				y: pointerStart.y - pointerChange.y
			}
		}
	}

	handleWindowMouseUp = (e) => {
		if (this.isOnGroup) {
			const stage = this.group.getStage(),
				scale = stage.scaleX();
			this.pointerEnd = {
				x: stage.getPointerPosition().x / scale - stage.x(),
				y: stage.getPointerPosition().y / scale - stage.y()
			}
			this.endPos = {
				x: (this.pointerEnd.x - this.pointerStart.x),
				y: (this.pointerEnd.y - this.pointerStart.y)
			};
			if (this.hasDrag) {
				this.props.selectedLines.map(function(line, i){
					line.setAttr('isFirstDrag', this.isFirstDrag);
					line.setAttr('endPos', this.endPos);
					line.x(line.x()+this.endPos.x)
					line.y(line.y()+this.endPos.y)
					line.fire('dragend');
				}, this);
				if (this.isFirstDrag) {
					this.isFirstDrag = false;
				}
				this.props.moveSelectLine(this.endPos)
			}
		}
		this.hasDrag = false;
		this.isOnGroup = false;
	}

	getEndPosition = () => {
		return this.endPos;
	}

	resetEndPosition = () => {
		const group = this.group;
		group && group.setPosition({x: 0, y: 0});
		this.endPos = {x: 0, y: 0};
	}

	handleDragStart = (e) => {
		this.hasDrag = true;
	}

	componentDidUpdate(prevProps, prevState){
		this.isFirstDrag = true;
	}

	componentWillUnmount() {
		window.removeEventListener('mouseup', this.handleWindowMouseUp);
	}
	
	render() {
		return (
			<Group
				name={Const.GROUP_NAME_LINES_SELECTED}
				ref={node => this.group = node}
				x={0}
				y={0}
				onDragStart={this.handleDragStart}
				draggable={true}
				onMouseDown={this.handleMouseDown}
				onMouseLeave={this.props.mouseLeaveGroupLinesSelected}
			>
				<TRLineSelect
					line={this.props.line}/>
				<TRSelectedLines
                    ref={this.props.trSelectedLinesRef}
					getEndPosition={this.getEndPosition}
					resetEndPosition={this.resetEndPosition}
					selectedLines={this.props.selectedLines}/>
			</Group>
			
		);
	}
}

TRSelectMoveGroup.defaultProps = {
	line: {
		points: [],
		color: 'black'
	},
	selectedLines: []
}

export default TRSelectMoveGroup;