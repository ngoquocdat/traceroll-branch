import React, { Component } from 'react';
import './style.css';
import Const from '../Util/const.js';
import Utils from '../Util/utils.js';

class TRElementOptions extends Component {
    constructor(props){
        super(props);

        this.state = {
            element: props.element
        }
    }

    componentDidMount() {

        window.addEventListener('wheel', this.handleWheel)
        window.addEventListener('resize', this.handleWindowResize)
    }

    handleWheel = () => {
        this.udpateOptionsPosition()
    }

    componentWillReceiveProps(nextProps) {
        const element = nextProps.element

        this.setState({
            element: element
        })
    }

    componentDidUpdate(prevProps, prevState) {
        this.setListener()
        this.udpateOptionsPosition()
    }

    setListener = () => {
        const group = this.getGroup()

        if (group) {
            group.on('dragmove', this.handleGroupDragMove)
        }
    }

    handleGroupDragMove = () => {
        this.udpateOptionsPosition()
    }

    getGroup = () => {
        const element = this.state.element
        return element ? element.getParent() : null
    }

    udpateOptionsPosition = () => {
        const menu = this.menu,
            group = this.getGroup()

        if (group) {
            const rect = group.getClientRect(),
                width = menu.clientWidth,
                height = menu.clientHeight

            const x = rect.x + rect.width - width,
                y = rect.y - height

            menu.style.top = `${y}px`
            menu.style.left = `${x}px`
        }
    }

    handleWindowResize = () => {
        this.udpateOptionsPosition()
    }

    componentWillUnmount() {
        const group = this.getGroup()

        if (group) {
            group.off('dragmove')
        }

        window.removeEventListener('wheel', this.handleWheel)
    }
    
    handleRemoveElement = () => {
        const shape = this.state.element,
            group = this.getGroup()

        if (shape && group) {

            const result = window.confirm('Are you sure want to delete the object?')

            if (result) {
                shape.fire(Const.EVENTS.REMOVE)
            
                const layer = group.getLayer()
                group.destroy()
                layer.draw()

                this.setState({
                    element: null
                })

                this.props.updateElementShowOptions && this.props.updateElementShowOptions(null)
            }
        }
    }
  
    render() {
        return (
            this.state.element &&
            <ul ref = {node => this.menu = node}
                className='element-options'>
                <li className="remove-element-wrapper">
                    <button onClick={this.handleRemoveElement}><span className="glyphicon glyphicon-trash" aria-hidden="true"></span></button>
                </li>
            </ul>
        )
    }
}

export default TRElementOptions;