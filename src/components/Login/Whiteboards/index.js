import React, { Component } from 'react';

import './style.css';

export default class Whiteboards extends Component{
    render(){
      return (
        <div  id="Whiteboards" className="whiteboards_wrapper wrapper">
					<img src="/img/login/Macbook_1100x726.png" width="875" height="577" alt="" />
          <div className="whiteboards_content_wrapper content_wrapper">
            <h2 className="headline">Arrange photos freely.<br />Draw wherever you want.</h2>
            <p>Traceroll lets you share photos and drawings in an infinite artboard where there are no limits to what you can do.</p>
            <a href="#login"><button className="whiteboards_signUp">Sign-up</button></a>
          </div>
      	</div>
      )
    }
}
