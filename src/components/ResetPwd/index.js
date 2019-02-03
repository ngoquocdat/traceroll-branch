import React, { Component } from 'react';
import axios from 'axios';
import Utils from '../Util/utils.js';
import Const from '../Util/const.js';
import Jquery from 'jquery';

import './style.css';
//=====================================
// LOGIN FORM
//=====================================
export default class ResetPwd extends Component {
    constructor(props){
        super(props);
        //State to save Usernam and Pass
        this.state={
            newPwd:'',
            confirmPwd:'',
            token: this.props.params.token
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
        const token = {
            "token": this.props.params.token
        }

        axios.post('/user/recover-password/isExpired', token)
        .then(function(response){
            if(response.status !== 200 || response.data.uid === null){
                // prompt reset email expired
                self.setState({
                    emailExpired: false,
                });
            }else{
                self.setState({
                    emailExpired: true,
                    requestEmail: response.data.email,
                    requestUid: response.data.uid
                });
            }
        })
    }

    //Register handler
    handleChangePwd(e){
        const newPassword = this.state.newPwd;
        const confirmPassword = this.state.confirmPwd;

        if (Utils.isValidPassword(newPassword)) {
            if (confirmPassword.localeCompare(newPassword) === 0) {
                const newPwdData = {
                    "recoverPassword": newPassword,
                    "recoverUid": this.state.requestUid,
                    "recoverEmail": this.state.requestEmail
                }

                axios.post('/user/recover-password', newPwdData)
                .then(function(response) {
                    if (response.status === 200) {
                        window.location.href = "/login";
                    } else {
                        alert('Can not reset password, try again please!');
                    }
                })

            } else {
                // corfirm password not equal
                alert('Confirm password not matching!');
            }
        } else {
            alert(Const.INVALID_PASSWORD_MSG);
        }
    }

    /*HANLDE REDIRECT LOGIN PAGE*/
    handleRedirectLogin(e){
        window.location.href = "/login"
    }

    render() {

        return (
            /*container*/
            <div id="forgot-password">
              <div className="forgot-password_wrapper">
                  <div className="loginmodal">
                      {/*Resgister FOrm*/}
                      <div className="signin signform" style={{display:this.state.display}}>
                        {/*CHANGE PASSWORD FORM*/}
                        <div className="signform-header">
                          <img src="/img/logo/logo.svg" width="65" height="65" />
                          <img src="/img/login/logo_header1.svg" width="150" height="33.67"/><br />
                          <h3 className="sub-headline">Change Password</h3>
                        </div>
                        {   this.state.emailExpired &&
                            <div>
                                <input type="password" 	placeholder="New Password" id="newpwd" onChange={(e) => this.setState({newPwd: e.target.value})}/>
                                <input type="password" 	placeholder="Confirm Password" id="confirmpwd" onChange={(e) => this.setState({confirmPwd: e.target.value})}/>
                                <button id="btn-change-passwd" onClick={(event) => this.handleChangePwd(event)}>Change Password</button>
                            </div>
                        }
                        {/*RECOVER EMAIL EXPIRED*/}
                        {   this.state.emailExpired === false &&
                            <div id="expiration">
                                <h3>Time expired to reset password</h3>
                                <button id="btnlogin" onClick={(event) => this.handleRedirectLogin(event)}>Return Home</button>
                            </div>
                        }
                      </div>
                  </div>
              </div>
            </div>
        );
    }
}
