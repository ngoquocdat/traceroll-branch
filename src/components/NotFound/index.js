import React, { Component } from 'react';

import './style.css';

export default class NotFound extends Component {

  render() {
    return (
      <div id="notfound">
        <h1>
          Oopss... <br />
          <strong>Looks like you got lost :(</strong>
        </h1>
        <img className="notfound-image" src="/img/404/404.webp" alt="404 not found image" width="425" /><br />
        <a href="/"><img src="/img/buttons/backhome.svg" alt="Back home" width="200" /></a>
      </div>
    );
  }
}
