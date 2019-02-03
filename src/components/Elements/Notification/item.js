import React, { Component } from 'react';
import './style.css';
import TrService from '../../Util/service.js';

class NotificationItem extends Component {
    constructor(props) {
        super(props);
        this.socket = props.socket
    }

    componentWillMount() {
        
    }

    componentDidMount() {

    }

    handlePermissionChecked = (event) => {
        const notification = this.props.notification,
            target = event.target,
            ownerId = this.props.ownerId

        if (target) {
            const checked = target.checked,
                notificationId = notification._id,
                followerId = notification.user.userId
            
            let requestBody = {
                notificationId: notificationId,
                followerId: followerId,
                followingId: ownerId,
                permission: checked
            }
            
            const callback = function(response) {
                const body = response.data;
                if (body && body.status !== "FAILED") {
                    const notiId = body.notification
                    const msg = {
                        userId: followerId,
                        notiId: notiId
                    }
                    if (checked === true) {
                        this.socket.emit('onAllow', msg)
                    } else {
                        this.socket.emit('onDisallow', msg)
                    }
                }
            }
            TrService.updatePermission(requestBody, callback.bind(this))
        }
    }

    getValue(elType) {
        if (elType === 'image') {
            return 'photo'
        } else if (elType === 'video') {
            return 'video'
        } else if (elType === 'text') {
            return 'text'
        }
        return 'drawing'
    }

    render() {
        const notification = this.props.notification
        const type = notification.type,
            user = notification.user,
            element = notification.element
        let elType = '', pTag, userslug = '', ownerPost = ''

        if (element) {
            elType = this.getValue(element.type)
            userslug = element.userslug
            ownerPost = element.ownerpost
        }

        const ownerCanvas = this.props.userslug === userslug ? 'your' : `${userslug}'s`

        let msg, showPermission = notification.enable, checked = notification.permission ? true : false
        switch(type) {
            case 'follow':
                msg = 'followed you.'
                break
            case 'add':
                msg = `added a ${elType} in your canvas.`
                break
            case 'comment':
                ownerPost = this.props.userslug === ownerPost ? 'you' : ownerPost

                msg = `commented on a ${elType} ${ownerPost} posted in ${ownerCanvas} canvas.`
                break
            case 'like':
                ownerPost = this.props.userslug === ownerPost ? 'your' : `${ownerPost}'s`

                msg = `liked ${ownerPost} ${elType} in ${ownerCanvas} canvas.`
                break
            case 'allow':
                msg = 'gave you permission to edit his/her canvas.'
                break
            case 'disallow':
                msg = 'took back your permission to edit his/her canvas.'
                break
            default:
                msg = ''
        }
        if (element) {
            pTag = <a href={`/stage/${userslug}/${element.id}`}><p className='msg'><strong>{ user.username }</strong> { msg }</p></a>
        } else {
            pTag = <p className='msg'><strong>{ user.username }</strong> { msg }</p>
        }
        return (
            <li>
                <img src={user.image} alt=''/>
                <div className="msg-container">
                    { pTag }
                    {
                        showPermission &&
                        <div className="permission">
                            <span>Allow { user.username } to collaborate on your canvas</span>
                            <label className="switch">
                                <input type="checkbox" onChange={this.handlePermissionChecked} defaultChecked={checked}/>
                                <span className="slider round"></span>
                            </label>
                        </div>
                    }
                </div>
            </li>
        )
    }
}

export default NotificationItem;