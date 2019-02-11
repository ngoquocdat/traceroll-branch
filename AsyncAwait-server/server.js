const { createServer } = require('http')
const express = require("express")
const next = require("next")
const axios = require("axios")
const port = parseInt(process.env.PORT, 10) || 3500
const dev = process.env.NODE_ENV !== "production"
const nextApp = next({ dev })
const routes = require('./routes')
const nextHandle = routes.getRequestHandler(nextApp)
var bodyParser = require('body-parser')
var Web3 = require('web3')
var async = require('asyncawait/async')
var await = require('asyncawait/await')
var cookieParser = require('cookie-parser')
var mysql = require('mysql')
var parser = require('ua-parser-js')
var ip = require('ip')
const getUuidByString = require('uuid-by-string')
var moment = require('moment')
const Tx = require('ethereumjs-tx')
const Aes = require('aes256')
const uniq = require('uniqid')
moment().format()

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "stib_db"
})

/*const apiRouters = {
    REGISTRY: "/registry",
    LOGIN: "/login",
    CREATEADS: "/create/ads",
    GETORDERLIST: "/get/orders",
    DELETEADS: "/ads/delete"
}*/

const responseCode = {
    SUCCESS: 305,
    FAILED: 350,
    SUCCESS_VALID: 580,
    SUCCESS_EXISTED: 585,
    ERROR_EXISTED: 600,
    ERROR_INVALID: 602,
    SUCCESS_REGIS: 601,
    FAILED_REGIS: 603,
    SUCCESS_CREATE_ADS: 604,
    FAILED_CREATE_ADS: 605
}

/* FORMAT VALIDATE EMAIL & PWD */
const validatePattern = {
    "email": /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    "pass": /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/
}

const emailFormat = /^[a-z][a-z0-9_\.]{5,32}@[a-z0-9]{2,}(\.[a-z0-9]{2,4}){1,2}$/
const blockSpecialChars = /[`~<>;:"\/\[\]\|{}()=_+-]/
const langNoneAlphabetChars = /[^\u0000-\u007F]/
const alphabet = /[a-zA-Z0-9 ]+$/

/*const ADSINFO = {
    BANK: {HD: 'HD Bank', SC: 'Sacombank', VC: 'Vietcombank', TC: 'Techcombank'},
    COUNTRY: {VN: 'VietNam', US: 'United State', UK: 'United Kingdom', FR: 'France', BE: 'Belgium'},
    REGION: {HC: 'Hồ Chí Minh', HN: 'Hà Nội', DN: 'Đà Nẵng'},
    CURRENCY: {VND: 'VND', USD: 'USD', EUR: 'EUR'},
    PAYMENT: {MS: 'Master Card', PP: 'Paypal', DB: 'Debit Card', CS: 'Cash'}
}*/

/* DOUBLE VALIDATE FORMAT EMAIL */
const doubleValidateEmail = (email) => {

    let rest = email.split("@")
    let part1 = rest[0]
    let part2 = rest[1]
    let dotsplt = part2 != undefined ? part2.split('.') : undefined
    // let t = 1

    if( email == '' || email.split('@').length != 2 || part1.length == 0 || part1.split(" ").length > 2 || part2.split(".").length < 2){
        return 0
    }else if(dotsplt != undefined){

        // CHECK CONTENT BETWEEN @ AND DOT (ex. gmail)
        if(dotsplt[0].length == 0 || dotsplt[1].length < 2 || dotsplt[1].length > 4){
            return 0
        }else{
            return 1
        }
    }
}


/* CHECK SPECIAL CHARS */
checkSpecChars = (string) => { let specCharBool = blockSpecialChars.test(string) === true ? false : true 
                                return specCharBool }

/* CHECK VALID LANGS - check if input none alphabet chars return false else return true */
checkValidLang = (string) => { let validLangBool = langNoneAlphabetChars.test(string) === true ? false : true
                                return validLangBool }

/* CHECK SUBMIT FORMS DATA WITH ASYNC/AWAIT */
async function checkAdsDataAsync(arr){
    let checkedResultArr = new Array(arr.length)

    arr.forEach(async (val, index) => {
        let isExistSpecChar = await checkSpecChars(val)
        let isValidLang = await checkValidLang(val)

        if( isExistSpecChar && isValidLang ){
            checkedResultArr[index] = true
        }else{
            checkedResultArr[index] = false
        }
    })

    await Promise.all(checkedResultArr)
    return { boolArr: checkedResultArr,
             valArr: arr }
}

/* VALIDATE REGIS EMAIL & PASS FORMAT */
validateRegis = (email, pass) => {
    if((validatePattern.email).test(email) && (validatePattern.pass).test(pass)){
        return true
    }else{
        return false
    }
}

/* VALIDATE LOGIN EMAIL & PASS FORMAT */
validateLogin = (email, pass) => {
    if((validatePattern.email).test(email) && (validatePattern.pass).test(pass) && email != undefined && pass != undefined){
        return true
    }else{
        return false
    }
}

/* CHECK EXIST USER */
isExist = (email, callback) => {
    /* Check is email existed */
    if(emailFormat.test(email)){
        const sql = `SELECT COUNT(email) FROM stib_users WHERE email = "`+email+`"`
        db.query(sql, (err, response) => {
            if(err){
                callback({  resCode: 600,
                            message: 'Something wrong when check user account'})
            }else{
                let resObj = JSON.parse(JSON.stringify(response))[0]
                callback(null, resObj[Object.keys(resObj)[0]])
            }
        }) 
    }else{
        callback({  resCode: responseCode.ERROR_INVALID,
                    message: 'Email invalid' })
    }


    /* Check is phone number existed - not yet */
    // ... 
}

/* REGISTER NEW USER */
regisUser = (email, passwd, callback) => {
    const sql = `INSERT INTO stib_users (email, pass) VALUES ("`+email+`","`+passwd+`")`
    db.query(sql, (err, response) => {
        /* insert error */
        if(err) { callback(new Error('Can not registry new user')) }
        /* insert success */
        if(response.hasOwnProperty('insertId')){
            callback(null, {resCode: responseCode.SUCCESS_REGIS,
                            message: "Sign up success"})
        }else{
            callback(null, {resCode: responseCode.FAILED_REGIS,
                            message: "Sign up failed"})
        }
    })
}

/* MAIN HANDLE LOGIN */
handleLogin = (user, passwd, callback) => {
    if((user == '' || passwd == '') || (user == undefined || passwd == undefined)) {
        callback(null, {resCode: responseCode.ERROR_INVALID, 
                        message: "Email and password invalid" })
    }else{
        const isValidFormat = validateLogin(user, passwd)

        if(isValidFormat){
            isExist(user, function(err, is){
                /* if error */
                if(err){ callback(err, null)}
                /* if equal 1 */
                if(is === 1) {
                    callback(null, {resCode: responseCode.SUCCESS_VALID,
                                    message: "User login successed" })
                }
                /* if equal diff 1 */ 
                else {
                    callback(null, {resCode: responseCode.ERROR_INVALID,
                                    message: "User existed" })
                }
            })
        } else {
            callback(null, {resCode: responseCode.ERROR_INVALID,
                            message: "Email and password invalid" })
        }
    }
}


/* MAIN HANDLE SIGN UP */
handleRegis = (regisInfo, callback) => {
    if((regisInfo.user == '' || regisInfo.passwd == '') || (regisInfo.user == undefined || regisInfo.passwd == undefined)) {
        callback(null, {resCode: responseCode.ERROR_INVALID, 
                        message: "Email and password invalid" })
    }else{
        const isValidFormat = validateLogin(regisInfo.user, regisInfo.passwd)

        if(isValidFormat){
            isExist(regisInfo.user, function(err, is){
                console.log('isExist user regist: ', err, is)
                /* if error */
                if(err){ callback(err, null)}
                /* if equal 1 */
                if(is !== 1) {
                    /* register new user account */
                    const passReg = Aes.encrypt('passRegis', regisInfo.passwd)

                    regisUser(regisInfo.user, passReg, function(err, result) {
                        if(err){
                            callback(err, null)
                        }else{
                            callback(null, result)
                        }
                    })
                }
                /* if equal diff 1 */ 
                else {
                    callback(null, {resCode: responseCode.ERROR_INVALID,
                                    message: "User existed" })
                }
            })
        }
    }
}

/* HANDLE CREATE SELL ADS */
createSellAds = (stringSQl, callback) => {
    // pricePerCoin, bank, countrycode, region, currency, paymentmethod, minbtc, maxbtc
    let sql = `INSERT INTO stib_sellorders (startorder, seller, price, bank, countrycode, region, currency, paymentmethod, minbtc, maxbtc, token) 
            VALUE ("`+stringSQl+`")`
    db.query(sql, (err, response) => {
        if(err){
            callback({ resCode: responseCode.FAILED_CREATE_ADS,
                        message: 'Can not create new sell ad' })
        }else{
            callback(null, responseCode.SUCCESS_CREATE_ADS)
        }
    })
}

/* HANDLE CREATE BUY ADS */
createBuyAds = (stringSQl, callback) => {
    let sql = `INSERT INTO stib_buyorders (startorder, buyer, price, bank, currency, paymentmethod, minbtc, maxbtc, token) 
                VALUE ("`+stringSQl+`")`
    db.query(sql, (err, response) => {
        if(err){
            callback ({ resCode: responseCode.FAILED_CREATE_ADS,
                        message: 'Can not create new buy ad' })
        }else{
            callback (null, responseCode.SUCCESS_CREATE_ADS)
        }
    })
}

catchCheckAdsReturn = (array, date, user, isSell, callback) => {
    const arr_input = array.valArr

    if((array.boolArr).includes('false')){
        callback({  resCode: responseCode.ERROR_INVALID,
                    message: 'Input data invalid' })
    }else if(!(array.boolArr).includes('false')){
        /* CHECK EXIST USER */
        const existResult = isExist(user, (err, is) => {
            if(err) callback({ resCode: responseCode.ERROR_EXISTED, 
                            message: 'User can not locate'})
            if(is === 0){ 
                console.log('is equal 0')
                callback({ resCode: responseCode.ERROR_EXISTED, 
                         message: 'User not exist'})
            }

            if(is === 1){
                let stringSQl = date+`", "`+user+`", "`
                /* Create new ad */
                arr_input.forEach((val, index) => {
                    console.log(val, index)
                    stringSQl = stringSQl + val+`", "`
                })

                if(isSell === true){
                    createSellAds(stringSQl, function(err, result) {
                        if(err) callback({ resCode: responseCode.FAILED_CREATE_ADS,
                                        message: 'Something wrong when create sell ad' })
                        if(result === responseCode.SUCCESS_CREATE_ADS){
                            callback({ resCode: result,
                                     message: 'Success create sell ad' })
                        }else{
                            callback({ resCode: responseCode.FAILED_CREATE_ADS,
                                     message: 'Can not create new sell ad' })
                        }
                    })
                }else{
                    createBuyAds(stringSQl, function(err, result) {
                        if(err) callback({ resCode: responseCode.FAILED_CREATE_ADS,
                                        message: 'Something wrong when create buy ad' })
                        if(result === responseCode.SUCCESS_CREATE_ADS){
                            callback({ resCode: result,
                                     message: 'Success create buy ad' })
                        }else{
                            callback({ resCode: responseCode.FAILED_CREATE_ADS,
                                     message: 'Can not create new buy ad' })
                        }
                    })
                }
            }
        })
    }
}

// const blockSpecialChars = /[`~<>;':"\/\[\]\|{}()=_+-]/
// const langNoneLatinChars = /[^\u0000-\u007F]/
// const thaiRegex = /[\n\u0e00-\u0e7e]/
// console.log('=========== Thai regex: ', thaiRegex.test('それは何ですか'))

nextApp.prepare().then(() => {
    var server = express();

    server.use(bodyParser.urlencoded({ extended: false }));
    server.use(bodyParser.json());
    server.use(cookieParser());

    /* MAIN CREATE AD FUNC */
    server.post('/create/ads', (req, res, next) => {
        console.log(req.body)

        const obj = req.body.adInfo
        let arrInfo = Object.keys(obj).map((k) => obj[k])

        const checkAds = req.body.isSell
        const startDate = req.body.startTime
        const user = req.body.user
        const pricePerCoin = req.body.adInfo.price
        const bank = req.body.adInfo.bank
        const countrycode = req.body.adInfo.countryCode
        const region = req.body.adInfo.region
        const currency = req.body.adInfo.currency
        const paymentmethod = req.body.adInfo.paymentmethod
        const minbtc = req.body.adInfo.min_btc
        const maxbtc = req.body.adInfo.max_btc
        const token = uniq()

        console.log('token: ', token)

        /* CHECK IS SELL OR BUY AD */
        checkObj = (check) => {
            if(check){
                return new Array(pricePerCoin, bank, countrycode, region, currency, paymentmethod, minbtc, maxbtc)
            }else{
                return new Array(pricePerCoin, bank, currency, paymentmethod, minbtc, maxbtc)
            }
        }

        checkAdsDataAsync(checkObj(checkAds)).then( result => {
            catchCheckAdsReturn(result, startDate, user, checkAds, token, function(result){
                res.json(result)
            })
        })
    })

    /* GET ORDER LIST ROUTE */
    server.get('/orders/list', (req, res, next) => {
        const email = String(req.body.user_email)

        /* Check is email exist or not */
        isExist(email, (err, result) => {
            console.log('check order is exsit: ', err, result)
            const promises = [
                /* GET ORDERBOOK SELL ORDER */
                new Promise(resolve => {
                    db.query('SELECT * FROM stib_sellorders', (err, response) => {
                        resolve({error: err, response: response})
                    })
                }),

                /* GET ORDERBOOK BUY ORDER */
                new Promise(resolve => {
                    db.query('SELECT * FROM stib_buyorders', (err, response) => {
                        resolve({error: err, response: response})
                    })
                })
            ]

            Promise.all(promises)
            .then( data => {
                console.log('promise return: ', data[0].response)
                res.json({  resCode: responseCode.SUCCESS,
                            sellData: JSON.parse(JSON.stringify(data[0].response)),
                            buyData: JSON.parse(JSON.stringify(data[1].response))
                        })
            })
            .catch(error => {
                console.log('promise error: ', error)
                res.json({  resCode: responseCode.FAILED,
                            data: 'Can not get orders'
                        })
            })
        })
    })

    /* DELETE ADVERTISING */

    server.post('/delete/ads', (req, res, next) => {
        const email = req.body.user_email
        const token = req.body.ad_token

        console.log('delete ad: ', email, token)
    })

    server.get("*", (req, res) => {
        return nextHandle(req, res)
    })

    server.listen(port, (err) => {
        if (err) {
            throw err;
        }
        console.log(`> Ready on http://localhost:${port}`)
    })
})