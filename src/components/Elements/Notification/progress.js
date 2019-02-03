import React, { Component } from 'react';
import './progress.css';
import $ from 'jquery';

class TRProgress extends Component {
    constructor(props) {
        super(props);
    }

    componentWillMount() {

    }

    show = (msg) => {
        if (this.el) {
            $(this.el).addClass('show')
        }
    }

    hide = () => {
        if (this.el) {
            $(this.el).removeClass('show')
        }
    }

    render() {
        return (
            <section ref={(node) => {this.el = node}}
                className="progress-box">
                <progress value={this.props.percent} max='100'></progress>
            </section>
        )
    }
}

export default TRProgress;