import React, { Component } from 'react';
import Footer from '../../Footer/index';
import './style.css';

export default class LoginFooter extends Component{

  render(){
    return(
      <div className="footer_wrapper wrapper">
        <div className="footer_content_wrapper content_wrapper">
          <h4 className="sub-headline">imagine the possibilities when the world has the <br /> <strong>freedom of creativity</strong> and an <strong>infinite amount of space</strong></h4>
            <img id="whiteboard" src="/img/login/Intro_Whiteboard.png" alt="" />
        </div>
       <Footer />
      </div>
    );
  }
}
