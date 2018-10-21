var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var routes = require('./routes/index');
var helper = require('./common/helper');
var appModel = require('./models/appModel');
var mqttClient = require('./mqtt/mqttClient');
var socket = require('socket.io-client');
var debug = require('debug')('app');

app.use(bodyParser.json());

//handle cross origin
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type,Cache-Control");
    next();

});

//call the route function for handling the incoming POST/GET requests
routes.route(app);

//check for schema validation and return the error
app.use(function (err, req, res, next) {

    if (err.name === 'JsonSchemaValidation') {

        var str = err.validations.body[0].property;
        var str2 = err.validations.body[0].messages;
        var arr = str.split(".");
        var index = arr.length - 1;
        var error_msg = str2[0];
        var status = false;
        var error = {
            property: arr[index],
            message: error_msg
        };
        var result = helper.createResponse(status, error, "validation");
        res.send(result);

    }
    next();
});


var port = '80';
app.listen(port, function () {
    console.log('listening on http server ', port);

});

/**
 * listen for bitcoin transactions and send notifications to the bitvault
 * device according to the wallet address
 */

var io = socket.connect("https://testnet.blockexplorer.com/");

var eventToListenTo = 'tx';
var room = 'inv';

io.on('connect', function () {

    debug('client connected to the blockexplorer \n');

    // Join the room.
    io.emit('subscribe', room);
});

//listen for bitcoin transactions
io.on(eventToListenTo, function (data) {

    //fetch receiver information
    var receiver = data.vout[0];
    var array = [];
    for (var prop in receiver) {

        var receiver_address = prop;
        var bitcoins = receiver[prop];
    }

    //get device info from the wallet address
    appModel.getDeviceInfo('wallet_address', receiver_address, function (err, result) {

        if (result.length > 0) {
            //fetch sender information
            var sender = data.vout[1];

            for (var sender_prop in sender) {

                //fetch sender address
                var sender_address = sender_prop;
            }

            var pub_topic = result[0].device_id;

            var date = new Date();
            var timestamp = date.getTime();

            //fetch transaction id from the transaction
            var transaction_id = data.txid;

            //create notification data for saving in db  
            var transaction = {
                receiver_address: receiver_address,
                sender_address: sender_address,
                tag: 'bitcoin_transaction',
                transaction_id: transaction_id,
                created_on: timestamp
            };

            //create notification data for publishing      
            var device_data = {
                tag: 'bitcoin_transaction',
                receiver_address: receiver_address,
                bitcoins: bitcoins,
                sender_address: sender_address,

            };

            //insert publish topic (device_id) in array    
            array.push(pub_topic);

            device_data = JSON.stringify(device_data);
            
            //send notification to the application    
            mqttClient.notification(array, device_data, transaction_id, function (err, cb) {

                //insert the notifications in the db
                appModel.insertNotificationDetails(transaction, function (err, cb) {
                    debug('-----bitcoin vault notification inserted successfully----');
                });

            });
        }
    });
});


