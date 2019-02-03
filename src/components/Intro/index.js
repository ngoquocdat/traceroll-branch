import React, { Component } from 'react';

export default class Intro extends Component{

  render(){
    return(
      <div>
        <a href="/" title="home"><img id="home-button" src="/img/about/logo_header2.svg" width="325" height="149"/></a>
        <div className="buttons">
            <a href="/about">About</a>
            <a href="https://medium.com/traceroll">Blog</a>
            <a href="https://docs.google.com/forms/u/1/d/e/1FAIpQLSfkLITqj6OLagmIyZyllV3RIoKeyAB9rY2hNHQ18i3KENkhCw/viewform?usp=send_form">Contact Us</a>
            <a href="/login" className="login">Log-in</a>
        </div>
      </div>
    );
  }
}
