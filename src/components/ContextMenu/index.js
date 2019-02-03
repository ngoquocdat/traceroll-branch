import React, { Component } from 'react';
import './style.css';
import Const from '../Util/const.js';

/**
* Get's exact position of event.
* 
* @param {Object} e The event passed in
* @return {Object} Returns the x and y position
*/
let getPosition = (e) => {
    let posx = 0;
    let posy = 0;

    if (!e) {
        e = window.event;
    }

    if (e.pageX || e.pageY) {
        posx = e.pageX;
        posy = e.pageY;
    } else if (e.clientX || e.clientY) {
        posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    return {
      x: posx,
      y: posy
    }
}

/**
* Positions the menu properly.
* 
* @param {Object} e The event
*/
let positionMenu = (e) => {
    const menu = document.querySelector("#context-menu");
    if (menu) {
        const clickCoords = getPosition(e),
            clickCoordsX = clickCoords.x,
            clickCoordsY = clickCoords.y,
            menuWidth = menu.offsetWidth + 4,
            menuHeight = menu.offsetHeight + 4,
            windowWidth = window.innerWidth,
            windowHeight = window.innerHeight;

        if ((windowWidth - clickCoordsX) < menuWidth) {
            menu.style.left = windowWidth - menuWidth + "px";
        } else {
            menu.style.left = clickCoordsX + "px";
        }

        if ((windowHeight - clickCoordsY) < menuHeight) {
            menu.style.top = windowHeight - menuHeight + "px";
        } else {
            menu.style.top = clickCoordsY + "px";
        }
    }
}

class TRContextMenu extends Component {
    constructor(props){
        super(props);
        this.handleDeleteListener = this.handleDeleteListener.bind(this);
    }

    handleDeleteListener() {
        const shape = this.props.elementTarget;
        if (shape) {
            let container = shape.getParent();
            if (!container.nodeType === 'Group') {
                container = shape;
            }
            shape.fire(Const.EVENTS.REMOVE);
            
            const layer = container.getLayer();
            container.destroy();
            layer.draw();
        }
        this.props.showContextMenu && this.props.showContextMenu(false);
    }

    componentDidMount() {
        positionMenu(this.props.evt);
    }
  
    render() {
        return (
            <nav id="context-menu" className="context-menu context-menu--active">
                <ul className="context-menu__items">
                    <li className="context-menu__item">
                        <a className="context-menu__link" onClick={this.handleDeleteListener} data-action="Delete">
                           Delete
                        </a>
                    </li>
                </ul>
            </nav>
        );
    }
}

export default TRContextMenu;