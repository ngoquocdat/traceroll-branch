import React from 'react';
import { Group, Rect } from 'tr-react-konva';
import { TRLineBrush, TRLine } from '../';
import Utils from '../../Util/utils.js';
import Const from '../../Util/const.js';
import TrService from '../../Util/service.js';

class TRLineGroup extends React.PureComponent {
	constructor(props){
		super(props);
		this.groupPos = {
			x: props.x,
			y: props.y
		}
	}

	componentWillMount() {
		this.updateState(this.props.data.json);
	}

    componentDidMount() {
        if (this.props.newCreated) {
            const group = this.group,
                stage = group.getStage(),
                groupAP = group.getAbsolutePosition();
            let isIntersect = false;

            const intersectResult = (result) => {
                isIntersect = result;
            };
            const newAP = Utils.dragBoundProfileImage.call(this, stage, group, groupAP, Utils.intersectProfileImage, intersectResult);
            if (isIntersect) {
                group.setAbsolutePosition(newAP);
                setTimeout(function() {
                    group.fire('dragend');
                }, 1000)
            }
        }
    }

	updateState = (json) => {
		const node = window.Konva.Node.create(json);
		this.setState({
			children: node.children
		})
	}

	componentWillReceiveProps(nextProps) {
		this.updateState(nextProps.data.json)
	}

	handleDblClick = () => {
		const isErasing = this.props.getOptions && this.props.getOptions().mode === Const.MODE.ERASER;
		if (isErasing) {
			return;
		}
		this.props.toggleTheatreMode && this.props.toggleTheatreMode(this.props.dbkey)
	}

	handleRemoving = () => {
		if (this.props.getOptions().mode === Const.MODE.ERASER){
			return;
		}

		const key = this.props.dbkey,
            uid = this.props.uid;
        TrService.deleteElementOnDb(uid, key);
	}

	handleDragEnd = (e) => {
		const newPos = {
			x: this.group.x(),
			y: this.group.y()
		}
		this.groupPos = newPos;
		const requestBody = {
			uid: this.props.uid,
			key: this.props.dbkey,
			stage: {
				newPos
			}
		}
		TrService.updateElementOnDb(requestBody);
	}

    handleEnterGroup = (e) => {
    	if (!this.props.drawMode) {
	        Utils.showBorder(e, true);
    	}
    }

    handleLeaveGroup = (e) => {
    	if (!this.props.drawMode) {
        	Utils.showBorder(e, false);
    	}
    }

	dragBoundFunc = (pos) => {
		const group = this.group,
            stage = group.getStage();
        return Utils.dragBoundProfileImage.call(this, stage, group, pos, Utils.intersectProfileImage);
	}
	
	render() {
		const rect = this.props.rect;
		return (
			<Group
				ref={node => (this.group = node)}
				name={Const.KONVA.TIME_LINE_NODE}
                x={this.groupPos.x}
                y={this.groupPos.y}
				draggable={this.props.draggable}
				date_created={this.props.date_created}
				onDblClick={this.handleDblClick}
				onDragend={this.handleDragEnd}
				getOptions={this.props.getOptions}
				dragBoundFunc={this.dragBoundFunc}
				>
				{this.state.children.map(function(item, i) {
					let attrs = item.attrs;
					switch(item.getClassName()) {
						case 'Line':
							return <TRLine
                                key={i}
								points={attrs.points}
								x={attrs.x}
								y={attrs.y}
								strokeWidth={attrs.strokeWidth}
								stroke={attrs.stroke}
								draggable={false}
							/>
						case 'Shape':
							return <TRLineBrush
                                key={i}
								points={attrs.points}
								stroke={attrs.stroke}
								x={attrs.x}
								y={attrs.y}
								draggable={false}
							/>
						default:
							return item;
					}
				}, this)}
				<Rect
                    ref={node => this.frame = node}
					name={Const.SHAPE_TYPE.GROUP}
					x={rect.x}
					y={rect.y}
                    createdBy={this.props.createdBy}
					stroke='rgb(102, 102, 102)'
					strokeEnabled={false}
					width={rect.width}
					height={rect.height}
					onRemove={this.handleRemoving}
					onMouseOver={this.handleEnterGroup}
					onMouseOut={this.handleLeaveGroup}
				/>
			</Group>
		);
	}
}

TRLineGroup.defaultProps = {
	data: {
		json: '{"attrs":{},"className":"Group","children":[]}'
	},
	draggable: false,
	date_created: 0,
	toggleTheatreMode: undefined,
	dbkey: '',
	uid: '',
	rect: {
		x: 0,
		y: 0
	}
}

export default TRLineGroup;