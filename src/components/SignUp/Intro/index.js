import React, { Component } from 'react';
import Utils from '../../Util/utils.js';
import './style.css';

export default class Intro extends Component{

  constructor(props){
    super(props);
    this.state={
      isMobile: '',
    };
  }

  //code for browser check
  componentDidMount(){
    ( Utils.mobileCheck() ) ? this.setState({isMobile: 'mobile'}) : console.log("not mobile");
  }

    render(){
      return (
        <div id="intro" className="intro_wrapper">
            <div className="imageandtext">
            <img className="logo" align="left" src="/img/logo/logo.svg" width="115" height="115" alt="Traceroll Logo"/>
                <div className="text_wrapper">
                  <p className="heading"><img src="/img/login/logo_header1.svg" width="216.83" height="48.69" /> <span className={ (this.state.isMobile) ? "beta " + this.state.isMobile : "beta"}>BETA</span></p>
                  <br /><p className="tagline">the creative space of the internet</p>
                </div>
            </div>
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
