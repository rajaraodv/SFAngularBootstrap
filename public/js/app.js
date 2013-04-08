/**
 * Describe Salesforce object to be used in the app. For example: Below AngularJS factory shows how to describe and
 * create an 'Contact' object. And then set its type, fields, where-clause etc.
 *
 *  PS: This module is injected into ListCtrl, EditCtrl etc. controllers to further consume the object.
 */
angular.module('Contact', []).factory('Contact', function (AngularForceObjectFactory) {
    var Contact = AngularForceObjectFactory({type: 'Contact', fields: ['FirstName', 'LastName', 'Title', 'Phone', 'Email', 'Id'], where: '', limit: 10});
    return Contact;
});

function HomeCtrl($scope, AngularForce, $location, $route) {
    $scope.authenticated = AngularForce.authenticated();
    if (!$scope.authenticated) {
        return $location.path('/login');
    }

    $scope.logout = function () {
        AngularForce.logout();
        $location.path('/login');
    }
}

function LoginCtrl($scope, AngularForce) {
    $scope.login = function () {
        AngularForce.login();
    }
}

function CallbackCtrl($scope, AngularForce, $location) {
    AngularForce.oauthCallback(document.location.href);
    $location.path('/contacts');
}

function ContactListCtrl($scope, AngularForce, $location, Contact) {
    $scope.authenticated = AngularForce.authenticated();
    if (!$scope.authenticated) {
        return $location.path('/login');
    }

    $scope.searchTerm = '';
    $scope.working = false;

    Contact.query(function (data) {
        $scope.contacts = data.records;
        $scope.$apply();//Required coz sfdc uses jquery.ajax
    }, function (data) {
        alert('Query Error');
    }, 'Select Id, FirstName, LastName, Title, Email, Phone, Account.Name From Contact Order By LastName Limit 20 ');

    $scope.isWorking = function () {
        return $scope.working;
    };

    $scope.doSearch = function (searchTerm) {
        Contact.search(function (data) {
            $scope.contacts = data;
            $scope.$apply();//Required coz sfdc uses jquery.ajax
        }, function (data) {
        }, 'Find {' + escape($scope.searchTerm) + '*} IN ALL FIELDS RETURNING CONTACT (Id, FirstName, LastName, Title, Email, Phone, Account.Name)');

    };

    $scope.doView = function (contactId) {
        console.log('doView');
        $location.path('/view/' + contactId);
    };

    $scope.doCreate = function () {
        $location.path('/new');
    }
}

function ContactCreateCtrl($scope, $location, Contact) {
    $scope.save = function () {
        Contact.save($scope.contact, function (contact) {
            var c = contact;
            $scope.$apply(function () {
                $location.path('/view/' + c.Id);
            });
        });
    }
}

function ContactViewCtrl($scope, AngularForce, $location, $routeParams, Contact) {

    AngularForce.login(function () {
        Contact.get({id: $routeParams.contactId}, function (contact) {
            self.original = contact;
            $scope.contact = new Contact(self.original);
            $scope.$apply();//Required coz sfdc uses jquery.ajax
        });
    });

}

function ContactDetailCtrl($scope, AngularForce, $location, $routeParams, Contact) {
    var self = this;

    if ($routeParams.contactId) {
        AngularForce.login(function () {
            Contact.get({id: $routeParams.contactId}, function (contact) {
                self.original = contact;
                $scope.contact = new Contact(self.original);
                $scope.$apply();//Required coz sfdc uses jquery.ajax
            });
        });
    } else {
        $scope.contact = new Contact();
        //$scope.$apply();
    }

    $scope.isClean = function () {
        return angular.equals(self.original, $scope.contact);
    }

    $scope.destroy = function () {
        self.original.destroy(
            function () {
                $scope.$apply(function () {
                    $location.path('/contacts');
                });
            },
            function () {
                console.log('delete error');
            }
        );
    };

    $scope.save = function () {
        if ($scope.contact.Id) {
            $scope.contact.update(function () {
                $scope.$apply(function () {
                    $location.path('/view/' + $scope.contact.Id);
                });

            });
        } else {
            Contact.save($scope.contact, function (contact) {
                var c = contact;
                $scope.$apply(function () {
                    $location.path('/view/' + c.id); //use lowercase id (instead of Id) coz the SFDC responds like that
                });
            });
        }
    };

    $scope.doCancel = function () {
        if ($scope.contact.Id) {
            $location.path('/view/' + $scope.contact.Id);
        } else {
            $location.path('/contacts');
        }
    }
}
