var r = require('rethinkdb')

var stf = Object.create(null);

var options = {
     host : 'localhost'
     ,port : 28015
     ,db : 'stf'
     ,user : 'admin'
     ,password : ''
     ,timeout : 20
     ,ssl : null
 }


stf.conn = require('./connection')(options);

stf.users = function (){
    return stf.conn.run(r.table('users'))
}

//返回数组
stf.getDevices = function(){
    return stf.conn.run(r.table('devices'))
}

stf.getPresentDevices = function(){
    return stf.conn.run(r.table('devices').getAll(true,{
        index : 'present'
    }))
}
//返回单条json记录
stf.getDevice = function(serial){
    //return stf.con.run(r.table('deivces').getAll(serial, {index : 'serial'}))
    return stf.conn.run(r.table('devices').get(serial))
}
/*
op return state
{
    "deleted": 0 ,
    "errors": 0 ,
    "inserted": 0 ,
    "replaced": 0 ,
    "skipped": 0 ,
    "unchanged": 1
}
*/
stf.saveDeviceInitialState = function(serial){
    var now = Date.now();
    var data = {
        present : false,
        presentAt : now,//r.now(),
        ready : false,
        readyAt : now,//r.now(),
        status : 3
    };

    return stf.conn.run(r.table('devices').get(serial).update(data))
    .then(function(stats) {
      if (stats.skipped) {
        data.serial = serial
        data.createdAt = now//r.now()
        return stf.conn.run(r.table('devices').insert(data))
      }
      return stats
    })
}

/*
{ serial: '359125052611912',
  platform: 'REL',
  manufacturer: 'Samsung',
  operator: null,
  model: 'GT-I9500',
  version: '4.4.2',
  abi: 'armeabi-v7a',
  sdk: '19',
  display: 
   { id: 1,
     width: 1080,
     height: 1920,
     rotation: 1,
     xdpi: 1,
     ydpi: 1,
     fps: 1,
     density: 1,
     secure: true,
     url: 'ws://192.168.2.100:7400',
     size: 1 },
  phone: { imei: '', phoneNumber: '', iccid: '', network: '' },
  product: 'hammerhead' }
*/
stf.saveDeviceIdentity = function(serial, identity){
    return stf.conn.run(r.table('devices').get(serial).update({
        abi: identity.abi,
        display :identity.display,
        manufacturer: identity.manufacturer,
        model: identity.model,
        //network: identity.network,
        phone: identity.phone,
        platform: identity.platform,
        product: identity.product,
        sdk: identity.sdk,
        version : identity.version,
    }))
    .then(function(state){
        if(state.replaced || state.unchanged){
            return Promise.resolve()
        }
        return Promise.reject()
    })
}

stf.setDeviceReady = function(serial){
    return stf.conn.run(r.table('devices').get(serial).update({
        ready : true,
        readyAt : Date.now()
    }))
    .then(function(state){
        if(state.replaced || state.unchanged){
            return Promise.resolve()
        }
        return Promise.reject()
    })
}

stf.setDevicePresent = function(serial){
    return stf.conn.run(r.table('devices').get(serial).update({
        present : true,
        presentAt : Date.now()
    }))
    .then(function(state){
        if(state.replaced || state.unchanged){
            return Promise.resolve()
        }
        return Promise.reject()
    })
}

stf.setDeviceAbsent = function(serial){
    return stf.conn.run(r.table('devices').get(serial).update({
        present : false,
        presentAt : Date.now()
    }))
    .then(function(state){
        if(state.replaced || state.unchanged){
            return Promise.resolve()
        }
        return Promise.reject()
    })
}

module.exports = stf;