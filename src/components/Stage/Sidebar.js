import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import {
    TRMenu
} from './../Elements';
import {Stage, Layer} from 'tr-react-konva';
import {SketchPicker} from 'react-color';
import $ from 'jquery';
import './style.css'

class Sidebar extends Component {
    constructor(props) {
        super(props)
        this.state = {
            selectedDraw:0,
            text:"",
            width:350
        }
    }

    mouseOut = () => {
        window.addEventListener('wheel',this.props.handleMouseWheel)
    }

    mouseOver = () => {
        window.removeEventListener('wheel',this.props.handleMouseWheel)
    }

    handlerMenuChange = (options) => {
        this.props.handlerMenuChange && this.props.handlerMenuChange(options)
    }

    handlerChangePointer = (pointer) => {
        this.props.handlerChangePointer && this.props.handlerChangePointer(pointer)
    }

    toggleDrawingMenu = () => {
        window.dataLayer.push({'event': 'logEvent', 'eventType': 'Drawing', 'eventProperties':null});
        this.props.toggleDrawingMenu && this.props.toggleDrawingMenu()
    }

    render(){
        return(
            <div className="sidebar container" onMouseOut={() => this.mouseOut()} onMouseOver={() => this.mouseOver()}>
                <div className="sidebar-item row" style={{borderBottom : '1px solid #f2f0f0'}}>
                    <div className="addStuff col-md-12 col-xs-12 col-sm-12">
                        <strong>Add stuff</strong>  <a id="toggleButton" onClick={this.props.toggleSidebar}><img src="/img/tools/toggle-shrink.svg" width="14"/></a>
                    </div>
                </div>
                <div className="sidebar-item row">
                    <div className="col-md-12 col-xs-12 col-sm-12">
                        <img src="/img/icons/add_draw_fill.svg" width="25"/> <span className="sidebar-label">Draw</span> {
                            this.props.showDrawTool && <a id="cancelButton" onClick={this.props.closeDrawingMenuWithoutSaving}>Cancel Drawing</a>
                        }
                    </div>
                </div>
                {
                    this.props.showDrawTool && [
                        <div className="sidebar-item row">
                            <section>
                                <Stage
                                    width={this.state.width}
                                    height={80}>
                                    <Layer>
                                        <TRMenu
                                            width={this.state.width}
                                            height={80}
                                            handlerMenuChange={this.handlerMenuChange}
                                            handlerChangePointer={this.handlerChangePointer}
                                            options={this.props.options}
                                            toggleDrawingMenu={this.toggleDrawingMenu}
                                        />
                                    </Layer>
                                </Stage>
                            </section>
                        </div>,
                        <div className="sidebar-item row" style={{padding:'0 5px'}}>
                            <div className="col-md-12 col-xs-12 col-sm-12">
                                <SketchPicker
                                    width={this.state.width-100}
                                    color={this.props.options.color || "black"}
                                    onChangeComplete={(color)=>{this.handlerMenuChange({mode:this.props.options.mode,color:color.hex})}}
                                />
                            </div>
                        </div>
                    ]
                }
                {
                    !this.props.showDrawTool && [
                        <button id="startDrawing" onClick={this.props.toggleDrawingMenu}>Start Drawing</button>
                    ]
                }
                <div className="sidebar-item row" style={{borderBottom : '1px solid #f2f0f0',borderTop : '1px solid #f2f0f0',marginTop:'10px'}}>
                    <div className="sidebar-item-title col-md-12 col-xs-12 col-sm-12" style={{marginBottom:'10px'}}>
                        <img src="/img/icons/add_photo_fill.svg" width="24"/> <span className="sidebar-label">Photo / Video</span>
                    </div>
                    <div className="dropzone-wrapper col-md-12 col-xs-12 col-sm-12">
                        <Dropzone onDrop={this.props.handleDropElement}>
                            <p className="medgray" style={{fontSize:'21px', padding:'10px'}}>
                                <u>Click to Upload</u> from computer <br /> <span style={{fontSize:'15px'}}>or</span> <br /> <u>Drag & Drop file</u>
                            </p>
                        </Dropzone>
                    </div>
                    <div className="col-md-12 col-xs-12 col-sm-12">
                        <h3 className="medgray">or</h3>
                    </div>
                    <div className="col-md-12 col-xs-12 col-sm-12">
                        <div className="form-group">
                            <input type="text" className="form-control" id="image_link" placeholder="Paste link of photo/video/GIF" />
                        </div>
                    </div>
                    <div className="col-md-12 col-xs-12 col-sm-12">
                        <div className="form-group">
                            <input type="text" className="form-control" id="owner-caption" maxLength="100" placeholder="Caption (optional)" />
                        </div>
                    </div>
                    <div className="col-md-12 col-xs-12 col-sm-12">
                        <button type="button" className="btn btn-primary" onClick={()=>this.props.handleAddLink($('#image_link').val(), $('#owner-caption').val())}  id="confirm_add_image">Post image</button>
                    </div>
                </div>
                <div className="sidebar-item row">
                    <div className="sidebar-item-title col-md-12 col-xs-12 col-sm-12">
                        <img src="/img/icons/add_text.svg" width="25"/> <span className="sidebar-label">Write</span>
                    </div>
                    <div className="col-md-12 col-xs-12 col-sm-12">
                        <div className="form-group" >
                            <input type="text" className="form-control" id="text" placeholder="Text" />
                        </div>
                    </div>
                    <div className="col-md-12">
                        <button type="button" className="btn btn-primary" id="confirm_add_text" onClick={this.props.handleAddText}>Post text</button>
                    </div>
                </div>

            </div>
        )
    }
}

export default Sidebar
