import React, {Component} from 'react'
import OrderBook from './orderbook'
import OrderRatio from './order-ratio'
import '../styles/main.less'
import axios from 'axios'
import $ from 'jquery'

const regexPrice = /^[0-9,.]*$/
const propersell = ['countryCode', 'region', 'bank', 'currency', 'min_btc', 'max_btc', 'paymentmethod', 'price']
const properbuy = ['bank', 'currency', 'min_btc', 'max_btc', 'paymentmethod', 'price']

class User extends Component {
    constructor(props){
        super(props)
        this.state = {
            ads_info: {},
            login_email: '',
            createSellAds: false,
            createBuyAds: false,
            tollgeOrderbook: false,
            toggleOrderRatio: false,
            addPrice: '',
            error: {}
        }

        this.getCountryCode = this.getCountryCode.bind(this)
    }

    componentDidMount() {
        /*const userLang = navigator.language || navigator.userLanguage
        console.log("========== The language is: " + userLang)*/

        this.setState({
            login_email: localStorage.getItem('userEmail')
        }) 

        /* ADD STRANLATE GOOGLE API */
        const script = document.createElement("script")
        script.src = "http://www.google.com/jsapi?key=AIzaSyA5m1Nc8ws2BbmPRwKu5gFradvD_hgq6G0";
        script.async = true;
        document.body.appendChild(script);

        /* GET COUNTRY-CODE */
        this.getCountryCode()
    }

    componentWillReceiveProps() {
    }

    getCountryCode = () => {
        const self = this

        axios.post('http://ip-api.com/json')
        .then( function(response){
            console.log('========== country code: ', typeof response.data)
            console.log('========== country code: ', response.data)
            self.setState({
                countryCode: response.data
            })
            localStorage.setItem('locationObj', JSON.stringify(response.data))
        })
        .catch( function(err){
            self.setState({
                error:  new Error(err)
            })
        })
    }

    /* TRANSLATE LANGUAGE VIA GOOGLE API */
    stranlateLanguage = () => {
        google.load("language", "1");

        function initialize() {
            var text = document.getElementById("text").innerHTML;
            google.language.translate(text, 'es', this.state.countryCode.toLowerCase(), function(result) {

                if (result.translation) {
                    console.log(result.translation);
                }
            });
        }

        google.setOnLoadCallback(initialize);
    }

    checkFullFill = () => {
        let adsObject = this.state.ads_info
        let properArray = this.state.createSellAds == true ? propersell : properbuy

        let isFilled = properArray.map((attribute, index) => {
            if(adsObject.hasOwnProperty(attribute) && (adsObject[attribute] != '' || adsObject[attribute] != undefined)){
                return true
            }else{
                return false
            }
        })

        if(!isFilled.includes(false)){
            return true
        }else{
            return false
        }
    }

    checkBitcoinQuantity = (min, max) => {
        if(min < 0.01 || max <= 0){
            return false
        }else if(min >= 0.01 && max <= 0){
            return false
        }else if(min > max){
            return false
        }else{
            return true
        }
    }

    isPriceValid = (price) => {
        if(price === null){
            return null
        }else{
            // price += ''
            price.replace(/,/g, '')
            let deleteText = price.replace(/[^\d.]/g, '')          // clear text 
            let deleteDot = deleteText.split('.').join('')         // clear dot when lang like vietnamese
            let x = deleteDot.split('.')
            let x1 = x[0]
            let x2 = x.length > 1 ? '.' + x[1] : ''
            let rgx = /(\d+)(\d{3})/
            while (rgx.test(x1)) {
               x1 = x1.replace(rgx, '$1' + ',' + '$2')
            }
            let result = (x1 + x2).replace(/^0+(?!\.|$)/, '')
            this.setState({
                ads_info: { ...this.state.ads_info, 
                            price: result },
                addPrice: result
            })
        }
    }

    validateInputPrice = (price) => {
        /* Check first input is higher 0 */
        return regexPrice.test(price)
    }

    createAds = (event) => {
        event.preventDefault()
        console.log('=========== ads_info: ', this.state.ads_info)

        const currentdate = new Date()
        let isFullFill, validateCoin
        let startOrder =    (currentdate.getMonth()+1) + 
                            "/" + currentdate.getDate() +  
                            "/" + currentdate.getFullYear() + 
                            " " + currentdate.getHours() + 
                            ":" + currentdate.getMinutes() + 
                            ":" + currentdate.getSeconds()

        /* CHECK FULL FILL */
        isFullFill = this.checkFullFill()

        /* CHECK BITCOIN QUANTITY (MIN = 0.01) */
        validateCoin = this.checkBitcoinQuantity(parseFloat(this.state.ads_info.min_btc), parseFloat(this.state.ads_info.max_btc))

        /* SAVE ADS DATA */  
        /* Check price should have numberic, equal or higher bottom price */     
        if(isFullFill && validateCoin && this.validateInputPrice(this.state.ads_info.price)){
                const payloadData = {
                    isSell: this.state.createSellAds,
                    startTime: startOrder,
                    user: 'ngoquocdat093@gmail.com',
                    adInfo: this.state.ads_info
                }

                console.log('============= payloadData create Ads: ', payloadData)

                axios.post('/create/ads', payloadData)
                .then( function(response){ 
                    console.log('=================== response createAds: ', response)
                })
                .catch( function(err){
                    console.log('=================== error createAds: ', err)
                })
        }else{
            console.log('================ reject create ads: ', isFullFill, validateCoin, this.validateInputPrice(this.state.ads_info.price))
        }  
    }

    isSellAds = (method) => {
        console.log('============= isSellAds: ', method)

        if(method === 'sell'){
            this.setState({
                createSellAds: true,
                createBuyAds: false,
                tollgeOrderbook: false,
                toggleOrderRatio: false
            })

            $('#createBuyAds').find('.price').val('')

        }else if(method === 'buy'){
            this.setState({
                createBuyAds: true,
                createSellAds: false,
                tollgeOrderbook: false,
                toggleOrderRatio: false
            })
        }else if(method === 'sell-ratio'){
            this.setState({
                toggleOrderRatio: true,
                tollgeOrderbook: false,
                createBuyAds: false,
                createSellAds: false,
            })
        }else{
            alert('Choose Sell or Buy method')
        }
    }

    showOrderBookButton = () => {
        this.setState({
            createBuyAds: false,
            createSellAds: false,
            toggleOrderRatio: false,
            tollgeOrderbook: true
        })
    }

    render() {
        
        return(
            <div className="user-info">
                <div className="create-ads-form">
                    {/*<button
                        type="button"
                        value="Get country"
                        onClick={this.getCountryCode}> Get Country </button>*/}

                    {/*<button
                        type="button"
                        value="Stranlate Language"
                        onClick={this.stranlateLanguage}> Stranlate </button>*/}

                    <button type="button"
                            className="sell-button"
                            value="sell"
                            onClick={(event) => this.isSellAds(event.target.value)}> Sell </button>

                    <button type="button"
                            value="buy"
                            onClick={(event) => this.isSellAds(event.target.value)}> Buy </button>

                    <button type="button"
                            className="order-button-ratio"
                            value="sell-ratio"
                            onClick={(event) => this.isSellAds(event.target.value)}> Sell Ratio </button>

                    <button type="button"
                            value="orderbook"
                            onClick={(event) => this.showOrderBookButton()}> Order Book </button>

                    {/* SELLER FORM */}
                    {this.state.createSellAds &&
                        <div id="createSellAds">
                            <p> Create Sell Ads Form </p>

                            <form onSubmit={this.createAds}>
                                {/* Country */}
                                <label> Country: </label>
                                <input ref="countryCode" className="sellCountry" list="sell-country" onChange={(event) => this.setState({ads_info: {...this.state.ads_info,
                                                                                                                                                    countryCode: event.target.value }})}/>
                                <datalist id="sell-country">
                                    <option value="Viet Nam"/>
                                    <option value="United States"/>
                                    <option value="United Kingdom"/>
                                    <option value="France"/>
                                    <option value="Belgium"/>
                                </datalist>
                                <br/><br/>

                                {/* Region */}
                                <label> Region: </label>
                                <input ref="region" className="sellRegion" list="sell-region" onChange={(event) => this.setState({ads_info: {   ...this.state.ads_info, 
                                                                                                                                                region: event.target.value }})}/>
                                <datalist id="sell-region">
                                    <option value="Ho Chi Minh"/>
                                    <option value="Ha Noi"/>
                                    <option value="Da Nang"/>
                                </datalist>
                                <br/><br/>

                                {/* Bank */}
                                <label> Bank: </label>
                                <input ref="bankName" className="bank" list="banks" onChange={(event) => this.setState({ads_info: { ...this.state.ads_info,
                                                                                                                                    bank: event.target.value }})}/>
                                <datalist id="banks">
                                    <option value="HD Bank"/>
                                    <option value="Sacombank"/>
                                    <option value="Vietcombank"/>
                                    <option value="Techcombank"/>
                                </datalist>
                                <br/><br/>

                                {/* Currency Type */}
                                <label> Currency Type: </label>
                                <input ref="currency" className="currencyType" list="currencies" onChange={(event) => this.setState({ads_info: {...this.state.ads_info,
                                                                                                                                                currency: event.target.value }})}/>
                                <datalist id="currencies">
                                    <option value="VND"/>
                                    <option value="USD"/>
                                    <option value="EUR"/>
                                </datalist>
                                <br/><br/>

                                {/* Minbtc */}
                                <label> Minimum Bitcoin Quantity: </label>
                                <input  type="number" 
                                        className="minBtc"
                                        min="0.01"
                                        step="0.01"
                                        placeholder="Min bitcoin quantity" 
                                        onChange={(event) => this.setState({ads_info: { ...this.state.ads_info, 
                                                                                        min_btc: event.target.value }})}>
                                </input>
                                <br/><br/>

                                {/* Maxbtc */}
                                <label> Maximum Bitcoin Quantity: </label>
                                <input  type="number" 
                                        className="maxBtc"
                                        min="1"
                                        placeholder="Max bitcoin quantity" 
                                        onChange={(event) => this.setState({ads_info: { ...this.state.ads_info, 
                                                                                        max_btc: event.target.value }})}>
                                </input>
                                <br/><br/>

                                {/* Payment Method */}
                                <label> Payment Method: </label>
                                <input ref="payments" className="payment-method" list="paymentMethods" onChange={(event) => this.setState({ads_info: {  ...this.state.ads_info,
                                                                                                                                                        paymentmethod: event.target.value }})}/>
                                <datalist id="paymentMethods">
                                    <option value="Master Card"/>
                                    <option value="Paypal"/>
                                    <option value="Debit"/>
                                    <option value="Cash"/>
                                </datalist>
                                <br/><br/>

                                {/* Price */}
                                <label> Price: </label>
                                <input  type="text"
                                        className="price" 
                                        placeholder="Price"
                                        value={this.state.addPrice}
                                        onChange={(event) => this.isPriceValid(event.target.value)}>
                                </input>
                                <br/><br/>

                                <button type="submit"
                                        value="Submit"> Create Ads </button>
                            </form>
                        </div>
                    }

                    {/* BUYER FORM */}
                    {this.state.createBuyAds && 
                        <div id="createBuyAds">
                            <p> Create Buy Ads Form </p>

                            <form onSubmit={this.createAds}>
                                {/* Bank */}
                                <label> Bank: </label>
                                <input ref="bankName" className="bank" list="banks" onChange={(event) => this.setState({ads_info: { ...this.state.ads_info,
                                                                                                                                    bank: event.target.value }})}/>
                                <datalist id="banks">
                                    <option value="HD Bank"/>
                                    <option value="Sacombank"/>
                                    <option value="Vietcombank"/>
                                    <option value="Techcombank"/>
                                </datalist>
                                <br/><br/>

                                {/* Payment Method */}
                                <label> Payment Method: </label>
                                <input ref="payments" className="payment-method" list="paymentMethods" onChange={(event) => this.setState({ads_info: {  ...this.state.ads_info,
                                                                                                                                                        paymentmethod: event.target.value }})}/>
                                <datalist id="paymentMethods">
                                    <option value="Master Card"/>
                                    <option value="Paypal"/>
                                    <option value="Debit"/>
                                    <option value="Cash"/>
                                </datalist>
                                <br/><br/>

                                {/* Currency Type */}
                                <label> Currency Type: </label>
                                <input ref="currency" className="currencyType" list="currencies" onChange={(event) => this.setState({ads_info: {...this.state.ads_info,
                                                                                                                                                currency: event.target.value }})}/>
                                <datalist id="currencies">
                                    <option value="VND"/>
                                    <option value="USD"/>
                                    <option value="EUR"/>
                                </datalist>
                                <br/><br/>

                                {/* Minbtc */}
                                <label> Minimum Bitcoin Quantity: </label>
                                <input  type="number" 
                                        className="minBtc"
                                        min="0.01"
                                        step="0.01"
                                        placeholder="Min bitcoin quantity" 
                                        onChange={(event) => this.setState({ads_info: { ...this.state.ads_info, 
                                                                                        min_btc: event.target.value }})}>
                                </input>
                                <br/><br/>

                                {/* Maxbtc */}
                                <label> Maximum Bitcoin Quantity: </label>
                                <input  type="number" 
                                        className="maxBtc"
                                        min="1"
                                        placeholder="Max bitcoin quantity" 
                                        onChange={(event) => this.setState({ads_info: { ...this.state.ads_info, 
                                                                                        max_btc: event.target.value }})}>
                                </input>
                                <br/><br/>

                                {/* Price */}
                                <label> Price: </label>
                                <input  type="text"
                                        className="price" 
                                        placeholder="Price" 
                                        value={this.state.addPrice}
                                        onChange={(event) => this.isPriceValid(event.target.value)}>
                                </input>
                                <br/><br/>

                                <button type="submit"
                                        value="Submit"> Create Ads </button>
                            </form>
                        </div>
                    }

                    {/* ORDER BOOK */}
                    {this.state.tollgeOrderbook && 
                        <OrderBook />
                    }

                    {/* ORDER BOOK RATIO */}
                    {this.state.toggleOrderRatio &&
                        <OrderRatio 
                            handleCreateAds= {this.state.createAds}
                            handlePrice= {this.state.isPriceValid}
                            userEmail= {this.state.login_email}
                            countryCode= {this.countryCode}
                        />
                    }
                    
                </div>
            </div>
        )
    }
}

export default User