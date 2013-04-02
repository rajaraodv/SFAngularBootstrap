/**
 * AngularForce Module helps with logging into Salesforce. It internally depends on Cordova(Phonegap apps) and
 * forcetk.ui(web apps) to do so.
 *
 * @param SFConfig An AngularJS object that is used to store forcetk.client.
 * If
 */
angular.module('AngularForce', []).
    service('AngularForce', function (SFConfig) {
        /**
         *  setCordovaLoginCred initializes forcetk client in Cordova/PhoneGap apps (not web apps).
         *  Usage: Import AngularForce module into your initial view and call AngularForce.setCordovaLoginCred
         *
         *  Note: This should be used when SalesForce *native-phonegap* plugin is used for logging in to SF
         */
        this.setCordovaLoginCred = function () {
            if (!cordova) throw 'Cordova/PhoneGap not found.';

            //Call getAuthCredentials to get the initial session credentials
            cordova.require("salesforce/plugin/oauth").getAuthCredentials(salesforceSessionRefreshed, getAuthCredentialsError);

            //register to receive notifications when autoRefreshOnForeground refreshes the sfdc session
            document.addEventListener("salesforceSessionRefresh", salesforceSessionRefreshed, false);
            function salesforceSessionRefreshed(creds) {
                // Depending on how we come into this method, `creds` may be callback data from the auth
                // plugin, or an event fired from the plugin.  The data is different between the two.
                var credsData = creds;
                if (creds.data)  // Event sets the `data` object with the auth data.
                    credsData = creds.data;

                SFConfig.client = new forcetk.Client(credsData.clientId, credsData.loginUrl);
                SFConfig.client.setSessionToken(credsData.accessToken, apiVersion, credsData.instanceUrl);
                SFConfig.client.setRefreshToken(credsData.refreshToken);
            }

            function getAuthCredentialsError(error) {
                logToConsole("getAuthCredentialsError: " + error);
            }
        };

        /**
         * Login using forcetk.ui (for non phonegap/cordova apps)
         * Usage: Import AngularForce and call AngularForce.login(callback)
         * @param callback A callback function (usually in the same controller that initiated login)
         */
        this.login = function (callback) {
            if (SFConfig.client) { //already loggedin
                return callback();
            }
            var ftkClientUI = new forcetk.ClientUI(SFConfig.sfLoginURL, SFConfig.consumerKey, SFConfig.oAuthCallbackURL,
                function forceOAuthUI_successHandler(forcetkClient) { // successCallback
                    console.log('OAuth success!');
                    SFConfig.client = forcetkClient;
                    SFConfig.client.serviceURL = forcetkClient.instanceUrl
                        + '/services/data/'
                        + forcetkClient.apiVersion;

                    return callback();
                });
            ftkClientUI.login();
        };
    });

/**
 * AngularForceObjectFactory creates & returns different kind of AngularForceObject class based on the params.
 * Usage: Import AngularForceObjectFactory and pass params.
 * Where params are:
 * @params  type    String  An SF object type like: 'Opportunity', 'Contact' etc
 * @param   fields  Array An array of fields
 * @param   where   A SOQL Where clause for the object like 'Where IsWon = TRUE'
 *
 * var MySFObject = AngularForceObjectFactory({params})
 *
 * Example:
 * var Opportunity = AngularForceObjectFactory({type: 'Opportunity', fields:
 *          ['Name', 'ExpectedRevenue', 'StageName', 'CloseDate', 'Id'], where: 'WHERE IsWon = TRUE'});
 */
angular.module('AngularForceObjectFactory', []).factory('AngularForceObjectFactory', function (SFConfig) {
    function AngularForceObjectFactory(params) {
        params = params || {};
        var type = params.type;
        var fields = params.fields;
        var where = params.where;

        /**
         * AngularForceObject acts like a super-class for actual SF Objects. It provides wrapper to forcetk ajax apis
         * like update, destroy, query, get etc.
         * @param props JSON representing a single SF Object
         *
         * Usage:
         * 1. First import AngularForceObjectFactory into your AngularJS main app-module.
         *
         * 2. Create an SF Object Class from the factory like this:
         *      var Opportunity = AngularForceObjectFactory({type: 'Opportunity', fields: ['Name', 'CloseDate', 'Id'], where: 'WHERE IsWon = TRUE'});
         *
         * 3. Create actual object by passing JSON from DB like this:
         *      var myOpp = new Opportunity({fields: {'Name': 'Big Opportunity', 'CloseDate': '2013-03-03', 'Id': '12312'});
         */
        function AngularForceObject(props) {
            angular.copy(props || {}, this);
            this._orig = props || {};
        }

        /************************************
         * CRUD operations
         ************************************/
        AngularForceObject.prototype.update = function (cb) {
            return AngularForceObject.update(this, cb);
        };

        AngularForceObject.prototype.destroy = function (cb) {
            return AngularForceObject.remove(this, cb);
        };

        AngularForceObject.query = function (successCB, failureCB) {
            var soql = 'SELECT ' + fields.join(',') + ' FROM ' + type + ' ' + where;
            return SFConfig.client.query(soql, successCB, failureCB);
        };

        AngularForceObject.get = function (params, successCB, failureCB) {
            return SFConfig.client.retrieve(type, params.id, fields.join(), function (data) {
                if (data && !angular.isArray(data)) {
                    return successCB(new AngularForceObject(data))
                }
                return successCB(data);
            }, failureCB);
        };

        AngularForceObject.save = function (obj, successCB, failureCB) {
            var data = AngularForceObject.getNewObjectData(obj);
            return SFConfig.client.create(type, data, function (data) {
                if (data && !angular.isArray(data)) {
                    return successCB(new AngularForceObject(data))
                }
                return successCB(data);
            }, failureCB);
        };

        AngularForceObject.update = function (obj, successCB, failureCB) {
            var data = AngularForceObject.getChangedData(obj);
            debugger;
            return SFConfig.client.update(type, obj.Id, data, function (data) {
                if (data && !angular.isArray(data)) {
                    return successCB(new AngularForceObject(data))
                }
                return successCB(data);
            }, failureCB);
        };

        AngularForceObject.remove = function (obj, successCB, failureCB) {
            return SFConfig.client.del(type, obj.Id, successCB, failureCB);
        };

        /************************************
         * HELPERS
         ************************************/
        AngularForceObject.getChangedData = function (obj) {
            var diff = {};
            var orig = obj._orig;
            if (!orig)  return {};
            angular.forEach(fields, function (field) {
                if (field != 'Id' && obj[field] !== orig[field]) diff[field] = obj[field];
            });
            return diff;
        };

        AngularForceObject.getNewObjectData = function (obj) {
            var newObj = {};
            angular.forEach(fields, function (field) {
                if (field != 'Id') {
                    newObj[field] = obj[field];
                }
            });
            return newObj;
        };

        return AngularForceObject;
    }
    return AngularForceObjectFactory;
});



/*angular.module('Opportunity', []).factory('Opportunity', function (SFObject) {
    return SFObject({type: 'Opportunity', fields: ['Name', 'ExpectedRevenue', 'StageName', 'CloseDate', 'Id'], where: 'WHERE IsWon = TRUE'});
});

angular.module('SFObject', []).factory('SFObject', function ($resource, $http, $rootScope, SFConfig) {
    function SFObjectFactory(params) {
        params = params || {};
        var type = params.type;
        var fields = params.fields;
        var where = params.where;


        function SFObject(value) {
            angular.copy(value || {}, this);
            this._orig = value || {};
        }

        SFObject.prototype.update = function (cb) {
            return SFObject.update(this, cb);
        };

        SFObject.prototype.destroy = function (cb) {
            return SFObject.remove(this, cb);
        };

        SFObject.getChangedData = function (obj) {
            var diff = {};
            var orig = obj._orig;
            if (!orig)  return {};
            angular.forEach(fields, function (field) {
                if (field != 'Id' && obj[field] !== orig[field]) diff[field] = obj[field];
            });
            return diff;
        };

        SFObject.getNewObjectData = function (obj) {
            var newObj = {};
            angular.forEach(fields, function (field) {
                if (field != 'Id') {
                    newObj[field] = obj[field];
                }
            });
            return newObj;
        };

        SFObject.query = function (successCB, failureCB) {
            var soql = 'SELECT ' + fields.join(',') + ' FROM ' + type + ' ' + where;

            return SFConfig.client.query(soql, successCB, failureCB);
        };

        SFObject.get = function (params, successCB, failureCB) {
            return SFConfig.client.retrieve(type, params.id, fields.join(), function (data) {
                if (data && !angular.isArray(data)) {
                    return successCB(new SFObject(data))
                }
                return successCB(data);
            }, failureCB);
        };

        SFObject.save = function (obj, successCB, failureCB) {
            var data = SFObject.getNewObjectData(obj);
            return SFConfig.client.create(type, data, function (data) {
                if (data && !angular.isArray(data)) {
                    return successCB(new SFObject(data))
                }
                return successCB(data);
            }, failureCB);
        };

        SFObject.update = function (obj, successCB, failureCB) {
            var data = SFObject.getChangedData(obj);
            debugger;
            return SFConfig.client.update(type, obj.Id, data, function (data) {
                if (data && !angular.isArray(data)) {
                    return successCB(new SFObject(data))
                }
                return successCB(data);
            }, failureCB);
        };

        SFObject.remove = function (obj, successCB, failureCB) {
            return SFConfig.client.del(type, obj.Id, successCB, failureCB);
        };

        return SFObject;
    }

    return SFObjectFactory;
});

angular.module('SFDC', []).
    service('SFDC', function ($resource, $http, $rootScope, SFConfig) {

        this.login = function (callback) {
            if (SFConfig.client) { //already loggedin
                return callback();
            }
            var ftkClientUI = new forcetk.ClientUI(SFConfig.sfLoginURL, SFConfig.consumerKey, SFConfig.oAuthCallbackURL,
                function forceOAuthUI_successHandler(forcetkClient) { // successCallback
                    console.log('OAuth success!');
                    SFConfig.client = forcetkClient;
                    SFConfig.client.serviceURL = forcetkClient.instanceUrl
                        + '/services/data/'
                        + forcetkClient.apiVersion;

                    callback();
                });
            ftkClientUI.login();
        };
    });
    */