'use strict'
function *foo(){


    var x = yield (new Promise(function(resolve, reject){
        setTimeout(function(){
            resolve(5000)
        }, 5000)
    }))
    
    var y = yield (new Promise(function(resolve, reject){
        setTimeout(function(){
            resolve(x)
        }, x)
    }))
}

var gen =  foo();
var p1 = gen.next().value;
p1.then(function(num){
    console.log(num)
    return gen.next(2000).value
})
.then(function(num){
    console.log(num)
})

