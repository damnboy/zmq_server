module.exports.list = function(val) {
  return val.split(/\s*,\s*/g).filter(Boolean)
}

module.exports.size = function(val) {
  var match = /^(\d+)x(\d+)$/.exec(val)
  if (match) {
    return [Number(match[1]), Number(match[2])]
  }
}

module.exports.range = function(from, to) {
  var items = []
  for (var i = from; i <= to; ++i) {
    items.push(i)
  }
  return items
}

module.exports.buildUri = function(schema, address, port){
  return schema + '://' + address + ':' + port
}

module.exports.buildUriArray = function(address, port){
  var schema = 'tcp';
  var ret = address.map(function(addr){
    return schema + '://' + addr + ':' + port
  })

  //console.log(ret)
  return ret;
}