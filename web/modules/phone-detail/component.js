module.exports = (function(){
    return {
    templateUrl:'./modules/phone-detail/template.html',
    //template: 'TBD: Detail view for <span>{{$ctrl.device.serial}}</span><br/><debug-canvas></debug-canvas>',
    controller: ['$scope', '$routeParams','DeviceService','IdentityService','socket',
      function PhoneDetailController($scope, $routeParams, DeviceService, IdentityService, socket) {
        /*
        this.device = {
          serial : $routeParams.phoneId,
          screenWs : 'ws://127.0.0.1:8300',
          width : 720,
          height : 1080
        }
        */
        this.device = IdentityService.device
        this.onOpenScreenStream = function(){
          socket.emit('screen.stream.open', this.device.serial, {})
        }

        this.onCloseScreenStream = function(){
          socket.emit('screen.stream.close', this.device.serial, {})
          
        }
      }
    ]
  }
})()