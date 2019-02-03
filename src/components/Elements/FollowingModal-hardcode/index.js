import React, { Component } from 'react';
import './style.css';
import $ from 'jquery';
import TrService from '../../Util/service.js';

class TRFollowingModal2 extends Component {
    constructor(props) {
        super(props);
        this.state = {
            followers: [],
            followings: [],
            followersCount: 0,
            followingsCount: 0,
            isFollow: false,
        }
        this.ownerId = this.props.userId;
        this.loginUserId = this.props.loginUser;
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

        this.updateUI();
        this.props.startExploring();
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

        this.updateUI();
        this.props.startExploring();
    }

    updateUI = () => {
        this.setState((prevState, props) => ({
            isFollow: !prevState.isFollow,
            followersCount: prevState.isFollow ? prevState.followersCount - 1 : prevState.followersCount + 1
        }))
    }

    render() {
        return (
            <section className={ (this.props.classNaming) ? `following-home ${this.props.classNaming}`: 'following-home' }>
                <section className="following-modal">
                    <header>
                        <img src={this.props.userPicture} alt=""/>
                        <h4>{this.props.userslug}<br /> <span className="name">{this.props.name}</span></h4>
                        {
                            this.state.isFollow ? (
                                <button onClick={this.handleUnfollow} className="btn-follow active">Following</button>
                            ) : (
                                <button onClick={this.handleFollow} className="btn-follow">Follow</button>
                            )
                        }
                    </header>
                </section>
            </section>
        )
    }
}

export default TRFollowingModal2;
