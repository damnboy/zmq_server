// Define the `phonecatApp` module
require('angular')
require('angular-route')
require('phone-list')
require('device')
require('socket')
require('phone-detail')
var phonecatApp = angular
.module('phonecatApp', [
  'ngRoute'
  ,'phoneDetail'
  ,'phoneList'
  ,'stf.socket'
  ,'stf/device'
])
.config(['$locationProvider', '$routeProvider',
    function config($locationProvider, $routeProvider) {
      $locationProvider.hashPrefix('!');

      $routeProvider.
        when('/phones', {
          template: '<phone-list></phone-list>'
        }).
        when('/phones/:phoneId', {
          template: '<phone-detail></phone-detail>'
        }).
        otherwise('/phones');
    }
  ]);
