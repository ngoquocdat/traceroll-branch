import React, { Component } from 'react';
import './style.css';

export default class Canvas extends Component{
  render(){
    return(
      <div id="canvas" className="canvas_wrapper wrapper">
          <img className="canvas-image full" src="/img/login/canvas.png"  alt="Canvas exmample" width="1182.42" height="700"/>
          <img className="canvas-mobile" src="/img/mobile_images/Canvas_Mobile.png"  alt="Canvas exmample" />

          <div id="canvas_top" className="canvas_content_wrapper content_wrapper">
            <h2 class="headline">Invite your friends to your canvas</h2>
            <p>Collaborate with your friends in a new way <br />with photos, videos & drawings</p>
          </div>
          <div id="canvas_bottom" className="canvas_content_wrapper content_wrapper">
            <h2 class="headline">Invite your friends to your canvas</h2>
            <p>Collaborate with your friends in a new way <br />with photos, videos & drawings</p>
          </div>
      </div>
    )
  }
}
