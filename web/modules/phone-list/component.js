module.exports = (function(){
  return {
    templateUrl:'./modules/phone-list/template.html',
    controller: ['$scope', 'DeviceService','IdentityService', function PhoneListController($scope, DeviceService, IdentityService) {
      var self = this;
      this.tracker = DeviceService.trackAll($scope);

      function status(data){
        return data.usable ? '（可用）':'（不可用）';
      }

      this.tracker.on('add', function(data){
        console.log('有新的设备上线 ' + data.serial + status(data));
        $scope.$apply();
      })

      this.tracker.on('change', function(data){
        console.log('检测到设备状态变化 ' + data.serial + status(data));
        $scope.$apply();
      })

      this.tracker.on('remove', function(data){
        console.log('有新的设备离线 ' + data.serial + status(data));
        $scope.$apply();
       })

       
       this.onControl = function onControl(serial){
         var phones = self.tracker.devices;
         phones.forEach(function(phone){
           if(phone.serial === serial){
             IdentityService.device = phone;
             if(phone.usable === false){
               alert('offline');
             }
             else{
               alert('online');
             }
           }
         })
       }
    }]
  }
})()
