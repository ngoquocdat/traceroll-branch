import React, { Component } from 'react';
import {Group, Circle, Image, Text, Rect} from 'tr-react-konva';
import './style.css';
import Utils from '../../Util/utils.js';
import Const from '../../Util/const.js';
import TrService from '../../Util/service.js';
import SuperGif from 'jsgif';

class TRImage extends Component{
	constructor(props){
		super(props);
		this.state = {
			key: this.props.dbkey,
			x: this.props.x,
			y: this.props.y,
			width: this.props.width,
			height: this.props.height,
			src: this.props.src,
			image: null,
			//default anchor
			anchor: {
				stroke: '#666',
				fill: '#ddd',
				radius: 6,
				strokeWidth: 2
			},
			uid: this.props.uid,
			ownerid: this.props.ownerid,
			date_created: this.props.date_created,
			video_image: "url(/img/tools/youtube.png)",
            visibleTransform: false,
		}
		this.textFontSize = Math.round(Math.abs(this.props.height / Const.FONT_SIZE_RATIO));
		this.captionWidth = this.props.width;
		
		this.handleRemoving = this.handleRemoving.bind(this);
		this.handleImageDragEnd = this.handleImageDragEnd.bind(this);
		this.handleDoubleClick = this.handleDoubleClick.bind(this);

		this.handleMouseDown = this.handleMouseDown.bind(this);
		this.syncToServer = this.syncToServer.bind(this);
	}

	componentDidMount() {
		if (this.props.isVideo) {
			const video = document.createElement('video');
			  video.src = this.state.src;
			  video.muted = true;
			  video.loop = true;
			  this.setState({
				image: video
				})
			video.addEventListener('canplay', () => {
				this.nodeImage.getLayer().batchDraw();
				this.requestUpdate();
			});
		} else {
			let img = new window.Image();
			img.src = this.state.src;

			if (/.*\.gif/.test(this.state.src)) {
				const gif = new SuperGif({gif: img});
				gif.load( (e) => {
					this.setState({
						image:  gif.get_canvas(),
					});
				})
				this.requestUpdate();
			}

			// Create image object
			img.onload = () => {
				this.setState({
					image: img
				});
			}
		}
		
        this.updatePosition()
	}

	// animateGif = (gif) => {
	// 	console.log(gif.get_length(), gif.get_current_frame(),  gif.get_canvas());
	// 	gif.move_relative(10);
	// 	console.log(gif.get_current_frame())
	// 	this.group.draw();
	// }

	requestUpdate = () => {
		this.nodeImage.getLayer().batchDraw();
		requestAnimationFrame(this.requestUpdate);
	}

    // update image position if it intersect profile image
    updatePosition = () => {
        if (this.props.newCreated) {
            const group = this.group,
                stage = group.getStage(),
                groupAP = group.getAbsolutePosition()
            let isIntersect = false

            const intersectResult = (result) => {
                isIntersect = result
            };
            const newAP = Utils.dragBoundProfileImage.call(this, stage, group, groupAP, Utils.intersectProfileImage, intersectResult)
            if (isIntersect) {
                group.setAbsolutePosition(newAP)
                setTimeout(function() {
                    group.fire('dragend')
                }, 1000)
            }
        } else if(this.props.gotoHome) {
            window.location.href = '/home'
        }
    }

    handleShowTransform = () => {
    	this.updateCircleScale();

        this.setState((prevState, props) => ({
            visibleTransform: true
        }))
    }

    handleStageWheel = () => {
    	this.updateCircleScale();
    }

    updateCircleScale = () => {
    	const frame = this.frame;
    	if (frame) {
	        const stage = frame.getStage();
	        if (stage) {
		        const scale = {
		            x: 1 / stage.scaleX(),
		            y: 1 / stage.scaleX()
		        };
		        this.TL.scale(scale);
		        this.TR.scale(scale);
		        this.BL.scale(scale);
		        this.BR.scale(scale);
	        }
    	}
    }

    handleHideTransform = () => {
        this.setState((prevState, props) => ({
            visibleTransform: false
        }))
    }
	
	handleDoubleClick(e) {
		let el_key = this.props.dbkey;
		this.props.handleDblClick && this.props.handleDblClick(el_key);
	}

	dragBoundFunc = (pos) => {
		const group = this.group,
            stage = group.getStage();
        return Utils.dragBoundProfileImage.call(this, stage, group, pos, Utils.intersectProfileImage);
	}

	handleImageDragEnd(){
		this.frame.listening(true);

		var thisElement = this.nodeImage;
		this.setState({
			x: thisElement.x(),
			y: thisElement.y(),
			width: thisElement.width(),
			height: thisElement.height()
		});

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
        }
        
		//Sync the current image information include X, Y, Width and Height
		this.syncToServer();
		this.nodeImage.getLayer().draw();
	}

	handleMouseDown = (e) => {
		this.frame.listening(false);

		const node = e.target;
		switch (node.getName()) {
			case 'topLeft':
				this.originalPos = this.BR.position();
				break;
			case 'topRight':
				this.originalPos = this.BL.position();
				break;
			case 'bottomRight':
				this.originalPos = this.TL.position();
				break;
			case 'bottomLeft':
				this.originalPos = this.TR.position();
				break;
			default:
		}
		this.anchor = node.getName();
		this.originalSize = this.nodeImage.size();
	}

	handleDragMove = (e) => {
		const node = e.currentTarget;
		let pointerPos = node.position(),
			originalPos = this.originalPos;
			
		const newPos = this.getNewPos(originalPos, pointerPos, this.originalSize);
		this.update(newPos, originalPos);
		this.group.draw();
	}

	getNewPos(original, pointer, originalSize) {
		const scaleX = (pointer.x - original.x) / originalSize.width,
			scaleY = (pointer.y - original.y) / originalSize.height,
			scale = Math.max(Math.abs(scaleX), Math.abs(scaleY)),
			fX = scaleX > 0 ? 1 : -1,
			fY = scaleY > 0 ? 1 : -1,
			newSize = {
				width: originalSize.width * scale,
				height: originalSize.height * scale
			};
		return {
			x: original.x + newSize.width * fX,
			y: original.y + newSize.height * fY
		}
	}
	
	//Update and re-draw the image
	update = (endPos, originalPos) => {
		const topLeft = this.TL,
			topRight = this.TR,
			bottomRight = this.BR,
			bottomLeft =this.BL,
			captionText = this.Caption;

		const minX = Math.min(endPos.x, originalPos.x),
			minY = Math.min(endPos.y, originalPos.y),
			maxX = Math.max(endPos.x, originalPos.x),
			maxY = Math.max(endPos.y, originalPos.y),
			topLeftPos = {
				x: minX,
				y: minY
			},
			topRightPos = {
				x: maxX,
				y: minY
			},
			botLeftPos = {
				x: minX,
				y: maxY
			},
			botRightPos = {
				x: maxX,
				y: maxY
			};

		switch (this.anchor) {
			case 'topLeft':
				topRight.position(topRightPos);
				bottomLeft.position(botLeftPos);
				break;

			case 'topRight':
				topLeft.position(topLeftPos);
				bottomRight.position(botRightPos);
				break;

			case 'bottomRight':
				bottomLeft.position(botLeftPos);
				topRight.position(topRightPos);
				break;

			case 'bottomLeft':
				bottomRight.position(botRightPos);
				topLeft.position(topLeftPos);
				break;

			default:
		}

		const newWidth = endPos.x - originalPos.x,
			newHeight = endPos.y - originalPos.y,
			image = this.nodeImage;

		image.position(topLeftPos);
		image.width(Math.abs(newWidth));
		image.height(Math.abs(newHeight));

		let font_size = Math.round(Math.abs(newHeight / Const.FONT_SIZE_RATIO));

		//set font size resize
		captionText.fontSize(font_size);
		captionText.width(Math.abs(newWidth));
		this.textFontSize = font_size;
		this.captionWidth = Math.abs(newWidth);

		captionText.position({
            x: minX,
            y: maxY + Const.PADDING_CAPTION
        })

		// this.props.handleResizeButton && this.props.handleResizeButton(
		// 	newPos,
		// 	{
		// 		width: newWidth,
		// 		height: newHeight
		// 	}
		// );
	}

	//change course and stroke when move mouse in/out img
	handleMouseOver(e) {
		let layer = this.getLayer();
        document.body.style.cursor = 'pointer';
        this.setStrokeWidth(4);
        layer.draw();
	}

	handleMouseOut(e) {
		let layer = this.getLayer();
        document.body.style.cursor = 'default';
        this.setStrokeWidth(2);
        layer.draw();
	}

	syncToServer(){
		const requestBody = {
            uid:this.state.uid,
            key:this.state.key,
            content:this.state.src,
            stage:{
                x:this.state.x + this.group.x(),
                y:this.state.y + this.group.y(),
                width:this.state.width,
                height:this.state.height
            }
        },
        gotoHome = this.props.gotoHome

        TrService.updateImage(requestBody, response => {
            if (gotoHome) {
                window.location.href = '/home'
            }
        });
	}

	handleEnterGroup = (e) => {
		Utils.showBorder(e, true);
	}

	handleLeaveGroup = (e) => {
		Utils.showBorder(e, false);
	}

	handleRemoving(){
		let key = this.state.key,
			uid = this.state.uid;
		TrService.deleteElementOnDb(uid, key);
	}

	render(){
		let fill = "black";
		if (this.props.isVideo && this.state.image) {
			this.state.image.play();
		}

		return (
			<Group
				ref={node => (this.group = node)}
				name={Const.KONVA.TIME_LINE_NODE}
				draggable={this.props.hasPermission}
				onDragend={this.handleImageDragEnd}
				date_created = {this.props.date_created}
				onDblClick = {this.handleDoubleClick}
				dragBoundFunc={this.dragBoundFunc}
				>
				<Image
					ref = {node => this.nodeImage = node}
					x = {this.state.x}
					y = {this.state.y}
					image={this.state.image}
					width = {this.state.width}
					height = {this.state.height}
					handleResizeButton = {this.handleResizeButton}
				/>
                <Rect
                    ref={node => this.frame = node}
                    name={Const.SHAPE_TYPE.IMAGE}
                    x={this.state.x}
                    y={this.state.y}
                    createdBy={this.props.createdBy}
                    stroke='rgb(102, 102, 102)'
                    strokeWidth={1}
                    strokeEnabled={false}
                    width={this.state.width}
                    height={this.state.height}
                    onRemove={this.handleRemoving}
                    onShowTransform={this.handleShowTransform}
                    onHideTransform={this.handleHideTransform}
                    onMouseOver={this.handleEnterGroup}
                    onMouseOut={this.handleLeaveGroup}
					onStageWheel={this.handleStageWheel}
                />
                
                {/* Top Left Anchor  */}
                <Circle
                    ref={node => (this.TL = node)}
                    x={this.state.x} 
                    y={this.state.y} 
                    draggable={this.props.hasPermission}
                    stroke={this.state.anchor.stroke}
                    fill={this.state.anchor.fill}
                    strokeWidth={this.state.anchor.strokeWidth}
                    radius={this.state.anchor.radius}
                    name="topLeft"
                    visible={this.props.hasPermission && this.state.visibleTransform}
                    onDragMove={this.handleDragMove}
                    onMouseDown={this.handleMouseDown}
                    onMouseOver={this.handleMouseOver}
                    onMouseOut={this.handleMouseOut}
                />

                {/* Top Right Anchor  */}
                <Circle
                    ref={node => (this.TR = node)}
                    x={this.state.x + this.state.width} 
                    y={this.state.y}
                    draggable={this.props.hasPermission}
                    stroke={this.state.anchor.stroke}
                    fill={this.state.anchor.fill}
                    strokeWidth={this.state.anchor.strokeWidth}
                    radius={this.state.anchor.radius}
                    name="topRight"
                    visible={this.props.hasPermission && this.state.visibleTransform}
                    onDragMove={this.handleDragMove}
                    onMouseDown={this.handleMouseDown}
                    onMouseOver={this.handleMouseOver}
                    onMouseOut={this.handleMouseOut}
                />

                {/* Bottom Right Anchor  */}
                <Circle
                    ref={node => (this.BR = node)}
                    x={this.state.x + this.state.width}
                    y={this.state.y + this.state.height}
                    draggable={this.props.hasPermission}
                    stroke={this.state.anchor.stroke}
                    fill={this.state.anchor.fill}
                    strokeWidth={this.state.anchor.strokeWidth}
                    radius={this.state.anchor.radius}
                    name="bottomRight"
                    visible={this.props.hasPermission && this.state.visibleTransform}
                    onDragMove={this.handleDragMove}
                    onMouseDown={this.handleMouseDown}
                    onMouseOver={this.handleMouseOver}
                    onMouseOut={this.handleMouseOut}
                />

                {/* Bottom Left Anchor  */}
                <Circle
                    ref={node => (this.BL = node)}
                    x={this.state.x}
                    y={this.state.y + this.state.height}
                    draggable={this.props.hasPermission}
                    stroke={this.state.anchor.stroke}
                    fill={this.state.anchor.fill}
                    strokeWidth={this.state.anchor.strokeWidth}
                    radius={this.state.anchor.radius}
                    name="bottomLeft"
                    visible={this.props.hasPermission && this.state.visibleTransform}
                    onDragMove={this.handleDragMove}
                    onMouseDown={this.handleMouseDown}
                    onMouseOver={this.handleMouseOver}
                    onMouseOut={this.handleMouseOut}
                />

				<Text
					ref={node => (this.Caption = node)}
					x={this.state.x}
					y={this.state.y + this.state.height + 5}
					text={this.props.caption}
					fontSize={this.textFontSize}
					fontFamily={"'Gaegu', Helvetica"}
					width={this.captionWidth}
					fill={fill}
				/>
			</Group>
		);
	}
}

export default TRImage;