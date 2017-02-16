/*
    不直接从phone－list中传递参数。
    而是依赖service是singleton的特性，直接在phoneDetail下的controller中引用DeviceService服务。
    通过所传递的device.serial参数，查找到对应的设备详细参数信息。

    openstf的实现中，是在跳转到设备控制页面时，通过rest＋设备id获取设备的详细信息，进一步进行控制页面的初始化操作。


    一个controller，负责初始化以及监视设备对象。
    .controller('phone', ['$scope', function($scope){
        $scope.control;//设备控制对象
        $scope.device;//设备对象
    }])

    一个directive，负责将设备的屏幕数据渲染到canvas标签内。
*/
require('angular-route')
angular.module('phoneDetail', [
  'ngRoute',
  require('./screen').name,
  require('../debug').name,
  require('../control').name
])
.component('phoneDetail', require('./component.js'));
//.controller('phoneDetailController', require('./controller.js'))
//.directive('phoneDetail', require('./directive.js'))