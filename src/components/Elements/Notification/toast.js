import React, { Component } from 'react';
import './toast.css';
import $ from 'jquery';

class TRToast extends Component {
    constructor(props) {
        super(props);
        this.state = {
            msg: '',
            isShow: false
        }
        this.timeout = null
    }

    showAutoHide = (msg, length = 2000) => {
        this.setState({
            msg: msg,
            isShow: true
        })
        if (this.timeout) {
            clearTimeout(this.timeout)
        }
        this.timeout = setTimeout(this.hide, length)
    }

    show = (msg) => {
        this.setState({
            msg: msg,
            isShow: true
        })
    }

    hide = () => {
        this.setState({
            isShow: false
        })
    }

    componentDidMount() {
        const height = $('.sticky-header').outerHeight()
        if (height) {
            this.setState({
                topOffset: height
            })
        }
    }

    render() {
        return (
            <section
                ref={node => this.el = node}
                className={`toast-box${this.state.isShow?' show':''}`}>
                <h4>{ this.state.msg }</h4>
            </section>
        )
    }
}

export default TRToast;