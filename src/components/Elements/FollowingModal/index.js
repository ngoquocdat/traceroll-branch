import React, { Component } from 'react';
import './style.css';
import $ from 'jquery';
import TrService from '../../Util/service.js';

class TRFollowingModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            followers: [],
            followings: [],
            followersCount: 0,
            followingsCount: 0,
            isFollow: false,
        }
        this.ownerId = props.user.userId;
        this.loginUserId = props.loginUser.userId;
        this.socket = props.getSocket()
    }

    componentWillMount() {
        let requestBody = {
            userId: this.ownerId
        }
        const callback = function(response) {
            const body = response.data;
            if (body && body.status !== "FAILED"){
                const data = body.results;
                const followers = data.followers;
                const followings = data.followings;
                const isFollow = followers.some(function(item) {
                    return item.value === this.loginUserId
                }.bind(this))

                this.setState({
                    followers: followers,
                    followings: followings,
                    isFollow: isFollow,
                    followersCount: followers.length,
                    followingsCount: followings.length,
                })
            }
        }
        TrService.followDetail(requestBody, callback.bind(this))
    }

    componentDidMount() {
        $('.following-modal .btn-close').click(() => {
            this.props.showFollowingModal && this.props.showFollowingModal(false);
        });
    }

    handleFollow = () => {
        const ownerId = this.ownerId

        let requestBody = {
            following: ownerId,
        }
        const isFollow = this.state.isFollow
        
        const callback = function(response) {
            const body = response.data
            if (body && body.status !== "FAILED"){
                const notiId = body.notification
                const msg = {
                    userId: ownerId,
                    notiId: notiId
                }
                this.socket.emit('onFollow', msg)
            }
        }
        TrService.follow(requestBody, callback.bind(this))

        this.updateUI()
    }

    handleUnfollow = () => {
        const ownerId = this.ownerId

        let requestBody = {
            following: ownerId,
        }
        
        const callback = function(response) {
            const body = response.data;
            if (body && body.status !== "FAILED"){
                this.props.updatePermission && this.props.updatePermission(false)

                const msg = {
                    userId: ownerId
                }
                this.socket.emit('unfollow', msg)
            }
        }
        TrService.unfollow(requestBody, callback.bind(this))

        this.updateUI()
    }

    updateUI = () => {
        this.setState((prevState, props) => ({
            isFollow: !prevState.isFollow,
            followersCount: prevState.isFollow ? prevState.followersCount - 1 : prevState.followersCount + 1
        }))
    }

    render() {
        return (
            <section className='following-modal-container'>
                <section className="following-modal">
                    <header>
                        <img src={this.props.user.picture} alt=""/>
                        <h4>{this.props.user.userslug}</h4>
                        <div>
                            <svg className="btn-close" viewBox="0 0 320 512">
                                <path fill="currentColor" d="M193.94 256L296.5 153.44l21.15-21.15c3.12-3.12 3.12-8.19 0-11.31l-22.63-22.63c-3.12-3.12-8.19-3.12-11.31 0L160 222.06 36.29 98.34c-3.12-3.12-8.19-3.12-11.31 0L2.34 120.97c-3.12 3.12-3.12 8.19 0 11.31L126.06 256 2.34 379.71c-3.12 3.12-3.12 8.19 0 11.31l22.63 22.63c3.12 3.12 8.19 3.12 11.31 0L160 289.94 262.56 392.5l21.15 21.15c3.12 3.12 8.19 3.12 11.31 0l22.63-22.63c3.12-3.12 3.12-8.19 0-11.31L193.94 256z">
                                </path>
                            </svg>
                        </div>
                    </header>
                    <div className="body">
                        <div className="followers">{this.state.followersCount} Followers</div>
                        <span className="barrier"></span>
                        <div className="followings">{this.state.followingsCount} Followings</div>
                    </div>
                    {
                        this.state.isFollow ? (
                            <button onClick={this.handleUnfollow} className="btn-follow active">Following</button>
                        ) : (
                            <button onClick={this.handleFollow} className="btn-follow">Follow</button>
                        )
                    }
                </section>
            </section>    
        )
    }
}

export default TRFollowingModal;