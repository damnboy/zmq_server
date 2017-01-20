require('angular-route')
angular.module('deviceScreen', [
  'ngRoute'
])
.component('deviceScreen', {
    template: '<div style="text-align:center"><canvas></canvas></div>',
    bindings : {
      device : '<'
    },
    controller : ['$scope', '$element', '$attrs', '$routeParams',  
      function($scope, $element, $attrs, $routeParams){

          var min_scale = 0.36;
          var canvas = $element.find('canvas')[0];
          //按照当前浏览器的高度，初始化最佳canvas大小
          var raw_ratio = this.device.width/this.device.height;
          canvas.height = document.documentElement.clientHeight;
          canvas.width = canvas.height * raw_ratio;
        
          //var BLANK_IMG =
          //'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='
          var ws = new WebSocket(this.device.screenWs);
          ws.binaryType = 'blob'
          ws.onmessage = function(message) {
            try{
              console.log(message);

              var canvas = $element.find('canvas')[0];
              var ctx = canvas.getContext('2d');
              var blob = new Blob([message.data], {type: 'image/jpge'})
              var URL = window.URL || window.webkitURL
              var img = new Image()
              img.onload = function() {
                console.log(img.width, img.height)
                canvas.width = img.width
                canvas.height = img.height
                ctx.drawImage(img, 0, 0)
                img.onload = null
                img.src = BLANK_IMG
                img = null
                u = null
                blob = null
              }
              var u = URL.createObjectURL(blob)
              img.src = u
              console.log(u);
            }catch(e){

            }

          };
        

    }]
})
module.exports.name = 'deviceScreen'
    