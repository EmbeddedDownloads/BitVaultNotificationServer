var language = require('./language');
var uuid = require('uuid');

module.exports.uuid = function () {
    return uuid.v4();
};

module.exports.app_version = 'v1';

module.exports.sub_topic = 'bitvault/';

//module.exports.pub_topic = 'device/';

/**
 * Stringify the object
 * @param {boolean} status
 * @param {JSON object || string} data
 * @returns {JSON string} response
 */
sendResult = function (status, data, type) {

    if (type === "message") {
        var response = {
            status: status,
            message: data
        };

    } else if (type === "error") {
        var response = {
            status: status,
            error: data
        };
    } else if (type === "data") {
        var response = {
            status: status,
            data: data
        };

    } else if (type === "validation") {
        var response = {
            status: status,
            error:
                    {
                        property: data.property,
                        message: data.message
                    }

        };
    }
    var result = JSON.stringify(response);
    return result;
};

module.exports.createResponse = function (status, resp_code, type) {
    if (typeof resp_code === "string") {
        var message = language.getResponse(resp_code);
        var result = sendResult(status, message, type);
    } else {
        var result = sendResult(status, resp_code, type);
    }
    return result;
};

module.exports.project = {
    type: "object",
    properties: {
        web_server_key: {
            type: "string",
            required: true,
            minLength: 1
        },
        application_key: {
            type: "string",
            required: true,
            minLength: 1
        },
        package_name: {
            type: "string",
            required: true,
            minLength: 1
        },
        description: {
            type: "string",
            required: true,
            minLength: 1
        }

    }
};

module.exports.notification = {

    type: "object",
    properties: {
        web_server_key: {
            type: "string",
            required: true,
            minLength: 1
        },
        receiver_address: {
            type: "string",
            required: true,
            minLength: 1
        },
        sender_address: {
            type: "string",
            required: true,
            minLength: 1
        },
        tag: {
            type: "string",
            required: true,
            minLength: 1
        },
        data: {
            type: "string",
            required: true,
            minLength: 1
        },
        transaction_id: {
            type: "string",
            required: true,
            minLength: 1
        }

    }
};


module.exports.appStoreUpdate = {
    type: "object",
    properties: {
        public_address : {
            type: "array",
            required: true,
            minLength: 1
        },
        web_server_key: {
            type: "string",
            required: true,
            minLength: 1
        },
        tag: {
            type: "string",
            required: true,
            minLength: 1
        },
        data : {
            "$ref": "/appStoreData"
        }
    }
};

module.exports.appStoreData = {

        id: "/appStoreData",
            type: "object",
        properties: {
            app_icon: {
                type: "string",
            required: true,
            minLength: 1
        },
        app_name: {
            type: "string",
            required: true,
            minLength: 1
        },
        app_id: {
            type: "string",
            required: true,
            minLength: 1
        },
        package_name: {
            type: "string",
            required: true,
            minLength: 1
        },
        app_size: {
            type: "string",
            required: true,
            minLength: 1
        },
        updated_on: {
            type: "string",
            required: true,
            minLength: 1
        }
        }
};











