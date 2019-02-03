import React, { Component } from 'react';
import {Image, Line, Group} from 'tr-react-konva';

//#Menu tool
class MenuButton extends Component {
    state = {
        
    }    
    constructor(props){
        super(props);
        this.state = {
            //default width and height of Stage (cover the screen)
            image: null,
            y: 20,
            active: props.active,
            headpoint : [],
            visablecolor : false,
            color : "black",
            eraseractive : false
        }        
    }

    handleClick = () => {
        if (this.state.y === 20) {
            return;
        }

        this.taggle(true);

        this.props.onClick(this.props.mode);
    }

    taggle(open, color="black") {
        var ystate = open ?  20 : 35;
        var visablecolor = open ? true: false;
        this.setState({
            y: ystate,
            color : color,
            visablecolor : visablecolor
        });                
    }

    componentWillReceiveProps(props) {          
        if (!this.props.hasActive) {            
            this.taggle(false);              
        } else {            
            this.taggle(true,props.color);              
        }
        if(props.mode === "eraser" && this.props.hasActive){
            this.setState({eraseractive : true})
        }else{
            this.setState({eraseractive : false})
        }
    }

    componentDidMount() {
        //console.log(this.props.active);
        
        const image = new window.Image();
        image.src = this.props.src;
        image.onload = () => {
            this.setState({
                image: image,
                y: 35
            });

            if (this.props.active) {
                this.taggle(true);
            }
        }   
        let headpoint
        if(this.props.mode === "brush"){            
            headpoint = [7, 5, 7, 11, 17, 11, 17, 0, 7, 5];
            this.setState({
                headpoint : headpoint
            })            
        } else if(this.props.mode === "pen"){
            headpoint = [11, 0, 7, 11, 17, 11, 13,0];
            this.setState({
                headpoint : headpoint
            })
        }
        else if(this.props.mode === "pencil"){
            headpoint = [11, 0, 7, 14, 17, 14, 13,0];
            this.setState({
                headpoint : headpoint
            })
        }

    }

    render() {
        return (            
            <Group x={this.props.x} y={this.state.y} onClick={this.handleClick}>                
                <Line fill="#f4425c" closed="true"  visible={this.state.eraseractive} points={[0,0,0,11,22,11,22,0]} />                          
                <Image image={this.state.image} width={24} height={70}  />                
                <Line fill={this.state.color} closed="true"  visible={this.state.visablecolor} points={this.state.headpoint} />                          
            </Group>
        );
    }
}

export default MenuButton;