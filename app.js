var app = angular.module('project', ['AngularForce', 'AngularForceObjectFactory', 'Opportunity']);
app.constant('SFConfig', {'sfLoginURL': 'https://login.salesforce.com/',
    'consumerKey': '3MVG9A2kN3Bn17huxQ_nFw2X9UgjpxsCn.CZgify3keA9sgl.VASp6A5HxfUFUtKH9IN7sgBH4ow7aS1WLYaa',
    'oAuthCallbackURL': 'http://localhost:3000',
    'proxyUrl': 'http://localhost:3000/proxy/'
});

app.config(function ($routeProvider) {
    $routeProvider.
        when('/', {controller: ListCtrl, templateUrl: 'list.html'}).
        when('/edit/:oppId', {controller: EditCtrl, templateUrl: 'detail.html'}).
        when('/new', {controller: CreateCtrl, templateUrl: 'detail.html'}).
        otherwise({redirectTo: '/'});
});

/**
 * Describe Salesforce object to be used in the app. For example: Below AngularJS factory shows how to describe and
 * create an 'Opportunity' object. And then set its type, fields, where-clause etc.
 *
 *  PS: This module is injected into ListCtrl, EditCtrl etc. controllers to further consume the object.
 */
angular.module('Opportunity', []).factory('Opportunity', function (AngularForceObjectFactory) {
    var Opportunity = AngularForceObjectFactory({type: 'Opportunity', fields: ['Name', 'ExpectedRevenue', 'StageName', 'CloseDate', 'Id'], where: 'WHERE IsWon = TRUE'});
    return Opportunity;
});

function ListCtrl($scope, AngularForce, Opportunity) {
    AngularForce.login(function () {
        Opportunity.query(function (data) {
            $scope.opportunities = data.records;
            $scope.$apply();//Required coz sfdc uses jquery.ajax
        });
    });
}


function CreateCtrl($scope, $location, Opportunity) {
    $scope.save = function () {
        Opportunity.save($scope.opp, function (opp) {
            var p = opp;
            $scope.$apply(function () {
                $location.path('/edit/' + p.id);
            });
        });
    }
}

function EditCtrl($scope, AngularForce, $location, $routeParams, Opportunity) {
    var self = this;

    AngularForce.login(function () {
        Opportunity.get({id: $routeParams.oppId}, function (opp) {
            self.original = opp;
            $scope.opp = new Opportunity(self.original);
            $scope.$apply();//Required coz sfdc uses jquery.ajax
        });
    });

    $scope.isClean = function () {
        return angular.equals(self.original, $scope.opp);
    };

    $scope.destroy = function () {
        self.original.destroy(function () {
            $scope.$apply(function () {
                $location.path('/list');
            });
        });
    };

    $scope.save = function () {
        $scope.opp.update(function () {
            $scope.$apply(function () {
                $location.path('/');
            });

        });
    };
}
