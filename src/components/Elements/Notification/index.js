import React, { Component } from 'react';
import './style.css';
import NotificationItem from './item.js';
import TrService from '../../Util/service.js';

class TRNotification extends Component {
    constructor(props) {
        var noNoti = '';
        super(props);
        this.state = {
            notifications: []
        }
        this.socket = props.getSocket()
        this.ownerId = props.ownerId
    }

    append = (newNoti) => {
        if (newNoti) {
            this.setState((prevState) => {

                prevState.notifications.unshift(newNoti)

                return {
                    notifications: prevState.notifications
                }
            })
        }
    }

    refresh = () => {
        this.getNotifications()
    }

    componentWillMount() {
        this.getNotifications()
    }

    getNotifications = () => {
        let requestBody = {
            userId: this.ownerId
        }
        const callback = function(response) {
            const body = response.data;
            if (body && body.status !== "FAILED"){
                const notifications = body.notifications;
                (notifications.length === 0) ? this.noNoti = true : this.noNoti = false;
                this.setState({
                    notifications
                })
            }
        }
        TrService.loadNotifications(requestBody, callback.bind(this))
    }

    componentDidMount() {
        
    }

    render() {
        const notifications = this.state.notifications
        const listNotifications = notifications.map((notification) => {
            return (
                <NotificationItem
                    key={notification._id}
                    socket = {this.socket}
                    notification = {notification}
                    ownerId = {this.ownerId}
                    userslug = {this.props.userslug}
                />
            )
        })

        return (
            <section className="notification">
                <h2>Notifications</h2>
                <ul>
                    { (this.noNoti === true) && <img id="noNoti" src="/img/tools/no_notifications.png" width="525" />}
                    { listNotifications }
                </ul>
            </section>
        )
    }
}

export default TRNotification;