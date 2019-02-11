import React, {Component} from 'react'
// import { incrementCount, decrementCount, resetCount } from '../store'
import axios from 'axios'
import aes from 'aes256'

class Registry extends Component {
    constructor(props) {
        super(props)
        this.state = { 
            isRegistry: false,
            regisEmail: '',
            regisPassword: '',
            validateRegisMessage: false,
            isHashed: false,
            successed: false
        }
    }

    componentWillMount(){
    }

    componentWillReceiveProps(nextProps){ 
        this.setState({
            isRegistry: nextProps.registry
        })
    }

    returnLogin = () => {
        this.props.toggleLogin && this.props.toggleLogin(!this.state.isRegistry)
    }

    handleRegistry = (event) => {
        this.setState({
            isHashed: !this.state.isHashed
        })

        let self = this
        const email = this.state.regisEmail
        const passwd = this.state.regisPassword

        let payloadRegis = {
            "email": email,
            "passwd": passwd 
        }

        axios.post('/registry', payloadRegis)
        .then( function(response){
            const obj = response.data
            if(response.data.resCode === 601){
                setTimeout(function(){
                    /* TURN ON SUCCESSED MESSAGE */
                    self.setState({
                        successed: !self.state.successed
                    })
                    setTimeout(function(){
                        /* RETURN TO LOG-IN FORM */
                        self.props.handleToggleLogin && self.props.handleToggleLogin(false)
                    }, 1000)
                }, 2000)
            }else{
                self.setState({
                    isHashed: !self.state.isHashed
                })
            }
        })
        .catch( function(err){
            console.log('======== registry err: ', err)
            self.setState({
                isHashed: !self.state.isHashed
            })
        })
    }

    /* HASH PWD BEFORE SEND TO BACK */
    /* hashRegisPassword = (password) => {
        return aes.encrypt('pwd', password)
    }*/

    handleRegisKeyPress = (e) => {
        if(e.key === 'Enter'){
            this.handleRegistry()
        }
    }

    render() {
        return(
            <div className="registry-container">
                {this.state.isRegistry &&
                    <div className="registry-form">
                        <p className=""> This is Stib Registry page </p>

                        {/* REGISTRY FORM */}
                        <form id="stib-registry" action="/registry" method="post">
                            <label>Email: <input 
                                            className="email-login" 
                                            type="email"
                                            placeholder="Email"
                                            onChange={(event) => this.setState({regisEmail: event.target.value})} />
                            </label>
                            <label>Password: <input 
                                                className="password-login" 
                                                type="password"
                                                placeholder="Password"
                                                onChange={(event) => this.setState({regisPassword: event.target.value})} />
                            </label>
                        </form>
                        <button 
                            type="button" 
                            value="Registry" 
                            onClick={(event) => this.handleRegistry(event)} 
                            onKeyPress={this.handleRegisKeyPress} >Registry</button>
                        <button 
                            type="button" 
                            value="Login" 
                            onClick={this.returnLogin} >Login</button>
                        <p className="pass-pattern"> Password at least six characters, one number, one lowercase and one uppercase letter </p>

                        {/* INVALID REGISTRY INFO */}
                        {this.state.validateRegisMessage &&
                            <p> Invalid email and password format </p>
                        }

                        {/* REGISTRY ERROR */}
                        {this.state.isHashed && 
                            <p> Oops! Can not registry new account or email existed, try again please! </p>
                        }

                        {/* REGISTRY SUCCESSED */}
                        {this.state.successed && 
                            <p> Successed create your StiB's account </p>
                        }
                    </div>
                }
            </div>
        )
    }
}

export default Registry