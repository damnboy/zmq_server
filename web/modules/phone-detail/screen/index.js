require('angular-route')
require('./scaling')
angular.module('deviceScreen', [
  'ngRoute'
  ,'stf/scaling'
])
.component('deviceScreen', {
    template: '<div style="text-align:center"><canvas></canvas></div>',
    bindings : {
      device : '<'
      ,control : '<'
    },
    controller : ['$scope', '$element', '$attrs', '$routeParams', '$document','ScalingService',
      function($scope, $element, $attrs, $routeParams, $document, ScalingService){

        var device = this.device;
        var control = this.control;

        var scaler = ScalingService.coordinator(
          device.display.width
          , device.display.height
          )  

          var min_scale = 0.36;
          var canvas = $element.find('canvas')[0];
          //按照当前浏览器的高度，初始化最佳canvas大小
          var raw_ratio = device.display.width/device.display.height;
          canvas.height = document.documentElement.clientHeight;
          canvas.width = canvas.height * raw_ratio;
        
          var BLANK_IMG =
          'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='
          var ws = new WebSocket(device.display.url);
          ws.binaryType = 'blob'
          ws.onmessage = function(message) {
            try{
              console.log(message.data.size);
              var canvas = $element.find('canvas')[0];
              var ctx = canvas.getContext('2d');
              var blob = new Blob([message.data], {type: 'image/jpge'})
              var URL = window.URL || window.webkitURL
              var img = new Image()
              img.onload = function() {
                //console.log(img.width, img.height)
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

      (function(){
        var seq = -1
        var cycle = 100

        function nextSeq() {
          return ++seq >= cycle ? (seq = 0) : seq
        }

        function calculateBounds(el) {
          //var el = element[0]
          var screen = {
            rotation: 0
          , bounds: {
              x: 0
            , y: 0
            , w: 0
            , h: 0
            }
          }
          screen.bounds.w = el.offsetWidth
          screen.bounds.h = el.offsetHeight
          screen.bounds.x = 0
          screen.bounds.y = 0

          while (el.offsetParent) {
            screen.bounds.x += el.offsetLeft
            screen.bounds.y += el.offsetTop
            el = el.offsetParent
          }

          return screen;
        }

        function mouseDownListener(event) {
          /*
            clientX,clientY(478,386)
            layerX,layerY(478,333)
            offsetX,offsetY(478,280)
            pageX,pageY(478,386)
            screenX,screenY(478,312)
            x,y(478,386)

            原实现中有加入altKey支持，按住alt键再点击，会生成两个touch按钮

          */
            var e = event
            if (e.originalEvent) {
              e = e.originalEvent
            }

            // Skip secondary click
            if (e.which === 3) {
              return
            }

            e.preventDefault()

            //fakePinch = e.altKey

            /*
            计算出canvas所在区域的参数信息
              高度，宽度（offsetHeight，offsetWidth）
              在浏览器中的相对原点（offsetTop，offsetLeft）

              从最内部的canvas元素开始计算screen区域
            */
            var screen = calculateBounds($element.find('canvas')[0])
            //startMousing()

            var x = e.pageX - screen.bounds.x
            var y = e.pageY - screen.bounds.y

            var pressure = 0.5
            var scaled = scaler.coords(
                  screen.bounds.w
                , screen.bounds.h
                , x
                , y
                , screen.rotation
                )

            //计算之后可得到scaled对象，其中包含了点击点的x，y轴百分比信息
            //百分比信息与原始的设备屏幕高宽的乘积，既可还原浏览器中点击点与设备屏幕点击点之间的映射
            
            control.touchDown(nextSeq(), 0, scaled.xP, scaled.yP, pressure)
            /*
            if (fakePinch) {
              control.touchDown(nextSeq(), 1, 1 - scaled.xP, 1 - scaled.yP,
                pressure)
            }
            */

            control.touchCommit(nextSeq())
            /*
            activateFinger(0, x, y, pressure)

            if (fakePinch) {
              activateFinger(1, -e.pageX + screen.bounds.x + screen.bounds.w,
                -e.pageY + screen.bounds.y + screen.bounds.h, pressure)
            }
            */
            
            $element.bind('mousemove', mouseMoveListener)
            $document.bind('mouseup', mouseUpListener)
            $document.bind('mouseleave', mouseUpListener)
            /*
            if (lastPossiblyBuggyMouseUpEvent &&
                lastPossiblyBuggyMouseUpEvent.timeStamp > e.timeStamp) {
              // We got mouseup before mousedown. See mouseUpBugWorkaroundListener
              // for details.
              mouseUpListener(lastPossiblyBuggyMouseUpEvent)
            }
            else {
              lastPossiblyBuggyMouseUpEvent = null
            }
            */
            
          }

          function mouseUpListener(event) {
            var e = event
            if (e.originalEvent) {
              e = e.originalEvent
            }

            // Skip secondary click
            if (e.which === 3) {
              return
            }
            e.preventDefault()
            
            control.touchUp(nextSeq(), 0)
            /*
            if (fakePinch) {
              control.touchUp(nextSeq(), 1)
            }*/

            control.touchCommit(nextSeq())

            //deactivateFinger(0)
            /*
            if (fakePinch) {
              deactivateFinger(1)
            }
            */

            //stopMousing()
            $element.unbind('mousemove', mouseMoveListener)
            $document.unbind('mouseup', mouseUpListener)
            $document.unbind('mouseleave', mouseUpListener)
        }
        function mouseMoveListener(event) {
          var e = event
          if (e.originalEvent) {
            e = e.originalEvent
          }

          // Skip secondary click
          if (e.which === 3) {
            return
          }
          e.preventDefault()
/*
          var addGhostFinger = !fakePinch && e.altKey
          var deleteGhostFinger = fakePinch && !e.altKey

          fakePinch = e.altKey
*/
          var screen = calculateBounds($element.find('canvas')[0])
          var x = e.pageX - screen.bounds.x
          var y = e.pageY - screen.bounds.y
          var pressure = 0.5
          var scaled = scaler.coords(
                screen.bounds.w
              , screen.bounds.h
              , x
              , y
              , screen.rotation
              )

          control.touchMove(nextSeq(), 0, scaled.xP, scaled.yP, pressure)
/*
          if (addGhostFinger) {
            control.touchDown(nextSeq(), 1, 1 - scaled.xP, 1 - scaled.yP, pressure)
          }
          else if (deleteGhostFinger) {
            control.touchUp(nextSeq(), 1)
          }
          else if (fakePinch) {
            control.touchMove(nextSeq(), 1, 1 - scaled.xP, 1 - scaled.yP, pressure)
          }
*/
          control.touchCommit(nextSeq())
/*
          activateFinger(0, x, y, pressure)

          if (deleteGhostFinger) {
            deactivateFinger(1)
          }
          else if (fakePinch) {
            activateFinger(1, -e.pageX + screen.bounds.x + screen.bounds.w,
              -e.pageY + screen.bounds.y + screen.bounds.h, pressure)
          }
          */
        }

          $element.on('mousedown', mouseDownListener)
      })()

      


    }]
})
module.exports.name = 'deviceScreen'
    