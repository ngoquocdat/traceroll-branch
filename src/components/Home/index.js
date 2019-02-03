import React, { Component } from 'react';
import { Stage, Layer} from 'tr-react-konva';
import { TRLine, TRLineBrush, TRVideo, TRLineGroup, TRSearch, TRInteractive, TROptMenu,
        TRNotificationBox, TRNotification, TRFollowingModal2} from '../Elements';
import axios from 'axios';
import './style.css';
import Jquery from 'jquery';
import Const from '../Util/const.js';
import Utils from '../Util/utils.js';
import TrService from '../Util/service.js';
import TRSocket from '../Util/socket.js';
import '../Elements/TRInteractive/style.css';
import moment from 'moment';

class Home extends Component {
	constructor(props) {
		super(props);
		this.state = {
			numChildren: 0,
			list: [],
            lastId1: null,
            lastId2: null,
			loading: "none",
			isShowTheatre: false,
			showOptMenu: false,
            showNotification: false,
            hasNewNoti: false,
            user: null,
		};

		this.handleLoadItem = this.handleLoadItem.bind(this);
		this.handleScroll = this.handleScroll.bind(this);
		this.handleLogout = this.handleLogout.bind(this);
		this.toggleOptMenu = this.toggleOptMenu.bind(this);
    this.startExploring = this.startExploring.bind(this);
		this.socket = TRSocket.getInstance()
	}

    getSocket = () => {
        return this.socket
    }

	toggleOptMenu(){
        this.setState((prevState, props) => {
            return {
                showOptMenu: !prevState.showOptMenu,
                showNotification: false,
            }
        });

        document.body.classList.remove('modal-open');
    }

    toggleNotification = () => {
        let showNotification = this.state.showNotification;
        this.setShowNotification(!showNotification, !showNotification);
    }

    setShowNotification = (showNotification, showOptMenu) => {
        this.setState({
            showNotification: showNotification,
            showOptMenu: showOptMenu,
            hasNewNoti: false,
        })
    }

    startExploring(){
      document.getElementById('explore').style.visibility = 'visible';
    /*  console.log( document.getElementById('explore').style.display );
      ( document.getElementById('explore').style.display === '' || document.getElementById('explore').style.display === 'none' ) ? document.getElementById('explore').display = 'block' : document.getElementById('explore').display = 'none';*/
    }
	componentWillMount() {
		//add Event scroll
		window.addEventListener('scroll', this.handleScroll);

        const callback = function(response) {
            let items = this.state.list,
                body = response.data;
            const data = body.data,
                user = body.user;

            this.setState({
                user: user,
                ownerid: user.userId,
                page: data.pageNum,
                limit: data.pageSize,
            });

            this.socket.emit('join', {userId: user.userId})

            data.elements.map((item)=>{
                this.handleLoadItem(items, item);
                return true;
            });

            if (items.length===0) {
              const textLength = ("You haven’t followed anyone page").length
              const fontSize = Utils.calculateTextSizeByTextLength(textLength);
              items = [
                <li className="noFollow">
                  <article className="canvasitem">
                    <div className="content">
                      <h2>Follow people to start exploring!</h2>
                      <img src="/img/news_feed/no-follow.png" />
                    </div>
                  </article>
                  <div id="follow-modal">
                    <h3>Suggestions</h3><br />
                    <TRFollowingModal2
                      classNaming={"first"}
                      user={this.state.user}
                      userId={43}
                      userslug={"katiajermaine"}
                      name={"Katia Jermaine"}
                      userPicture={"https://d2w4sqd6q4mas4.cloudfront.net/uploads/images/c7acbc01-f68f-4692-bde5-1256700d71ea"}
                      loginUser={this.state.loginUser}
                      showFollowingModal = {this.showFollowingModal}
                      updatePermission = {this.updatePermission}
                      getSocket = {this.getSocket}
                      startExploring = {this.startExploring}
                     />
                      <TRFollowingModal2
                        user={this.state.user}
                        userId={46}
                        userslug={"bobjenkins"}
                        name={"Bob Jenkins"}
                        userPicture={"https://d2w4sqd6q4mas4.cloudfront.net/uploads/images/fbe43633-2955-4f99-88c4-07c6741dc5f7"}
                        loginUser={this.state.loginUser}
                        showFollowingModal = {this.showFollowingModal}
                        updatePermission = {this.updatePermission}
                        getSocket = {this.getSocket}
                        startExploring = {this.startExploring}
                        />
                        <TRFollowingModal2
                          user={this.state.user}
                          userId={22}
                          userslug={"thomaskim "}
                          name={"Thomas Kim"}
                          userPicture={"https://d2w4sqd6q4mas4.cloudfront.net/uploads/images/99018b50-8844-4962-b423-fb88fed99db5"}
                          loginUser={this.state.loginUser}
                          showFollowingModal = {this.showFollowingModal}
                          updatePermission = {this.updatePermission}
                          getSocket = {this.getSocket}
                          startExploring = {this.startExploring}
                        />
                        <TRFollowingModal2
                          user={this.state.user}
                          userId={33}
                          userslug={"brooksbutterfield"}
                          name={"Brooks Butterfield"}
                          userPicture={"https://i2.wp.com/s3.amazonaws.com/traceroll-bucket/profile/ProfileAvatar01.png?ssl=1"}
                          loginUser={this.state.loginUser}
                          showFollowingModal = {this.showFollowingModal}
                          updatePermission = {this.updatePermission}
                          getSocket = {this.getSocket}
                          startExploring = {this.startExploring}
                        />
                    </div>
                    <div id="explore-wrapper">
                        <button id="explore"><a href="/home">Start Exploring!</a></button>
                    </div>
                </li>
              ]
            }

            this.setState({list: items});
        }

        const requestBody = {
          //TODO should be constants
            page:1,
            limit:10,
        }

        TrService.getNewsfeed(requestBody, callback.bind(this));
	}

    componentDidMount() {
        this.setupSocketListener(this.socket)
    }

    setupSocketListener = (socket) => {
        socket.on('onFollow', (msg) => {
            this.notifyNewNotification(msg)
        })

        socket.on('onAllow', (msg) => {
            this.notifyNewNotification(msg)
            if (this.state.uid !== this.state.ownerid) {
                this.setState({
                    hasPermission: true
                })
            }
        })

        socket.on('onDisallow', (msg) => {
            this.notifyNewNotification(msg)
            if (this.state.uid !== this.state.ownerid) {
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

	handleLogout() {
		axios.post("/logout", {})
		.then(function (response) {
			if (response.status === 200) {
				window.location.href = "/login";
			}
		});
	}

	componentWillUnmount() {
		window.removeEventListener('scroll', this.handleScroll);
	}

	//Handle scroll to bottom event - lazyload
	handleScroll(event) {
		//if user scroll to the bottom of the page
		 if( Jquery(window).scrollTop() + Jquery(window).height() >= (Jquery(document).height()-2) &&  ( Jquery('.noFollow').length === 0  ) ) {

            this.setState({
                loading:"block",
            });

            const callback = function(response) {
                const items = this.state.list,
                	body = response.data
                const data = body.data

                data.elements.map((item)=>{
                        this.handleLoadItem(items, item);
                    return true;
                });
                this.setState({
                    list: items,
                    loading:"none",
                    page: data.pageNum,
                    limit: data.pageSize,
                });
            }

            const requestBody = {
              page: this.state.page+1,
              limit:this.state.limit,
            }

            TrService.getNewsfeed(requestBody, callback.bind(this))
        }
	}

	setCurrentCommentOpen = (el) => {
		this.currentCommentOpen = el;
	}

	getCurrentCommentOpen = () => {
		return this.currentCommentOpen;
	}

	renderInteractive = (obj) =>{
		return(
			<TRInteractive
				caption={obj.caption}
				comment={obj.comment}
				main_user={this.state.user}
				element_id={obj.elementId}
				likeTimes={obj.likeTimes}
				usersLiked={obj.usersLiked}
				userIds={obj.userIds}
				shareLink={obj.shareLink}
				element={obj.element}
				mode='newsfeed'
				setCurrentCommentOpen={this.setCurrentCommentOpen}
				getCurrentCommentOpen={this.getCurrentCommentOpen}
				isShowTheatre= {this.state.isShowTheatre}
				loginUser={this.state.user}
        socket={this.socket}
			/>
		)
	}
    /* Calculate element hours and minutes*/
    differHours = (elementTime, currentTime) => {
        let differMinutes;
        let diff = (currentTime.getTime() - elementTime.getTime()) / 1000;
        let roundHours = Math.abs(Math.round(diff/(60 * 60)));

        if(roundHours == 0){
            differMinutes = Math.abs(currentTime.getMinutes() - elementTime.getMinutes());
            return {hours: roundHours, minutes: differMinutes};
        }else{
            return {hours: roundHours};
        }
    }

	handleLoadItem(container, item){
        let time = new Date(item.date_created);
        let current_time = new Date();
        let diffDays = Math.abs(current_time.getDate() - time.getDate());
        let timeString;

		if (container && item) {
            /* Handle show date time on post*/
            if(diffDays > 0){
                // show days ago
                timeString = <a href='' style={{pointerEvents: 'none', cursor: 'default', textDecoration: 'none', float: 'right', padding: '0px 20px',}}>{moment.months(time.getMonth())+' '+time.getDate()}</a>;
            }else{
                // show minutes and hours ago
                let differHours = this.differHours(time, current_time);
                if(differHours.hours != 0 ){
                    timeString = <a href='' style={{pointerEvents: 'none', cursor: 'default', textDecoration: 'none', float: 'right', padding: '0px 20px',}}>{differHours.hours > 1 ? differHours.hours+" hours ago" : differHours.hours+" hour ago"}</a>;
                }else if(differHours.hours == 0 && differHours.minutes != 0){
                    timeString = <a href='' style={{pointerEvents: 'none', cursor: 'default', textDecoration: 'none', float: 'right', padding: '0px 20px',}}>{differHours.minutes > 1 ? differHours.minutes+" minutes ago" : differHours.minutes+" minute ago"}</a>;
                }else{
                    timeString = <a href='' style={{pointerEvents: 'none', cursor: 'default', textDecoration: 'none', float: 'right', padding: '0px 20px',}}>seconds ago</a>
                }
            };

			const type = item.type,
			obj = {
				caption: item.caption,
				comment: item.comment,
				elementId: item.id,
				likeTimes: item.likeTimes,
				usersLiked: item.usersLikedElement,
				userIds: item.userLikedIds,
				shareLink: document.location.origin + "/stage/" + item.owner.userslug + '/' + item.id,
				element: item
			};

			if (type === Const.SHAPE_TYPE.IMAGE || (type === Const.SHAPE_TYPE.GROUP && item.content)) {
				container.push(
					<li>
						<article className="canvasitem">
              <header>
                  <a href={"/stage/"+item.createdUser.userslug}><img className="represent-image" src={item.createdUser.picture}/>{item.createdUser.username}</a>
                  {timeString}
              </header>
							<a href={"/stage/"+item.owner.userslug+"/"+item.id}>
								<div className="content">
										<img src={item.content} alt={item.content}/>
								</div>
							</a>
						</article>
						<div className="row row-align">
							{this.renderInteractive(obj)}
						</div>
					</li>
				);
			} else if (type === Const.SHAPE_TYPE.VIDEO) {
				container.push(
					<li>
						<article className="canvasitem">
							<header>
								<a href={"/stage/"+item.createdUser.userslug}><img className="represent-image" src={item.createdUser.picture}/>{item.createdUser.username}</a>
                                {timeString}
							</header>
							<a>
								<div className="content" style={{position: 'relative'}}>
									<TRVideo
										videoUrl={item.content_video}
										el_id={item.id}
										href={"/stage/"+item.owner.userslug+"/"+item.id}
									/>
								</div>
							</a>
						</article>
						<div className="row row-align">
							{this.renderInteractive(obj)}
						</div>
					</li>
				)
			} else if (type === Const.SHAPE_TYPE.TEXT) {
				const textLength = item.content.length;
				const fontSize = Utils.calculateTextSizeByTextLength(textLength);
				container.push(
					<li>
						<article className="canvasitem">
							<header>
								<a href={"/stage/"+item.createdUser.userslug}><img className="represent-image" src={item.createdUser.picture}/>{item.createdUser.username}</a>
                                {timeString}
							</header>
							<a href={"/stage/"+item.owner.userslug+"/"+item.id}>
								<div className="content">
									<h2 style={{'fontSize': `${fontSize}px`}}>{item.content}</h2>
								</div>
							</a>
						</article>
						<div className="row row-align">
							{this.renderInteractive(obj)}
						</div>
					</li>
				);
			} else {
				const parentWidth = Jquery('.canvaslist').width(),
					maxHeight = parentWidth * 2 / 3,
					rect = Utils.getRect(item);
				if (rect) {
					let	scale = rect.width / rect.height,
						itemWidth = parentWidth,
						itemHeight = itemWidth / scale;
						itemHeight = Math.min(itemHeight, maxHeight, rect.height);

					scale = itemHeight / rect.height;
					if (scale > 1) {
						scale = 1;
					}
					const stagePositionX = - rect.x * scale + Math.abs((rect.width * scale - itemWidth) / 2),
		        		stagePositionY = - rect.y * scale;
					let shape;
					if (type === Const.SHAPE_TYPE.PEN || type === Const.SHAPE_TYPE.PENCIL) {
						shape = <TRLine
							dbkey={item._key}
							width={item.stage.width}
							height={item.stage.height}
							points = {item.stage.points}
							stroke= {item.stage.color}
							strokeWidth={item.stage.strokeWidth}
							draggable="false"
						/>
					} else if (type === Const.SHAPE_TYPE.BRUSH) {
						shape = <TRLineBrush
							dbkey={item._key}
							uid={item.ownerid}
							date_created={item.date_created}
							points = {item.stage.points}
							stroke={item.stage.color}
						/>
					} else {
						shape = <TRLineGroup
							dbkey={item._key}
							uid={item.uid}
							data={item.stage}
							rect={rect}
						/>
					}

					container.push(
						<li>
							<article className="cavnasitem">
								<header>
									<a href={"/stage/"+item.createdUser.userslug}><img className="represent-image" src={item.createdUser.picture}/>{item.createdUser.username}</a>
                                    {timeString}
								</header>
								<a href={"/stage/"+item.owner.userslug+"/"+item.id}>
									<div className="content-drawing" id={item.id}>
										<Stage
											x={stagePositionX}
											y={stagePositionY}
											container={item.id}
											height={itemHeight}
											width={itemWidth}
											scaleX={scale}
											scaleY={scale}
											>
											<Layer hitGraphEnabled={false}>
												{ shape }
											</Layer>
										</Stage>
									</div>
								</a>
							</article>
							<div className="row row-align">
								{this.renderInteractive(obj)}
							</div>
						</li>
					);
				}
			}
		}
	}

	render() {

        if (this.state.showOptMenu) {
            document.body.classList.add('no-scroll')
        } else {
            document.body.classList.remove('no-scroll')
        }
		//children: all element of homepage
		const children = this.state.list;
		if (this.state.user) {
			return (
				<div>
						{/*Loading message*/ }
					  <p className="loading loader" style={{display: this.state.loading, position: 'fixed', bottom:'0px'}}></p>
                    <div id="home-wrapper">
                        <nav className="navbar navbar-inverse no-border-radius active-hover navbar-fixed-top">
                            <div className="container-fluid">
                                    <div className="navbar-header controll-style">
                                        <button type="button" className="navbar-toggle" data-toggle="collapse" data-target="#myNavbar">
                                            <span className="icon-bar"></span>
                                            <span className="icon-bar"></span>
                                            <span className="icon-bar"></span>
                                        </button>
                                        <a className="navbar-brand hamburgerMenu" onClick={this.toggleOptMenu}><span className="glyphicon">&#9776;</span></a>
                                        <a className="navbar-brand homelink" href="/home" onClick={this.handleRedirectPage}>
                                              <span className="glyphicon glyphiconHome">
                                                <img alt="" src="/img/logo/traceroll-logo-small.png" width="35" height="35" />
                                              </span>
                                        </a>
                                        <TRSearch/>
                                    </div>
                                    <div className="collapse navbar-collapse" id="myNavbar">
                                        <ul className="nav navbar-nav navbar-right">
                                          <li className="nav-avatar-container">
                        											<a href={"/stage/"+this.state.user.userslug} id="add_image">
                        													<img className="circular nav-avatar" src={this.state.user.picture} />
                        											</a>
                                              <div className="tooltips">
                                                  <span className="tooltiptext">My Traceroll</span>
                                              </div>
                        									</li>
                                          <li className="nav-home-container">
                                            <a href="/home" >
                                              <img className="circular nav-home" src="/img/icons/home_home.svg" />
                                            </a>
                                            <div className="tooltips">
                                                <span className="tooltiptext">Feed</span>
                                            </div>
                                          </li>
                                            <li className="nav-notification-container">
                                                <a onClick={this.toggleNotification} className={this.state.hasNewNoti ? 'new-notification' : ''}>
                                                    <img className="circular nav-notification" src="/img/icons/notifications_home.svg" />
                                                </a>
                                                <div className="tooltips">
                                                    <span className="tooltiptext">Notifications</span>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                            </div>
                        </nav>

                        {/*Handle toggle options menu*/}

                        {
                            this.state.showOptMenu &&
                            <TROptMenu
                                toggleOptMenu = {this.toggleOptMenu}
                                showOptMenu = {this.state.showOptMenu}
                                showNotification = {this.state.showNotification}
                                setShowNotification = {this.setShowNotification}
                                user_info = {this.state.user}
                            />
                        }

                        <ul className="canvaslist">
                        {/*render list element*/ }
                            {children}
                        </ul>
                    </div>
                    {
                        this.state.showNotification &&
                        <TRNotification
                            ref={(node) => {this.Notification = node}}
                            getSocket = {this.getSocket}
                            ownerId={this.state.ownerid}
                            userslug={this.state.user.userslug}
                        />
                    }
                    <TRNotificationBox
                        ref={(node) => {this.NotiBox = node}}
                    />
				</div>
			)
		}
		else {
			return(<div></div>)
		}
	}

	//Increase number of newsfeed
	onAddChild (){
		this.setState({
			numChildren: this.state.numChildren + 1
		})
	}
}

export default Home;
