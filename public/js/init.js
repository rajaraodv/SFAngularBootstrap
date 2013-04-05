/**
 * Please configure Salesforce Connected app's info below.
 */
var consumerKey = null; //Enter your app's consumer key aka client_id
var oAuthCallbackURL = null; // Enter your app's oauth_callback url
var proxyUrl = null; //Enter your proxy url. Must be with <YourAppUrl>/proxy/


/**
 * This configures and initializes AngularJS app. Place this file BEFORE app.js (where your actual app is located).
 */
var app = angular.module('AngularSFDemo', ['AngularForce', 'AngularForceObjectFactory', 'Contact']);


/**
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

 * @returns SFConfig object
 */
app.constant('SFConfig', getSFConfig());

/**
 * Please configure Salesforce consumerkey, proxyUrl etc in getSFConfig().
 *
 * @returns SFConfig object depending on where (localhost v/s heroku v/s visualforce) the app is running.
 */
function getSFConfig() {
    var location = document.location;
    var href = location.href;
    if (href.indexOf('localhost') >= 0) { //default
        return {
            'sfLoginURL': 'https://login.salesforce.com/',
            'consumerKey': consumerKey || '3MVG9A2kN3Bn17huxQ_nFw2X9UgjpxsCn.CZgify3keA9sgl.VASp6A5HxfUFUtKH9IN7sgBH4ow7aS1WLYaa',
            'oAuthCallbackURL': oAuthCallbackURL || 'http://localhost:3000//#/callback',
            'proxyUrl': proxyUrl || 'http://localhost:3000/proxy/'
        }
    } else if (href.indexOf('herokuapp.com') >= 0) { //demo app on heroku
        return {
            'sfLoginURL': 'https://login.salesforce.com/',
            'consumerKey': consumerKey || '3MVG9A2kN3Bn17huxQ_nFw2X9Ur2FK9lemhq7IntIqIla7wP93hi9qjsy_rvX.b4T1eBt0k9eFQLxQu.KsrG5',
            'oAuthCallbackURL': oAuthCallbackURL || 'https://mysterious-beach-6478.herokuapp.com/#/callback',
            'proxyUrl': proxyUrl || 'https://mysterious-beach-6478.herokuapp.com/proxy/'
        }
    } else if (href.indexOf('file:') >= 0) { //Phonegap or visualforce
        return {};
    } else {
        throw  'You are not running on localhost or heroku. Please configure SFConfig in init.js';
    }
}