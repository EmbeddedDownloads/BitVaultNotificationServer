var config = require('../conf/config');
var debug = require('debug')('app');

//connect with the database
var connection = config.dbConnection();
connection.connect(function (err, con_data) {
    if (err) {
        console.log('----db error----');
        console.log(err);
    } else {

        console.log("db Connected!");
    }
});

/**
 * Insert the application details in db
 * @params {JSON object} data
 * @returns {string} callback
 */
module.exports.insertProjectInfo = function (data, callback) {
    var sql = 'insert into bitvault_project_info set ?';
    connection.query(sql, [data], function (err, rows) {
        callback(err, rows);

    });
};

/**
 * register device with the notification server
 * @param {JSON object} data
 * @returns {string} callback
 */
module.exports.registerDevice = function (data, callback) {

    var sql = 'insert into bitvault_device_info (device_id,device_token,desktop_token,wallet_address,created_on) values ?';
    connection.query(sql, [data], function (err, rows) {
        callback(err, rows);
    });
};

/**
 * Search for package name
 * @params {string} package_name
 * @returns {int} callback
 */
module.exports.searchPackage = function (package_name, callback) {
    var sql = 'select count(*) as package from bitvault_project_info where package_name = ?';
    connection.query(sql, [package_name], function (err, rows) {
        callback(err, rows);

    });
};

/**
 * Search if device is registered
 * @param {string} device_id
 * @returns {int} callback
 */
module.exports.searchDevice = function (device_id, callback) {
    var sql = 'select count(*) as device_id from bitvault_device_info where device_id = ?';
    connection.query(sql, [device_id], function (err, rows) {
        callback(err, rows);

    });
};

/**
 * Check for app registration
 * @param {string} app_key
 * @param {string} device_token
 * @returns {int} callback
 */
module.exports.checkAppRegistration = function (app_key, device_token, callback) {
    var sql = 'select count(*) as count from bitvault_application_info where application_key_fk = ? and device_token_fk = ?';
    connection.query(sql, [app_key, device_token], function (err, rows) {
        callback(err, rows);

    });
};

/**
 * Check if application is registered on developer console
 * @param {string} app_key
 * @returns {int} callback
 */
module.exports.searchAppKey = function (app_key, callback) {
    var sql = 'select count(*) as app_key from bitvault_project_info where application_key = ?';
    connection.query(sql, [app_key], function (err, rows) {
        callback(err, rows);

    });
};

/**
 * Fetch device-info based on column
 * @param {string} column
 * @param {string} value
 * @returns {string} callback
 */
module.exports.getDeviceInfo = function (column, value, callback) {
    var sql = 'select device_id,device_token,desktop_token from bitvault_device_info where ' + column + ' = ?';
    connection.query(sql, [value], function (err, rows) {
        callback(err, rows);

    });
};

/**
 * Register the application on the notification server
 * @param {JSON object} data
 * @returns {string} callback
 */
module.exports.registerApplication = function (data, callback) {
    var sql = 'insert into bitvault_application_info set ?';
    connection.query(sql, [data], function (err, rows) {
        callback(err, rows);

    });
};

/**
 * Search the application information base on web server key
 * @param {string} server_key
 * @returns {string} callback
 */
module.exports.searchServerKey = function (server_key, callback) {
    var sql = 'select package_name,application_key from bitvault_project_info where web_server_key = ?';
    connection.query(sql, [server_key], function (err, rows) {
        callback(err, rows);

    });
};

/**
 * Count the notifications 
 * @param {string} transaction_id
 * @param {string} tag
 * @returns {string} callback
 */
module.exports.checkNotificationDetails = function (transaction_id, tag, callback) {
    var sql = 'select count(*) as count from bitvault_notifications where transaction_id = ? and tag = ?';
    connection.query(sql, [transaction_id, tag], function (err, rows) {
        callback(err, rows);

    });
};

/**
 * Insert the notifications in the db
 * @param {JSON object} data
 * @returns {string} callback
 */
module.exports.insertNotificationDetails = function (data, callback) {
    var sql = 'insert into bitvault_notifications set ?';
    connection.query(sql, [data], function (err, rows) {
        callback(err, rows);
        //debug('------------insertNotificationDetails----------\n');

    });
};

/**
 * Fetch all the device id based on the wallet address
 * @param {array} wallet_address
 * @returns {string} callback
 */
module.exports.deviceId = function (wallet_address, callback) {
    var sql = 'select distinct(device_id) from bitvault_device_info where wallet_address IN (?)';
    connection.query(sql, [wallet_address], function (err, rows) {
        callback(err, rows);
    });
};

