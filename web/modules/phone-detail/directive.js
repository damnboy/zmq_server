module.exports = function($window){
  return {
      restrict: 'E',
      scope: {
        device: '='
      },
      template: '<div style="text-align:center"><canvas></canvas></div>',
      link: function(scope, element, attrs){
        var min_scale = 0.36;
        var canvas = element.find('canvas')[0];
        //按照当前浏览器的高度，初始化最佳canvas大小
        var raw_ratio = 720/1080;
        canvas.height = document.documentElement.clientHeight;
        canvas.width = canvas.height * raw_ratio;
    
          var ws = new WebSocket('ws://127.0.0.1:12345');
          ws.binaryType = 'blob'
          ws.onmessage = function(message) {
             console.log(message);
             var canvas = element.find('canvas')[0];
             var ctx = canvas.getContext('2d');
             var blob = new Blob([message.data], {type: 'image/png'})
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
           };
      }
  };
}