import React, { Component } from 'react';
import {Group, Circle} from 'tr-react-konva';

//#Menu color
class MenuCircle extends Component {
    state = {
        
    }
    constructor(props){
        super(props);
        this.state = {            
            visible: this.props.colorActive || false
        }

        
    }
    
    handleClick = () => {      
        this.props.onClick(this.props.color);
    }

    taggle(open) {
        var status = open ?  true : false;
        this.setState({
            visible: status
        });        
    }

    componentWillReceiveProps(props) {
        if (!this.props.colorActive) {
            this.taggle(false);  
        } else {
            this.taggle(true);  
        }
    }

    componentDidMount() {
        
    }

    render() {
        return (
            <Group onClick={this.handleClick}>
                <Circle ref="circle" fill="white" x={this.props.x} y={this.props.y} radius="70" width="28" height="28" stroke={this.props.color} strokeWidth="1" visible={this.state.visible} />
                <Circle ref="circle" fill={this.props.color} x={this.props.x} y={this.props.y} radius="70" width="25" height="25" />
            </Group>
        );
    }
}

export default MenuCircle;