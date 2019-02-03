
'use strict';

var	async = require('async'),
	helpers = require('./../helpers'),
	db = require('./../../database/mongo'),
	meta = {config:{}};

module.exports = function(Users) {

	Users.getSettings = function(uid, callback) {
		if (!parseInt(uid, 10)) {
			return onSettingsLoaded(0, {}, callback);
		}

		var key = helpers.buildKey('user',uid,'settings');

		db.getObject(key, function(err, settings) {
			if (err) {
				return callback(err);
			}

			onSettingsLoaded(uid, settings ? settings : {}, callback);
		});
	};

	Users.getMultipleUserSettings = function(uids, callback) {
		if (!Array.isArray(uids) || !uids.length) {
			return callback(null, []);
		}

		var keys = helpers.buildKeys('user', uids, 'settings');

		db.getObjects(keys, function(err, settings) {
			if (err) {
				return callback(err);
			}

			for (var i=0; i<settings.length; ++i) {
				settings[i] = settings[i] || {};
				settings[i].uid = uids[i];
			}

			async.map(settings, function(setting, next) {
				onSettingsLoaded(setting.uid, setting, next);
			}, callback);
		});
	};

	function onSettingsLoaded(uid, settings, callback) {

		var defaultHistoriesPerPage = parseInt(meta.config.historiesPerPage, 10) || 20;
		var defaultVisitorsPerPage = parseInt(meta.config.visitorsPerPage, 10) || 20;
		var defaultAgentsPerPage = parseInt(meta.config.agentsPerPage, 10) || 20;
		var defaultDepartmentsPerPage = parseInt(meta.config.departmentsPerPage, 10) || 20;
		var defaultShortcutsPerPage = parseInt(meta.config.shortcutsPerPage, 10) || 20;

		settings.showemail = parseInt(settings.showemail, 10) === 1;
		settings.showfullname = parseInt(settings.showfullname, 10) === 1;
		settings.openOutgoingLinksInNewTab = parseInt(settings.openOutgoingLinksInNewTab, 10) === 1;
		settings.usePagination = (settings.usePagination === null || settings.usePagination === undefined) ? parseInt(meta.config.usePagination, 10) === 1 : parseInt(settings.usePagination, 10) === 1;
		settings.historiesPerPage = Math.min(settings.historiesPerPage ? parseInt(settings.historiesPerPage, 10): defaultHistoriesPerPage, defaultHistoriesPerPage);
		settings.visitorsPerPage = Math.min(settings.visitorsPerPage ? parseInt(settings.visitorsPerPage, 10): defaultVisitorsPerPage, defaultVisitorsPerPage);
		settings.agentsPerPage = Math.min(settings.agentsPerPage ? parseInt(settings.agentsPerPage, 10): defaultAgentsPerPage, defaultAgentsPerPage);
		settings.departmentsPerPage = Math.min(settings.departmentsPerPage ? parseInt(settings.departmentsPerPage, 10): defaultDepartmentsPerPage, defaultDepartmentsPerPage);
		settings.shortcutsPerPage = Math.min(settings.shortcutsPerPage ? parseInt(settings.shortcutsPerPage, 10): defaultShortcutsPerPage, defaultShortcutsPerPage);
		settings.notificationSounds = parseInt(settings.notificationSounds, 10) === 1;
		settings.userLang = settings.userLang || meta.config.defaultLang || 'en_GB';
		settings.sendChatNotifications = parseInt(settings.sendChatNotifications, 10) === 1;
		settings.restrictChat = parseInt(settings.restrictChat, 10) === 1;

		callback(null, settings);
	
	}

	Users.saveSettings = function(uid, data, callback) {
		if (invalidPaginationSettings(data)) {
			return callback(new Error('[[error:invalid-pagination-value]]'));
		}

		async.waterfall([
			function(next) {
				db.setObject('user:' + uid + ':settings', {
					showemail: data.showemail,
					showfullname: data.showfullname,
					openOutgoingLinksInNewTab: data.openOutgoingLinksInNewTab,
					usePagination: data.usePagination,
					historiesPerPage: Math.min(data.historiesPerPage, parseInt(meta.config.historiesPerPage, 10) || 20),
					visitorsPerPage: Math.min(data.visitorsPerPage, parseInt(meta.config.visitorsPerPage, 10) || 20),
					agentsPerPage: Math.min(data.agentsPerPage, parseInt(meta.config.agentsPerPage, 10) || 20),
					departmentsPerPage: Math.min(data.departmentsPerPage, parseInt(meta.config.departmentsPerPage, 10) || 20),
					shortcutsPerPage: Math.min(data.shortcutsPerPage, parseInt(meta.config.shortcutsPerPage, 10) || 20),
					notificationSounds: data.notificationSounds,
					userLang: data.userLang || meta.config.defaultLang,
					sendChatNotifications: data.sendChatNotifications,
					restrictChat: data.restrictChat
				}, next);
			},
			function(next) {
				//updateDigestSetting(uid, data.dailyDigestFreq, next);
				next();
			},
			function(next) {
				Users.getSettings(uid, next);
			}
		], callback);
	};

	function invalidPaginationSettings(data) {
		return !data.historiesPerPage || !data.visitorsPerPage || !data.agentsPerPage || !data.departmentsPerPage
			parseInt(data.historiesPerPage, 10) <= 0 || parseInt(data.visitorsPerPage, 10) <= 0 || 
			parseInt(data.agentsPerPage, 10) <= 0 || parseInt(data.departmentsPerPage, 10) <= 0 ||
			parseInt(data.historiesPerPage, 10) > meta.config.historiesPerPage || parseInt(data.visitorsPerPage, 10) > meta.config.visitorsPerPage ||
			parseInt(data.agentsPerPage, 10) > meta.config.agentsPerPage || parseInt(data.departmentsPerPage, 10) > meta.config.departmentsPerPage;
	}

	Users.setSetting = function(uid, key, value, callback) {
		db.setObjectField('user:' + uid + ':settings', key, value, callback);
	};

};
