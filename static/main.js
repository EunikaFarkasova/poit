$(document).ready(function() {
    namespace = '/test';
    var socket;

    $('#open').click(function(event) {
        console.log("open");
        socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + namespace);
        socket.on('connect', function() {
          socket.emit('my_event', {data: 'I\'m connected!', value: 1}); 
        });

        socket.on('my_response', function(msg) {
            $('#log').prepend('Received #'+msg.count+': '+JSON.stringify(msg.data)+'<br>').html();
        });
    }); 
    
    $('form#disconnect').submit(function(event) {
        socket.emit('disconnect_request');
        return false; 
    });   
});
