/**
 * Return the error message for the corresponding error code
 * @param {string} error_code
 * @returns {string} response
 * 
 */

module.exports.getResponse = function (error_code) {
    switch (error_code) {
        case "1" :
            var response = "This project is already registered.";
            return response;
            break;
        case "2" :
            var response = "Application succesfully registered on the notfication server";
            return response;
            break;
        case "3" :
            var response = "Device already registered.";
            return response;
            break;
        case "4" :
            var response = "Application is already registered with the device.";
            return response;
            break;
        case "5" :
            var response = "Application is not registered on the notification server.";
            return response;
            break;
        case "6" :
            var response = "Wallet address not found";
            return response;
            break;
        case "7" :
            var response = "Notification sent sucessfully";
            return response;
            break;
        case "8" :
            var response = "Please send a valid Tag";
            return response;
            break;
        case "9" :
            var response = "Unique key violation for application key or server key.";
            return response;
            break;
        case "10" :
            var response = "Unique key violation for wallet address.";
            return response;
            break;
        case "11" :
            var response = "Device not found.";
            return response;
            break;
        case "12":
            var response = "Empty wallet address";
            return response;
            break;
        case "13":
            var response = "Application is not registered with this device on the notification server.";
            return response;
            break;
        case "14":
            var response = "Notification already sent.";
            return response;
            break;
        case "15":
            var response = "Application key missing in the request.";
            return response;
            break;
        case "16":
            var response = "Application key length is zero.";
            return response;
            break;
        case "17":
            var response = "Request failed.Please try again.";
            return response;
            break;
        case "18":
            var response = "No devices found.";
            return response;
            break;




    }
};
