/**
 * This initializes AngularJS app. Place this file BEFORE app.js (where your actual app is located).
 */
var app = angular.module('AngularSFDemo', ['AngularForce', 'AngularForceObjectFactory', 'Contact']);
app.constant('SFConfig', getSFConfig());

/**
 * Configure all the AngularJS routes here.
 */
app.config(function ($routeProvider) {
    $routeProvider.
        when('/', {controller: HomeCtrl, templateUrl: 'partials/home.html'}).
        when('/login', {controller: LoginCtrl, templateUrl: 'partials/login.html'}).
        when('/callback', {controller: CallbackCtrl, templateUrl: 'partials/callback.html'}).
        when('/contacts', {controller: ContactListCtrl, templateUrl: 'partials/contact/list.html'}).
        when('/view/:contactId', {controller: ContactViewCtrl, templateUrl: 'partials/contact/view.html'}).
        when('/edit/:contactId', {controller: ContactDetailCtrl, templateUrl: 'partials/contact/edit.html'}).
        when('/new', {controller: ContactDetailCtrl, templateUrl: 'partials/contact/edit.html'}).
        otherwise({redirectTo: '/'});
});

/**
 * Please configure Salesforce consumerkey, proxyUrl etc in getSFConfig().
 *
 * SFConfig is a central configuration JS Object. It is used by angular-force.js and also your app to set and retrieve
 * various configuration or authentication related information.
 *
 * Note: Please configure SFConfig Salesforce consumerkey, proxyUrl etc in getSFConfig() below.
 *
 * @property SFConfig Salesforce Config object with the following properties.
 * @attribute {String} sfLoginURL       Salesforce login url
 * @attribute {String} consumerKey      Salesforce app's consumer key
 * @attribute {String} oAuthCallbackURL OAuth Callback URL. Note: If you are running on Heroku or elsewhere you need to set this.
 * @attribute {String} proxyUrl         URL to proxy cross-domain calls. Note: This nodejs app acts as a proxy server as well at <location>/proxy/
 * @attribute {String} client           ForcetkClient. Set by forcetk lib
 * @attribute {String} sessionId        Session Id. Set by forcetk lib
 * @attribute {String} apiVersion       REST Api version. Set by forcetk (Set this manually for visualforce)
 * @attribute {String} instanceUrl      Your Org. specific url. Set by forcetk.
 *
 * @returns SFConfig object depending on where (localhost v/s heroku v/s visualforce) the app is running.
 */
function getSFConfig() {
    var location = document.location;
    var href = location.href;
    if (href.indexOf('file:') >= 0) { //Phonegap
        return {};
    } else if (configFromEnv && configFromEnv.sessionId) { //VisualForce just sets sessionId (as that's all what is required)
        return {
            sessionId: configFromEnv.sessionId
        }
    } else {
        if (!configFromEnv || configFromEnv.client_id == "" || configFromEnv.client_id == "undefined"
            || configFromEnv.app_url == "" || configFromEnv.app_url == "undefined") {
            throw 'Environment variable client_id and/or app_url is missing. Please set them before you start the app';
        }
        return {
            sfLoginURL: 'https://login.salesforce.com/',
            consumerKey: configFromEnv.client_id,
            oAuthCallbackURL: removeTrailingSlash(configFromEnv.app_url) + '/#/callback',
            proxyUrl: removeTrailingSlash(configFromEnv.app_url) + '/proxy/'
        }
    }
}

//Helper
function removeTrailingSlash(url) {
    return url.replace(/\/$/, "");
}