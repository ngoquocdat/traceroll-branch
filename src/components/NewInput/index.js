import React, { Component } from 'react';
import './style.css';
//============================================
//THE INPUT TO CHANGE TEXT
//============================================
class NewInput extends Component{
	constructor(props){
		super(props);
		//position and key
		this.state = {
			x: parseInt(props.x) || 0,
			y: parseInt(props.y) || 0,
			key: 'newText'
		}
	}

	render(){
		return (
			<div id="newTextWrapper" style={{display:'none'}}>
				<input id="newText" type="text" refs={this.state.key} />		
			</div>
		);
	}

}

export default NewInput;