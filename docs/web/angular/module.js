/*
Module 除了定义了加载，启动应用的逻辑之外，同时也作为
    controllers，services，filters，directives等对象的容器
*/
angular.module('module',[
    /*加载对其他模块的依赖*/

])
/*
由一组config与run方法组成,这些方法在应用启动的时候被执行
*/
.config(/*configFn*/function(injectables){ //provider-injector

})
.run(/*initializetionFn*/function(injectables){ //instance-injector

})
.provider(name, providerType)
.factory(name, providerFunction)
.service(name, constructor)
.value(name, object)
.constant(name, object)
.decorator(name, decorFn)
.animation(name, animationFactory)
.filter(name, constructor)
.controller(name, constructor)
.directive(name, directiveFactory)
//特殊的directive：独立的scope且类型为E
.component('component', {   //options
    template : '',
    //templateUrl : '',

    controller : ['$scope', function($scope){

    }],
    //为controller起别名，默认为$ctrl
    controllerAs : '',

    //transclude : 'false',
    
    })
