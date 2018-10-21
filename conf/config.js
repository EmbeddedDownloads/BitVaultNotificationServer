var mysql = require('mysql');
var mqtt = require('mqtt');

module.exports.dbConnection = function () {
    var connection = mysql.createConnection({
        host: 'notificationserver.cu9swvx2odaj.us-west-2.rds.amazonaws.com',
        user: 'root',
        password: 'bitvault123',
        database: 'notification_server',
        debug: false
    });
    return connection;
};

module.exports.mqttConnection = function () {
    var client = mqtt.connect({
        host: 'localhost',
        port: 1883
    });
    return client;
};
