require('./phone-status')
angular
.module('phoneList', [
    'phoneStatus'
])
.component('phoneList', require('./component.js'))
    