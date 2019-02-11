import React, {Component} from 'react'
// import { regis } from '../store'
import Registry from './registry.js'
import axios from 'axios'

/* TEST AES256 */
// var key = 'my passphrase'
// var plaintext = 'my plaintext message'
 
/*var cipher = Aes.createCipher(key)
console.log('=========== aes256 cipher: ', cipher)*/
 
// var encrypted = aes.encrypt(key, plaintext)
// console.log('=========== aes256 encrypt: ', encrypted)
// var decrypted = aes.decrypt('my passphrase', encrypted)
// console.log('=========== aes256 dencrypt: ', decrypted)
/* END TEST */

const validatePattern = {
    "email": /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    "pass": /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/
}

class Login extends Component {
    constructor(props){
        super(props)
        this.state = {
            isRegistry: false,
            validateMessage: false,
            cannotSave: false,
            emailLogin: "",
            passLogin: ""
        }
    }

    componentDidMount(){
    }

    componentWillReceiveProps(nextProps) {
    }

    stibRegistry = () => {
        this.setState({
            isRegistry: !this.state.isRegistry
        })
    }

    handleToggleLogin = (isRegistry) => {
        this.setState({
            isRegistry: isRegistry
        })
    }

    handleLogin = (event) => {
        let self = this
        let isValidated = this.validateLogin(this.state.emailLogin, this.state.passLogin)
        // let isHashed = this.doubleCheckPassword(this.state.passLogin)

        /* Check  */
        if(isValidated){
            this.setState({
                validateMessage: !isValidated
            })

            let payloadData = {
                "email": this.state.emailLogin,
                "pass": this.state.passLogin
            }

            axios.post('/login', payloadData)
            .then( function(response) {
                console.log('============== call login success: ', response)
                if(response.data.authorised){
                    /* STORAGE SESSION */
                    localStorage.setItem('userEmail', self.state.emailLogin)
                    /* Authorised: redirect to User-page */
                    location.replace('/stib-user')
                }else{
                    /* !Authorised: notice can not login message */
                    self.setState({
                        validateMessage: !response.data.authorised
                    })
                }
            })
            .catch( function(err) {
                /* Notice message login get error */
                self.setState({
                    validateMessage: !self.state.validateMessage
                })
            })
        }else{
            this.setState({
                validateMessage: !this.state.validateMessage
            })
        }
    }

    /*doubleCheckPassword = (password) => {
        if(passHash.isHashed(password)){
            return false
        }else{
            return true
        }
    }*/

    validateLogin = (email, pass) => {
        if((validatePattern.email).test(email) && (validatePattern.pass).test(pass) && email != undefined && pass != undefined){
            return true
        }else{
            return false
        }
    }

    handleLoginPress = (e) =>{
        if(e.key === 'Enter'){
            this.handleLogin();
        }
    }

    render() {
        return(
            <div className="container">
                {/* LOGIN FORM */}
                {!this.state.isRegistry &&
                    <div className="login-container">
                        <p className="about"> This is Stib Login page </p>
                        <div id="stib-login">
                            <label>Email: <input 
                                            className="email-login" 
                                            type="email"
                                            placeholder="Email"
                                            onChange={(event) => this.setState({emailLogin: event.target.value})} />
                            </label>
                            <label>Password: <input 
                                                className="password-login" 
                                                type="password"
                                                placeholder="Password"
                                                onChange={(event) => this.setState({passLogin: event.target.value})} />
                            </label>
                        </div>
                        <button 
                            id="submit-login" 
                            onClick={(event) => this.handleLogin(event)} 
                            onKeyPress={this.handleLoginPress} 
                            value="Submit"> Log-in </button>
                        <button 
                            type="button"  
                            value="Registry" 
                            onClick={this.stibRegistry} > Registry </button>
                        
                        {/* MESSAGE INVALID EMAIL AND PASSWORD */}
                        {this.state.validateMessage &&
                            <p> Invalid email and password </p>
                        }
                    </div>
                }

                {/* REGISTRY FORM */}
                <Registry 
                    registry={this.state.isRegistry}
                    toggleLogin={this.handleToggleLogin}
                    validatePattern={validatePattern}
                    handleToggleLogin={this.handleToggleLogin}
                />
            </div>
        )
    }
}

export default Login