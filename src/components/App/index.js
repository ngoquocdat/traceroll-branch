import React, { Component } from 'react';
import './style.css';

class ModalAddImage extends Component {
  render() {
    return(
      <div id="add_image_modal" className="modal fade" role="dialog">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" data-dismiss="modal">×</button>
              <h4 className="modal-title">Add Image</h4>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label for="image_link" classname="col-md-2">Link:</label>
                <input type="text" className="form-control col-md-10" id="image_link" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" id="confirm_add_image">Add</button>
              <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
      )
  }
}

class ModalAddText extends Component {
  render() {
    return(
      <div id="add_text_modal" className="modal fade" role="dialog">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" data-dismiss="modal">×</button>
              <h4 className="modal-title">Add Text</h4>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label for="text" classname="col-md-2">Content:</label>
                <input type="text" className="form-control col-md-10" id="text" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" id="confirm_add_text">Add</button>
              <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
      )
  }
}

class App extends Component {
  state = {
    children: []
  }
  
  render() {
    return (
      <div>
        <nav className="navbar navbar-default">
          <div className="container-fluid">
            <div className="navbar-header">
              <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
                <span className="sr-only">Toggle navigation</span>
                <span className="icon-bar">
                  <span className="icon-bar">
                    <span className="icon-bar">
                    </span></span></span></button>
            </div>
            <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
              <ul className="nav navbar-nav">
                <li><a href="#">Home/Newsfeed</a></li>
                <li className="dropdown">
                  <a href="#" className="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Avatar <span className="caret" /></a>
                  <ul className="dropdown-menu">
                    <li><a href="#">Avatar Image</a></li>
                    <li role="separator" className="divider">
                    </li><li><a href="#"><i className="glyphicon glyphicon-home" /> Avatar Info</a></li>
                    <li role="separator" className="divider">
                    </li><li><a href="#"><i className="glyphicon glyphicon-map-marker" /> Avatar Info</a></li>
                    <li role="separator" className="divider">
                    </li><li><a href="#"><i className="glyphicon glyphicon-briefcase" /> Avatar Info</a></li>
                  </ul>
                </li>
                <li><a href="#">Theatre mode</a></li>
                <li><a href="#" id="add_image">Add image</a></li>
                <li><a href="#" id="add_text">Add text</a></li>
                <li><a href="#">Draw</a></li>
                <li><a href="#">Frame space</a></li>
                <li><a href="#">Account</a></li>
              </ul>
            </div>
          </div>
        </nav>
        <div id="konvastage">

        </div>
        <ModalAddImage />
        <ModalAddText />
      </div>
    );
  }
}

export default App;
