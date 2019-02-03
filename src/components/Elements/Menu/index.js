import React, { Component } from 'react';
import {Group, Rect, Line} from 'tr-react-konva';

import MenuButton from './Button';
import MenuCircle from './Circle';

import './style.css';

class TRMenu extends Component {
    static cursorsArr = ['url(/img/tools/pen-tool.png),auto', 'url(/img/tools/brush-tool.png),auto', 'url(/img/tools/pencil-tool.png),auto', 'url(/img/tools/eraser-tool.png) 6 12,auto', 'url(/img/tools/choosen.png) 10 15,auto'];
    static drawModes = ['pen', 'brush', 'pencil', 'eraser', 'select']
    // static cursorsArr = ['pointer', 'move', 'crosshair', 'not-allowed']
    constructor(props){
        super(props)
        this.state = {
            //default width and height of Stage (cover the screen)
            color: props.options.color,
            mode: props.options.mode,
            width: props.width,
            height: props.height
        }
    }

    /* Event change color */
    handleColorSelected = (color) => {
        this.setState({color: color});
        this.handlerMenuChange();
    }
    
    /* Event change mode */
    handleModeSelected = (mode) => {
        /* if (this.state.mode===mode) {
            this.props.toggleDrawingMenu && this.props.toggleDrawingMenu()
        }
        else {
            this.setState({mode: mode});
            this.handlerMenuChange();
            this.handlerChangePointer(mode);
        } */
        this.setState({mode: mode});
        this.handlerMenuChange();
        this.handlerChangePointer(mode);
    }

    /* Change cursor*/
    handlerChangePointer = (choosen) => {
        this.props.handlerChangePointer && this.props.handlerChangePointer(choosen);
    }

    /* Update parent options */
    handlerMenuChange = () => {
        this.props.handlerMenuChange && this.props.handlerMenuChange(this.state);
    }

    componentWillReceiveProps(nextProps){
        this.setState({
            color: nextProps.options.color,
            mode: nextProps.options.mode
        })
    }

    render() {
        let containerwidth = this.props.width;
        let containerheight = this.props.height;
        let pading = 64;
        let centerpos = containerwidth;
        const buttons = [
                {mode: 'pen', img: '/img/tools/2.png', x: centerpos - pading*4.1, y: 20, active: true},
                {mode: 'brush', img: '/img/tools/3.png', x: centerpos - pading*3.6, y: 20},
                {mode: 'pencil', img: '/img/tools/4.png', x: centerpos - pading*3.1, y: 20},
                {mode: 'eraser', img: '/img/tools/5.png', x: centerpos - pading*2.6, y: 20},
                {mode: 'select', img: '/img/tools/6.png', x: centerpos - pading*2.1, y: 20},
            ],
            colors = [
                {color: 'black', x: centerpos  + 20, y: 60},
                {color: 'blue', x: centerpos   + 20 + pading*1, y: 60},
                {color: 'green', x: centerpos  + 20 + pading*2, y: 60},
                {color: 'yellow', x: centerpos + 20 + pading*3, y: 60},
                {color: 'red', x: centerpos    + 20 + pading*4 , y: 60},
            ];
        return (
            
                <Group ref="menuGroup" x="0" y='0'>
                    <Rect x="0" y="0" width={containerwidth} height="10" />
                    {/* <Line fill="red" closed="true" stroke="green" strokeWidth="2" points={[5, 70, 140, 23, 250, 60, 300, 20]} /> */}
                    {buttons.map((value, index) => {
                        return <MenuButton key={index} active={value.active} hasActive={value.mode === this.state.mode} mode={value.mode} color={this.state.color} src={value.img} x={value.x} y={value.y} onClick={this.handleModeSelected}/>;
                    })}
                    {/* colors.map((value, index) => {
                        return <MenuCircle key={index} colorActive={value.color === this.state.color} color={value.color} x={value.x} y={value.y} onClick={this.handleColorSelected} />;
                    }) */}
                </Group>
        );
    }
}

export default TRMenu;