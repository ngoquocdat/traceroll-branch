import React, { Component } from 'react';

import './style.css';

export default class Canvas extends Component{
  render(){
    return(
      <div id="canvas" className="canvas_wrapper wrapper">
     
          <img src="/img/login/Canvas.png"  alt="" />
          <div id="canvas_top" className="canvas_content_wrapper content_wrapper">
            <h2 className="headline">Traceroll gives you an <br />infinite amount of space</h2>
            <p>You can draw wherever you want and arrange <br /> your photos how ever you like…</p>
          
        </div>
        <div id="canvas_bottom" className="canvas_content_wrapper content_wrapper">
            <h2 className="headline">Traceroll gives you an infinite amount of space</h2>
            <p>You can draw wherever you want and arrange your photos how ever you like…</p>
          
        </div>
      </div>
    )
  }
}
