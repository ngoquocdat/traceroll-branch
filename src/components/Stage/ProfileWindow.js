import React, { Component } from 'react';
import Toggle from 'react-toggle';

import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';

import Utils from '../Util/utils.js';
import TrService from '../Util/service.js';

import './style.css';
import 'react-toggle/style.css';

class ProfileWindow extends Component {
	constructor(props) {
		super(props);
		this.state={
			profileImageFilePath: this.props.profileImage,
			followings: 0,
			followers: 0,
			isHide:this.props.isProfileImageHide
		};
	}
	
	componentWillMount() {
		if (this.props.uid) {
			TrService.followDetail({userId: this.props.uid}, (res) => {
				const results = res.data.results;
				const followings = results.followings.length;
				const followers = results.followers.length;

				this.setState({
					...this.state,
					followings,
					followers
				})
			})
		}
	}

	getInputFile() {
		return document.querySelector('#new_profile_image');
	}
	
	validFileType(file) {
		return file.type.includes('image/');
	}

	handleChangeProfileImage = () => {
		if (this.props.uid !== 0 &&
			this.props.ownerid !== 0 &&
			!this.props.showDrawTool) {
			// If is owner
			if (this.props.uid === this.props.ownerid) {
				let input = this.getInputFile();
				input.click();
			}
		}
	}
	
	handelHideProfileImageChange = (e) =>{
		this.props.handleToggleProfileImage(e.target.checked);
		this.setState({isHide: e.target.checked});
		TrService.updateProfileImageHide({ isHide: e.target.checked }, (response) => { 
			if(200 != response.status){
				alert("Error during saving")
			}});

	}
	updateImageDisplay = (e) => {
		const input = e.target;
		if (input) {
			const files = input.files;
			if (files.length > 0) {
				const file = files[0];
				if (this.validFileType(file)) {
					this.loadImage(window.URL.createObjectURL(file), function(err) {
						if (!err) {
							this.updateProfileImage(this.props.uid, file);
							this.isUpdated = true;
						}
					}.bind(this));
				} else {
					alert(file.name + ': Not an image file.')
				}
			}
		}
	}
	
	loadImage = (src, callback) => {
		if (!src) {
			return;
		}
		const image = new window.Image();
		image.onload = () => {
			this.setState({
				image: image
			})
			callback && callback();
		}
		image.onerror = (e) => {
			alert("Can't open this file.");
			callback && callback(e);
		}
		image.src = src;
		this.src = src;
		this.isUpdated = false;
	}
	
	updateProfileImage = (uid, file) => {
		Utils.showProcessingBar();
		const callback = function(response) {
			const body = response.data;
			if (body && body.status !== "FAILED"){
				const filePath = body.file_path;

				this.setState({
					profileImageFilePath: filePath
				})

				TrService.updateProfileImagePath({
					uid: uid,
					filePath: filePath
				});
				
				this.props.updateAvatar(filePath);
			}
		}
		TrService.uploadImage(file, callback.bind(this))
	}

	render() {
		if (!this.props.openProfileWindow) {
			return null;
		}
		console.log(this.props.profileImage);
		return (
			<div id="profile-window" className="profile-window-container">
				<div className="user-picture" style={{backgroundImage: `url(${this.state.profileImageFilePath})`}}>
				</div>
				<div className="user-overview">
					<div className="profile-user-name">{this.props.username}</div>
					<div className="user-follow-container">
						<span className="user-follower">{`${this.state.followers} Followers`}</span>
						<span className="user-following">{`${this.state.followings} Followings`}</span>
					</div>
					<div className="user-change-image" onClick={this.handleChangeProfileImage}>
						<u>Change Profile Image</u>
						<input type="file" id="new_profile_image" name="new_profile_image" accept="image/*" style={{display:'none'}} onChange={this.updateImageDisplay}/>
					</div>
					<div className="user-hide-image">
						Hide Profile Image
					</div>
					<span className="user-toggle-button">
						<Toggle
							defaultChecked={this.state.isHide}
							icons={false} 
							onChange={this.handelHideProfileImageChange}/>
					</span>
				</div>
				<span className="user-close-button glyphicon glyphicon-remove" onClick={()=>this.props.closeProfileWindow()}/>
			</div>
		)
	}
}

export default ProfileWindow;