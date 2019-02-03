import React, {Component} from 'react';
import { detect } from 'detect-browser';
const _BROWSER = detect();

class CheckBrowser{

  check(){
    if (_BROWSER) {
      switch(_BROWSER.name){
        case "edge":
          window.confirm("Sorry your browser is not supported. IF you'd like you could update to a browser that is compatible (Clicking ok will redirect you to install Google Chrome") ? window.location.href = "https://www.google.com/chrome/" : console.log("cancelled");
          break;
        default:
          console.log('browser not detected');
          break;
      }
    }
  }

}

const checkbrowser = new CheckBrowser();
export default checkbrowser;
