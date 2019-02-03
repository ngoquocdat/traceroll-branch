import React, { Component } from 'react';
import './style.css';
import Utils from '../../Util/utils.js';
import Const from '../../Util/const.js';
import TrService from '../../Util/service.js';
import TRToast from '../Notification/toast'

class TROptMenu extends Component {
    constructor(props) {
        super(props);

        this.state = {
            showOptMenu: props.showOptMenu ? props.showOptMenu : false,
            editInfo: false,
            userInfomation: props.user_info,
            showReportModal: false,
            showSettingModal: false,
            currentPwd: '',
            newPwd: '',
            confirmPwd: '',
            issue: '',
        }
        this.isSaving = false
        this.isSending = false
    }

    handleChange = (e) => {
        const input = e.target,
            valueField = input.dataset.value_field

        this.setState({
            [valueField]: input.value
        })
    }

    handleSendIssue = () => {

        if (this.isSending) return

        let { issue } = this.state
        issue = issue.trim()

        const self = this

        if (issue.length > 0) {

            self.TRToast.showAutoHide('Sending...')
            this.isSending = true

            const userData = this.state.userInfomation,
                reportData = {
                    reportDetails: issue,
                    senderEmail: userData.email,
                    fullName: userData.fullname
                }

            TrService.reportIssue(reportData, response => {

                if (response.status === 200) {
                    this.isSending = false
                    self.TRToast.showAutoHide('Send report success !')
                }
                else alert('Can not send report !')
            })

        }
        else alert('Your report is empty !')
    }

    handleSaveEdit = () => {

        if (this.isSaving) return

        const { currentPwd, newPwd, confirmPwd, userInfomation } = this.state,
            self = this

        if (Utils.isValidPassword(newPwd)) {

            if (newPwd.localeCompare(confirmPwd) === 0) {

                this.TRToast.showAutoHide('Saving...')
                this.isSaving = true

                const dataPwd = {
                    uid: userInfomation.userId,
                    data: {
                        oldpassword: currentPwd,
                        rpassword: newPwd
                    }
                }

                TrService.changePassword(dataPwd, response => {

                    if (response.data.error === null) {
                        self.isSaving = false
                        self.setState({
                            currentPwd: '',
                            newPwd: '',
                            confirmPwd: ''
                        })
                        this.TRToast.showAutoHide('Password changed !')
                    }
                    else alert('Cannot change password !')
                })
            }
            else alert('Confirm password not match !')
        }
        else alert(Const.INVALID_PASSWORD_MSG)
    }

    handleDelUser = (userKey, userID, userName, userEmail, userFullName) => {
        const self = this;

        let userDelInfo = {
                userKey : userKey, 
                userId: userID, 
                userName: userName,
                userEmail: userEmail,
                userFullName: userFullName
            }

        TrService.deleteUser(userDelInfo, response => {
            if (response.status == 200){
              window.dataLayer.push({'event': 'clearUserProperties'});
              window.dataLayer.push({'event': 'logEvent', 'eventType': 'clearUserProperties', 'eventProperties':null});
              self.handleOptLogout();
            }else {
              window.dataLayer.push({'event': 'logEvent', 'eventType': 'errorClearUserProperties', 'eventProperties':null});
            }
        })
    }

    handleOptLogout = () => {
        TrService.logout({}, response => {
            if (response.status === 200){
              window.dataLayer.push({'event': 'resetUserId'});
              window.location.href = "/login";
            }
        })
    }

    showSettingModal = () => {
        this.setModalVisibility('showSettingModal', true)
        this.setModalVisibility('showReportModal', false)
        this.props.setShowNotification && this.props.setShowNotification(false, true)
    }

    showReportModal = () => {
        this.setModalVisibility('showReportModal', true)
        this.setModalVisibility('showSettingModal', false)
        this.props.setShowNotification && this.props.setShowNotification(false, true)
    }

    setModalVisibility = (modal, visibility) => {

        const data = {}
        data[modal] = visibility

        this.setState(data)
    }

    toggleEditUserInfo = () => {
        let editInfo = this.state.editInfo;

        this.setState((prevState, props) => ({
            editInfo: !prevState.editInfo,
        }));
    }

    render() {
        const self = this;
        const userInfo = this.state.userInfomation;
        const userSettingInfo = this.props.user_info ? this.props.user_info : null;
        let isEditInfo = this.state.editInfo;
        let renderElement = isEditInfo ? (
                <div>
                    <div className="custom-form">
                        <label htmlFor="userpassword" className="control-label-account-setting col-md-3">Current Password</label>
                        <div className="col-md-9">
                            <input
                                type="password"
                                name="password"
                                className="form-control-account-setting"
                                id="user_password"
                                maxLength="100"
                                value={this.state.currentPwd}
                                onChange={this.handleChange}
                                data-value_field='currentPwd'
                            />
                        </div>
                    </div>
                    <div className="custom-form">
                        <label htmlFor="new_userpassword" className="control-label-account-setting col-md-3">New Password</label>
                        <div className="col-md-9">
                            <input
                                type="password"
                                name="password"
                                className="form-control-account-setting"
                                id="new_user_password"
                                maxLength="100"
                                value={this.state.newPwd}
                                onChange={this.handleChange}
                                data-value_field='newPwd'
                            />
                        </div>
                    </div>
                    <div className="custom-form">
                        <label htmlFor="confirm_userpassword" className="control-label-account-setting col-md-3">Confirm Password</label>
                        <div className="col-md-9">
                            <input
                                type="password"
                                name="password"
                                className="form-control-account-setting"
                                id="confirm_user_password"
                                maxLength="100"
                                value={this.state.confirmPwd}
                                onChange={this.handleChange}
                                data-value_field='confirmPwd'
                            />
                        </div>
                    </div>
                    <div className="button-action col-md-9" style={{float: 'right', padding: '0px 8px', display: 'grid',}}>
                        <input type="submit" className="edit-info info-action" value="Save Edit" onClick={this.handleSaveEdit}/>
                        <input type="submit" className="del-info info-action" value="Cancel Edit"  onClick={this.toggleEditUserInfo}/>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="custom-form">
                        <label htmlFor="userpassword" className="control-label-account-setting col-md-3">Password</label>
                        <div className="col-md-9">
                            <input
                                value='************'
                                type="password"
                                name="password"
                                className="form-control-account-setting"
                                id="user_password"
                                maxLength="100"
                                readOnly
                            />
                        </div>
                    </div>
                    <div className="button-action col-md-9" style={{float: 'right', padding: '0px 8px', display: 'grid',}}>
                        <input type="submit" className="edit-info info-action" value="Edit Account Information" onClick={this.toggleEditUserInfo}/>
                        {/*<input type="submit" className="del-info info-action" value="Delete Account" onClick={() => this.handleDelUser(userInfo._key, userInfo.userId, userInfo.username)}/>*/}
                        <input type="submit" className="del-info info-action" value="Delete Account" data-toggle="modal" data-target="#confirmModal"/>
                    </div>
                </div>  
            )

        const fullWidthOption = this.props.showNotification || this.state.showSettingModal || this.state.showReportModal

        return (
            <div id="options_menu_zone" style={{top: "0", position: "absolute"}}>
                <div id='options-menu' style={{position: 'fixed'}} className={fullWidthOption ? 'full-width' : ''}> 
                    <span className="optionTitle"><b>Menu</b></span>
                    <ul className="listOptions">
                        <li>
                            <a onClick={this.showSettingModal}>
                                Settings
                            </a>
                        </li>
                        <li>
                            <a onClick={this.showReportModal}>
                                Submit Feedback or Issues
                            </a>
                        </li>
                        <li>
                            <a href="https://medium.com/traceroll">
                                Get Inspired
                            </a>
                        </li>
                        <li>
                            <a onClick={this.handleOptLogout}>
                                Sign-out
                            </a>
                        </li>
                    </ul>
                    <footer id="copyright">
                        <p>&copy;2018 Traceroll • <a href="/privacy-policy">Privacy Policy</a> <br /> • <a href="terms">Terms of Service</a></p>
                    </footer>
                </div>

                {/*Modal for account setting*/}

                {
                    this.state.showSettingModal && !this.props.showNotification &&
                    <div id="account_setting_modal" className="modal-dialog custom-modal">
                        <div className="modal-content" style={{borderRadius: '0px'}}>
                            {/*<div className="modal-header"></div>*/}
                            <div className="modal-body">
                                <h2 id="headline-settings">Settings</h2>
                                <div className="row" style={{margin: '0px', padding: '20px 10px'}}>
                                    <div className="custom-form">
                                        <label htmlFor="username" className="control-label-account-setting col-md-3">Username</label>
                                        <div className="col-md-9">
                                            <input type="text" value={userSettingInfo.username ? userSettingInfo.username : null} className="form-control-account-setting" id="user_name" maxLength="100" readOnly/>
                                        </div>
                                    </div>
                                    <div className="custom-form">
                                        <label htmlFor="fullname" className="control-label-account-setting col-md-3">Name</label>
                                        <div className="col-md-9">
                                            <input type="text" value={userSettingInfo.fullname ? userSettingInfo.fullname : null} className="form-control-account-setting" id="user_full_name" maxLength="100" readOnly/>
                                        </div>
                                    </div>
                                    <div className="custom-form">
                                        <label htmlFor="useremail" className="control-label-account-setting col-md-3">Email Address</label>
                                        <div className="col-md-9">
                                            <input type="text" value={userSettingInfo.email ? userSettingInfo.email : null} className="form-control-account-setting" id="user_email" maxLength="100" readOnly/>
                                        </div>
                                    </div>

                                    {renderElement}

                                </div>
                            </div>
                            {/*<div className="modal-footer"></div>*/}
                        </div>
                    </div>
                }

                {/*Modal for report issue*/}

                {
                    this.state.showReportModal && !this.props.showNotification &&
                    <div id="report_issue" className="modal-dialog custom-modal">
                        <div className="modal-content" style={{borderRadius: '0px'}}>
                            <div className="modal-body">
                                <h2 id="headline-report">Report an issue</h2>
                                <div className="row" style={{margin: '0px', padding: '20px 50px'}}>
                                    <textarea
                                        id="issueReport"
                                        className="textarea-report"
                                        rows="12"
                                        cols="50"
                                        placeholder="Describe your issue or share your ideas"
                                        value={this.state.issue}
                                        onChange={this.handleChange}
                                        data-value_field='issue'
                                    />
                                    <div className="button-action">
                                        <input
                                            onClick={this.handleSendIssue}
                                            type="submit"
                                            className="send-report edit-info info-action"
                                            value="Send"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                }

                {/*Modal confirm*/}

                <div id="confirmModal" className="modal fade" role="dialog">
                    <div className="modal-dialog" style={{margin: '200px auto',}}>
                        <div className="modal-content">
                            <div className="modal-body">
                                <p style={{textAlign: 'center', fontSize: '2em',}}>Would you like delete your account ?</p>
                            </div>
                            <div className="modal-footer" style={{padding: '0px',}}>
                                <div className="button-action" style={{width: '100%', padding: '0px 200px', display: 'inline-flex',}}>
                                    <input type="submit" className="edit-info info-action" data-dismiss="modal" onClick={() => this.handleDelUser(userInfo._key, userInfo.userId, userInfo.username, userInfo.email, userInfo.fullname)} value="Confirm"/>
                                    <input type="submit" className="edit-info info-action" data-dismiss="modal" value="Cancel"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div> 
                <TRToast ref={node => this.TRToast = node} />
            </div>
        )
    }
}

export default TROptMenu;