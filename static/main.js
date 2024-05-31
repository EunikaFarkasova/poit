$(document).ready(function() {
    var x = new Array();
    var tempY = new Array();
    var lightY = new Array();
    var tempTrace;
    var lightTrace;
    var tempLayout = {
        title: 'Temperature data',
        xaxis: {
            title: 'Datetime',
            type: 'date',
        },
        yaxis: {
            title: 'Value',
        }
    };
    var lightLayout = {
        title: 'Light data',
        xaxis: {
            title: 'Datetime',
            type: 'date',
        },
        yaxis: {
            title: 'Value',
        }
    };
    var temp;
    var light;

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
            x.push(msg.data.datetime);
            console.log(msg.data.datetime)
            if (temp) {
                tempY.push(parseFloat(msg.data.temperature));
                tempTrace = {
                    x: x,
                    y: tempY,
                    name: 'value',
                };
                var tempTraces = new Array();
                tempTraces.push(tempTrace);
                Plotly.newPlot($('#temp-plot')[0], tempTraces, tempLayout); 
            }

            if (light) {
                lightY.push(parseFloat(msg.data.light));
                lightTrace = {
                    x: x,
                    y: lightY,
                    name: 'value',
                };      
                var lightTraces = new Array();
                lightTraces.push(lightTrace);
                Plotly.newPlot($('#light-plot')[0], lightTraces, lightLayout);  
            }
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
    
    $('.buttonVal').click(function(event) {
        const val = event.target.value
        console.log(val)
        if (val == 'true') {
            x = new Array();
            tempY = new Array();
            lightY = new Array();
        }
        socket.emit('click_event', {value: val});
        return false; 
      });

    $('form#disconnect').submit(function(event) {
        socket.emit('disconnect_request');
        return false; 
    });   
});
