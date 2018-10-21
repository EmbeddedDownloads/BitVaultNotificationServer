var appController = require('../controllers/appController');
var helper = require('../common/helper');
var app_version = helper.app_version;
var validate = require('express-jsonschema').validate;

module.exports.route = function(app){
  app.post('/'+app_version+'/register-project',validate({body: helper.project}),appController.registerProject);
  app.post('/'+app_version+'/send-notification',validate({body: helper.notification}),appController.sendNotification); 
  app.post('/'+app_version+'/play-store-app-update',validate({body: helper.appStoreUpdate},[helper.appStoreData]),appController.playStoreAppUpdate);
      
};
