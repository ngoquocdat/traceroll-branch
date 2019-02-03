import Utils from './utils.js';
import axios from 'axios';
import config from '../../config.json';

const apiURL = config.url;
axios.defaults.baseURL = apiURL;
axios.defaults.withCredentials = true;

const TrService = {
    updateElementOnDb(requestBody, callback){
        Utils.showProcessingBar();
        axios.post('/api/element/drawing/update', requestBody)
            .then(function(response) {
                Utils.hideProcessingBar();
                callback && callback();
        });
    },
    deleteElementOnDb(uid, key, callback) {
        Utils.showProcessingBar();
        axios.post('/api/element/delete',{
                uid: uid,
                key: key,
            }).then(function(response){
                Utils.hideProcessingBar();
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    updateText(requestBody, callback){
        Utils.showProcessingBar();
        axios.post('/api/element/text/update', requestBody)
        .then(function(response){
            Utils.hideProcessingBar();
            callback && callback(response);
        })
        .catch(Utils.axiosError);
    },
    uploadImage(file, callback, updateProgress, showProgress, hideProgress) {
        showProgress && showProgress()

        let data = new FormData();
        data.append('file', file);

        const config = {
            headers: {
                'content-type': 'multipart/form-data'
            },
            onUploadProgress: function(progressEvent) {
                const percent = parseInt(Math.round((progressEvent.loaded * 100) / progressEvent.total))
                updateProgress && updateProgress(percent)
            }.bind(this)
        }

        axios.post('/api/upload', data, config)
            .then(function(response) {
                callback && callback(response);

                hideProgress && hideProgress()
            })
            .catch(Utils.axiosError);
    },
    uploadBase64(requestBody, callback) {
        axios.post('/api/upload', requestBody)
            .then(function(response) {
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    updateProfileImagePath(requestBody, callback) {
        axios.post('/api/update-profile-image', requestBody)
            .then(function(response) {
                Utils.hideProcessingBar();
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    updateImage(requestBody, callback) {
        Utils.showProcessingBar();
        axios.post('/api/element/image/update', requestBody)
            .then(function(response){
                Utils.hideProcessingBar();
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    getNewsfeed(requestBody, callback) {
        axios.post('/api/newsfeed/list', requestBody)
            .then(function (response) {
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    saveDrawingElement(requestBody, callback) {
        axios.post('/api/element/drawing/save', requestBody)
            .then(function (response) {
                localStorage.removeItem('tracerollCountDrawed')
                Utils.hideProcessingBar();
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    getUserJoinDate(userslug, callback) {
        axios.get('/api/user/join-date/' + userslug)
            .then(function(response){
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    getElementList(userslug, callback) {
        axios.get('/api/element/list/' + userslug)
            .then(function(response){
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    saveText(requestBody, callback) {
        Utils.showProcessingBar();
        axios.post('/api/element/text/save', requestBody)
            .then(function (response) {
                Utils.hideProcessingBar();
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    saveVideo(requestBody, callback) {
        axios.post('/api/element/video/save', requestBody)
            .then(function (response) {
                Utils.hideProcessingBar();
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    saveImage(requestBody, callback) {
        axios.post('/api/element/image/save', requestBody)
            .then(function (response) {
                Utils.hideProcessingBar();
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    createThumbnailVideo(requestBody, callback) {
        axios.post('/api/element/video/create-thumb', requestBody)
            .then(function (response) {
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    searchUser(requestBody, callback) {
        axios.post('/api/search/username', requestBody)
            .then(function (response) {
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    follow(requestBody, callback) {
        axios.post('/api/user/follow', requestBody)
            .then(function (response) {
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    unfollow(requestBody, callback) {
        axios.post('/api/user/unfollow', requestBody)
            .then(function (response) {
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    followDetail(requestBody, callback) {
        axios.post('/api/user/follow-detail', requestBody)
            .then(function (response) {
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    loadNotifications(requestBody, callback) {
        axios.post('/api/user/notifications/list', requestBody)
            .then(function (response) {
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    checkPermission(requestBody, callback) {
        axios.post('/api/user/check-permission', requestBody)
            .then(function (response) {
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    updatePermission(requestBody, callback) {
        axios.post('/api/user/update-permission', requestBody)
            .then(function (response) {
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    createNotificationAdd(requestBody, callback) {
        axios.post('/api/notification/create', requestBody)
            .then(function (response) {
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    saveComment(requestBody, callback) {
        axios.post('/api/comments/save', requestBody)
            .then(function (response) {
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    likeElement(requestBody, callback) {
        axios.post('/api/element/like', requestBody)
            .then(function (response) {
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    checkFollower(requestBody, callback) {
        axios.post('/api/follow/check-follower', requestBody)
            .then(function (response) {
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    getElementDetail(requestBody, callback) {
        axios.post('/api/element/detail', requestBody)
            .then(function (response) {
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    updateProfilePosition(requestBody, callback) {
        axios.post('/api/user/update-profile-position', requestBody)
            .then(function (response) {
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    resetPassword(requestBody, callback) {
        axios.post('/reset-pwd', requestBody)
            .then(function (response) {
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    reportIssue(requestBody, callback) {
        axios.post('/api/user/report', requestBody)
            .then(function (response) {
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    changePassword(requestBody, callback) {
        axios.post('/api/user/change-pass', requestBody)
            .then(function (response) {
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    deleteUser(requestBody, callback) {
        axios.post('/api/user/delete', requestBody)
            .then(function (response) {
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    logout(requestBody, callback) {
        axios.post('/logout', requestBody)
            .then(function (response) {
                callback && callback(response);
            })
            .catch(Utils.axiosError);
    },
    getUserProfile(callback) {
        axios.get('/api/profile')
        .then(function(response){
            console.log(response);
            callback && callback(response);
        })
        .catch(Utils.axiosError);
    },
    updateProfileImageHide(requestBody, callback){
        axios.post('/api/profile/hide', requestBody)
        .then(function(response){
            callback && callback(response);
        })
        .catch(Utils.axiosError);
    }
}

export default TrService;
