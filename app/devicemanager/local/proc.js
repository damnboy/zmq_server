process.on('message', function(data){
    console.log(data)
})

process.send('ready')

process.on('SIGINT', function(){

})

process.on('SIGTERM', function(){
        console.log('working process exited')
    process.exit(0)
})

