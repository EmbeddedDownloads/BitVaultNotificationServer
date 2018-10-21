var mosca = require('mosca');
var debug = require('debug')('app');


var settings = {
    port: 1883,
    persistence: {
        factory: mosca.persistence.Mongo,
        url: 'mongodb://localhost:27017/mqtt',
        ttl: {
            //set offline packets expiry time to 1 day
            packets: 24 * 60 * 60 * 1000

        }
    }

};

//here we start mosca
var server = new mosca.Server(settings);
server.on('ready', setup);

// fired when the mqtt server is ready
function setup() {
    console.log('Mosca server is up and running');
}

// fired when a client is connected
server.on('clientConnected', function (client) {
    debug('client connected', client.id);
    debug('session ', client.clean);
});

// fired when a message is published
server.on('published', function (packet, client) {
    debug('Published : ', packet);

});

// fired when a client subscribes to a topic
server.on('subscribed', function (topic, client) {
    console.log('subscribed : ', topic);

});

// fired when a client unsubscribes to a topic
server.on('unsubscribed', function (topic, client) {
    console.log('unsubscribed : ', topic);
});

// fired when a client is disconnecting
server.on('clientDisconnecting', function (client) {
    debug('clientDisconnecting : ', client.id);
});

// fired when a client is disconnected
server.on('clientDisconnected', function (client) {
    debug('clientDisconnected : ', client.id);
});

