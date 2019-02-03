import React, { Component } from 'react';
//import ScrollAnimation from 'react-animate-on-scroll';
import './style.css';

export default class Discover extends Component{
  render(){
    return(
      <div id="platforms">
         <div className="platforms_wrapper2 wrapper">
           <img className="platform-image1" src="/img/login/discover1.png" width="375.77px" height="656.5px" alt="Work in Progress" />
           <img className="platform-image2" src="/img/login/discover2.png" width="244px" height="462px" alt="Check out our new designs" style={{    marginTop: '5px'}} />
          <div className="platforms_content_wrapper2 content_wrapper">
            <h2 className="headline">Follow creative people <br /> Reach your audience</h2>
            <p>Like, comment and share photos and drawings.
              <br />Discover photographers, artists and designers.</p>
          </div>
      	</div>
      </div>
      )
    }
}
