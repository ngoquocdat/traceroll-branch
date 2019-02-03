import React, { Component } from 'react';
//import ScrollAnimation from 'react-animate-on-scroll';
import './style.css';

export default class Platforms extends Component{
  render(){
    return(
      <div id="collaboration">
        <div className="platforms_wrapper1 wrapper">
             <img className="drawing-collaboration half" src="/img/login/drawing_collaboration.png" width="670" height="670" alt="" />
            <div id="platform_top" className="platforms_content_wrapper1 content_wrapper">
                <h2 className="headline">Draw something <br />neat or messy</h2>
                <p>Draw something interesting and invite<br /> friends to your canvas.</p>
                <p id="wacom-text"><img src="/img/logo/wacom_logo.jpg" /> Also works with Wacom Tablets!</p>
            </div>
	      <div id="platform_bottom" className="platforms_content_wrapper1 content_wrapper">
	         <h2 className="headline">Draw something <br />neat or messy</h2>
            <p>Draw something interesting and invite friends to your canvas.</p>
	      </div>
        </div>

      </div>
      )
    }
}
