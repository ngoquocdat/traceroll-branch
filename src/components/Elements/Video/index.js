import React, { Component } from 'react';
import './style.css';


class TRVideo extends Component{
	constructor(props){
		super(props);
		this.state = {
			videoURL: this.props.videoURL,
			type: "video/mp4",
		}
		this.playPause = this.playPause.bind(this);
		this.onPlay = this.onPlay.bind(this);
		this.onPause = this.onPause.bind(this);
		this.handleVideoEnd = this.handleVideoEnd.bind(this);
		this.handleDblClick = this.handleDblClick.bind(this);
	}

	componentWillMount(){

	}

	componentDidMount() {
		this.video.addEventListener('dblclick', this.handleDblClick);
	}

	componentWillUnmount() {
		this.video.removeEventListener('dblclick', this.handleDblClick);
	}

	playPause(){
		const video = this.video;
	    if (video.paused) {
	        video.play();
	    } else { 
	        video.pause();
	    }
	}

	onPlay() {
		let el_className = "play-button-" + this.props.el_id;
		document.getElementsByClassName(el_className)[0].className += ' hide-button';
	}


	onPause() {
		let el_className = "play-button-" + this.props.el_id;
		this.hideClass(el_className);
	}

	handleVideoEnd(){
		let el_className = "play-button-" + this.props.el_id;
		this.hideClass(el_className);
	}

	hideClass(el_className){
		const button = document.getElementsByClassName(el_className)[0],
        	newClassName = button.className.replace(' hide-button', '');
    	button.className = newClassName;
	}

	handleDblClick() {
		const href = this.props.href;
		if (href && href.length > 0) {
			window.location.href = href;
		}
	}

	render(){
		return (
			<div>
				<video 	ref={video => (this.video = video)}
					width='100%'
					onClick={this.playPause}
					onEnded={this.handleVideoEnd}
					onPause={this.onPause}
					onPlay={this.onPlay}
					>
					<source
						src={this.props.videoUrl} 
						type={this.state.type}
					/>
				</video>
                <img className={"play-button play-button-"+this.props.el_id}
                    alt=''
                    src='/img/tools/play-button.svg'
                    onClick={this.playPause}
                    >
                </img>
			</div>
		);
	}

}

export default TRVideo;