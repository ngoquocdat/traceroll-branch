import React, { Component } from 'react';
import axios from 'axios';
import Utils from '../Util/utils.js';
import Jquery from 'jquery';

import './style.css';
//=====================================
// LOGIN FORM
//=====================================
export default class NonRegistration extends Component {
    constructor(props){
        super(props);
        //State to save Usernam and Pass
        this.state={
            token: this.props.params.tokenNonRegis
        }

        var width = window.innerWidth;
        //handle Responsive change one column to one column
        if (width<768){
            this.state={
                display: "none",
                displayop:"block"
            }
        }
        else{
            this.state={
                display:"block"
            }
        }
    }

    componentWillMount(){
        const self = this;
        const urlToken = this.props.params.tokenNonRegis;

        axios.get('/api/user/non-register/'+urlToken)
        .then(function(response){
            if(response.data.status === "FAILED"){
                self.setState({
                    isNonRegistExist: false,
                })
            }else{
                self.setState({
                    isNonRegistExist: true,
                })
            }
        })
    }

    //HANLDE REDIRECT LOGIN PAGE
    handleRedirectLogin(e){
        window.location.href = "/login"
    }

    render() {
        return (
            /*container*/
            <div id="non-registration">
                <div className="login_wrapper">
                    <div className="loginmodal">
                        {/*Resgister FOrm*/}
                        <div className="signup signform" style={{display:this.state.display}}>
                            <div className="signform-header">
                                <img src="/img/logo/logo.svg" width="65" height="65" />
                                <h2>Traceroll</h2><br />
                                <h3 className="sub-headline">Account Deletion</h3>
                            </div>
                            {/*DELETED NON-REGISTRATION MESSAGE*/}
                            {   this.state.isNonRegistExist &&
                                <div>
                                    <h3>Your registered account has been deleted</h3>
                                    <button id="btnlogin" onClick={(event) => this.handleRedirectLogin(event)}>Login or Register</button>
                                </div>
                            }
                            {/*DELETED NON-REGISTRATION MESSAGE*/}
                            {   this.state.isNonRegistExist &&
                                <div>
                                    <h3>Your registered account has been deleted</h3>
                                    <button id="btnlogin" onClick={(event) => this.handleRedirectLogin(event)}>Login or Register</button>
                                </div>
                            }
                            {/*NON-REGISTRATION ACCOUNT NOT EXIST MESSAGE*/}
                            {
                                this.state.isNonRegistExist === false &&
                                <div>
                                    <h3>Your registered account does not exist or has been deleted</h3>
                                    <button id="btnlogin" onClick={(event) => this.handleRedirectLogin(event)}>Login or Register</button>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
