import React, { Component } from 'react';
import './box.css';
import $ from 'jquery';

class TRNotificationBox extends Component {
    constructor(props) {
        super(props);
        this.state = {
            topOffset: 0
        }
        this.timeout = null
    }

    componentWillMount() {

    }

    show = () => {
        if (this.el) {
            if (this.timeout) {
                clearTimeout(this.timeout)
            }
            $(this.el).addClass('show')
            setTimeout(this.hide, 4000)
        }
    }

    hide = () => {
        if (this.el) {
            $(this.el).removeClass('show')
        }
    }

    componentDidMount() {
        const height = $('.navbar-inverse').outerHeight()
        if (height) {
            this.setState({
                topOffset: height
            })
        }
    }

    render() {
        return (
            <section ref={(node) => {this.el = node}}
                className="notification-box" style={{top: this.state.topOffset}}>
                <h2>New Notification</h2>
            </section>
        )
    }
}

export default TRNotificationBox;