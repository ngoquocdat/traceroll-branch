import React, { Component } from 'react';
import {Stage, Group, Layer} from 'tr-react-konva';
import Dropzone from 'react-dropzone';
import $ from 'jquery';
import async from 'async';
import {request} from 'request';
import io from "socket.io-client";
import config from '../../config.json';
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';

import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';


import axios from 'axios';
import {
	TRText, TRImage, TRImageVideo, TRMenu, TRDrawing, TRLine,TRLineBrush,
	TRSelectMoveGroup, TRTheatre, TRLineGroup, TRSearch, TRProfileImage,
	TRFollowingModal, TROptMenu, TRNotification, TRNotificationBox, TRToast,
	TRProgress,
} from './../Elements';
import TRElementOptions from '../ElementOptions';
import Const from '../Util/const.js';
import Utils from '../Util/utils.js';
import TrService from '../Util/service.js';
import { linesInsidePolygon } from '../Elements/SelectMoveGroup';
import Sidebar from './Sidebar';
import ProfileWindow from './ProfileWindow';
import ProfileImageDock from './ProfileImageDock';

import './style.css';

const { SELECT } = Const.MODE
const {
	DEFAULT_MAX_IMAGE_SIZE,
	DEFAULT_MAX_IMAGE_WIDTH,
    DEFAULT_MAX_IMAGE_HEIGHT,
	DEFAULT_MAX_VIDEO_SIZE,
	DEFAULT_MAX_VIDEO_DURATION,

} = Const;

class TR_Stage extends Component{
	constructor(props){
		super(props);
		this.state = {
			container: 'root',
			//default width and height of Stage (cover the screen)
			width: window.innerWidth,
			height: window.innerHeight,
			//List elements of Stage
			childs: [],
			userslug: this.props.params.userslug,
			user: {
				picture: null
			},
			loginUser: {},
			loginUserAvatar: '',
			focusId: this.props.params.elementId || -1,
			joinDate:0,
			now:Date.now(),
			step:1000,
			swiperOption:{
				auto: 0,
					speed: 300,
					disableScroll: 'true',
					continuous: 'true'
			},
			options: {
				color: props.color || "black",
				mode: 'pen'
			},
			line: {
				points: [],
				mode: 'pen',
				color: ''
			},
			lines: [],
			drawings: [],
			groupArr: [],
			showTimeLine: false,
			showTheatre: false,
			showDrawTool: false,
			showFollowingModal: false,
			showNotification: false,
			elementShowOptions: null,
			currentElement: '',
			isPointer: false,
			x1: 0,
			y1: 0,
			x2: window.innerWidth,
			y2: window.innerHeight,
			isValidLink: true,
			showOptMenu: false,
			hasPermission: false,
			hasNewNoti: false,
			progressPercent: 0,
			mainStageMoving: false,
			openProfileWindow: false,
			isPressDown: false,
			isProfileImageHide: false
		}

		// Context menu
		this.evt = null;
		this.elementTarget = null;
		this.windowMouseDown = false;

		//======================================
		//bind events to Stage Component
		//======================================

		this.handleAddText = this.handleAddText.bind(this)
		this.toggleTimeline = this.toggleTimeline.bind(this)
		this.handleChangeTimeline = this.handleChangeTimeline.bind(this)
		this.toggleTheatreMode = this.toggleTheatreMode.bind(this)
		this.toggleDrawingMenu = this.toggleDrawingMenu.bind(this)
		this.handlerChangePointer = this.handlerChangePointer.bind(this)
		this.handlerMenuChange = this.handlerMenuChange.bind(this)
		this.addNewLine = this.addNewLine.bind(this)
		this.getCurrentOption = this.getCurrentOption.bind(this)
		this.addImageOrTextClick=this.addImageOrTextClick.bind(this)
		this.resetDefaultMode = this.resetDefaultMode.bind(this)
		this.handleDropElement = this.handleDropElement.bind(this)
		this.handleAddVideo = this.handleAddVideo.bind(this)
		this.handleAddLink = this.handleAddLink.bind(this);
		this.handleLoginUserAvatarCallback = this.handleLoginUserAvatarCallback.bind(this);
		this.getUserInfoCallback = this.getUserInfoCallback.bind(this);
		this.toggleOptMenu = this.toggleOptMenu.bind(this);
		this.socket = io(config.url, {transports: ['websocket']});
		this.callUserInfo = this.callUserInfo.bind(this);
		this.handleEffectEraser = this.handleEffectEraser.bind(this);
		this.handleOnLoad = this.handleOnLoad.bind(this);
		this.updateElementShowOptions = this.updateElementShowOptions.bind(this);
	}

	isOwner = () => {
		return this.state.uid == this.state.ownerid
	}

	handleOnLoad(){
		 ( document.getElementById('inTurnFadingTextG') ) ? setTimeout(function(){
			 document.getElementById('inTurnFadingTextG').style.visibility = 'hidden';
		 }, 10000) : '';
	}

	handleRedirectPage = (e) => {
		let showDrawTool = this.state.showDrawTool
		let showTimeLine = this.state.showTimeLine

		if (showDrawTool) {

			if (this.getDrawingChildren().length > 0) {

				const isSave = window.confirm('You have drawings that are not saved yet. Would you like to save?')
				if (isSave) {

					this.gotoHome = true
					this.resetDefaultMode(showDrawTool, showTimeLine)

					e.preventDefault()
				}
			}
		}
	  }

	handleLoginUserAvatarCallback = response => {
		const responseData = response.data;
		this.setState({
			loginUserAvatar: responseData.data.picture
		})
	}

	// Get children list in drawing mode
	getDrawingChildren = () => {
		const group = this.newLinesGroup
		return group ? group.getChildren() : []
	}

	toggleOptMenu() {
		const showDrawTool = this.state.showDrawTool,
			showTimeLine = this.state.showTimeLine

		window.dataLayer.push({'event': 'logEvent', 'eventType': 'Options Menu Toggled', 'eventProperties':null});
		this.setState((prevState, props) => ({
			showOptMenu: !prevState.showOptMenu,
			showTheatre: false,
			showTimeLine: false,
			showDrawTool: false,
			showNotification: false,
			showFollowingModal: false,
		}));
		this.resetDefaultMode(showDrawTool, showTimeLine);
	}

	/**
	 * to create a shape with Konva and add to Stage
	 * @param {Object} line
	 */
	addNewLine = (line) => {
		if (line.mode === Const.MODE.SELECT) {
			const selectedLines = this.getSelectedLines(line.stage);
			this.setState({
				line: line.stage,
				selectedLines: selectedLines
			});
		} else {
			line.uid = this.state.uid;
			line.ownerid = this.state.ownerid;
			let lines = this.state.lines;
			lines.push(line);
			this.setState({
				lines: lines
			})
		}
	}

	/**
	 * Get shapes list selected in drawing mode
	 * @param {Object} line
	 */
	getSelectedLines = (line) => {
		const points = line.points;
		let selectedLines = [];
		if (points.length > 0) {
			const shapeLineArray = this.getLineArr();
			selectedLines = linesInsidePolygon(shapeLineArray, points);
		}
		return selectedLines;
	}

	getLineArr = () => {
		const self = this,
			stage = this.mainStage.getStage(),
			groupNewLine = stage.findOne('.' + Const.KONVA.NEW_LINES_CONTAINER_NAME);
		const lineArr = groupNewLine.getChildren(function(node){
			return Utils.isLine(node);
		});
		return lineArr;
	}

	addImageOrTextClick(){
		let showDrawTool = this.state.showDrawTool;
		let showTimeLine = this.state.showTimeLine;

		$('#owner-caption').val('');

		this.setState((prevState, props) => ({
			showTimeLine: false,
			showTheatre: false,
			showDrawTool: false,
			showOptMenu: false,
			showNotification: false,
			showFollowingModal: false,
		}));
		this.resetDefaultMode(showDrawTool, showTimeLine);
	}

	timeConverter(UNIX_timestamp){
			var a = new Date(UNIX_timestamp);
			var months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
			var year = a.getFullYear();
			var month = months[a.getMonth()];
			var date = a.getDate();
			var time = date + '/' + month + '/' + year ;
			return time;
	}

	handleSlider = (props) => {
		const Handle = Slider.Handle;
		const { value, dragging, index, ...restProps } = props;
		return (
			<Tooltip
				prefixCls="rc-slider-tooltip"
				overlay={this.timeConverter(value)}
				visible={dragging}
				placement="top"
				key={index}
			>
				<Handle value={value} {...restProps} />
			</Tooltip>
		);
	}

	toggleSidebar = () => {
		$(".sidebar").toggleClass('show')
	}

	toggleTimeline(){
		let showDrawTool = this.state.showDrawTool;
		let showTimeLine = this.state.showTimeLine;
		window.dataLayer.push({'event': 'logEvent', 'eventType': 'Timeline Activated', 'eventProperties':null});
		this.setState((prevState, props) => ({
			showTimeLine: !prevState.showTimeLine,
			showTheatre: false,
			showDrawTool: false,
			showOptMenu: false,
			showNotification: false,
			showFollowingModal: false,
		}));

		if (!showTimeLine) {
			this.setState({
				now: Date.now()
			})
		}

		this.resetDefaultMode(showDrawTool, showTimeLine);
	}

	resetDefaultMode(showDrawTool, showTimeLine){
		const stage = this.mainStage.getStage();
		if (showDrawTool) {
			const trSelectedLines = this.trSelectedLines;
			trSelectedLines.finishSelectMove();

			setTimeout(function() {
				this.createAndSaveGroup();
			}.bind(this), 50);

			this.handlerChangePointer('grabbing');
			this.setState({
				options: {
					color: 'black',
					mode: 'pen'
				}
			})
			this.addNewLine(
			{
				mode: 'select',
				stage: {
					points: [],
					color: 'black'
				}
			});
		}

		if (showTimeLine) {
			let element_list = Utils.getTimeLineElementList(stage);
			element_list.forEach(function(item){
				item.show();
			})
			stage.batchDraw();
		}

		this.hideOldTransforms()
		this.updateElementShowOptions(null)
	}

	createAndSaveGroup = () => {
		const group = this.newLinesGroup,
			children = group ? group.getChildren() : [],
			self = this
		if (children.length > 0) {

			this.Toast.show('Saving ...')

			const clone = group.clone(),
				now = Date.now(),
				rect = Utils.getClientRect(group),
				uid = this.state.uid,
				ownerid = this.state.ownerid,
				groupArr = this.state.groupArr

			const localKey = uid + "-" + now

			async.waterfall([
				function(next) {
					clone.toImage({
						callback: img => {
							const src = img.src.replace('data:image/png;base64,', '')
							TrService.uploadBase64({ src }, res => {
								next(null, res)
							})
						},
						x: rect.x,
						y: rect.y,
						width: rect.width,
						height: rect.height,
					})
				},
				function(res, next) {
					clone.destroy()

					const body = res.data
					if (body.error_code == 1) {
						next(body)
						return
					}

					const requestBody = {
						uid: uid,
						ownerid: ownerid,
						drawing_type: Const.SHAPE_TYPE.GROUP,
						content: body.file_path,
						stage: {
							x: rect.x,
							y: rect.y,
							width: rect.width,
							height: rect.height
						},
						key: localKey,
						created_by: uid,
						date_created: now,
						newCreated: true,
						_key: 'element:' + localKey,
					}

					groupArr.push(requestBody);

					setTimeout(() => {
						group.destroyChildren();
						self.setState({
							groupArr: groupArr
						})
					}, 1);

					TrService.saveDrawingElement(requestBody, res => {
						next(null, res)
					})
				},
				function(res, next) {
					let body = res.data
					let data = body.data
					if (uid !== ownerid) {
						const elementId = data.data.id
						self.createNotification(elementId, 'drawing', ownerid)
					}
					next(null)
				},
			],
			function(err) {
				self.Toast.hide()
			})
		}
	}

	//Toggle Theatre mode
	toggleTheatreMode(currentElement){
		let showDrawTool = this.state.showDrawTool;
		let showTimeLine = this.state.showTimeLine;
		let showTheatre = this.state.showTheatre;

		window.dataLayer.push({'event': 'logEvent', 'eventType': 'Theatre Activated', 'eventProperties':null});
		if (showTheatre) {
			this.addWheelListener();
		} else {
			this.removeWheelListener();
		}

		let result = typeof currentElement === 'string' ? currentElement : '';
		this.setState((prevState, props) => ({
			showTimeLine: false,
			showTheatre: !prevState.showTheatre,
			showDrawTool: false,
			showOptMenu: false,
			currentElement: result,
			showNotification: false,
			showFollowingModal: false,
		}));

		this.resetDefaultMode(showDrawTool, showTimeLine);
	}

	toggleFollowingModal = () => {
		let showFollowingModal = this.state.showFollowingModal;
		this.showFollowingModal(!showFollowingModal);
	}

	showFollowingModal = (isShow) => {
		this.setState({
			showFollowingModal: isShow,
			showNotification: false,
			showTimeLine: false,
			showTheatre: false,
			showDrawTool: false,
			showOptMenu: false,
			hasNewNoti: false,
		})
	}

	toggleNotification = () => {
		const showNotification = this.state.showNotification,
			showDrawTool = this.state.showDrawTool,
			showTimeLine = this.state.showTimeLine
			this.setShowNotification(!showNotification, !showNotification);

		this.resetDefaultMode(showDrawTool, showTimeLine)
	}

	setShowNotification = (showNotification, showOptMenu) => {
		this.setState({
			showNotification: showNotification,
			showTimeLine: false,
			showTheatre: false,
			showDrawTool: false,
			showOptMenu: showOptMenu,
			hasNewNoti: false,
			showFollowingModal: false,
		})


        if(this.state.showNotification == false){
            this.removeWheelListener()
        }else{
            this.addWheelListener()
        }
	}

	handleChangeTimeline(cur_value){
		const stage = this.mainStage.getStage(),
			element_list = Utils.getTimeLineElementList(stage);
		element_list.forEach(function(item){
			if (item.getAttr('date_created') > cur_value) {
				item.hide();
			} else {
				item.show();
			}
		})
		stage.batchDraw();
	}

	handleStageContentMouseDown = (e) => {
		const mode = this.state.options.mode,
			showDrawTool = this.state.showDrawTool,
			stage = this.mainStage.getStage(),
			{ button, clientX, clientY } = e.evt,
			pos = {
				x: clientX,
				y: clientY
			}

		if (Utils.isLeftClick(button) && typeof(this.state.cursor) != 'undefined' ) {

			if(mode === 'eraser'){
				this.handlerChangePointer('eraser-on');
			} else {
				let shape = this.handleStageContentClick(e)

				if (shape && !Utils.isObjectContainString(Const.SHAPE_TYPE, shape.name())) {
					shape = null;
				}

				const element = showDrawTool ? null : shape
				this.handleShowElementOptions(element);

				if(this.state.cursor === 'grab'){
					this.handlerChangePointer('grabbing');
				}
			}
		}else{
			 this.handlerChangePointer('grabbing');
		}
	}

	/* Event change pointer in drawing*/
	handlerChangePointer(mode) {
		this.setState({
			cursor: mode
		})
		// document.body.style.cursor = Const.CURSOR[mode]

	}

	handleStageContentClick = (e) => {
		const stage = e.currentTarget,
			target = stage.getIntersection(stage.getPointerPosition());

		if (target && target.className === 'Circle') {
			return target
		}

		if (!target || !target.hasName(Const.SHAPE_TYPE.IMAGE)) {
			this.hideOldTransforms();
			return target
		}

		if (target === this.oldTransform) {
			return target
		}

		this.hideOldTransforms();

		target.fire(Const.EVENTS.SHOW_TRANSFORM);
		this.oldTransform = target;

		return target
	}

	hideOldTransforms = () => {
		const node = this.oldTransform;
		if (node) {
			node.fire(Const.EVENTS.HIDE_TRANSFORM);
			this.oldTransform = null;
		}
	}

	handleShowElementOptions = (elementShowOptions) => {
		if (elementShowOptions) {
			const attrs = elementShowOptions.attrs
			const createdBy = attrs.createdBy
			if ((createdBy && createdBy == this.state.uid) || (this.state.uid == this.state.ownerid)) {

				const group = elementShowOptions.getParent()
				group.setZIndex(1000)
				group.draw()

				this.updateElementShowOptions(elementShowOptions)
			} else {
				this.updateElementShowOptions(null)
			}
		} else {
			this.updateElementShowOptions(null)
		}
	}

	updateElementShowOptions(elementShowOptions){
		this.setState({
			elementShowOptions: elementShowOptions
		})
	}

	handleContextMenu = (e) => {
		e.preventDefault()
	}

	//==========================================
	// Handle mouse wheel
	//==========================================
	handleMouseWheel = (e) => {
		e.preventDefault()

		if (this.windowMouseDown) {
			return
		}

		const stage = this.mainStage.getStage(),
			{ x, y } = this.currentPointerPos

		if (stage) {

			let oldScale = stage.scaleX(),
				mousePointTo = {
					x: (x - stage.x()) / oldScale,
					y: (y - stage.y()) / oldScale,
				},
				// e.deltaY to catch when scroll down (-100) or up (100)
				newScale = e.deltaY > 0 ? oldScale * Const.SCALE_BY : oldScale / Const.SCALE_BY,
				scaleRatioFor3 = (Math.abs(newScale - oldScale))/12;


			if (newScale >= Const.ZOOM.max || newScale <= Const.ZOOM.min) {
				return
			}

			if(e.deltaY < 0){ // when mouse wheel scroll up - zoom in

				let oldScaleIn = oldScale;

				while(oldScaleIn < newScale){
					let tempNewScale = oldScaleIn + scaleRatioFor3;

					let newPos = {
						x: -(mousePointTo.x - x / tempNewScale) * tempNewScale,
						y: -(mousePointTo.y - y / tempNewScale) * tempNewScale
					}

					stage.scale({ x: tempNewScale, y: tempNewScale });
					stage.position(newPos);
					stage.batchDraw();

					oldScaleIn = tempNewScale;
				}

			}else{ // when mouse wheel scroll down - zoom out

				let oldScaleOut = oldScale;

				while(oldScaleOut > newScale){
					let tempNewScale = oldScaleOut - scaleRatioFor3;

					let newPos = {
						x: -(mousePointTo.x - x / tempNewScale) * tempNewScale,
						y: -(mousePointTo.y - y / tempNewScale) * tempNewScale
					}

					stage.scale({ x: tempNewScale, y: tempNewScale })
					stage.position(newPos)
					stage.batchDraw()

					oldScaleOut = tempNewScale;
				}

			}

			// const newPos = {
			// 	x: -(mousePointTo.x - x / newScale) * newScale,
			// 	y: -(mousePointTo.y - y / newScale) * newScale
			// }

			// stage.scale({ x: newScale, y: newScale })
			// stage.position(newPos)
			// stage.batchDraw()

			this.updateTransformCircle(newScale)
		}
	}

	getMainStage = () => {
		return this.mainStage.getStage()
	}

	updateTransformCircle = (newScale) => {
		if(this.oldTransform) {
			this.oldTransform.fire(Const.EVENTS.STAGE_WHEEL);
		}
	}

	componentWillMount() {
	   const userslug = this.state.userslug;

	   //Getting join_date of stage owner
		const getUserJoinDateCallback = function(response) {
			const body = response.data,
				  loginUser = body.user,
				  userId = loginUser.userId,
				  ownerId = body.owner,
				  profilePosition = body.data.profilePosition;

			//checks to set profile data to loginUser
			(body.user.username === body.data.username) ? this.setState({loginUserAvatar: body.data.picture}) : 	TrService.getUserJoinDate(body.user.username, this.handleLoginUserAvatarCallback);

			this.setState({
				joinDate: body.data.joinDate,
				user: body.data,
				loginUser: loginUser,
				isHideProfileImage: body.data.isProfileImageHide? true : 1 == body.data.isProfileImageHide,
				ownerid: ownerId,
				uid: userId
			});

			const size = this.getCanvasSize(),
				centerPosition = {
					x: size.width / 2,
					y: size.height / 2,
				}

			if (profilePosition) {
				const distanceToCenterPosition = {
					x: centerPosition.x - profilePosition.x,
					y: centerPosition.y - profilePosition.y
				}

				this.setState({ profilePosition })

				const stage = this.mainStage.getStage()

				if (stage) {
					stage.position({
						x: distanceToCenterPosition.x,
						y: distanceToCenterPosition.y
					})
					stage.batchDraw()
				}

			} else {

				this.setState({
					profilePosition: centerPosition
				})
				TrService.updateProfilePosition({ position: centerPosition })
			}

			this.socket.emit('join', {userId: userId})

			if (userId == ownerId) {
				this.setState({
					hasPermission: true
				})
			}
			else {
				const checkPermissionCallback = function(response) {
					let data = response.data;
					this.setState({
						hasPermission: data.hasPermission
					})
				}

				TrService.checkPermission({
					ownerId: ownerId
				}, checkPermissionCallback.bind(this));
			}
		}

		TrService.getUserJoinDate(userslug, getUserJoinDateCallback.bind(this));

		const getElementListCallback = function(response) {
			let elementList = response.data;
			this.setState({
				//Element arrays
				childs: elementList.data,
			})
		}

		TrService.getElementList(userslug, getElementListCallback.bind(this));
	}

	componentDidUpdate() {
		//============================
		//Zoom on Component on click
		//============================
		const focusId = this.state.focusId,
			children = this.state.childs;

		if (focusId !== -1 && children.length !== 0) {
			const stage = this.mainStage.getStage(),
				viewportW = window.innerWidth,
				viewportH = window.innerHeight;

			let frameW, frameH,
				x, y;

			children.some(item => {
				if (item._key === "element:" + focusId) {
					if (item.type === "text") {
						// Get Width + Height element is Text by using rect wrapper
						// this.refs["element:10406"].refs["element:10406_wrapper"].width()
						let element_text = this.refs[item._key].text;
						frameW = element_text.width();
						frameH = element_text.height();
						x = item.stage.x;
						y = item.stage.y;
					} else {
						let rect = Utils.getRect(item),
							posX = item.stage.x,
							posY = item.stage.y;
						if (!item.content) {
							rect.x += posX;
							rect.y += posY;
						}

						x = rect.x;
						y = rect.y;
						frameW = rect.width;
						frameH = rect.height;
					}
					return true;
				}
				return false;
			}, this);

			const ratioW = viewportW / frameW,
				ratioH = viewportH / frameH;

			let scale = Math.min(ratioW, ratioH);
			scale = this.getRightScale(scale);

			if (frameW && frameH) {
				//Scale and move Stage
				stage.x( - x * scale - (frameW * scale - viewportW) / 2);
				stage.y( - y * scale - (frameH * scale - viewportH) / 2);
				stage.scaleX(scale);
				stage.scaleY(scale);
			}
			this.setState({focusId:-1});
		}
		// turn on add image button
		document.getElementById('confirm_add_image').disabled=false;
	}

	getRightScale(scale) {
		let newScale = scale;
		if (newScale < Const.ZOOM.min) {
			newScale = Const.ZOOM.min;
		}
		else if (newScale > Const.ZOOM.max) {
			newScale = Const.ZOOM.max;
		}
		return newScale;
	}

	getCurrentOption() {
		return this.state.options;
	}

	//callback function
	getUserInfoCallback(response){

		const   body = response.data,
				loginUser = body.user,
				userId = loginUser.userId,
				ownerId = body.owner,
				profilePosition = body.data.profilePosition;

		this.setState({
		   user: body.data,
		   loginUser: loginUser,
		});

		//checks to set profile data to loginUser
		(body.user.username === body.data.username) ? this.setState({loginUserAvatar: body.data.picture}) : 	TrService.getUserJoinDate(body.user.username, this.handleLoginUserAvatarCallback);

	}

	hasPermission = () => {
		return this.state.hasPermission
	}

	updatePermission = (hasPermission) => {
		return this.setState({
			hasPermission: hasPermission
		})
	}

	showToast = (type) => {
		switch(type) {
			case Const.ToastType.NO_PER:
				this.Toast && this.Toast.show("You don't have permission to perform this action.")
				break
			case Const.ToastType.SAVING:
				this.Toast && this.Toast.show("Saving...")
				break

			default:
				this.Toast && this.Toast.show(type)


		}
	}

	hideToast = () => {
		this.Toast && this.Toast.hide()
	}

	componentDidMount() {
		window.addEventListener("load", this.handleOnLoad);
		this.addWheelListener();
		window.addEventListener("contextmenu", this.handleContextMenu);
		window.addEventListener("mousedown", this.handleWindowMouseDown);
		window.addEventListener("mouseup", this.handleWindowMouseUp);
		window.addEventListener("mousemove", this.handleWindowMouseMove);
		window.addEventListener("resize", this.handleWindowResize);
		this.setupSocketListener();

		Utils.hideOverflow();

		window.addEventListener('beforeunload', this.handleBeforeUnload);
	}

	addWheelListener = () => {
		window.addEventListener('wheel', this.handleMouseWheel);
	}

	callUserInfo(vals){
		const userslug = this.state.userslug;

		this.setState({
			src_picture: vals,
			src_pictureLoginUser: vals
		})
		//Getting join_date of stage owner

		TrService.getUserJoinDate(userslug, this.getUserInfoCallback);
	}

	handleWindowResize = () => {

		const   size = this.getCanvasSize(),
				stage = this.mainStage.getStage()

		stage.width(size.width)
		stage.height(size.height)
		stage.draw()

		this.setState({
			width: window.innerWidth
		})
	}

	getCanvasSize = () => {
		const   menuSize = Utils.getMainMenuSize(),
				normalHeight = window.innerHeight - menuSize.height

		return {
			width: window.innerWidth,
			height: (this.state.showDrawTool ? normalHeight - 80 : normalHeight)
		}
	}

	handleBeforeUnload = (e) => {

		let showDrawTool = this.state.showDrawTool
		let showTimeLine = this.state.showTimeLine

		if (showDrawTool) {

			if (this.getDrawingChildren().length > 0) {
				e.returnValue = "Do you want to leave?";
			}
		}
	}

	handleWindowMouseDown = (e) => {
		var currentCursorMode = this.state.cursor;
		var pointX = e.pageX;
		var pointY = e.pageY;
		const { button } = e,
			stage = this.mainStage.getStage()

		this.setState({
			isPressDown: !this.state.isPressDown,
		})

		/* Handle when mouse down is eraser right click*/
		if (button === 2) {
			this.hideOldTransforms()
			this.updateElementShowOptions(null)
			this.handlerChangePointer('select-on');
			this.setState({
				mainStageMoving: true
			})
			if (!stage.getPointerPosition()) {
				stage._setPointerPosition(e)
			}
			stage.startDrag();
		}

		/* Handle when mouse down is eraser left click*/
		if(button === 0 && currentCursorMode == 'eraser') {
			this.handleEffectEraser(currentCursorMode, pointX, pointY);
		}
	}

	handleWindowMouseUp = (e) => {
		const mode = this.state.options.mode,
			showDrawTool = this.state.showDrawTool,
			stage = this.mainStage.getStage(),
			button = e.button;

        $('.trail').remove();

        this.setState({
            isPressDown: !this.state.isPressDown,
        })

		if (button === 0) {
      if(this.state.cursor === 'grabbing'){
        this.handlerChangePointer('grab');
      } else if(mode === 'eraser'){
        this.handlerChangePointer(mode);
      }
		}
		else if (button === 2) {
			if (showDrawTool) {
				this.handlerChangePointer(mode);
			} else {
				this.handlerChangePointer('grab');
			}
		}
		this.windowMouseDown = false;
		this.evt = {
			pageX: e.pageX,
			pageY: e.pageY
		};

        this.setState({
            mainStageMoving: false
        })
	}

    /* Handle effect for eraser on keep press and move*/
    handleEffectEraser(mode, pointX, pointY) {
        var pressedLeft = this.state.isPressDown;

        if(mode == 'eraser' && pressedLeft === true){

            var dots = [],
            mouse = {
                x: pointX,
                y: pointY
            };

            var Dot = function() {
                this.x = pointX;
                this.y = pointY;
                this.node = (function(){
                    var n = document.createElement("div");
                    n.className = "trail";
                    // document.body.appendChild(n);
                    document.getElementById('Stage__main').appendChild(n);
                    return n;
                }());
            };

            Dot.prototype.draw = function() {
                this.node.style.left = this.x + "px";
                this.node.style.top = this.y + "px";
            };

            for (var i = 0; i < 250; i++) {
                var d = new Dot();
                dots.push(d);
            }

            function draw() {
                var x = mouse.x,
                    y = mouse.y;

                dots.forEach(function(dot, index, dots) {
                    var nextDot = dots[index + 1] || dots[0];

                    dot.x = x;
                    dot.y = y;
                    dot.draw();
                    x += (nextDot.x - dot.x) * .08;
                    y += (nextDot.y - dot.y) * .08;
                });
            }

            window.addEventListener("mousemove", function(event) {
                //event.preventDefault();
                mouse.x = event.pageX;
                mouse.y = event.pageY;
            });

            function animate() {
                draw();
                requestAnimationFrame(animate);
            }

            animate();
        }
    }

	/**
	* Function to check if we clicked inside an element with a particular class
	* name.
	*
	* @param {Object} e The event
	* @param {String} className The class name to check against
	* @return {Boolean}
	*/
	clickInsideElement(e, className) {
		let el = e.srcElement || e.target;

		if (el.classList.contains(className)) {
			return el;
		} else {
			while (el = el.parentNode) {
				if (el.classList && el.classList.contains(className)) {
					return el;
				}
			}
		}
		return false;
	}

	handleWindowMouseMove = (e) => {
		this.currentPointerPos = {
			x : e.clientX,
			y : e.clientY
		}
		const { mainStageMoving } = this.state,
			shape = this.mainStage.getStage().getIntersection(this.currentPointerPos, "Group")

		if (shape && !mainStageMoving && shape.name() === Const.GROUP_NAME_LINES_SELECTED) {
			this.setState({
				mainStageMoving: true
			})
		}
	}

	handleOpenProfileWindow = () => {
		this.setState({
			...this.state,
			openProfileWindow: true
		})
	}

	handleCloseProfileWindow = () => {
		this.setState({
			...this.state,
			openProfileWindow: false
		})
	}

	mouseLeaveGroupLinesSelected = () => {
		this.setState({
			mainStageMoving: false
		})
	}

	setupSocketListener = () => {
		const socket = this.socket
		socket.on('onFollow', (msg) => {
			this.notifyNewNotification(msg)
		})

		socket.on('onAllow', (msg) => {
			this.notifyNewNotification(msg)
			if (this.state.uid != this.state.ownerid) {
				this.setState({
					hasPermission: true
				})
			}
		})

		socket.on('onDisallow', (msg) => {
			this.notifyNewNotification(msg)
			if (this.state.uid != this.state.ownerid) {
				this.setState({
					hasPermission: false
				})
			}
		})

		socket.on('unfollow', (msg) => {
			if (this.Notification) {
				this.Notification.refresh()
			}
		})

		socket.on('receiveNotification', (msg) => {
			this.notifyNewNotification(msg)
		})
	}

	notifyNewNotification = (msg) => {
		if (this.Notification) {
			this.Notification.append(msg)
		} else {
			this.setState({
				hasNewNoti: true
			})
		}
		this.NotiBox && this.NotiBox.show()
	}

	createNotification = (elementId, elType, ownerId) => {
		const createNotificationCallback = function(res) {
			const body = res.data
			if (body && body.status !== "FAILED"){
				const notiId = body.notification
				const msg = {
					userId: ownerId,
					notiId: notiId,
					type: 'add'
				}
				this.socket.emit('sendNotification', msg)
			}
		}

		const createNotificationParams = {
			type: 'add',
			element: {
				type: elType,
				id: elementId,
				userslug: this.state.user.userslug
			},
			receiverId: ownerId
		}
		TrService.createNotificationAdd(createNotificationParams, createNotificationCallback.bind(this))
	}

	componentWillUnmount() {
		this.removeWheelListener();
		window.removeEventListener("contextmenu", this.handleContextMenu);
		window.removeEventListener("mousedown", this.handleWindowMouseDown);
		window.removeEventListener("mouseup", this.handleWindowMouseUp);
		window.removeEventListener("mousemove", this.handleWindowMouseMove);
	}

	removeWheelListener = () => {
		window.removeEventListener('wheel', this.handleMouseWheel);
	}

	//======================================
	//Handle add text from modal
	//======================================
	handleAddText() {
		if($("#text").val().trim() !== '') {

			const tempContent=$('#text').val();
			$('#text').val('');

			const content = tempContent;
			const textPos = {
				x: window.innerWidth / 2,
				y: window.innerHeight / 2 + Const.PROFILE_IMAGE_SIZE
			};
			const uId = this.state.uid,
			ownerId = this.state.ownerid
			const requestBody = {
				uid: uId,
				ownerid: ownerId,
				content:content,
				stage: textPos
			};
			const callback = function(response) {
				let dateNow = Date.now(),
					body = response.data;
				const element = {
					_key: body.data.id,
					type: 'text',
					content: content,
					ownerid: ownerId,
					stage: {
						x: textPos.x,
						y: textPos.y
					},
          created_by: uId,
					date_created: body.data.data.date_created
				};
				//clear input text
				$("#text").val("");
				//close modal add text
				$("#close_add_text_modal").trigger("click");
				this.setState({childs:[...this.state.childs,element]});

				if (uId !== ownerId) {
					const elementId = body.data.data.id
					this.createNotification(elementId, 'text', ownerId)
				}
				this.hideToast()
			}
			TrService.saveText(requestBody, callback.bind(this));
		}
		else {
			alert('Text isn\'t blank, please!!! ');
		}
	}

	//=============================================
	//Handle add video from modal - in progress
	//=============================================
	handleAddVideo(video_link, thumb_link, path, pathThumb, ownerCaption) {
		var video = document.createElement('video');

		video.onloadeddata = () => {
			const ratio = video.videoWidth / video.videoHeight;

			//set default Size of Img
			const thumbHeight = Const.IMAGE_HEIGHT;
			const thumbWidth = ratio * thumbHeight;

			//set default position of video
			const thumbX = window.innerWidth / 2 + Const.PROFILE_IMAGE_SIZE;
			const thumbY = window.innerHeight / 2 - thumbHeight / 2;
			const uId = this.state.uid,
				ownerId = this.state.ownerid
			const requestBody = {
				ownerid: ownerId,
				uid: uId,
				content_thumb:thumb_link,
				content_video:video_link,
				path: path,
				pathThumb: pathThumb,
				caption: ownerCaption,
				stage:{
					x:thumbX,
					y:thumbY,
					width: thumbWidth,
					height: thumbHeight
				}
			};
			const callback = function(response) {
        let body = response.data
        let data = body.data
				const element = {
					uid: uId,
					ownerid: ownerId,
					_key: data.id,
					content:thumb_link,
					content_video:video_link,
					caption: ownerCaption,
					type:'video',
					stage:{
						x:thumbX,
						y:thumbY,
						width:thumbWidth,
						height:thumbHeight
					},
          created_by: uId,
					date_created: Date.now(),
				};
				this.setState({childs:[...this.state.childs,element]});

                if (uId !== ownerId) {
                    const elementId = data.data.id
                    this.createNotification(elementId, 'video', ownerId)
                }
                this.hideToast()
			}

			TrService.saveVideo(requestBody, callback.bind(this));
		}

		video.onerror = this.showAlertFileInvalid;
		video.src = video_link;
	}

	showAlertFileInvalid = () => {
		alert('Your file is invalid. The file must be an image or video (mp4, ogg, webm).');
        this.hideToast()
    }

    showAlertFileInvalidSize() {
		alert('File is too large. The file must be less than 5MB for image and 25MB for video.');
    }

    showAlertVideoDuration() {
        alert('Video duration must be less than 60 seconds');
    }

    showAlertImageResolution() {
        alert('Image must be less than 2048x2048 pixels');
    }

	//=============================================
	//Handle add image from modal - in progress
	//=============================================
	handleAddImage(link, ownerCaption) {
		$("#image_link").val("");

		const img = new Image();
		img.onload = () => {
			const ratio = img.width / img.height;
			//set default Size of Img
			const imageHeight = Const.IMAGE_HEIGHT;
			const imageWidth = ratio * imageHeight;
			//set default position of Img
			const imageX = window.innerWidth / 2 + Const.PROFILE_IMAGE_SIZE;
			const imageY = window.innerHeight / 2 - imageHeight / 2;
            const uId = this.state.uid,
                ownerId = this.state.ownerid
			const requestBody = {
  				ownerid: ownerId,
  				uid: uId,
  				content:link,
  				caption: ownerCaption,
  				stage:{
  				x:imageX,
  				y:imageY,
  				width: imageWidth,
  				height: imageHeight
				}
			}
			const callback = function(response) {
        let body = response.data
        let data = body.data
				const element = {
					uid: uId,
					ownerid: ownerId,
					_key: data.id,
					content:link,
					caption: ownerCaption,
					type:'image',
					stage:{
						x:imageX,
						y:imageY,
						width:imageWidth,
						height:imageHeight
					},
          created_by: uId,
					date_created: Date.now(),
				};
				this.setState({childs:[...this.state.childs,element]});

                if (uId !== ownerId) {
                    const elementId = data.data.id
                    this.createNotification(elementId, 'image', ownerId)
                }
                this.hideToast()
			}

			TrService.saveImage(requestBody, callback.bind(this));
		}

		img.onerror = this.showAlertFileInvalid;
		img.src = link;
	}

	//Check input link is image or video
	handleAddLink(link, caption){
        if (!link || link.trim().length === 0) {
            alert('You must attach a file or link.');
            return;
        }

        const inputLink = document.getElementById('image_link')

        if (inputLink) {

            inputLink.value = ''
            this.closeAddImageModal()
            this.showToast(Const.ToastType.SAVING)
        }

		const newImage = new Image(),
			Caption = caption.trim();

		newImage.onload = (e) => {
			this.handleAddImage(link, Caption);
		};

		newImage.onerror = (e) => {
			const newVideo = document.createElement('video');
			newVideo.onloadeddata = () => {
				const requestBody = {
					link: link,
					elementDropType: 'video'
				}
				const callback = function(response){
                    const body = response.data

					if(body.error_code === 1) {
						alert('Error during create video thumb: ' + body.error_message);
                        this.hideToast()
					} else {
						this.handleAddVideo(body.link, body.thumbnail_path, body.path, body.pathThumb, Caption);
					}
				}
				TrService.createThumbnailVideo(requestBody, callback.bind(this));
			};

			newVideo.onerror = this.showAlertFileInvalid;
			newVideo.src = link;
		};

		newImage.src = link;
	}

	// Handle drop image to dropzone in modal
	handleDropElement(file) {
        if (!file || file.length < 1) {
            return;
        }

        const fileUpload = file[0];

        if(!this.validFileType(fileUpload)) {
            this.showAlertFileInvalid();
            return;
        };

        if (!this.validFileSize(fileUpload)) {
			this.showAlertFileInvalidSize();
			return false;
        }

		document.getElementById('confirm_add_image').disabled = true;

		const callback = function(response) {
			const body = response.data;
			if (body.status !== "FAILED"){
				//Get caption from modal
				let ownerCaption = $('#owner-caption').val().trim();

				switch(body.elementDropType){
					case "image":
						this.handleAddImage && this.handleAddImage(body.file_path, ownerCaption);
						break;
					case "video":
						if (body.error_code === 1) {
							alert('Error happened during upload video');
						} else if (body.error_code !== 1) {
							this.handleAddVideo && this.handleAddVideo(body.file_path, body.thumbnail_path, body.path, body.pathThumb, ownerCaption);
						}
						break;
					default:
						break;
				}
			}else{
				alert("Error happened during upload element");
			}
        }

        if (['video/mp4', 'video/ogg','video/webm'].indexOf(fileUpload.type) >= 0) {
            let video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadeddata = () => {
                window.URL.revokeObjectURL(video.src);

                if (video.duration <= DEFAULT_MAX_VIDEO_DURATION) {
                    TrService.uploadImage(fileUpload, callback.bind(this), this.updateProgress, this.Progress.show, this.Progress.hide)
                    this.closeAddImageModal()
                } else {
                    this.showAlertVideoDuration();
                    return false;
                }

            }
            video.src = window.URL.createObjectURL(fileUpload);
        } else {
            let image = new Image();
            image.onload = () => {
                window.URL.revokeObjectURL(image.src);

                if (image.width <= DEFAULT_MAX_IMAGE_WIDTH && image.height <= DEFAULT_MAX_IMAGE_HEIGHT) {
                    TrService.uploadImage(fileUpload, callback.bind(this), this.updateProgress, this.Progress.show, this.Progress.hide)
                    this.closeAddImageModal()
                } else {
                    this.showAlertImageResolution();
                    return false;
                }
            }
            image.src = window.URL.createObjectURL(fileUpload);
        }
	}

    closeAddImageModal = () => {
        $("#close_add_image_modal").trigger("click");
    }

	validFileType(file) {
        const type = file.type;
        return type.includes('image/') || type === 'video/mp4' || type === 'video/ogg' || type === 'video/webm';
    }

    validFileSize(file) {
		const type = file.type;
		const size = file.size;
		if (type.includes('image')) {
			return size <= DEFAULT_MAX_IMAGE_SIZE;
		} else {
            return size <= DEFAULT_MAX_VIDEO_SIZE;
		}
	}

	// ========== MENU ==
	/* MENU EVENT */
	handlerMenuChange(options) {
		this.setState({
			line: {
            	points: [],
            	color: 'black'
            },
			selectedLines: [],
			options: options,
      drawings: this.getLineArr()
		});
	}

	// Handler event on/off drawing mode
    toggleDrawingMenu() {
        if (!this.hasPermission()) {
            this.showToast(Const.ToastType.NO_PER)
            return
        }
		let showDrawTool = this.state.showDrawTool;
		let showTimeLine = this.state.showTimeLine;

		window.dataLayer.push({'event': 'logEvent', 'eventType': 'Drawing Started', 'eventProperties':null});

    	this.setState((prevState, props) => ({
			showTimeLine: false,
			showTheatre: false,
			showOptMenu: false,
			showDrawTool: !prevState.showDrawTool,
            showNotification: false,
            showFollowingModal: false,
		}));

    	if (!showDrawTool) {
			this.handlerChangePointer('pen')
        }

		this.resetDefaultMode(showDrawTool, showTimeLine);
    }

    closeDrawingMenuWithoutSaving = () => {

        this.setState((prevState, props) => ({
            showTimeLine: false,
            showTheatre: false,
            showOptMenu: false,
            showDrawTool: false,
            showNotification: false,
            showFollowingModal: false,
        }));

        const newLinesGroup = this.newLinesGroup
        if (newLinesGroup) newLinesGroup.destroyChildren()

        const trSelectedLines = this.trSelectedLines
        if (trSelectedLines) trSelectedLines.refs.group.destroyChildren()

        this.handlerChangePointer('default');
        this.setState({
            options: {
                color: 'black',
                mode: 'pen'
            }
        })
        this.addNewLine(
        {
            mode: 'select',
            stage: {
                points: [],
                color: 'black'
            }
        });
    }

    updateProgress = (percent) => {
        this.setState({
            progressPercent: percent
        })
    }

    handleToggleProfileImage = (isHide) =>{

		this.setState({
			...this.state,
			isHideProfileImage:isHide
		});
    }

    renderLine(data) {
    	let rect = Utils.getRect(data);
    	return (
    		<TRLine
          key={data._key}
  				ref={data._key}
  				points={data.stage.points}
  				stroke={data.stage.color}
  				strokeWidth={data.stage.strokeWidth}
  				date_created={data.date_created}
  				createdBy={data.created_by}
  				rect={rect}
  				uid={this.state.uid}
  				getOptions={this.getCurrentOption}
  				handleDblClick={this.toggleTheatreMode}
  				draggable={this.state.hasPermission && !this.state.showDrawTool}
			/>
    	)
    }

    renderLineBrush(data) {
    	let rect = Utils.getRect(data);
    	return (
    		<TRLineBrush
          key={data._key}
  				ref={data._key}
  				dbkey={data._key}
  				points={data.stage.points}
  				stroke={data.stage.color}
  				date_created={data.date_created}
  				createdBy={data.created_by}
  				rect={rect}
  				uid={this.state.uid}
  				getOptions={this.getCurrentOption}
  				handleDblClick={this.toggleTheatreMode}
  				draggable={this.state.hasPermission && !this.state.showDrawTool}
  			/>
    	)
    }

    renderLineGroup(data) {
    	let rect = Utils.getRect(data);
        if (data.content) {
            return (
                <TRImage
                  key={data._key}
                  ref={data._key}
                  uid={this.state.uid}
                  ownerid={this.state.ownerid}
                  dbkey={data._key}
                  src={data.content}
                  x={data.stage.x}
                  y={data.stage.y}
                  width={data.stage.width}
                  height={data.stage.height}
                  date_created={data.date_created}
                  createdBy={data.created_by}
                  handleDblClick={this.toggleTheatreMode}
                  hasPermission={this.state.hasPermission}
                  showToast={this.showToast}
                  newCreated={data.newCreated}
                  gotoHome={this.gotoHome}
                />
            )
        }
    	return (
    		<TRLineGroup
        key={data._key}
				ref={data._key}
				dbkey={data._key}
				data={data.stage}
				date_created={data.date_created}
				createdBy={data.created_by}
				rect={rect}
				uid={this.state.uid}
				x={data.stage.x}
				y={data.stage.y}
				newCreated={data.newCreated}
				strokeEnabled={true}
				toggleTheatreMode={this.toggleTheatreMode}
				draggable={this.state.hasPermission && !this.state.showDrawTool}
				drawMode={this.state.showDrawTool}
				getOptions={this.getCurrentOption}
			/>
    	)
    }

    getSocket = () => {
        return this.socket;
	}

	moveSelectLine = (posDiff)=>{
		console.log(posDiff)
		let line = this.state.line
		console.log(line)
		line.rect.x = line.rect.x + posDiff.x
		line.rect.y = line.rect.y + posDiff.y
		line.points = line.points.map((item,index)=>{
			if (index%2===0) {
				item += posDiff.x
			}
			else {
				item += posDiff.y
			}
			return item
		})
		console.log(line)
		this.setState({line:line})
	}

	//Render stage
	render() {
		let marks={};
		marks[this.state.joinDate] = { label:'ACCOUNT CREATED' };
		marks[this.state.now] = {
			style: { float:'right' },
			label: 'NOW'
		};

		let src_picture = this.state.src_picture ? this.state.src_picture : this.state.user.picture
		let src_pictureLoginUser = this.state.src_pictureLoginUser ? this.state.src_pictureLoginUser : this.state.loginUserAvatar

        const { showDrawTool, options, mainStageMoving } = this.state,
            { mode } = options,
            showStageOverlay = showDrawTool && !(mainStageMoving)

        const size = this.getCanvasSize()
		const stage = {
			width: window.innerWidth,
			height: size.height ? size.height : window.innerHeight
        }
        var smallProfiePos = {x:0, y:0};
		return(
				/* Menu zone  */
			<div className={`canvas-wrapper ${this.state.cursor}`}>
				<nav className="navbar navbar-inverse no-border-radius active-hover sticky-header">
					<div className="container-fluid">
						<div className="navbar-header controll-style">
							<button type="button" className="navbar-toggle" data-toggle="collapse" data-target="#myNavbar">
								<span className="icon-bar"></span>
								<span className="icon-bar"></span>
								<span className="icon-bar"></span>
							</button>
							<a className="navbar-brand hamburgerMenu" href="#" onClick={this.toggleOptMenu}><span className="glyphicon">&#9776;</span></a>
							<a className="navbar-brand homelink" href="/home" onClick={this.handleRedirectPage}><span className="glyphicon glyphiconHome"><img src="/img/logo/logo.svg" width="37" height="37" /></span></a>
						</div>

						<div className="collapse navbar-collapse" id="myNavbar">
							<ul className="nav navbar-nav navbar-right">
				              <li className="nav-avatar-container">
				                  <a href={`/stage/${this.state.loginUser.username}`} >
				                      <img className="circular nav-container nav-avatar" src={ (src_pictureLoginUser) ? src_pictureLoginUser : '/img/icons/profilemenubaroutline.svg'} />
				                  </a>
				                  <div className="tooltips">
				                      <span className="tooltiptext">My Traceroll</span>
				                  </div>
				              </li>
				              <li className="nav-home-container">
				                  <a href="/home" >
				                      <img className="circular nav-container nav-home" src="/img/icons/home_canvas.svg" />
				                  </a>
				                  <div className="tooltips">
				                      <span className="tooltiptext">Feed</span>
				                  </div>
				              </li>
				              <li className="nav-notification-container">
					                <a href="#" onClick={this.toggleNotification} className={this.state.hasNewNoti ? 'new-notification' : ''}>
					                    <img className="circular nav-container nav-notification" src="/img/icons/notifications_canvas.svg" />
					                </a>
					                <div className="tooltips">
					                    <span className="tooltiptext">Notifications</span>
					                </div>
				              </li>
				              <li className="nav-timeline-container">
												<a href="#" onClick={this.toggleTimeline}>
													<img className="circular nav-container nav-timeline" src="/img/icons/timeline2.svg" />
												</a>
				                <div className="tooltips">
				                    <span className="tooltiptext">Timeline</span>
				                </div>
											</li>
				              <li className="nav-theatre-container">
				                  <a href="#" onClick={this.toggleTheatreMode}>
				                      <img className="circular nav-container nav-theatre" src="/img/icons/theatre2.svg" />
				                  </a>
				                  <div className="tooltips">
				                      <span className="tooltiptext">Theatre</span>
				                  </div>
				              </li>
              {
                  this.state.hasPermission &&
                  <li className="nav-sidebar-container">
	                      <a href="#" onClick={this.toggleSidebar}>
	                          <img className="circular nav-container nav-sidebar" src="/img/icons/add_canvas.svg" />
	                      </a>
	                      <div className="tooltips">
	                          <span className="tooltiptext">Add Stuff</span>
	                      </div>
	              </li>
              }

							</ul>
						</div>
					</div>
				</nav>
				{
					this.state.showTimeLine &&
            <div id='filter_bar'>
                <Slider
                    min={this.state.joinDate}
                    max={this.state.now}
                    marks={marks}
                    defaultValue={this.state.now}
                    onChange={this.handleChangeTimeline}
                    step={this.state.step}
                    handle={this.handleSlider}
                />
                <button className="btn-close-feature btn-close-timeline"
                    onClick={this.toggleTimeline}
                    >
                    &#x2715;
                </button>
            </div>
				}

				{/*Handle toggle options menu*/}

				{
					this.state.showOptMenu &&
					<TROptMenu
						toggleOptMenu = {this.toggleOptMenu}
                        showOptMenu = {this.state.showOptMenu}
                        showNotification = {this.state.showNotification}
                        setShowNotification = {this.setShowNotification}
						user_info = {this.state.loginUser}
					/>
				}

				{
					this.state.showTheatre &&
					<TRTheatre
						toggleTheatreMode={this.toggleTheatreMode}
						userslug={this.state.userslug}
						currentElement={this.state.currentElement}
						showTheatre={this.state.showTheatre}
						loginUser={this.state.loginUser}
					/>
				}

				{/* Main Canvas's zone  */}
            <section id="Stage__main">
                <Stage ref={node => this.mainStage = node}
                    width={window.innerWidth}
                    height={window.innerHeight}
                    draggable={!this.state.showDrawTool}
                    onContentMouseDown={this.handleStageContentMouseDown}>
                    <Layer ref={layer => (this.oldElements = layer)}>
                        {/*Render element on stage which is getting from Database*/}
                        {this.state.childs.map(function(el, i){
                            switch(el.type){
                                case "image":
                                    return <TRImage
                                        key={el._key}
                                        ref={el._key}
                                        uid={this.state.uid}
                                        ownerid={this.state.ownerid}
                                        dbkey={el._key}
                                        src={el.content}
                                        x={el.stage.x}
                                        y={el.stage.y}
                                        width={el.stage.width}
                                        height={el.stage.height}
                                        date_created={el.date_created}
                                        createdBy={el.created_by}
                                        handleDblClick={this.toggleTheatreMode}
                                        el_type={el.type}
                                        caption={el.caption}
                                        hasPermission={this.state.hasPermission}
                                        showToast={this.showToast}
                                        />
                                case "video":
                                    return <TRImageVideo
                                        key={el._key}
                                        ref={el._key}
                                        uid={this.state.uid}
                                        ownerid={this.state.ownerid}
                                        dbkey={el._key}
                                        src={el.content_video}
                                        x={el.stage.x}
                                        y={el.stage.y}
                                        width={el.stage.width}
                                        height={el.stage.height}
                                        date_created={el.date_created}
                                        createdBy={el.created_by}
                                        handleDblClick={this.toggleTheatreMode}
                                        el_type={el.type}
                                        caption={el.caption}
                                        hasPermission={this.state.hasPermission}
                                        showToast={this.showToast}
                                    />
                                };
                            },this)}

                            {this.state.childs.map(function(el, i){
                                switch(el.type){
                                    case "text":
                                        return <TRText
                                            key={el._key}
                                            ref={el._key}
                                            dbkey={el._key}
                                            content={el.content}
                                            x={el.stage.x}
                                            y={el.stage.y}
                                            uid={this.state.uid}
                                            fontSize={el.stage.fontSize}
                                            date_created={el.date_created}
                                            createdBy={el.created_by}
                                            handleDblClick={this.toggleTheatreMode}
                                            hasPermission={this.state.hasPermission}
                                        />;
                                };
                            }, this)}

                            {
                                this.state.childs.map(function(item, i){
                                    switch(item.type){
                                        case "drawing:pen":
                                        case "drawing:pencil":
                                            return this.renderLine(item)
                                        case "drawing:brush":
                                            return this.renderLineBrush(item)
                                        case "drawing:group":
                                            return this.renderLineGroup(item)
                                        default:
                                            break;
                                    };
                                }, this)
                            }
                            {
                                this.state.groupArr.map(function(item, i) {
                                    return this.renderLineGroup(item)
                                }, this)
                            }

                            <Group
                                ref={node => (this.newLinesGroup = node)}
                                name={Const.KONVA.NEW_LINES_CONTAINER_NAME}>
                                {
                                    this.state.lines.map((item, index) => {
                                        switch(item.stage.mode){
                                            case "pen":
                                            case "pencil":
                                                return this.renderLine(item)
                                            case "brush":
                                                return this.renderLineBrush(item)
                                            default:
                                        }
                                    }, this)
                                }
                            </Group>
                        </Layer>
                        {/* <Layer>
                            {
                                this.state.childs.map(function(item, i){
                                    switch(item.type){
                                        case "drawing:pen":
                                        case "drawing:pencil":
                                            return this.renderLine(item)
                                        case "drawing:brush":
                                            return this.renderLineBrush(item)
                                        case "drawing:group":
                                            return this.renderLineGroup(item)
                                        default:
                                            break;
                                    };
                                }, this)
                            }
                            {
                                this.state.groupArr.map(function(item, i) {
                                    return this.renderLineGroup(item)
                                }, this)
                            }
                        </Layer> */}
                        <Layer>
                            {/* <Group
                                ref={node => (this.newLinesGroup = node)}
                                name={Const.KONVA.NEW_LINES_CONTAINER_NAME}>
                                {
                                    this.state.lines.map((item, index) => {
                                        switch(item.stage.mode){
                                            case "pen":
                                            case "pencil":
                                                return this.renderLine(item)
                                            case "brush":
                                                return this.renderLineBrush(item)
                                            default:
                                        }
                                    }, this)
                                }
                            </Group> */}
                            <TRSelectMoveGroup
                                trSelectedLinesRef={el => this.trSelectedLines = el}
                                line={this.state.line}
                                selectedLines={this.state.selectedLines}
								mouseLeaveGroupLinesSelected={this.mouseLeaveGroupLinesSelected}
								moveSelectLine={this.moveSelectLine}
                            />
                            {
							!this.state.isHideProfileImage &&
                            <TRProfileImage
                                centerPos={this.state.profilePosition}
                                username={this.state.userslug}
                                src={src_picture}
                                uid={this.state.uid}
                                ownerid={this.state.ownerid}
                                showDrawTool={this.state.showDrawTool}
                                toggleFollowingModal = {this.toggleFollowingModal}
																updateAvatar = {this.callUserInfo}
																showProfileWindow={this.handleOpenProfileWindow}
                            />
                            }



                        </Layer>
                    </Stage>
                </section>

                <section id="Stage__overlay"
                    className={`${showStageOverlay ? '' : 'hidden'}`}>
                    <Stage
                        width={window.innerWidth}
                        height={window.innerHeight}>
                        <Layer>
                            <TRDrawing
                                addNewLine={this.addNewLine}
                                uid={this.state.uid}
                                ownerid={this.state.ownerid}
                                options={this.state.options}
                                getMainStage={this.getMainStage}
                                drawings={this.state.drawings}
                            />
                        </Layer>
                    </Stage>
                </section>

                <TRElementOptions
                    element={this.state.elementShowOptions}
                    updateElementShowOptions={this.updateElementShowOptions}
                />

				{/* Drawing menu*/}
               {/*  <section id="Stage__drawing-menu">
                    <Stage
                        width={this.state.width}
                        height={(this.state.showDrawTool ? Const.MENU_HEIGHT : 0)}>
                        <Layer>
                            <TRMenu
                                width={this.state.width}
                                height={Const.MENU_HEIGHT}
                                handlerMenuChange={this.handlerMenuChange}
                                handlerChangePointer={this.handlerChangePointer}
                                options={this.state.options}
                            />
                        </Layer>
                    </Stage>
                </section> */}

				{/* To select new profile image */}
				<input type="file" id="profile_image" name="profile_image" accept="image/*" style={{display:'none'}}/>

				{/*Input Edit text*/}
				<div id="newTextWrapper" style={{display:'none'}}>
                    <input type="text" id="newText"/>
				</div>
				{/*Saving message*/}
				<div id="snackbar">Saving...</div>
				{/*Serach engine*/}
				<TRSearch
					handleRedirectPage={this.handleRedirectPage}
				/>
                {
                    this.state.showFollowingModal &&
                    <TRFollowingModal
                        user={this.state.user}
                        loginUser={this.state.loginUser}
                        showFollowingModal = {this.showFollowingModal}
                        updatePermission = {this.updatePermission}
                        getSocket = {this.getSocket}
                    />
                }
                {
                    this.state.showNotification &&
                    <TRNotification
                        ref={(node) => {this.Notification = node}}
                        getSocket = {this.getSocket}
                        loginUserId={this.state.loginUser.userId}
                        ownerId={this.state.ownerid}
                        userslug={this.state.userslug}
                    />
                }
                <TRNotificationBox
                    ref={(node) => {this.NotiBox = node}}
                />
                <TRToast
                    ref={(node) => {this.Toast = node}}
                />
                <TRProgress
                    ref={(node) => {this.Progress = node}}
                    percent = {this.state.progressPercent}
                />
				{
					this.state.openProfileWindow &&
					<ProfileWindow
						openProfileWindow={this.state.openProfileWindow}
						username={this.state.userslug}
						profileImage={src_picture}
						uid={this.state.uid}
						ownerid={this.state.ownerid}
						showDrawTool={this.state.showDrawTool}
						toggleFollowingModal = {this.toggleFollowingModal}
						updateAvatar = {this.callUserInfo}
            closeProfileWindow={this.handleCloseProfileWindow}
            isProfileImageHide={this.state.isHideProfileImage}
						handleToggleProfileImage={this.handleToggleProfileImage}
					/>
				}
                <Sidebar
                    handleAddText={this.handleAddText}
                    handleDropElement={this.handleDropElement}
                    handleAddLink={this.handleAddLink}
                    handlerMenuChange={this.handlerMenuChange}
                    handlerChangePointer={this.handlerChangePointer}
                    options={this.state.options}
                    handleMouseWheel={this.handleMouseWheel}
                    toggleDrawingMenu={this.toggleDrawingMenu}
                    showDrawTool = {this.state.showDrawTool}
										closeDrawingMenuWithoutSaving = {this.closeDrawingMenuWithoutSaving}
										toggleSidebar = {this.toggleSidebar}
                />


                {	/* Profile image top left */
					this.state.isHideProfileImage && /*this.isOwner()  &&*/

					<ProfileImageDock
						userslug={this.state.userslug}
						src={src_picture}
						uid={this.state.uid}
						ownerid={this.state.ownerid}
						showDrawTool={this.state.showDrawTool}
						toggleFollowingModal={this.toggleFollowingModal}
						callUserInfo={this.callUserInfo}
						handleOpenProfileWindow={this.handleOpenProfileWindow}
					/>
				}
								{
									//this.toggleSidebar &&
									//<a id="toggleButton" onClick={this.props.toggleSidebar}>Toggle</a>
								}
                {
                    this.state.showDrawTool &&
                    [
                        <button key="btn-save-drawing"
                            className="btn-close-feature btn-close-drawing canvas"
                            onClick={this.toggleDrawingMenu}
                        >
                            Save
                        </button>,
                    ]
                }
				<div style={{position:'absolute',bottom:'0',left:'5px',}} id="inTurnFadingTextG"> <div style={{float:'left'}}>Loading of large canvases may take a while</div><div id="inTurnFadingTextG_1" className="inTurnFadingTextG">.</div><div id="inTurnFadingTextG_2" class="inTurnFadingTextG">.</div><div id="inTurnFadingTextG_3" className="inTurnFadingTextG">.</div><div id="inTurnFadingTextG_4" className="inTurnFadingTextG">.</div><div id="inTurnFadingTextG_5" class="inTurnFadingTextG">.</div></div>
			</div>
		);
	}
};

export default TR_Stage;
