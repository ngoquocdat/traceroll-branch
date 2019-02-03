import React, { Component } from 'react';

class BodyBackground extends Component{

   componentWillMount() {
     this.props.background ? document.body.classList.add('background') : document.body.classList.remove('background');
     this.props.componentTemplate ? document.body.classList.add('about_body') : document.body.classList.remove('about_body');
   }
   render() {
     return this.props.children;
   }
}

export default BodyBackground;
