import React, {Component} from 'react'
import '../styles/main.less'
import axios from 'axios'
import $ from 'jquery'

class OrderBook extends Component {
    constructor(props){
        super(props)
        this.state = {
            doneGet: false,
            showPopUp: false,
            successDelAds: false,
            errorDelAds: false,
            errorDel: {}
        }

        this.handleDoubleClick = this.handleDoubleClick.bind(this)
        this.handleEditOrder = this.handleEditOrder.bind(this)
        this.cancelActions = this.cancelActions.bind(this)
        this.getOrderList = this.getOrderList.bind(this)
        this.handleClosePopUp = this.handleClosePopUp.bind(this)
    }

    componentDidMount() {
        const self = this

        this.setState({
            login_email: localStorage.getItem('userEmail')
        })

        this.getOrderList()
    }

    getOrderList = () => {
        console.log('============== get orders list')
        const self = this
        const payloadData = {
            email: localStorage.getItem('userEmail')
        }

        axios.post('/api/get/orders', payloadData)
        .then( function(response){
            self.setState({
                doneGet: true,
                buy: response.data.buyOrders,
                sell: response.data.sellOrders
            })
            console.log(self.state)
        })
        .catch( function(err){
            console.log('================= error get orders: ', err)
        })
    }

    handleClosePopUp = () => {
        this.setState({
            showPopUp: !this.state.showPopUp,
            showDelResPop: !this.state.showDelResPop,
            successDelAds: false,
            errorDelAds: false
        })
    }

    hanleDeleteAds = () => {
        // event.preventDefault()
        const self = this
        console.log('========== handleDeleteAds: ', this.state.delObj)

        axios.post('/api/ads/delete', this.state.delObj)
        .then( function(response){
            if(response.data === 604){
                /* SHOW POPUP MESSAGE */
                self.setState({
                    showDelResPop: !self.state.showDelResPop,
                    successDelAds: true
                })
                /* GET ORDER LIST */
                self.getOrderList()
            }else{
                self.setState({
                    showDelResPop: !self.state.showDelResPop,
                    errorDelAds: true
                })
            }
        })
        .catch( function(err){
            console.log('========== handle delete ads error: ', err)
            self.setState({
                showDelResPop: !self.state.showDelResPop,
                errorDelAds: true,
                error: err
            })
        })
    }

    handleDoubleClick = (event) => {
        if(event.target.lastElementChild.classList.contains('hidden')){
            /* READD "HIDDEN" CLASS */
            let orderEls = document.getElementsByClassName('editOptionsButton')
            // console.log('============== handle double click: ', document.querySelectorAll('.editOptionsButton'))
            console.log('============== handle double click: ', orderEls)
            event.target.lastElementChild.classList.remove('hidden')
        }
    }

    handleEditOrder = (e) => {
        console.log('========== handle edit order', e.target.className)
        console.log('========== handle edit order value', e.target.value)
    }

    cancelActions = (e) => {
        console.log('cancel ads action')
    }

    handleShowDelPopup = (event) => {
        event.preventDefault()
        const dataform = event.target.elements
        let arr = Object.keys(dataform).map((k) => dataform[k])
        let payloadData = function(){
            let dataObj = {}

            for(let i = 0; i < (arr.length) - 2; i++){
                dataObj[(arr[i].name).toString()] = arr[i].value
            }

            return dataObj
        }

        this.setState({
            showPopUp: true,
            delObj: payloadData()
        })

    }

    // HANDLE RENDER BUY ORDER
    renderOrder = (orderObj, index, kind) => {
        console.log('=========== renderOrder: ', orderObj, kind)
        let isKind

        if(kind === 'buy'){
            isKind = 1
        }

        if(kind === 'sell'){
            isKind = 0
        }

        console.log('========== renderOrder kind: ', isKind)
        return (
            <div data-id={"Buy-"+orderObj.id} className="buyOrder" style={{display: 'flex', backgroundColor: 'blue',}}>
                <form className="buyerForm" onSubmit={this.handleShowDelPopup} style={{width: '100%',}} onDoubleClick={event => this.handleDoubleClick(event)}>
                    { isKind == 1 ? 
                            <label> Buyer: <input type="text" name="buyerOrder" className="countryName" value={orderObj.buyer} onClick={e => this.handleEditOrder(e)} readOnly/></label>
                        :
                            <label> Seller: <input type="text" name="sellerOrder" className="countryName" value={orderObj.seller} onClick={e => this.handleEditOrder(e)} readOnly/></label>      
                    }

                    <label> Minimum BTC: 
                    <input type="text" name="orderMinBTC" className="minBTC" value={orderObj.minbtc} onClick={e => this.handleEditOrder(e)} readOnly/></label>

                    <label> Maximum BTC: 
                    <input type="text" name="orderMaxBTC" className="maxBTC" value={orderObj.maxbtc} onClick={e => this.handleEditOrder(e)} readOnly/></label>

                    <label> Currency Type: 
                    <input type="text" name="currency" className="currencyType" value={orderObj.currency} onClick={e => this.handleEditOrder(e)} readOnly/></label>

                    <label> Price: 
                    <input  type="text" name="orderPrice" className="price" value={orderObj.price} onClick={e => this.handleEditOrder(e)} readOnly/></label>

                    <label> Payment Method: 
                    <input type="text" name="orderPayment" className="payment-method" value={orderObj.paymentmethod} onClick={e => this.handleEditOrder(e)} readOnly/></label>

                    <label> Bank: 
                    <input type="text" name="orderBank" className="bankName" value={orderObj.bank} onClick={e => this.handleEditOrder(e)} readOnly/></label>
                    <br/><br/>

                    <input name="idtok" value={orderObj.token} style={{display: 'none',}} readOnly/>
                    <input name="num" value={isKind} style={{display: 'none',}} readOnly/>
                    
                    <div className="editOptionsButton hidden">
                        <button type="submit" value="Delete"> Delete Ads </button>
                        <button type="button" value="Cancel" onClick={e => this.cancelActions(e)}> Cancel Edit </button>
                    </div>
                </form>
            </div>
        )
    }

    render() {
        const self = this
        return(
            <div className="mainOrderBook">
                {/* POPUP HANDLE MESSAGE */}
                {this.state.showPopUp &&
                    <div className="popup" style={{position: "fixed", width: "100%", height: "100%", top: 0, left: 0, right: 0, bottom: 0, margin: "auto", backgroundColor: "rgba(0,0,0, 0.5)",}}>
                        <div className="popup_inner" style={{position: "absolute", left: "25%", right: "25%", top: "25%", bottom: "25%", margin: "auto", background: "white", textAlign: "-webkit-center", borderRadius: "4%",}}>
                            <p> Would you delete this ads ? </p>
                            <div className="popupButton">
                                <button className="cancelDelete" onClick={this.handleClosePopUp}> Cancel </button>
                                <button className="confirmDelete" onClick={this.hanleDeleteAds}> Delete </button>
                            </div>
                        </div>
                    </div>
                }

                { this.state.showDelResPop &&
                    <div className="popup" style={{position: "fixed", width: "100%", height: "100%", top: 0, left: 0, right: 0, bottom: 0, margin: "auto", backgroundColor: "rgba(0,0,0, 0.5)",}}>
                        <div className="popup_inner" style={{position: "absolute", left: "25%", right: "25%", top: "25%", bottom: "25%", margin: "auto", background: "white", textAlign: "-webkit-center", borderRadius: "4%",}}>
                            {this.state.successDelAds &&
                                <p> Your ad has been deleted </p>
                            }
                            {this.state.errorDelAds && 
                                <p> Can not delete your ad </p>
                            }
                            <button className="cancelDelete" onClick={this.handleClosePopUp}> Close </button>
                        </div>
                    </div>
                }

                {this.state.doneGet &&
                    <div className="wrapperOrders">
                        {/* BUYER ZONE */}
                        <div className="buyer-order-list buyer-zone-wapper">
                            <p> Buyer zone </p>
                            {this.state.buy.map( function(order, index){
                                return self.renderOrder(order, index, 'buy')
                            })}
                        </div>

                        {/* SELLER ZONE */}
                        <div className="seller-order-list seller-zone-wapper">
                            <p> Seller zone </p>
                            {this.state.sell.map( function(order, index){
                                return self.renderOrder(order, index, 'sell')
                            })}
                        </div>
                    </div>
                }
            </div>
        )
    }
}

export default OrderBook