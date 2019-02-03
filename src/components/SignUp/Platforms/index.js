import React, { Component } from 'react';

import './style.css';

export default class Platforms extends Component{
  render(){
    return(
      <div id="platforms">
        <div className="platforms_wrapper1 wrapper">
          <div id="platform_top" className="platforms_content_wrapper1 content_wrapper">
            <h2 className="headline">Platforms tell you how to present your content.</h2>
            <p>Your content gets stacked chronologically; as you share new stuff, the older ones get lost.</p>
          </div>
          <img className="platform-image1" src="/img/login/Problem01.png" width="600" height="500" alt="" />
	      <div id="platform_bottom" className="platforms_content_wrapper1 content_wrapper">
	        <h2 className="headline">Platforms tell you how to present your content.</h2>
	        <p>Your content gets stacked chronologically; as you share new stuff, the older ones get lost.</p>
	      </div>
        </div>
        <div className="platforms_wrapper2 wrapper">
          <img className="platform-image2" src="/img/login/Problem02.png" width="400" height="540" alt="" />
          <div className="platforms_content_wrapper2 content_wrapper">
            <h2 className="headline">Platforms don't let you collaborate with friends.</h2>
            <p>Commenting is the only way of contributing to someone's content.</p>
          </div>
      	</div>
      </div>
      )
    }
}
