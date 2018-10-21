var helper = require('../common/helper');
var appModel = require('../models/appModel');
var mqttClient = require('../mqtt/mqttClient');
var debug = require('debug')('app');

/**
 * Register the application on the developer console
 * @param {string} web_server_key
 * @param {string} application_key
 * @param {string} package_name
 * @param {string} description
 * @returns {boolean} status 
 * @returns {string} message
 */

module.exports.registerProject = function (req, res) {

    var web_server_key = req.body.web_server_key;
    var application_key = req.body.application_key;
    var package_name = req.body.package_name;
    var description = req.body.description;

    //search if package is already registered
    appModel.searchPackage(package_name, function (err, cb) {
        //error callback    
        if (!err) {

            if (cb[0].package === 0) {

                var date = new Date();
                var timestamp = date.getTime();
                var data = {
                    package_name: package_name,
                    web_server_key: web_server_key,
                    application_key: application_key,
                    description: description,
                    created_on: timestamp
                };

                //register the package name        
                appModel.insertProjectInfo(data, function (err, cb) {

                    //check for error handling
                    if (err) {
                        var status = false;
                        var resp_code = '9';
                        var result = helper.createResponse(status, resp_code, "error");
                        res.send(result);

                        //successfull response                    
                    } else {
                        var status = true;
                        var resp_code = "2";
                        var result = helper.createResponse(status, resp_code, "message");
                        res.send(result);
                    }
                });
            } else {
                var status = false;
                var resp_code = "1";
                var result = helper.createResponse(status, resp_code, "message");
                res.send(result);
            }
        } else {
            var status = false;
            var resp_code = '17';
            var result = helper.createResponse(status, resp_code, "message");
            res.send(result);
        }
    });

};

/**
 * Receive data from PBC and send notification to mobile app
 * @param {string} web_server_key
 * @param {string} wallet_address
 * @param {string} tag
 * @param {string} data
 * @returns {boolean} status
 * @returns {string} message
 */

module.exports.sendNotification = function (req, res) {

    var web_server_key = req.body.web_server_key;
    var receiver_address = req.body.receiver_address;
    var sender_address = req.body.sender_address;
    var tag = req.body.tag;
    var data = req.body.data;
    var transaction_id = req.body.transaction_id;
    var array = [];

    //Search for the web server key
    appModel.searchServerKey(web_server_key, function (err, cb) {

        //error callback
        if (!err) {

            if (cb.length > 0) {

                var package_name = cb[0].package_name;
                var app_key = cb[0].application_key;

                //get device info from the wallet address
                appModel.getDeviceInfo('wallet_address', receiver_address, function (err, cb) {

                    //error callback   
                    if (!err) {

                        //device info is found for the corresponding wallet address
                        if (cb.length > 0) {

                            var device_id = cb[0].device_id;
                            var device_token = cb[0].device_token;
                            var desktop_token = cb[0].desktop_token;

                            //check if application is registered with the given device 
                            appModel.checkAppRegistration(app_key, device_token, function (err, cb) {

                                //error callback
                                if (!err) {

                                    if (cb[0].count > 0) {

                                        appModel.checkNotificationDetails(transaction_id, tag, function (err, cb) {

                                            //error callback
                                            if (!err) {

                                                if (cb[0].count > 0) {
                                                    var status = false;
                                                    var resp_code = '14';
                                                    var result = helper.createResponse(status, resp_code, "message");
                                                    res.send(result);

                                                } else {

                                                    //fetch current time    
                                                    var date = new Date();
                                                    var timestamp = date.getTime();

                                                    //create notification data for saving in db    
                                                    var transaction = {
                                                        receiver_address: receiver_address,
                                                        sender_address: sender_address,
                                                        tag: tag,
                                                        transaction_id: transaction_id,
                                                        created_on: timestamp
                                                    };

                                                    //create notification data for publishing  
                                                    var device_data = {
                                                        package_name: package_name,
                                                        data: data,
                                                        tag: tag,
                                                        receiver_address: receiver_address,
                                                        sender_address: sender_address
                                                    };

                                                    device_data = JSON.stringify(device_data);

                                                    //check if tag is valid
                                                    if (tag === 'secure_message') {

                                                        //insert notification data in db
                                                        appModel.insertNotificationDetails(transaction, function (err, result) {

                                                            if (err) {
                                                                debug('--- error in insertion ----\n');

                                                                var status = true;
                                                                var resp_code = '14';
                                                                var result = helper.createResponse(status, resp_code, "message");
                                                                res.send(result);
                                                            } else {

                                                                debug('--- insertion successfull in secure_mesage ----\n');
                                                                //insert publish topic(device_id) in array
                                                                array.push(device_id);

                                                                //send notification to the application
                                                                mqttClient.notification(array, device_data, transaction_id, function (err, cb) {

                                                                    var status = true;
                                                                    var resp_code = '7';
                                                                    var result = helper.createResponse(status, resp_code, "message");
                                                                    res.send(result);
                                                                });
                                                            }
                                                        });
                                                    } else if (tag === 'B2A_FileNotification') {

                                                        //insert notification data in db
                                                        appModel.insertNotificationDetails(transaction, function (err, result) {

                                                            //error callback    
                                                            if (err) {
                                                                debug('--- error in insertion ----\n');
                                                                var status = true;
                                                                var resp_code = '14';
                                                                var result = helper.createResponse(status, resp_code, "message");
                                                                res.send(result);
                                                            } else {

                                                                //insert publish topic(desktop_token) in array    
                                                                array.push(desktop_token);

                                                                //send notification to the application
                                                                mqttClient.notification(array, device_data, transaction_id, function (err, cb) {

                                                                    var status = true;
                                                                    var resp_code = '7';
                                                                    var result = helper.createResponse(status, resp_code, "message");
                                                                    res.send(result);
                                                                });
                                                            }
                                                        });
                                                    } else if (tag === 'A2A_FileNotification') {

                                                        //insert notification data in db
                                                        appModel.insertNotificationDetails(transaction, function (err, result) {

                                                            if (err) {
                                                                debug('--- error in insertion ----\n');
                                                                var status = true;
                                                                var resp_code = '14';
                                                                var result = helper.createResponse(status, resp_code, "message");
                                                                res.send(result);
                                                            } else {

                                                                //insert publish topic(desktop_token,device_id) in array    
                                                                array.push(desktop_token);
                                                                array.push(device_id);

                                                                //send notification to the application
                                                                mqttClient.notification(array, device_data, transaction_id, function (err, cb) {

                                                                    var status = true;
                                                                    var resp_code = '7';
                                                                    var result = helper.createResponse(status, resp_code, "message");
                                                                    res.send(result);
                                                                });
                                                            }
                                                        });

                                                    } else {

                                                        var status = false;
                                                        var resp_code = '8';
                                                        var result = helper.createResponse(status, resp_code, "message");
                                                        res.send(result);
                                                    }
                                                }
                                            } else {
                                                var status = false;
                                                var resp_code = '17';
                                                var result = helper.createResponse(status, resp_code, "message");
                                                res.send(result);
                                            }
                                        });
                                    } else {
                                        var status = false;
                                        var resp_code = '13';
                                        var result = helper.createResponse(status, resp_code, "message");
                                        res.send(result);
                                    }
                                } else {
                                    var status = false;
                                    var resp_code = '17';
                                    var result = helper.createResponse(status, resp_code, "message");
                                    res.send(result);
                                }
                            });
                        } else {
                            var status = false;
                            var resp_code = '6';
                            var result = helper.createResponse(status, resp_code, "message");
                            res.send(result);
                        }
                    } else {
                        var status = false;
                        var resp_code = '17';
                        var result = helper.createResponse(status, resp_code, "message");
                        res.send(result);
                    }
                });

            } else {
                var status = false;
                var resp_code = '5';
                var result = helper.createResponse(status, resp_code, "message");
                res.send(result);
            }
        } else {
            var status = false;
            var resp_code = '17';
            var result = helper.createResponse(status, resp_code, "message");
            res.send(result);
        }
    });
};

/**
 * Send notification to all the devices on application update
 * @param {string} web_server_key
 * @param {string} tag
 * @param {string} app_icon
 * @param {string} app_name
 * @param {string} app_id
 * @param {string} package_name
 * @param {string} app_size
 * @param {string} updated_on
 * @returns {JSON string} message
 */
module.exports.playStoreAppUpdate = function(req,res) {
    
    //public address of the devices in which application is installed
    var public_address = req.body.public_address;
    
    //web server key of the play store app
    var web_server_key = req.body.web_server_key;
    var tag = req.body.tag;
    var app_icon = req.body.data.app_icon;
    var app_name = req.body.data.app_name;
    var app_id = req.body.data.app_id;
    var package_name = req.body.data.package_name;
    var app_size = req.body.data.app_size;
    var updated_on = req.body.data.updated_on;
    
    appModel.searchServerKey(web_server_key, function (err, cb) {

        //error callback
        if (!err) {

            if (cb.length > 0) {
                
                //fetch all the device id from the wallet address
                appModel.deviceId(public_address, function (err, cb) {
                
                if(!err) {
                    
                 var len = cb.length;
                 if (len > 0) {
                     
                    //initialize an empty array 
                     var device_array = [];
                     
                     //push all the device id in the array
                        for (var i = 0; i < len; i++) {
                            device_array.push(cb[i].device_id);
                        }
                        
                        var device_data = {
                            tag: tag,
                            data: {
                                app_icon: app_icon,
                                app_name: app_name,
                                app_id: app_id,
                                package_name: package_name,
                                app_size: app_size,
                                updated_on: updated_on
                            }
                        
                        };


                        device_data = JSON.stringify(device_data);
                       
                        //send notification to the application
                        mqttClient.notification(device_array, device_data, 'play store app update', function (result) {
                            debug('-----play store app update notification sent-----');
                            var status = true;
                            var resp_code = '7';
                            var result = helper.createResponse(status, resp_code, "message");
                            res.send(result);
                        });

                    } else {
                        var status = false;
                        var resp_code = '18';
                        var result = helper.createResponse(status, resp_code, "message");
                        res.send(result);
                        
                    }   
                } else {
                    var status = false;
                    var resp_code = '17';
                    var result = helper.createResponse(status, resp_code, "message");
                    res.send(result);
                }      
                });
            } else {
                var status = false;
                var resp_code = '5';
                var result = helper.createResponse(status, resp_code, "message");
                res.send(result);  
            }
        } else {
            var status = false;
            var resp_code = '17';
            var result = helper.createResponse(status, resp_code, "message");
            res.send(result);
        }
    });    
};