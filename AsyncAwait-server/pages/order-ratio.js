import React, {Component} from 'react'
import axios from 'axios'
import $ from 'jquery'

const   payment = ['Cash','Bank transfer','Paypal','International wire','Orther','Venmo','Western Union','MoneyGram','Gift card','Skrill','PAYEER','TransferWise'],
        currency = ['','','','','']

class OrderRatio extends Component {
    constructor(props){
        super(props)
        this.state = {
            ads_info_radio: {},
            uerEmail: this.props.userEmail,
            countryCode: JSON.parse(localStorage.getItem('locationObj')),
            currenciesCode: {},
            toggleCountryField: false
        }

        this.getCurrenciesCode = this.getCurrenciesCode.bind(this)
        this.handleSelectCurrency = this.handleSelectCurrency.bind(this)
        this.handleOtherCountry = this.handleOtherCountry.bind(this)
    }

    componentDidMount() {
        console.log('========== state: ', this.state)
    }

    componentWillMount() {
        this.getCurrenciesCode()
    }

    setObjectInfo = (event) => {
        const self = this
        let field = event.target.name
        self.setState({ ads_info_radio: {   ...this.state.ads_info_radio,
                                            [field]: event.target.value }})

    }

    getCurrenciesCode = () => {
        axios.post('https://openexchangerates.org/api/currencies.json')
        .then(response => {
            this.setState({currenciesCode: response.data})
            console.log('============== getCurrenciesCode: ', Object.keys(this.state.currenciesCode))
        })
        .catch(err => {
            console.log('========= currencies objcet error: ', err)
        }) 
    }

    handleSelectCurrency = (event) => {
        if((this.preCurremcyVal) != (event.target.value)){
            this.setState({ads_info_radio: {...this.state.ads_info_radio,
                                            currency: event.target.value }})
        }else{
            this.setState({ads_info_radio: {...this.state.ads_info_radio,
                                            currency: prevVal }})
        }   
    }

    handleOtherCountry = (event) => {
        console.log('========= handle other country')
        this.setState({toggleCountryField: true})
    }

    render() {
        console.log('============== currency: ', this.state)
        const self = this
        return(
            <div id="createSellAds">
                <p> Create Sell Radio Ads Form </p>

                <form onSubmit={this.props.handleCreateAds}>
                    {/* Country */}
                    <label> Country: </label><br/>
                    <input  type="radio" 
                            name="country"
                            value={this.state.countryCode.region+", "+this.state.countryCode.city+", "+this.state.countryCode.country}
                            onChange={(event) => this.setObjectInfo(event)} /> {this.state.countryCode.region+", "+this.state.countryCode.city+", "+this.state.countryCode.country}

                    <input  type="radio" 
                            name="country"
                            value="other"
                            onChange={(event) => this.handleOtherCountry(event)} /> Others
                    <br/>
                    {this.state.toggleCountryField &&
                        <input type="text" placeholder="Other country" name="payment" onChange={(event) => this.setObjectInfo(event)}/>
                    }
                    <br/><br/>

                    {/* Payment Method */}
                    <label> Payment Method: </label><br/>
                    {   payment.map((payThod, index) => {
                            return(
                                <label>
                                    <input  type="radio"
                                            name="payment"
                                            value={payThod}
                                            onChange={(event) => {this.setObjectInfo(event)}} /> {payThod}
                                    <br/>
                                </label>
                            )
                    })}
                    <input type="text" placeholder="Payment Options" name="payment" onChange={(event) => this.setObjectInfo(event)}/>
                    <br/><br/>

                    {/* Currency Type */}
                    <label> Currency Type: </label>
                    <input ref="currency" className="currencyType" name="currency" list="currencies" onChange={(event) => this.handleSelectCurrency(event)}/>
                    <datalist id="currencies">
                    {   /* LOOP THROUGH OBJECT CURRENCIES CODE */
                        Object.keys(this.state.currenciesCode).map((key) => {
                            return(
                                <option value={key+" - "+this.state.currenciesCode[key]}/>
                            )
                        })
                    }     
                    </datalist>
                    <br/><br/>

                    <button type="submit"
                            value="Submit"> Create Ads </button>
                </form>
            </div>
        )
    }
}

export default OrderRatio