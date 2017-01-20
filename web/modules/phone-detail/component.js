module.exports = (function(){
    return {
    template: 'TBD: Detail view for <span>{{$ctrl.device.serial}}</span><br/><device-screen device="$ctrl.device"><device-screen>',
    //template: 'TBD: Detail view for <span>{{$ctrl.device.serial}}</span><br/><debug-canvas></debug-canvas>',
    controller: ['$scope', '$routeParams','DeviceService',
      function PhoneDetailController($scope, $routeParams, DeviceService) {
        this.device = {
          serial : $routeParams.phoneId,
          screenWs : 'ws://127.0.0.1:8300',
          width : 720,
          height : 1080
        }
        
      }
    ]
  }
})()