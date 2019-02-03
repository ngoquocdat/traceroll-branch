import React, { Component } from 'react';
import { Link } from 'react-router';

import './style.css';

export default class MobileApp extends Component{

  render(){
    return(
        <div id="mobile" className="mobileApp_wrapper wrapper">
          <div id="mobile_top" className="mobileApp_content_wrapper content_wrapper">
            <h2 className="headline">The world of Traceroll. <br />Now in your pocket.</h2>
            <p>Draw with your fingers on your screen.<br/>Organize and move your photos on the go.<br/>Discover creatives & friends.</p>
            <p className="ios-headline">Mobile Apps coming later this year!</p>
            <img id="appleBadge" src="/img/login/AppStoreBadge.svg" alt="Apple Store Badge" width="204" height="68.23"/>&nbsp;&nbsp;&nbsp;&nbsp;
            <img id="googleBadge" src="/img/login/google-play-badge.svg" alt="Google Store Badge" width="222"/>
          </div>
          <div className="mobileApp_image_wrapper image_wrapper">
            <img className="full" src="/img/login/iPhone.png" alt="example on Iphone" width="685" />
          </div>
          <div id="mobile_bottom" className="mobileApp_content_wrapper content_wrapper">
            <h2 className="headline">The world of Traceroll. <br />Now in your pocket.</h2>
            <p>Draw with your fingers on your screen.<br/>Organize and move your photos on the go.<br/>Discover creatives & friends.</p>
            <p className="ios-headline">Mobile Apps coming later this year!</p>
            <img id="appleBadge" src="/img/login/AppStoreBadge.svg" alt="Apple Store Badge" width="204" height="68.23"/>&nbsp;&nbsp;&nbsp;&nbsp;
            <img id="googleBadge" src="/img/login/google-play-badge.svg" alt="Google Store Badge" width="222"/>

          </div>
        </div>
    );
  }
}
