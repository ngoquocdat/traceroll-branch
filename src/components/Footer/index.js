import React, { Component } from 'react';
import { Link } from 'react-router';
import './style.css';

export default class Footer extends Component{

  render(){
    return(
      <div className="footer_content">
        <div class="image-copyright">
        <img className="footer_logo" src="/img/logo/logo.svg" width="100"/>
          <Link to="/">
            <img id="copyright-image" src="/img/icons/copyright.svg" width="141"/>
          </Link>
        </div>
        <div class="product">
            <p>PRODUCT</p>
            <a href="/about">About</a>
            <a href="https://medium.com/traceroll">Blog</a>
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSfkLITqj6OLagmIyZyllV3RIoKeyAB9rY2hNHQ18i3KENkhCw/viewform">Contact Us</a>
        </div>
        <div class="company">
            <p>COMPANY</p>
            <a href="https://twitter.com/traceroll">Twitter</a>
            <a href="https://www.linkedin.com/company/traceroll/">Linkedin</a>
            <a href="https://www.crunchbase.com/organization/traceroll">Crunchbase</a>
        </div>
        <div class="resources">
            <p>RESOURCES</p>
            <a href="/privacy-policy">Privacy Policy</a>
            <a href="/terms">Terms Of Service</a>
        </div>
        <div class="image-copyright-mobile">
        <Link to="/"><img className="footer_logo" src="/img/logo/logo.svg" width="100"/></Link>
          <Link to="/">
            <img id="copyright-image" src="/img/icons/copyright.svg" width="141"/>
          </Link>
        </div>
      </div>
    );
  }
}
