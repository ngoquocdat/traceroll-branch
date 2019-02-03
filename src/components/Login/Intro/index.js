import React, { Component } from 'react';

import './style.css';

export default class Intro extends Component{
    render(){
      return (
        <div id="intro" className="intro_wrapper wrapper">
          <div className="intro_content_wrapper content_wrapper">
            <img src="/img/logo/Logo_200x200.png" width="200" alt=""/>
            <h1><strong>Traceroll</strong></h1>
            <h4>network of <strong>digital canvases</strong> <br />for sharing & collaboration</h4>
            <p className="introLogin_wrapper"><a id="login-button" className="signup-links" href="#login">Log-in</a>  <a id="sign-up-button" className="signup-links" href="#login">Sign-up</a></p>
          </div>
      	</div>
      );
    }
}
