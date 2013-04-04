
/**
 * Describe Salesforce object to be used in the app. For example: Below AngularJS factory shows how to describe and
 * create an 'Contact' object. And then set its type, fields, where-clause etc.
 *
 *  PS: This module is injected into ListCtrl, EditCtrl etc. controllers to further consume the object.
 */
angular.module('Contact', []).factory('Contact', function (AngularForceObjectFactory) {
    var Contact = AngularForceObjectFactory({type: 'Contact', fields: ['FirstName', 'LastName', 'Title','Phone','Email', 'Id'], where: ''});
    return Contact;
});

function HomeCtrl($scope, AngularForce) {
    $scope.login = function() {
        AngularForce.login(function() {
            alert('hello');
        })
    }
}

function CallbackCtrl($scope, AngularForce) {
    AngularForce.oauthCallback(document.location.href);
}

function ContactListCtrl($scope, AngularForce, Contact) {
    Contact.query(function (data) {
        $scope.contacts = data.records;
        $scope.$apply();//Required coz sfdc uses jquery.ajax
    });
}

function ContactCreateCtrl($scope, $location, Contact) {
    $scope.save = function () {
        Contact.save($scope.contact, function (contact) {
            var p = contact;
            $scope.$apply(function () {
                $location.path('/edit/' + p.id);
            });
        });
    }
}

function ContactEditCtrl($scope, AngularForce, $location, $routeParams, Contact) {
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
