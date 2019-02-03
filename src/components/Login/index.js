import React, { Component } from 'react';
import axios from 'axios';
import Utils from '../Util/utils.js';
import Const from '../Util/const.js';
import TrService from '../Util/service';
import TRToast from '../Elements/Notification/toast';

import './style.css';

const _EmailError = Const.EMAIL_ERROR;

export default class Login extends Component {
  constructor(props){
    super(props);
    this.state={
      username_login: '',
      password_login: '',
      fullname: '',
      email: '',
      formError: '',
      showForgotPwdDialog: false,
      isValidRecoveryEmail: true,
    }
  }

  //Login handler
	handleLogin(event){
    ( document.getElementsByClassName("cursor-type")[0] ) ? document.getElementsByClassName("cursor-type")[0].style.cursor = 'progress' : '';
    ( document.getElementById("btnlogin") ) ? document.getElementById("btnlogin").style.cursor = 'progress' : '';
    ( document.getElementById("btnForgot") ) ? document.getElementById("btnlogin").style.cursor = 'progress' : '';
		//setting
		var apiBaseUrl = "/login";
		var payload={
			"username": this.state.username_login,
			"password": this.state.password_login
		}
		//call API login, data = payload
		axios.post(apiBaseUrl, payload)
		.then(function (response) {
			if (response.data.username){
        window.dataLayer.push({'event': 'setUserId', 'userId': `${response.data.username}`});
				window.location.href = "/stage/"+response.data.userslug;
			}
		})
		.catch(function(err) {
			const body = err.response.data;
			if(body === 'user-password-incorrect'){
        alert('user or password is incorrect');
      }else{
        alert(body);
      }
      ( document.getElementsByClassName("cursor-type")[0] ) ? document.getElementsByClassName("cursor-type")[0].style.cursor = "default" : '';
      ( document.getElementById("btnlogin") ) ? document.getElementById("btnlogin").style.cursor = 'pointer' : '';
      ( document.getElementById("btnForgot") ) ? document.getElementById("btnForgot").style.cursor = 'pointer' : '';
		})

	}
	// Call function handlelogin when press Enter while filling password
	handleLoginPress = (e) =>{
		if(e.key === 'Enter'){
				this.handleLogin();
			}
	}

  handleForgotPassword = () => {
      this.setState({
          showForgotPwdDialog: true
      })
  }

  handleHideDialog = (e) => {
      const dialog = e.target.dataset.dialog
      this.setState({
          [dialog]: false
      })
  }

  handleResetPwd = (e) => {
      const { recoveryEmail, isValidRecoveryEmail } = this.state

      if(isValidRecoveryEmail) {

          this.TRToast.showAutoHide('Sending...')

          const requestBody = {
              "email": recoveryEmail
          }

          TrService.resetPassword(requestBody, response => {
              const error = response.data.error
              if (error !== null) this.TRToast.showAutoHide(error)
              else                this.TRToast.showAutoHide(`We sent a recovery link to ${recoveryEmail}`, 5000)
          })

          this.setState({
              showForgotPwdDialog: false
          })
      }
  }

  handleValidateEmail = (e) => {
      const input = e.target,
          email = e.target.value,
          isValid = Utils.validateEmail(email),
          input_value = input.dataset.input_value,
          input_error = input.dataset.input_error

      this.setState({
          [input_value]: email,
          [input_error]: isValid
      })
  }

  componentWillMount(){
    ( Utils.mobileCheck() ) ? window.location.href = '/' : console.log("not mobile");
  }

  render(){
    console.log('login ===')
    return(
      <div id="login-wrapper" className="cursor-type">
        <div id="login" className="login_wrapper">
          {/*modal login*/}
            <div className="loginmodal">
              {/*LOGIN FORM*/}
                <div className="signin signform" style={{display:this.state.display}}>
                    <div className="signform-header">
                        <a href="/"><img src="/img/logo/logo.svg" width="65" height="65" /></a>
                        <img src="/img/login/logo_header1.svg" width="150"/><br />
                        <h3 className="sub-headline">Log-in</h3>
                    </div>
                    <input
                        type="text"
                        id="username"
                        placeholder="Username or Email"
                        onChange = {(e) => this.setState({username_login:e.target.value}) } />
                    <input
                        type="password"
                        id="pass"
                        placeholder="Password"
                        onChange = {(e) => this.setState({password_login:e.target.value})} onKeyPress={this.handleLoginPress} required/>
                    <button id="btnForgot" className="Login__forgotpwd-btn" onClick={this.handleForgotPassword}>Forgot password?</button>
                    <button id="btnlogin" onClick={(event) => this.handleLogin(event)}>Log-in</button>
                    <br />
                    <p className="legal">By logging in, you agree to our <br /> <a href="/terms" style={{color:'inherit',textDecoration
                            :'underline'}}>Terms of Service</a> & <a href="/privacy-policy" style={{color:'inherit',textDecoration
                            :'underline'}}>Privacy Policy</a></p>
                </div>
                {/* Forgot password dialog */}
                {
                    this.state.showForgotPwdDialog &&
                    <section className="ForgotPwd__container" data-dialog="showForgotPwdDialog" onClick={this.handleHideDialog}>
                        <section className="ForgotPwd">
                            <h2 className="ForgotPwd__title">Forgot Password</h2>
                            <p className="ForgotPwd__info">Type in your email address so we can send your password.</p>
                            <input
                                className={`ForgotPwd__email-input${this.state.isValidRecoveryEmail?'':' hasDanger-border'}`}
                                type="email"
                                placeholder="E-mail Address"
                                onChange={this.handleValidateEmail}
                                data-input_value="recoveryEmail"
                                data-input_error="isValidRecoveryEmail"
                            />
                            {
                                !this.state.isValidRecoveryEmail &&
                                <p className="hasDanger">{_EmailError}</p>
                            }
                            <button className="ForgotPwd__send-btn" onClick={this.handleResetPwd}>Send</button>
                        </section>
                    </section>
                }
          </div>
        </div>
        <TRToast ref={node => this.TRToast = node}/>
      </div>
    )
  }
}
