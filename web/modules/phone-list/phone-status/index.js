angular
.module('phoneStatus', [])
    .filter('status', function() {
    return function(input) {
      return input ? 'online' : 'offline';
    };
  });