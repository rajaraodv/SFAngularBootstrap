/**
 * Describe Salesforce object to be used in the app. For example: Below AngularJS factory shows how to describe and
 * create an 'Contact' object. And then set its type, fields, where-clause etc.
 *
 *  PS: This module is injected into ListCtrl, EditCtrl etc. controllers to further consume the object.
 */
angular.module('Contact', []).factory('Contact', function (AngularForceObjectFactory) {

    var objDesc = {
        type: 'User',
        fields: ['Name', 'Id', 'SmallPhotoUrl', 'Email', 'Phone', 'Title'],
        //where: "Email='dcarroll@salesforce.com'",
        where: '',
        limit: 1,
        soslFields: 'Email Fields'
    };
    var Contact = AngularForceObjectFactory(objDesc);

    return Contact;
});

angular.module('DirectReports', []).factory('DirectReports', function (AngularForceObjectFactory) {

    var objDesc = {
        type: 'User',
        fields: ['Name', 'Id', 'Title', 'Email', 'Phone'],
        where: "ManagerId=''",
        orderBy: 'LastName',
        limit: 25
    };
    var DirectReports = AngularForceObjectFactory(objDesc);

    return DirectReports;
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
    };

    //If in visualforce, directly login
    if (AngularForce.inVisualforce) {
        AngularForce.login();
    }
}

function CallbackCtrl($scope, AngularForce, $location) {
    AngularForce.oauthCallback(document.location.href);
    $location.path('/contacts');
}

function ContactListCtrl($scope, AngularForce, $location, Contact, DirectReports) {
    $scope.authenticated = AngularForce.authenticated();
    if (!$scope.authenticated) {
        return $location.path('/login');
    }

    $scope.searchTerm = 'dcarroll@salesforce.com';


    $scope.findContactWithManagerId = function (contactList) {
        if(contactList.length == 1){
            return contactList[0];
        }
        for (var i = 0; i < contactList.length; i++) {
            if (contactList[i].ManagerId) {
                return contactList[i];
            }
        }
        return;
    };

    $scope.hasManager = function() {
        return $scope.contact && $scope.contact.ManagerId;
    }

    $scope.getImgUrl = function (contact) {
        return contact && contact.SmallPhotoUrl + "?oauth_token=" + $scope.sessionId;
    };

    $scope.directReports = [];

    $scope.hasDirectReports = function () {
        return $scope.directReports.length > 0;
    };

    $scope.getDirectReports = function () {
        var soql = "SELECT Name,SmallPhotoUrl,Title,ManagerId,Email from User where ManagerId='" + $scope.contact.Id + "'";
        DirectReports.queryWithCustomSOQL(soql, function (data) {
            $scope.sessionId = AngularForce.sessionId;


            $scope.directReports = data.records;
            $scope.$apply();//Required coz sfdc uses jquery.ajax
        }, function (data) {
            alert('Query Error');
        });
    };

    $scope.getCurrentContactManager = function () {
        if(!$scope.contact.ManagerId) {  //CEO
            $scope.manager = null;
            return;
        }
        var soql = "SELECT Name,SmallPhotoUrl,Title,ManagerId,Email from User where Id='" + $scope.contact.ManagerId + "'";
        DirectReports.queryWithCustomSOQL(soql, function (data) {
            $scope.sessionId = AngularForce.sessionId;

            $scope.manager = data.records[0];
            $scope.$apply();//Required coz sfdc uses jquery.ajax
        }, function (data) {
            alert('Query Error');
        });
    };

    $scope.doSearch = function () {
        var soql = "SELECT Name, SmallPhotoUrl, Title, Id, ManagerId,Email from User where Email='" + $scope.searchTerm + "'";

        Contact.queryWithCustomSOQL(soql, function (data) {
            $scope.sessionId = AngularForce.sessionId;


            $scope.contact = $scope.findContactWithManagerId(data.records);
            $scope.$apply();//Required coz sfdc uses jquery.ajax

            $scope.getCurrentContactManager();
            $scope.getDirectReports();
        }, function (data) {
            alert('Query Error');
        });
    };

    $scope.newSearch = function (contact) {
        $scope.searchTerm = contact.Email;
        $scope.doSearch();
    };

    $scope.doView = function (contactId) {
        console.log('doView');
        $location.path('/view/' + contactId);
    };

    $scope.doCreate = function () {
        $location.path('/new');
    };
    $scope.doSearch();

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
    };

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
                    $location.path('/view/' + c.Id || c.id);
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
