import React, { Component } from 'react';
import axios from 'axios';
import Utils from '../Util/utils.js';
import Const from '../Util/const.js';
import TrService from '../Util/service';
import TRToast from '../Elements/Notification/toast';
import fbLogo from './fb_logo.png'

import './style.css';

const _EmailError = Const.EMAIL_ERROR;

export default class Login extends Component {
    constructor(props){
        super(props);
        this.state={
            username: '',
            password: '',
			fullname: '',
			email:'',
            fbID: '',
            formError: '',
            fullNameCheck: true,
			usernameCheck: true,
			passwordCheck: false,
			emailCheck: true
        }
    }

    componentDidMount = () => {
        let qs = window.location.search
        console.log('========== qs search: ', qs)
		qs = qs.slice(1)
		let paramArr = qs.split('&')
        
        console.log('========== qs: ', qs)
        console.log('========== paramArr: ', paramArr)
		paramArr.forEach((item)=>{
			item = item.split("=")
			let obj = {}
			if (item[0]==="fullname") {
				obj[item[0]] = decodeURIComponent(item[1])
			}else if(item[0]==="picture"){
                obj[item[0]] = item[1]+"="+item[2]
            }
			else {
				obj[item[0]] = item[1]
			}
			this.setState(obj)
		})
    }

    //Register handler
	handleRegister = (e) => {
		const _SECRETKEY = 'ADtCrhPcSQ';
		const _ErrorClass='hasDanger-border';
		const _UsernameError = '3 - 20 characters & no caps / special';
		const _PasswordError='Please enter a password';
		const _NameError = 'Please enter a valid name';

		if(!this.state.usernameCheck){
			this.setState({
                usernameClass: _ErrorClass,
                usernameError: _UsernameError
			})
		}
		if(!this.state.passwordCheck){
			this.setState({
                passwordClass:_ErrorClass,
                passwordError:_PasswordError
			})
		}
		if(!this.state.emailCheck){
			this.setState({
					emailClass: _ErrorClass,
					emailError: _EmailError
			})
		}
		if(!this.state.fullNameCheck){
			this.setState({
				fullNameClass:_ErrorClass,
				fullNameError:_NameError
			})
		}

		if( this.state.fullNameCheck && this.state.usernameCheck && this.state.passwordCheck && this.state.emailCheck) {
			//we want to change styling but don't want to re-render but want some type of user feedback
			( document.getElementsByClassName("cursor-type")[0] ) ? document.getElementsByClassName("cursor-type")[0].style.cursor = 'progress' : '';
			( document.getElementById("btnreg") ) ? document.getElementById("btnreg").style.cursor = 'progress' : '';
			var apiBaseUrl = "/register";
			var payload={
				"username": this.state.username.replace(/ +/g, "").toLowerCase(),
				"password": this.state.password,
				"fullname": this.state.fullname,
				"email":this.state.email,
				"fbID": this.state.fbID,
                "picture": this.state.picture+"&height="+this.state.height+"&width="+this.state.width+"&ext="+this.state.ext+"&hash="+this.state.hash
            }
			//CALL API, data = payload
			axios.post(apiBaseUrl, payload)
			.then(function (response) {
				const body = response.data;

				if (body.username && body.email && body.userId && body.fullname){
					window.dataLayer.push({'event': 'setUserId', 'userId': `${body.username}`});
					window.dataLayer.push({
						'event': 'setUserProperties',
						'userProperties': {
								'Username': `${body.username}`,
								'First Name': `${(body.fullname).split(" ")[0]}`,
								'Last Name': `${(body.fullname).split(" ")[1]}`,
								'Email': `${body.email}`,
								'S3UId': `${body.userId}`,
							}
					});
					window.dataLayer.push({'event': 'logEvent', 'eventType': 'Sucessful Register', 'eventProperties':null});
					//Redirect URL with encryption on username
					//var key = cryptoJS.AES.encrypt(""+response.data.userslug, _SECRETKEY);
                    //window.location.href = `${_ONBOARDING_URL}?username=${response.data.userslug}&id=${key}`;
                    window.location.href = "/"
				}else{
					alert('login error');
				}
			})
			.catch(function(err) {
				const body = err.response.data;
				alert(body);
				//don't want to re-render the contents in render
				( document.getElementsByClassName("cursor-type")[0] ) ? document.getElementsByClassName("cursor-type")[0].style.cursor = "default" : '';
				( document.getElementById("btnreg") ) ? document.getElementById("btnreg").style.cursor = 'pointer' : '';
			})
		}else{
			this.setState({formError: "error"});
		}
	}
	// Call function handleRegister when press Enter while filling password
	handleRegisterPress = (e) =>{
		if(e.key === 'Enter'){
				this.handleRegister();
			}
	}

    componentWillMount(){
        ( Utils.mobileCheck() ) ? window.location.href = '/' : console.log("not mobile");
    }

    verifyUsername = (e) => {
		const _UsernameError = '3 - 20 characters & no caps / special';
		const _ErrorClass = 'hasDanger-border';
		const _NoError = '';
		const username=e.target.value;
		if(!username){
			this.setState({
                usernameClass: _ErrorClass,
                usernameError: _UsernameError,
                usernameCheck: false,
                formError: 'error'
			})
		}else if( username.match(/[A-Z]|\`|\~|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\+|\=|\[|\{|\]|\}|\||\\|\'|\<|\,|\.|\>|\?|\/|\""|\;|\:|\s/g) || username.length < 3 || username.length > 20 ) {
			this.setState({
                usernameClass: _ErrorClass,
                usernameError: _UsernameError,
                usernameCheck: false,
                formError: 'error'
			})
		}else{
			this.setState({
                usernameClass: _NoError,
                usernameError: _NoError,
                usernameCheck: true
			})
		}
    }
    handleFullName = (e) => {
		this.setState({fullname:e.target.value})
		const _Name=e.target.value;
		const _ErrorClass = 'hasDanger-border';
		const _NoError = '';
		const _NameError = 'Please enter a valid name (no special characters)';
		var specialCheck = new RegExp('([0-9,.!@#$%^&*()])', 'g');
		if(specialCheck.test(_Name)){
			this.setState({
				fullNameClass:_ErrorClass,
				fullNameError:_NameError,
				fullNameCheck:false,
				formError: 'error'
			})
		}
		else{
			this.setState({
                fullNameClass:_NoError,
                fullNameError:_NoError,
                fullNameCheck:true
			})
		}
    }
    
    verifyPassword = (e) => {
		const _ErrorClass = 'hasDanger-border',
				_NoError = '',
				_PasswordLength = 'Password should atleast have 6 characters',
				lengthCheck = new RegExp("(?=.{6,})"),
				password = this.state.password
		if(!lengthCheck.test(password)) {
			this.setState({
				passwordClass:_ErrorClass,
				passwordError:_PasswordLength,
				passwordCheck: false,
				formError: 'error'
			})
		}
		else {
			this.setState({
				passwordClass: _NoError,
				passwordError: _NoError,
				passwordMisMatch: _NoError,
				passwordCheck:true
			})
		}
	}

	verifyEmail = (e) => {
		const email = e.target.value;
		const _ErrorClass = 'hasDanger-border';
		const _NoError = '';

		if(!Utils.validateEmail(email)) {
			this.setState({
							emailClass: _ErrorClass,
							emailError: _EmailError,
							emailCheck: false,
							formError: 'error'
			});
			return;
			//alert(`Email ${email} is invalid.`);
		}else{
			this.setState({
							emailClass: _NoError,
							emailError: _NoError,
							emailCheck: true
			})
		}
	}

    render(){
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
                            <h3 className="sub-headline">Facebook Log-in</h3>
                        </div>
                        <input
                            type="text"
                            className={this.state.fullNameClass}
                            id="fullname"
                            placeholder="Full Name"
                            value={this.state.fullname}
                            onChange = {this.handleFullName} 
                        />
                        <p className="hasDanger">{this.state.fullNameError}</p>
                        <input
                            type="text"
                            className={this.state.usernameClass}
                            id="username_register"
                            placeholder="Username"
                            value={this.state.username}
                            onBlur = {this.verifyUsername}
                            onChange = {(e) => this.setState({username:e.target.value}) } 
                        />
                        <p className="hasDanger">{this.state.usernameError}</p>
						<input
							type="email"
							className={this.state.emailClass}
							placeholder="E-mail Address"
							id="email"
                            style={{display: 'none'}}
							value={this.state.email}
							onChange = {(e)=>{this.setState({email:e.target.value})}}
							onBlur = {this.verifyEmail}
						/>
						<p className="hasDanger">{this.state.emailError}</p>
                        <input
                            type="password"
                            className={this.state.passwordClass}
                            id="pass_register"
                            placeholder="Password"
                            value={this.state.password}
                            onChange = {(e)=>{this.setState({password:e.target.value});}}
	                        onBlur = {this.verifyPassword}
                            onChange = {(e) => this.setState({password:e.target.value})} 
                            onKeyPress={this.handleRegisterPress} 
                            required
                        />
                        <p className="hasDanger">{this.state.passwordError}</p>
                        <button id="btnlogin" onClick={(event) => this.handleRegister(event)}>Sign-up</button>
                        <br />
                        <p className="legal">By logging in, you agree to our <br /> <a href="/terms" style={{color:'inherit',textDecoration
                                :'underline'}}>Terms of Service</a> & <a href="/privacy-policy" style={{color:'inherit',textDecoration
                                :'underline'}}>Privacy Policy</a></p>
                    </div>
                </div>
            </div>
            <TRToast ref={node => this.TRToast = node}/>
        </div>
        )
    }
}
