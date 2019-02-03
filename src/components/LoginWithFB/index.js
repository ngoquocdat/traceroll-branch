import React, { Component } from 'react';
import TRToast from '../Elements/Notification/toast';

import './style.css';

export default class Login extends Component {
    constructor(props){
        super(props);
        this.state={
			name:'',
			profile:'',
			height:'',
			width:'',
			ext:'',
			hash:''
        }
    }

    componentDidMount = () => {
        let qs = window.location.search
        console.log('========= qs', qs)
		qs = qs.slice(1)
		let paramArr = qs.split('&')
		paramArr.forEach((item)=>{
            console.log('============ login with FB component did mount: ', item)
			item = item.split("=")
			let obj = {}
			if (item[0]==="name") {
				obj[item[0]] = decodeURIComponent(item[1])
			}
			else {
				obj[item[0]] = item[1]
			}
			if (item[2]) {
				obj[item[0]] = obj[item[0]] + '=' + item[2]
			}
			this.setState(obj)
		})
    }

    render(){
        console.log('login with FB')
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
                        <div className="profile-wrapper">
							<img src={`${this.state.profile}&height=${this.state.height}&width=${this.state.width}&ext=${this.state.ext}&hash=${this.state.hash}`} className="profile-pic"/>
						</div>
                        <button id="btnlogin" onClick={(event) => window.location.href="/"}>Continue as {this.state.name}</button>
                        <br />
                        <p className="legal">
							Not {this.state.name} <a href="#">Switch Account</a>
						</p>
                    </div>
                </div>
            </div>
            <TRToast ref={node => this.TRToast = node}/>
        </div>
        )
    }
}
