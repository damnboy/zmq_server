var r = require('rethinkdb');
var conn = require('./stf').conn;

module.exports = function(options){

    function createDatabase(name){
        return conn.run(r.dbCreate(name))
            .then(function(state){
                if(state.dbs_created === 1){
                    console.log('Database %s created', name)

                }
            })
            .catch(function(err){
                //console.log(err)
                if(err.msg.indexOf('already exists') !== -1){
                    console.log('Database %s already created', name);
                }
            })
    }

    return createDatabase('zone').then(function(){//建表
        return conn.run(r.db('zone').tableCreate('devices',{
                primaryKey : 'serial'
            }))
            .then(function(state){
                if(state.tables_created === 1){
                    console.log('Table %s created', 'devices')

                    conn.run(r.db('zone').table('devices').indexCreate('present'))
                }
            })
            .catch(function(err){
                //console.log(err)
                if(err.msg.indexOf('already exists') !== -1){
                    console.log('Table %s already created', 'devices');
                }
            })
    })
    .then(function(){
        return conn.close()
    })

}
    





