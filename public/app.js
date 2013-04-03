var app = angular.module('project', ['AngularForce', 'AngularForceObjectFactory', 'Contact']);

//Set SFConfig
app.constant('SFConfig', getSFConfig());

//Set AngularJS Routes
app.config(function ($routeProvider) {
    //Config Angular Routes
    $routeProvider.
        when('/', {controller: ListCtrl, templateUrl: 'list.html'}).
        when('/edit/:contactId', {controller: EditCtrl, templateUrl: 'detail.html'}).
        when('/new', {controller: CreateCtrl, templateUrl: 'detail.html'}).
        otherwise({redirectTo: '/'});
});

/**
 * Returns SFConfig object depending on where (localhost v/s heroku v/s visualforce) the app is running.
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
function getSFConfig() {
    var location = document.location.origin;
    var proxyUrl = location + '/proxy/';

    if (location.indexOf('localhost') >= 0) {
        return {
            'sfLoginURL': 'https://login.salesforce.com/',
            'consumerKey': '3MVG9A2kN3Bn17huxQ_nFw2X9UgjpxsCn.CZgify3keA9sgl.VASp6A5HxfUFUtKH9IN7sgBH4ow7aS1WLYaa',
            'oAuthCallbackURL': 'http://localhost:3000/oauthcallback.html',
            'proxyUrl': proxyUrl,
            'client': null //Forcetk client. Set after login
        }
    } else if (location.indexOf('herokuapp.com') >= 0) { //running on heroku
        if (location.indexOf('mysterious-beach-6478.herokuapp.com') == -1) {
            throw 'Please configure YOUR Heroku app\'s consumerKey, oAuthCallbackURL in getSFConfig function';
        }
        //Note: If you are running on Heroku or elsewhere, please change the below config to match your app.
        return {
            'sfLoginURL': 'https://login.salesforce.com/',
            'consumerKey': '3MVG9A2kN3Bn17huxQ_nFw2X9Ur2FK9lemhq7IntIqIla7wP93hi9qjsy_rvX.b4T1eBt0k9eFQLxQu.KsrG5',
            'oAuthCallbackURL': 'https://mysterious-beach-6478.herokuapp.com/oauthcallback.html',
            'proxyUrl': proxyUrl,
            'client': null  //Forcetk client. Set after login
        }
    } else if (location.indexOf('file:') >= 0) { //Phonegap or visualforce
        return {};
    } else {
        throw  'You are not running on localhost or heroku. Please configure SFConfig';
    }
}


/**
 * Describe Salesforce object to be used in the app. For example: Below AngularJS factory shows how to describe and
 * create an 'Contact' object. And then set its type, fields, where-clause etc.
 *
 *  PS: This module is injected into ListCtrl, EditCtrl etc. controllers to further consume the object.
 */
angular.module('Contact', []).factory('Contact', function (AngularForceObjectFactory) {
    var Contact = AngularForceObjectFactory({type: 'Contact', fields: ['FirstName', 'LastName', 'Title', 'Phone', 'Email', 'Id'], where: ''});
    return Contact;
});

function ListCtrl($scope, AngularForce, Contact, SFConfig) {
    $scope.login = function () {
        AngularForce.login(function () {
            $scope.query();
        });
    };

    $scope.query = function () {
        Contact.query(function (data) {
            $scope.contacts = data.records;
            $scope.$apply();//Required coz sfdc uses jquery.ajax
        });
    };

    //Already logged in, probably coming back from details or new page so automatically re-query and show the list
    if (SFConfig.client) {
        $scope.query();
    }
}

function CreateCtrl($scope, $location, Contact) {
    $scope.save = function () {
        Contact.save($scope.contact, function (contact) {
            var p = contact;
            $scope.$apply(function () {
                $location.path('/edit/' + p.id);
            });
        });
    }
}

function EditCtrl($scope, AngularForce, $location, $routeParams, Contact) {
    var self = this;

    AngularForce.login(function () {
        Contact.get({id: $routeParams.contactId}, function (contact) {
            self.original = contact;
            $scope.contact = new Contact(self.original);
            $scope.$apply();//Required coz sfdc uses jquery.ajax
        });
    });

    $scope.isClean = function () {
        return angular.equals(self.original, $scope.contact);
    };

    $scope.destroy = function () {
        self.original.destroy(function () {
            $scope.$apply(function () {
                $location.path('/list');
            });
        });
    };

    $scope.save = function () {
        $scope.contact.update(function () {
            $scope.$apply(function () {
                $location.path('/');
            });

        });
    };
}
