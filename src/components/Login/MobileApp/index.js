import React, { Component } from 'react';
import { Link } from 'react-router';

import './style.css';

export default class MobileApp extends Component{

  render(){
    return(
        <div id="mobile" className="mobileApp_wrapper wrapper">
          <div id="mobile_top" className="mobileApp_content_wrapper content_wrapper">
            <h2 className="headline">Your personalized canvas. <br /> Now coming to your phone.</h2>
            <p>Draw with your fingers on your screen. <br />Organize and move your photos on the go. <br/>Discover new content.</p>
            <p className="ios-headline">iOS App coming later this year!</p>
            <img id="appleBadge" src="/img/login/AppStoreBadge.svg" alt="Apple Store Badge" width="204"/>
          </div>
          <div className="mobileApp_image_wrapper image_wrapper">
            <img src="/img/login/iPhone00.png" alt="example on Iphone" width="600"/>
          </div>
          <div id="mobile_bottom" className="mobileApp_content_wrapper content_wrapper">
            <h2 className="headline">Your personalized canvas. <br /> Now coming to your phone.</h2>
            <p>Draw with your fingers on your screen. <br />Organize and move your photos on the go. <br/>Discover new content.</p>
            <p className="ios-headline">iOS App coming later this year!</p>
            <img id="appleBadge" src="/img/login/AppStoreBadge.svg" alt="Apple Store Badge" width="204"/>
          </div>
        </div>
    );
  }
}
