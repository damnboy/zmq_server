"use strict";
var path = require("path")

var protobufjs = require("protobufjs")

var messageDefines = protobufjs.loadProtoFile(path.join(__dirname, "msg.proto")).build();

/*
package tutorial;

option java_package = "com.example.tutorial";
option java_outer_classname = "AddressBookProtos";

message Person {
  required string name = 1;
  required int32 id = 2;
  optional string email = 3;

  enum PhoneType {
    MOBILE = 0;
    HOME = 1;
    WORK = 2;
  }

  message PhoneNumber {
    required string number = 1;
    optional PhoneType type = 2 [default = HOME];
  }

  repeated PhoneNumber phone = 4;
}

message AddressBook {
  repeated Person person = 1;
}
*/
/*
  ----> output
var person = { 
  tutorial: 
  { 
    Person: 
    { 
      [Function]
        encode: [Function],
        decode: [Function],
        decodeDelimited: [Function],
        decode64: [Function],
        decodeHex: [Function],
        decodeJSON: [Function],
        PhoneType: [Object],
        PhoneNumber: [Object] 
    },
    AddressBook: 
    { [Function]
        encode: [Function],
        decode: [Function],
        decodeDelimited: [Function],
        decode64: [Function],
        decodeHex: [Function],
        decodeJSON: [Function] 
        
    } 
  } 
}

*/
/*
reduce(每个元素触发一次的callback)

callback的定义
function callback(上一次callback调用的返回值（没有返回值则为undefined），当前值，索引，数组本身){

}

由于数组的首元素触发callback的时候，没有前一次callback调用。
因此reduce还有一个可选参数，用于定义首元素触发callback的时候，前一次callback的返回值
*/

//返回一个数组，其中包含类型对应的字符串
var keys = Object.keys(messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name);

messageDefines.ReverseMessageType = keys
.reduce(function(acc/*上一次callback调用的返回值（没有返回值则为undefined）*/, type /*当前值*/ /*, index, array*/) {
      //console.log("detect message type: " + type);
      //类型字符串对应的代码
      var code = messageDefines.com.example.ponytail.testjeromq.MessageTypes.Name[type];
      if (!messageDefines.com.example.ponytail.testjeromq[type]) {
        throw new Error('msgdefines.com.example.ponytail.testjeromq.MessageType has unknown value "' + type + '"')
      }
      messageDefines.com.example.ponytail.testjeromq[type].$code = messageDefines.com.example.ponytail.testjeromq[type].prototype.$code = code;
      acc[code] = type
      return acc
    },
    Object.create(null))

//console.log(person.Envelope);
//console.log(Object.keys(person.tutorial.MessageType));


module.exports = messageDefines


/*
protoc -IPATH=./ --java_out=/Users/ponytail/AndroidStudioProjects/TestJeroMQ/app/src/main/java/ msg.proto
*/