var express = require('express');
var router = express.Router();
var nodeMailer = require('nodemailer');
var async = require('async');

const responseCode = {
    SUCCESS: 580,
    FAILED: 630,
    REJECT: 750,
    SUCCESS_NoEMAIL: 586,
    SUCCESS_NoPHONE: 589,
    FAILED_NotPhone: 587
}

const blockSpecialChars = /[\^$|?*()@#!]/

const authSender = {
    "user": "stibteam@gmail.com",
    "pass": "StiB_2019"
}

/* CREATE TRANSPORTER */
const transporter = nodeMailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: authSender
})

/* CHECK FORMAT EMAIL */
doubleValidateEmail = (email) => {

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

/* CHECK SPECIAL CHARS - false: contain spec chars - true: not contain spec chars */
checkSpecChars = (string) => { let specCharBool = blockSpecialChars.test(string) === true ? false : true
                               return specCharBool }

/* CHECK BANK NUMBER */
checkBankAccountNumber = (bumber) => {  if(bumber.length < 6){
                                            return false
                                        } else { return true } 
                                    }

/* VALIDATE REQUEST DATA */
validateInputData = (userName, cryptoQuantum, cash, banking, bankNum, email, phone, callback) => {
    console.log('validateInputData: ', userName, cryptoQuantum, cash, banking, bankNum, email, phone)

    if((phone === '' || phone === null || phone === undefined) && (email === '' || email === null || email === undefined)){
        callback(null, {  resCode: responseCode.REJECT, 
                          message: 'User not provide email or phone' })
    }else{
        async.parallel({

            /* Validate Type & Special Chars - only accept value is string */
            validateTypeSpecChars: (next_parallel) => {
                if(phone && (phone.length < 8 || phone.length > 13)){
                    next_parallel(null, { resCode: responseCode.FAILED_NotPhone,
                                          message: 'Phone invalid'})
                }else{
                    let inputArr = [userName, cryptoQuantum, cash, banking, phone]
                    const checkedArr = []

                    inputArr.map((val, index) => {
                        if((checkSpecChars(val) === false) || val === undefined){
                            checkedArr[index] = false
                        }else{
                            checkedArr[index] = true
                        }
                    })

                    if(checkedArr.includes(false)){
                        next_parallel(null, { resCode: responseCode.FAILED, 
                                              message: 'Data invalid' })
                    }else{
                        next_parallel(null, { resCode: phone === "" ? responseCode.SUCCESS_NoPHONE : responseCode.SUCCESS, 
                                             message: 'Data validated' }) 
                    }
                }             
            }, 

            /* Validate Format Email */
            checkEmail: (next_parallel) => {
                if(email === ''){
                    next_parallel(null, { resCode: responseCode.SUCCESS_NoEMAIL, 
                                          message: 'User not provide email' })
                }else{
                    const bool = doubleValidateEmail(email)
                    if(Boolean(bool)){
                        next_parallel(null, { resCode: responseCode.SUCCESS, 
                                              message: 'Email validate success' })
                    }else{
                        next_parallel(null, { resCode: responseCode.FAILED, 
                                              message: 'Email invalid'})
                    }
                }
            },

            /* Validate Bank account number */
            checkBankNumber: (next_parallel) => {
                if(checkBankAccountNumber(bankNum) === true){ 
                    next_parallel(null, {   resCode: responseCode.SUCCESS, 
                                            message: 'Bank account number accepted' })
                } else {
                    next_parallel(null, {   resCode: responseCode.FAILED, 
                                            message: 'Bank account number rejected' })
                }
            }

        }, function(err, results){
            console.log('validateInputData parallel: ', err, results)

            /* Return with error when validate input data */
            if(err){
                callback({ resCode: responseCode.FAILED, 
                           message: 'Can not validate input data' })
            }

            /* Return with phone number invalid */
            if(results.validateTypeSpecChars.resCode === responseCode.FAILED_NotPhone){
                callback(null, { resCode: responseCode.FAILED,
                                 message: results.validateTypeSpecChars.message})

            /* Return with bank account number invalid */
            }else if(results.checkBankNumber.resCode === responseCode.FAILED){
                callback(null, { resCode: responseCode.FAILED,
                                 message: 'Data validate failed with bank account number' })

            /* Return with validate successed */
            }else if((results.validateTypeSpecChars.resCode === responseCode.SUCCESS_NoPHONE || results.validateTypeSpecChars.resCode === responseCode.SUCCESS) && 
                ((results.checkEmail.resCode === responseCode.SUCCESS) || (results.checkEmail.resCode === responseCode.SUCCESS_NoEMAIL))){
                callback(null, { resCode: responseCode.SUCCESS,
                                 message: results.checkEmail.resCode === responseCode.SUCCESS_NoEMAIL ? 'Data validate successed with no email' :
                                        (results.validateTypeSpecChars.resCode === responseCode.SUCCESS_NoPHONE ? 'Data validate successed with no phone' : 'Data validate successed with phone') })
            
            /* Return with failed validate */
            }else{
                callback(null, { resCode: responseCode.FAILED, 
                                 message: 'Data validate failed' })
            }
        })
    }
}

/* MAIN HANDLE SEND EMAIL */
handleSendEmail = (userName, cryptoQuantum, cash, banking, bankNum, email, phone, lang, callback) => {

    const sender = (email, phone) => {
        if(email === ''){
            return phone
        }else{
            return email
        }
    }

    const templateEmailFeed =   lang === "VN" ? `<html>
                            <head>
                                <title>StiB 2FA</title>
                            </head>
                            <body>
                                <div style='margin:0 auto; text-align:center; max-width: 600px; width:100%; display: block; color:#7d7d7d;'>
                                    <img style='paddig:10px;width:69px;height:87px' src='https://stib.co/stib_version2/logo_mail.jpg' alt='Logo StiB'/>
                                    <h1 style='margin: 15px auto; text-align: center; font-size:24px; line-height:24px; color:#777474'>StiB TRADING SELL ORDER</h1>
                                    <p style='text-align:left'>Gửi từ `+ authSender.user +`,</p>
                                    <div style='text-align: left'>
                                        <p>Xác nhận thông tin giao dịch bạn đã cung cấp: </p>
                                            <p>Thông tin liên hệ: `+ email +`</p>
                                            <p>Số lượng crypto: `+ cryptoQuantum +`</p>
                                            <p>Số tiền giao dịch: `+ cash +`</p>
                                            <p>Ngân hàng thanh toán: `+ banking +`</p>
                                            <p>Số tài khoản thanh toán: `+ bankNum +`</p>
                                    </div>
                                    <p style='text-align:left'> 
                                        Chúng tôi sẽ thông báo với bạn sau khi giao dịch của bạn được chấp nhận. Bạn có thể giao dịch Bitcoin miễn phí tại sàn 
                                        <a href='https://stib.co/' style='color:#f38320'>StiB.co</a>
                                    </p>
                                    <p style='text-align:left'>Trân trọng,<br/>StiB Team </p>
                                </div>
                                <div style='border-top:1px solid #ececec; padding:10px 0 5px 0; background:#f6f6f6 url(https://stib.co/images/footer_mail.jpg) no-repeat; width:100%; display:block; paddig:10px 0; margin:30px auto'>
                                    <p style='padding:0!important; line-height:18px;text-align:center;padding:0;margin:0 0 5px 0;'> 
                                        <a style='color:#4b92dd;' href='maito:Support@StiB.co'> Support@StiB.co</a> 
                                        | <a href='https://www.google.com/maps/place/StiB.co/@10.7626314,106.696062,17z/data=!3m1!4b1!4m5!3m4!1s0x31752f1498362fad:0x306e8af129cbaf4e!8m2!3d10.7626261!4d106.6982507'>155 Bến Vân Đồn, phường 6, Quận 4, HCM</a> 
                                        | Nhắn tin: 0906 097 525 | (8am - 6pm T2 - T6 | 9am - 5pm T7)
                                    </p>
                                    </div>
                                </div>
                            </body>
                        </html>`
                         : `<html>
                            <head>
                                <title>StiB 2FA</title>
                            </head>
                            <body>
                                <div style='margin:0 auto; text-align:center; max-width: 600px; width:100%; display: block; color:#7d7d7d;'>
                                    <img style='paddig:10px;width:69px;height:87px' src='https://stib.co/stib_version2/logo_mail.jpg' alt='Logo StiB'/>
                                    <h1 style='margin: 15px auto; text-align: center; font-size:24px; line-height:24px; color:#777474'>StiB TRADING SELL ORDER</h1>
                                    <p style='text-align:left'>Send from: `+ authSender.user +`,</p>
                                    <div style='text-align: left'>
                                        <p>Please confirm infomation you provided for us: </p>
                                            <p>Contact info: `+ email +`</p>
                                            <p>Crypto quantum: `+ cryptoQuantum +`</p>
                                            <p>Trading cash: `+ cash +`</p>
                                            <p>Banking: `+ banking +`</p>
                                            <p>Bank account number: `+ bankNum +`</p>
                                    </div>
                                    <p style='text-align:left'> 
                                        We send this email to confirm with you we recieved your order and will contact with you as soon as accepted. Our product for trader can find at 
                                        <a href='https://stib.co/' style='color:#f38320'>StiB.co</a>
                                    </p>
                                    <p style='text-align:left'>Trân trọng,<br/>StiB Team </p>
                                </div>
                                <div style='border-top:1px solid #ececec; padding:10px 0 5px 0; background:#f6f6f6 url(https://stib.co/images/footer_mail.jpg) no-repeat; width:100%; display:block; paddig:10px 0; margin:30px auto'>
                                    <p style='padding:0!important; line-height:18px;text-align:center;padding:0;margin:0 0 5px 0;'> 
                                        <a style='color:#4b92dd;' href='maito:Support@StiB.co'> Support@StiB.co</a> 
                                        | <a href='https://www.google.com/maps/place/StiB.co/@10.7626314,106.696062,17z/data=!3m1!4b1!4m5!3m4!1s0x31752f1498362fad:0x306e8af129cbaf4e!8m2!3d10.7626261!4d106.6982507'>155 Bến Vân Đồn, Ward 6, District 4, Ho Chi Minh City</a> 
                                        | Phone: 0906 097 525 | (8am - 6pm T2 - T6 | 9am - 5pm T7)
                                    </p>
                                    </div>
                                </div>
                            </body>
                        </html>`

    const templateEmail =   `<html>
                                <head>
                                    <title>StiB 2FA</title>
                                </head>
                                <body>
                                    <div style='margin:0 auto; text-align:center; max-width: 600px; width:100%; display: block; color:#7d7d7d;'>
                                        <img style='paddig:10px;width:69px;height:87px' src='https://stib.co/stib_version2/logo_mail.jpg' alt='Logo StiB'/>
                                        <h1 style='margin: 15px auto; text-align: center; font-size:24px; line-height:24px; color:#777474'>StiB TRADING SELL ORDER</h1>
                                        <p style='text-align:left'>Gửi từ `+ sender(email, phone) +`,</p>
                                        <div style='text-align: left'>
                                            <p>Contact info: `+ sender(email, phone) +`</p>
                                            <p>Crypto quantum: `+ cryptoQuantum +`</p>
                                            <p>Seller offer: `+ cash +`</p>
                                            <p>Banking: `+ banking +`</p>
                                            <p>Bank trading number: `+ bankNum +`</p>
                                        </div>
                                        <p style='text-align:left'> 
                                            Chúng tôi sẽ thông báo với bạn sau khi giao dịch của bạn được chấp nhận. Bạn có thể giao dịch Bitcoin miễn phí tại sàn 
                                            <a href='https://stib.co/' style='color:#f38320'>StiB.co</a>
                                        </p>
                                        <p style='text-align:left'>Trân trọng,<br/>StiB Team </p>
                                    </div>
                                    <div style='border-top:1px solid #ececec; padding:10px 0 5px 0; background:#f6f6f6 url(https://stib.co/images/footer_mail.jpg) no-repeat; width:100%; display:block; paddig:10px 0; margin:30px auto'>
                                        <p style='padding:0!important; line-height:18px;text-align:center;padding:0;margin:0 0 5px 0;'> 
                                            <a style='color:#4b92dd;' href='maito:Support@StiB.co'> Support@StiB.co</a> 
                                            | <a href='https://www.google.com/maps/place/StiB.co/@10.7626314,106.696062,17z/data=!3m1!4b1!4m5!3m4!1s0x31752f1498362fad:0x306e8af129cbaf4e!8m2!3d10.7626261!4d106.6982507'>155 Bến Vân Đồn, phường 6, Quận 4, HCM</a> 
                                            | Nhắn tin: 0906 097 525 | (8am - 6pm T2 - T6 | 9am - 5pm T7)
                                        </p>
                                        </div>
                                    </div>
                                </body>
                            </html>`

    /* CREATE SEND OPTIONS */
    let mailOptions = {
        from: '"'+sender(email, phone)+'"', // sender address
        to: authSender.user, // list of receivers
        subject: 'Sell crypto order', // Subject line
        text: 'Request sell crypto', // plain text body
        html: templateEmail // html body
    };

    let mailOptionsFeed = {
        from: '"'+authSender.user+'"', // sender address
        to: email, // list of receivers
        subject: 'Sell crypto confirm email', // Subject line
        text: 'Confirm email for sell crypto from StiB', // plain text body
        html: templateEmail // html body
    };

    /* HANDLE SEND EMAIL */
    async.waterfall([
        (next_waterfall) => {
            /* Send mail to Stib agent */
            transporter.sendMail(mailOptions, (error, info) => {
                console.log('message to agent: '+info.messageId+' sent: '+info.response)
                if (error) {
                    next_waterfall({ resCode: responseCode.FAILED, 
                                     message: 'Send email failed' });
                }else{
                    next_waterfall(null, {  resCode: responseCode.SUCCESS,
                                            message: 'Send report success' });
                }
            });
        },

        (resultSendAgent, next_waterfall) => {
            if(email === "" || email === null || email === undefined || Boolean(doubleValidateEmail(email)) === false){
                callback(null, { resCode: responseCode.FAILED, 
                                message: 'Email invalid to send feedback email'})
            }else{
                /* Send mail to customer */
                transporter.sendMail(mailOptionsFeed, (error, infoFeed) => {
                    console.log('message feedback: '+infoFeed.messageId+' sent: '+infoFeed.response)
                    if(error){
                        next_waterfall({ resCode: responseCode.FAILED,
                                        message: 'Send feedback email failed' })
                    }else{
                        next_waterfall(null, {  resCode: responseCode.SUCCESS, 
                                                message: 'Send feedback success - '+resultSendAgent.message })
                    }
                })
            }
        }

    ], (err, result) => {
        console.log('final result send email: ', err, result)

        if(err){
            callback({ resCode: responseCode.FAILED,
                       message: 'Can not send email' })
        }else{
            callback({ resCode: responseCode.SUCCESS, 
                       message: 'Send email successed - '+result.message })
        }
    })

    // transporter.sendMail(mailOptions, (error, info) => {
    //     if (error) {
    //         callback({  resCode: responseCode.FAILED, 
    //                    message: 'Send email failed' });
    //     }else{
    //         callback(null, { resCode: responseCode.SUCCESS,
    //                         message: 'Send report success - message '+info.messageId+' sent: '+info.response });
    //     }
    // });
}

/* HANDLE SEND FEEDBACK EMAIL */
// handleSendEmailFeed = (email, phone, cryptoQuantum, cash, banking, bankNum, lang, callback) => {
//     console.log('is email to send: ', email !== "" || email !== null || email !== undefined || Boolean(doubleValidateEmail(email)))
    
//         const templateEmail =   lang === "VN" ? `<html>
//                                     <head>
//                                         <title>StiB 2FA</title>
//                                     </head>
//                                     <body>
//                                         <div style='margin:0 auto; text-align:center; max-width: 600px; width:100%; display: block; color:#7d7d7d;'>
//                                             <img style='paddig:10px;width:69px;height:87px' src='https://stib.co/stib_version2/logo_mail.jpg' alt='Logo StiB'/>
//                                             <h1 style='margin: 15px auto; text-align: center; font-size:24px; line-height:24px; color:#777474'>StiB TRADING SELL ORDER</h1>
//                                             <p style='text-align:left'>Gửi từ `+ authSender.user +`,</p>
//                                             <div style='text-align: left'>
//                                                 <p>Xác nhận thông tin giao dịch bạn đã cung cấp: </p>
//                                                     <p>Thông tin liên hệ: `+ email +`</p>
//                                                     <p>Số lượng crypto: `+ cryptoQuantum +`</p>
//                                                     <p>Số tiền giao dịch: `+ cash +`</p>
//                                                     <p>Ngân hàng thanh toán: `+ banking +`</p>
//                                                     <p>Số tài khoản thanh toán: `+ bankNum +`</p>
//                                             </div>
//                                             <p style='text-align:left'> 
//                                                 Chúng tôi sẽ thông báo với bạn sau khi giao dịch của bạn được chấp nhận. Bạn có thể giao dịch Bitcoin miễn phí tại sàn 
//                                                 <a href='https://stib.co/' style='color:#f38320'>StiB.co</a>
//                                             </p>
//                                             <p style='text-align:left'>Trân trọng,<br/>StiB Team </p>
//                                         </div>
//                                         <div style='border-top:1px solid #ececec; padding:10px 0 5px 0; background:#f6f6f6 url(https://stib.co/images/footer_mail.jpg) no-repeat; width:100%; display:block; paddig:10px 0; margin:30px auto'>
//                                             <p style='padding:0!important; line-height:18px;text-align:center;padding:0;margin:0 0 5px 0;'> 
//                                                 <a style='color:#4b92dd;' href='maito:Support@StiB.co'> Support@StiB.co</a> 
//                                                 | <a href='https://www.google.com/maps/place/StiB.co/@10.7626314,106.696062,17z/data=!3m1!4b1!4m5!3m4!1s0x31752f1498362fad:0x306e8af129cbaf4e!8m2!3d10.7626261!4d106.6982507'>155 Bến Vân Đồn, phường 6, Quận 4, HCM</a> 
//                                                 | Nhắn tin: 0906 097 525 | (8am - 6pm T2 - T6 | 9am - 5pm T7)
//                                             </p>
//                                             </div>
//                                         </div>
//                                     </body>
//                                 </html>`
//                                  : `<html>
//                                     <head>
//                                         <title>StiB 2FA</title>
//                                     </head>
//                                     <body>
//                                         <div style='margin:0 auto; text-align:center; max-width: 600px; width:100%; display: block; color:#7d7d7d;'>
//                                             <img style='paddig:10px;width:69px;height:87px' src='https://stib.co/stib_version2/logo_mail.jpg' alt='Logo StiB'/>
//                                             <h1 style='margin: 15px auto; text-align: center; font-size:24px; line-height:24px; color:#777474'>StiB TRADING SELL ORDER</h1>
//                                             <p style='text-align:left'>Send from: `+ authSender.user +`,</p>
//                                             <div style='text-align: left'>
//                                                 <p>Please confirm infomation you provided for us: </p>
//                                                     <p>Contact info: `+ email +`</p>
//                                                     <p>Crypto quantum: `+ cryptoQuantum +`</p>
//                                                     <p>Trading cash: `+ cash +`</p>
//                                                     <p>Banking: `+ banking +`</p>
//                                                     <p>Bank account number: `+ bankNum +`</p>
//                                             </div>
//                                             <p style='text-align:left'> 
//                                                 We send this email to confirm with you we recieved your order and will contact with you as soon as accepted. Our product for trader can find at 
//                                                 <a href='https://stib.co/' style='color:#f38320'>StiB.co</a>
//                                             </p>
//                                             <p style='text-align:left'>Trân trọng,<br/>StiB Team </p>
//                                         </div>
//                                         <div style='border-top:1px solid #ececec; padding:10px 0 5px 0; background:#f6f6f6 url(https://stib.co/images/footer_mail.jpg) no-repeat; width:100%; display:block; paddig:10px 0; margin:30px auto'>
//                                             <p style='padding:0!important; line-height:18px;text-align:center;padding:0;margin:0 0 5px 0;'> 
//                                                 <a style='color:#4b92dd;' href='maito:Support@StiB.co'> Support@StiB.co</a> 
//                                                 | <a href='https://www.google.com/maps/place/StiB.co/@10.7626314,106.696062,17z/data=!3m1!4b1!4m5!3m4!1s0x31752f1498362fad:0x306e8af129cbaf4e!8m2!3d10.7626261!4d106.6982507'>155 Bến Vân Đồn, Ward 6, District 4, Ho Chi Minh City</a> 
//                                                 | Phone: 0906 097 525 | (8am - 6pm T2 - T6 | 9am - 5pm T7)
//                                             </p>
//                                             </div>
//                                         </div>
//                                     </body>
//                                 </html>`

//         /* CREATE SEND OPTIONS */
//         let mailOptions = {
//             from: '"'+authSender.user+'"', // sender address
//             to: email, // list of receivers
//             subject: 'Sell crypto confirm email', // Subject line
//             text: 'Confirm email for sell crypto from StiB', // plain text body
//             html: templateEmail // html body
//         };

//         /* HANDLE SEND EMAIL */
//         transporter.sendMail(mailOptions, (error, info) => {
//             if (error) {
//                 callback({  resCode: responseCode.FAILED, 
//                             message: 'Send feedback email failed' });
//             }

//             callback(null, { resCode: responseCode.SUCCESS,
//                              message: 'Send feedback email success' });
//         });
//     }
// }

/* ROUTE SEND MAIL */
router.post('/stib-trading', function(req, res, next) {

    const cryptoQuantum = String(req.body.crypto_quantum)
    const userName = String(req.body.user_name)
    const cash = String(req.body.currency_amount) 
    const banking = String(req.body.bank)
    const bankNum = String(req.body.bank_account)
    const email = String(req.body.trading_email)
    const phone = String(req.body.phone_number)
    const lang = String(req.body.language)

    validateInputData(userName, cryptoQuantum, cash, banking, bankNum, email, phone, function(err, results){
        console.log('validateInputData: ', err, results)

        if(results.resCode === responseCode.SUCCESS){
            handleSendEmail(userName, cryptoQuantum, cash, banking, bankNum, email, phone, lang, function(err, isSend){
                if(err){
                    console.log({  resCode: responseCode.FAILED,
                                message: err.message+' - '+results.message })
                    res.json({  resCode: responseCode.FAILED,
                                message: err.message+' - '+results.message })
                }else{
                    console.log({  resCode: responseCode.SUCCESS, 
                                message: 'Email send successed',
                                subMsg: results.message })
                    res.json({  resCode: responseCode.SUCCESS, 
                                message: 'Email send successed',
                                subMsg: results.message })
                }
            })
        }else{
            console.log({ resCode: responseCode.FAILED, 
                       message: results.message})
            res.json({ resCode: responseCode.FAILED, 
                       message: results.message}) 
        }
    })
});

// router.post('/email/feedback', function(req, res, next){

//     const cryptoQuantum = String(req.body.crypto_quantum)
//     const userName = String(req.body.user_name)
//     const cash = String(req.body.currency_amount) 
//     const banking = String(req.body.bank)
//     const bankNum = String(req.body.bank_account)
//     const email = String(req.body.trading_email)
//     const phone = String(req.body.phone_number)
//     const lang = String(req.body.language)

//     handleSendEmailFeed(email, phone, cryptoQuantum, cash, banking, bankNum, lang, (err, result) => {
//         console.log('handle send feedback email: ', err, result)
//         if(err){
//             res.json(err)
//         }else{
//             res.json(result)
//         }
//     })
// })

module.exports = router;