import React, { Component } from 'react';
import {Line} from 'tr-react-konva';
import Const from '../../Util/const.js';
import TrService from '../../Util/service.js';

class TRLine extends Component{
    constructor(props){
        super(props);
        this.rect = props.rect;
        this.pos = {
            x: props.x,
            y: props.y
        };
    }

    componentDidMount() {
        this.line.setPosition({
            x: this.props.x,
            y: this.props.y
        })
    }

    handleRemoving = () => {
        if (this.props.getOptions().mode === 'eraser'){
            return;
        }

        const key = this.props.dbkey,
            uid = this.props.uid;
        TrService.deleteElementOnDb(uid, key);
    }

    render(){
        return (
            <Line
                ref={node => (this.line = node)}
                name={Const.SHAPE_TYPE.PEN}
                points = {this.props.points}
                stroke= {this.props.stroke}
                fill={this.props.stroke}
                strokeWidth={this.props.strokeWidth}
                date_created = {this.props.date_created}
                rect={this.rect}
                lineCap='round'
                lineJoin='round'
                draggable={this.props.draggable}
                onRemove={this.handleRemoving}
            />
        );
    }
}

TRLine.defaultProps = {
    x: 0,
    y: 0
}

export default TRLine;