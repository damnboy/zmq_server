var r = require('rethinkdb');

module.exports = function(options){

    var dbConn = Object.create(null);
    dbConn.create = (function(){
        function rethinkdConnect(){
            return r.connect(options);
        }

        var backed = [];
        //加载index.js脚本，既创建到rethinkdb的连接
        var connection;
            console.log('try connecting to db server...');
            rethinkdConnect()
            .then(function(conn){
                console.log('connection to database established from ' + conn.clientAddress() + ':' + conn.clientPort());
                connection = conn;

                connection.on('connect', function(){
                    //连接成功

                })

                connection.on('close', function(){
                    /*
                        连接断开，主动或被动均触发
                        
                        主动关闭数据库后，会触发两次
                        Running rethinkdb 2.3.4 (CLANG 7.3.0 (clang-703.0.29))...
                        Running on Darwin 13.4.0 x86_64
                    */
                    console.log('disconnect')

                })

                connection.on('timeout', function(){
                    //所依赖的socket对象，请求超时

                })

                connection.on('error', function(){
                    //协议级的错误，查询错误不会触发此callback
                    

                })


                backed.forEach(function(p){
                    p.resolver(connection)
                })
            })
            .catch(function(err){
                ////ReqlDriverError
                console.log('connection error');
                console.log(err.message)
                process.exit(0)
            })

        /*
            require 当前lib之后，无法确保connection已被正确的初始化，
            因此采用一个promise对connection进行包装
        */
        return function(){
            return new Promise(function(resolve, reject){
                if(connection){
                    resolve(connection)
                }
                else{
                    //将resovel，reject压入队列，等待connect的callback完成之后，进行解析resolve
                    backed.push({
                        resolver : resolve
                        ,rejector : reject
                    })
                }
            })
        }
    })()
    /*
    将以上rethinkdb，conn对象的初始化操作打包到一个作用域内，
    并实现再index.js加载的时候自动执行
    */


    /*
        基于connection的操作对返回值的处理。

        then中的return可以作为下一个级联的then的参数

        虽然then中的回调函数的返回值无法作为当前函数的返回值，
        但可以通过返回promise对象，并添加一级then来处理上一个then中所执行的代码的返回值
        
    */
    dbConn.close = function() {
        return dbConn.create().then(function(conn) {
            return conn.close()
        })
    }


    dbConn.run = function(cmd, options) {
        return dbConn.create().then(function(conn) {
            return cmd.run(conn, options)
        })
    }

    return dbConn;
}


