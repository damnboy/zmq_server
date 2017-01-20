require('angular-route')
angular.module('debugCanvas', [
  'ngRoute'
])
.factory('colorBlack', function(){
    return {
        index: 0,
        table: ['#000000','#272727','#3C3C3C','#4F4F4F','#5B5B5B','#6C6C6C','#7B7B7B','#8E8E8E','#9D9D9D','#ADADAD','#BEBEBE','#D0D0D0','#E0E0E0','#F0F0F0','#FCFCFC','#FFFFFF'],
        getNext : function(){
        if(this.index === this.table.length){
          this.index = 1;
        }
        var ret_color = this.table[this.index];
        this.index = this.index + 1;
        return ret_color;
      }
    }
})
.component('debugCanvas', {
    template : '<canvas></canvas>',
    controller : function($scope, $element, $attrs, colorBlack){
        var canvas = $element.find('canvas')[0];
        canvas.height = 800;
        canvas.width = 600;
        setInterval(function(){
            var ctx = canvas.getContext('2d');
            ctx.fillStyle = colorBlack.getNext()
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }, 100)
    }
})

module.exports.name = 'debugCanvas'
    