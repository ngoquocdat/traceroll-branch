import React, { Component } from 'react';
import { Group, Image} from 'tr-react-konva';
import { TRImage } from '../';

const BUTTON = {
	width: 64,
	height: 64,
	src: "../img/tools/youtube.png"
}

class TRImageVideo extends Component{
	constructor(props){
		super(props);
		this.state = {
			buttonImg: null,
			button: {
				x: 0,
				y: 0,
				width: 0,
				height: 0
			}
		}

		this.handleResizeButton = this.handleResizeButton.bind(this);
	}

	componentWillMount() {
		const imagePos = {
				X: this.props.x,
				Y: this.props.y
			},
			imageSize = {
				width: this.props.width,
				height: this.props.height
			},
			widthScale = imageSize.width / BUTTON.width,
			heightScale = imageSize.height / BUTTON.height;
		this.initalScale = widthScale < heightScale ? widthScale : heightScale;
		this.updateButton(imagePos, imageSize);
	}

	updateButton(newPos, newSize) {
		if (newPos && newSize) {
			const newButtonSize = {
				width: newSize.width / this.initalScale,
				height: newSize.height / this.initalScale
			}
			const button = {
				width: newButtonSize.width,
				height: newButtonSize.height,
				x: newPos.X + (newSize.width - newButtonSize.width) / 2,
				y: newPos.Y + (newSize.height - newButtonSize.height) / 2
			};
			this.setState({
				button
			});
		}
		
	}

	componentDidMount() {
		const img = new window.Image();
		img.src = BUTTON.src;
		img.onload = () => {
			this.setState({
				buttonImg: img
			});
		}
	}

	handleResizeButton(newPos, newSize){
		if (newPos && newSize) {
			this.updateButton(newPos, newSize);
		}
	}

	render(){
		const width = this.props.width,
			height = this.props.height,
			X = this.props.x,
			Y = this.props.y;

		const fontSize = 16, fill = "black";

		return (
            <TRImage
                ref={node => (this.image = node)}
                uid={this.props.uid}
                ownerid={this.props.ownerid}
                dbkey={this.props.dbkey}
                src={this.props.src}
                x={X}
                y={Y}
                width={width}
                height={height}
                date_created={this.props.date_created}
                createdBy={this.props.createdBy}
                handleDblClick={this.props.handleDblClick}
                el_type={this.props.el_type}
                caption={this.props.caption}
                hasPermission={this.props.hasPermission}
				showToast={this.props.showToast}
				isVideo={true}
            />
		);
	}
}

export default TRImageVideo;