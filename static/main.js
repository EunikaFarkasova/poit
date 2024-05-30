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

    $('#setCheckboxes').click(function(event) {
        temp = $('#temperature_check')[0].checked
        light = $('#light_check')[0].checked
  
        if (temp) {
            $('#temp-wrapper').show()
        } else {
            $('#temp-wrapper').hide()
        }
        if (light) {
            $('#light-wrapper').show()
        } else {
            $('#light-wrapper').hide()
        }
  
          socket.emit('my_event', {
            temperature: temp,
            light: light
          });
          
          return false; 
    });
    
    $('form#disconnect').submit(function(event) {
        socket.emit('disconnect_request');
        return false; 
    });   
});
