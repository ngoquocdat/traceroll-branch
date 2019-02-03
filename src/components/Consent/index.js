import React, { Component } from 'react';

class Consent extends Component{
  componentDidMount(){
    const script = document.createElement("script");
    script.id = "CookieDeclaration";
    script.src = "https://consent.cookiebot.com/086d5b69-9655-4859-a914-a4eea4d6a645/cd.js";
    script.async = true;
    document.body.appendChild(script);
  }

  render(){
    return(
      <div>
        <h1>Consent</h1>
      </div>
    );
  }
}

export default Consent;
