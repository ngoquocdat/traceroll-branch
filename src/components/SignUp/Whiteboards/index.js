import React, { Component } from 'react';

import './style.css';

export default class Whiteboards extends Component{
    render(){
      return (
        <div  id="Whiteboards" className="whiteboards_wrapper wrapper">
          <div className="whiteboards_content_wrapper content_wrapper whiteboard_top">
            <h2 className="headline">Showcase your stories <br /> on an infinite canvas</h2>
            <p>Traceroll lets you share on an infinite canvas where <br/> there are no limits to what you can do.</p>
          </div>
          <div className="whiteboards_content_wrapper_2 content_wrapper_2 whiteboard_bottom">
          	<img className="whiteboard-image" src="/img/mobile_images/Welcome_Mobile.png"  alt="Canvas exmample" />
            <div className="whiteboard_bottom_content">
	         <h2 className="headline">Showcase your stories <br /> on an infinite canvas</h2>
	         <p>Traceroll lets you share on an infinite canvas where <br/> there are no limits to what you can do.</p>
	        </div>
          </div>
      	</div>
      )
    }
}
