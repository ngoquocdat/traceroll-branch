import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import {
	TRMenu, TRProfileImage
} from './../Elements';
import {Stage, Layer, Text} from 'tr-react-konva';
import {SliderPicker} from 'react-color';
import $ from 'jquery';
import './style.css'

class ProfileImageDock extends Component {
	constructor(props) {
		super(props)
		this.state = {
			

		}
	}

	render(){
		var pos={x:20,y:25};
		return(
			<button className="profile-image-dock">
				<section>
					<Stage
						width={350}
						height={50}>
						<Layer>
							<TRProfileImage
								centerPos={pos}
								username={this.props.userslug}
								src={this.props.src}
								uid={this.props.uid}
								ownerid={this.props.ownerid}
								showDrawTool={this.props.showDrawTool}
								toggleFollowingModal = {this.props.toggleFollowingModal}
								updateAvatar = {this.props.callUserInfo}
								showProfileWindow={this.props.handleOpenProfileWindow}
								isHiding={true}
							/>	
							<Text x="60" y="0" text={this.props.username} fontSize="10px" fontFamily="AvenirNext-Regular" fontStyle="bold"/>			
						</Layer>
						
					</Stage>
				</section>
			</button>

		)
	}
}

export default ProfileImageDock