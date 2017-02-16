module.exports = (function(){
    return {
    templateUrl:'./modules/phone-detail/template.html',
    //template: 'TBD: Detail view for <span>{{$ctrl.device.serial}}</span><br/><debug-canvas></debug-canvas>',
    controller: ['$scope', '$routeParams','DeviceService','IdentityService','ControlService',
      function PhoneDetailController($scope, $routeParams, DeviceService, IdentityService, ControlService) {
        /*
        this.device = {
          serial : $routeParams.phoneId,
          screenWs : 'ws://127.0.0.1:8300',
          width : 720,
          height : 1080
        }
        */
        this.control = ControlService.create(IdentityService.device, IdentityService.device.serial)
        this.device = IdentityService.device
        this.onOpenScreenStream = function(){
          this.control.screenStreamOpen()
        }

        this.onCloseScreenStream = function(){
          this.control.screenStreamClose()
        }
      }
    ]
  }
})()