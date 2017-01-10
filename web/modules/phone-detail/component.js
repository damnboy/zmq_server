module.exports = (function(){
    return {
    template: 'TBD: Detail view for <span>{{$ctrl.phoneId}}</span>',
    controller: ['$scope', '$routeParams','DeviceService',
      function PhoneDetailController($scope, $routeParams, DeviceService) {
        this.phoneId = $routeParams.phoneId;
      }
    ]
  }
})()