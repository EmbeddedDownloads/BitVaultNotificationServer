/* ***********************
 * Mqtt Client for nodejs
 **************************/

var helper = require('../common/helper');
var appModel = require('../models/appModel');
var config = require('../conf/config');
var debug = require('debug')('app');

//connect the mqtt client to the broker
var client = config.mqttConnection();

//listener on successfull mqtt connection
client.on('connect', function () {

    debug('mqtt client connected with the server \n');

    //subscribe the client on the topic
    var device_topic = helper.sub_topic + "+";
    client.subscribe(device_topic, {qos: 1}, function (err, granted) {
        debug("error in subscription -->", err);
        debug("topic subscribed", granted);
    });

});

//receive the message on a topic
client.on('message', function (topic, message) {

    //parse the incoming message
    var string_data = JSON.parse(message.toString());

    switch (topic) {
        case helper.sub_topic + 'device-register':
            deviceRegister(string_data);
            break;
        case helper.sub_topic + 'application-register':
            applicationRegister(string_data);
            break;
        case helper.sub_topic + 'desktop-register':
            desktopRegister(string_data);
            break;
    }

});

/**
 * This function is used to register device on notification server
 * @param {JSON object} device
 * @returns null
 * 
 */
function deviceRegister(device) {

    //check for device id property
    if (device.hasOwnProperty('device_id')) {

        var device_id = device.device_id;

        //check for device id length
        if (device_id.length > 0) {

            var pub_array = [];

            //create the publish topic   
            var pub_topic = device_id;
            pub_array.push(pub_topic);

            //check for wallet address length
            if (device.hasOwnProperty('wallet_addr')) {
                var wallet_address = device.wallet_addr;

                //check for wallet address length
                if (wallet_address.length > 0) {

                    //search if device is registered   
                    appModel.searchDevice(device_id, function (err, cb) {

                        //error callback    
                        if (!err) {
                            //check if device is already registered or not
                            if (cb[0].device_id === 0) {

                                var date = new Date();
                                var timestamp = date.getTime();
                                var master_arr = [];
                                var device_token = helper.uuid();
                                var desktop_token = helper.uuid();

                                for (var i = 0; i < wallet_address.length; i++) {
                                    var address = wallet_address[i];
                                    var device_data = [
                                        device_id,
                                        device_token,
                                        desktop_token,
                                        address,
                                        timestamp
                                    ];
                                    master_arr.push(device_data);
                                }

                                //register the device   
                                appModel.registerDevice(master_arr, function (err, cb) {

                                    //error callback    
                                    if (err) {
                                        var status = false;
                                        var resp_code = '10';
                                        var pub_data = helper.createResponse(status, resp_code, "error");

                                        //publish the data on the topic
                                        module.exports.notification(pub_array, pub_data, null, function (err, cb) {
                                            debug('----- duplicate wallet address in device registration ------ \n');
                                        });

                                    } else {
                                        var status = true;
                                        var data = {
                                            device_token: device_token
                                        };
                                        var pub_data = helper.createResponse(status, data, "data");

                                        //publish the data on the topic
                                        module.exports.notification(pub_array, pub_data, null, function (err, cb) {
                                            debug('-----device successfuly registered------\n');
                                        });

                                    }
                                });

                            } else {
                                var status = false;
                                var resp_code = "3";
                                var pub_data = helper.createResponse(status, resp_code, "message");

                                //publish the data on the topic
                                module.exports.notification(pub_array, pub_data, null, function (err, cb) {
                                    debug('-----device already registered ------\n');
                                });
                            }
                        } else {
                            var status = false;
                            var resp_code = '17';
                            var pub_data = helper.createResponse(status, resp_code, "message");

                            //publish the data on the topic
                            module.exports.notification(pub_array, pub_data, null, function (err, cb) {
                                debug('-----Request failed.Please try again. ------\n');
                            });
                        }
                    });
                } else {
                    var status = false;
                    var resp_code = '12';
                    var pub_data = helper.createResponse(status, resp_code, "message");

                    //publish the data on the topic
                    module.exports.notification(pub_array, pub_data, null, function (err, cb) {
                        debug('---- Empty wallet address in the request ------- \n ');
                    });

                }
            } else {
                var status = false;
                var resp_code = "6";
                var pub_data = helper.createResponse(status, resp_code, "message");

                //publish the data on the topic
                module.exports.notification(pub_array, pub_data, null, function (err, cb) {
                    debug('---- wallet address not found in the request-------\n  ');
                });

            }

        } else {
            debug('---- device id not length not valid in the request------- \n ');
        }
    } else {
        debug('---- device id property not found in the request-------\n  ');

    }
};

/**
 * This function is used to register application with device
 * on notification server
 * @param {JSON object} application
 * @returns null
 * 
 */
function applicationRegister(application) {

    if (application.hasOwnProperty('device_token')) {

        var device_token = application.device_token;

        if (device_token.length > 0) {

            //get device id from device table
            appModel.getDeviceInfo("device_token", device_token, function (err, cb) {
                //error callback    
                if (!err) {
                    if (cb.length > 0) {
                        var device_id = cb[0].device_id;

                        var pub_array = [];

                        //create the publish topic
                        var pub_topic = device_id;
                        pub_array.push(pub_topic);

                        if (application.hasOwnProperty('application_key')) {

                            var application_key = application.application_key;

                            if (application_key.length > 0) {

                                //check if application is registered on notification server
                                appModel.searchAppKey(application_key, function (err, cb) {

                                    //error callback
                                    if (!err) {
                                        if (cb[0].app_key === 1) {

                                            //check if application is already registered with the device     
                                            appModel.checkAppRegistration(application_key, device_token, function (err, cb) {

                                                //error callback
                                                if (!err) {

                                                    if (cb[0].count === 0) {

                                                        var applicaton_token = helper.uuid();
                                                        var insert_data = {
                                                            device_token_fk: device_token,
                                                            application_token: applicaton_token,
                                                            application_key_fk: application_key
                                                        };

                                                        //register the application on the notification server with the device   
                                                        appModel.registerApplication(insert_data, function (err, cb) {

                                                            //error callback    
                                                            if (!err) {

                                                                var status = true;
                                                                var data = {
                                                                    applicaton_token: applicaton_token
                                                                };

                                                                var pub_data = helper.createResponse(status, data, "data");

                                                                //publish the data to the application  
                                                                module.exports.notification(pub_array, pub_data, null, function (err, cb) {
                                                                    debug('------application registered successfully------\n ');
                                                                });

                                                            } else {
                                                                var status = false;
                                                                var resp_code = '17';
                                                                var pub_data = helper.createResponse(status, resp_code, "message");

                                                                //publish the data on the topic
                                                                module.exports.notification(pub_array, pub_data, null, function (err, cb) {
                                                                    debug('-----Request failed.Please try again. ------\n');
                                                                });
                                                            }
                                                        });

                                                    } else {
                                                        var status = false;
                                                        var resp_code = "4";
                                                        var pub_data = helper.createResponse(status, resp_code, "message");

                                                        //publish the data on the topic
                                                        module.exports.notification(pub_array, pub_data, null, function (err, cb) {
                                                            debug('------application already registered ------\n ');
                                                        });
                                                    }
                                                } else {

                                                    var status = false;
                                                    var resp_code = '17';
                                                    var pub_data = helper.createResponse(status, resp_code, "message");

                                                    //publish the data on the topic
                                                    module.exports.notification(pub_array, pub_data, null, function (err, cb) {
                                                        debug('-----Request failed.Please try again. ------\n');
                                                    });
                                                }
                                            });
                                        } else {

                                            var status = false;
                                            var resp_code = "5";
                                            var pub_data = helper.createResponse(status, resp_code, "message");

                                            //publish the data on the topic
                                            module.exports.notification(pub_array, pub_data, null, function (err, cb) {
                                                debug('------application not registered on notification server------\n ');
                                            });

                                        }
                                    } else {
                                        var status = false;
                                        var resp_code = '17';
                                        var pub_data = helper.createResponse(status, resp_code, "message");

                                        //publish the data on the topic
                                        module.exports.notification(pub_array, pub_data, null, function (err, cb) {
                                            debug('-----Request failed.Please try again. ------\n');
                                        });
                                    }
                                });
                            } else {
                                var status = false;
                                var resp_code = "16";
                                var pub_data = helper.createResponse(status, resp_code, "message");

                                //publish the data on the topic
                                module.exports.notification(pub_array, pub_data, null, function (err, cb) {
                                    debug('-----application key length is zero-----\n ');
                                });

                            }

                        } else {
                            var status = false;
                            var resp_code = "15";
                            var pub_data = helper.createResponse(status, resp_code, "message");

                            //publish the data on the topic
                            module.exports.notification(pub_array, pub_data, null, function (err, cb) {
                                debug('-----application key not found in the request------\n ');
                            });
                        }

                    } else {
                        debug('------device not found in db------\n ');
                    }
                } else {
                    var status = false;
                    var resp_code = '17';
                    var pub_data = helper.createResponse(status, resp_code, "message");

                    //publish the data on the topic
                    module.exports.notification(pub_array, pub_data, null, function (err, cb) {
                        debug('-----Request failed.Please try again. ------\n');
                    });
                }
            });

        } else {
            debug('-------device token length is zero-----\n ');
        }
    } else {
        debug('-------device token key not found in the request-------\n ');

    }
};

/**
 * This function is used to register desktop with the device
 * @param {JSON object} desktop
 * @returns null
 */

function desktopRegister(desktop) {
    var device_token = desktop.device_token;

    var pub_array = [];

    //create the publish topic
    var pub_topic = device_token;
    pub_array.push(pub_topic);

    //get device id from device table
    appModel.getDeviceInfo("device_token", device_token, function (err, cb) {

        //error callback
        if (!err) {

            if (cb.length > 0) {
                var desktop_token = cb[0].desktop_token;

                var status = true;
                var data = {
                    desktop_token: desktop_token
                };

                var pub_data = helper.createResponse(status, data, "data");

                //publish the data to the application
                module.exports.notification(pub_array, pub_data, null, function (err, cb) {
                    debug('------desktop registered------\n ');
                });

            } else {
                var status = false;
                var resp_code = '11';
                var pub_data = helper.createResponse(status, resp_code, "message");

                //publish the data on the topic
                module.exports.notification(pub_array, pub_data, null, function (err, cb) {
                    debug('------device not found in db------\n ');
                });
            }
        } else {
            var status = false;
            var resp_code = '17';
            var pub_data = helper.createResponse(status, resp_code, "message");

            //publish the data on the topic
            module.exports.notification(pub_array, pub_data, null, function (err, cb) {
                debug('-----Request failed.Please try again. ------\n');
            });
        }
    });


};


/**
 * Send notification to the device/desktop for request coming from PBC.
 * @param {string} device_id
 * @param {JSON object} data
 * @returns {undefined}
 */
module.exports.notification = function (array, pub_data, transaction_id, callback) {

    array.forEach(function (item, index) {
        var pub_topic = item;

        client.publish(pub_topic, pub_data, {qos: 1}, function (err, response) {
            if (err) {
                debug('errr --- ' + err);
                debug('pub_data --- ' + pub_data);
                debug('transaction-id --- ' + transaction_id);
            }

        });
        debug('---publish data --- ' + pub_data);
        debug('transaction id ----- ' + transaction_id);
    });

    callback();
};
