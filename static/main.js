$(document).ready(function() {
    var tempGauge = new RadialGauge({
        renderTo: 'tempGauge',
        width: 300,
        height: 300,
        units: "°C",
        minValue: -50,
        maxValue: 50,
        majorTicks: [
            "-50",
            "-45",
            "-40",
            "-35",
            "-30",
            "-25",
            "-20",
            "-15",
            "-10",
            "-5",
            "0",
            "5",
            "10",
            "15",
            "20",
            "25",
            "30",
            "35",
            "40",
            "45",
            "50"
        ],
        minorTicks: 2,
        strokeTicks: true,
        highlights: [
            {
                "from": -50,
                "to": -35,
                "color": "rgba(200, 50, 50, .75)"
            },
            {
                "from": 35,
                "to": 50,
                "color": "rgba(50, 200, 50, .75)"
            }
        ],
        colorPlate: "#fff",
        borderShadowWidth: 0,
        borders: false,
        needleType: "arrow",
        needleWidth: 2,
        needleCircleSize: 7,
        needleCircleOuter: true,
        needleCircleInner: false,
        animationDuration: 1500,
        animationRule: "linear"
    });
    tempGauge.draw();
    tempGauge.value = "0";

    var lightGauge = new RadialGauge({
        renderTo: 'lightGauge',
        width: 300,
        height: 300,
        units: "adcVal",
        minValue: 0,
        maxValue: 4095,
        majorTicks: [
            "0",
            "200",
            "400",
            "600",
            "800",
            "1000",
            "1200",
            "1400",
            "1600",
            "1800",
            "2000",
            "2200",
            "2400",
            "2600",
            "2800",
            "3000",
            "3200",
            "3400",
            "3600",
            "3800",
            "4095"
        ],
        minorTicks: 2,
        strokeTicks: true,
        highlights: [
            {
                "from": 0,
                "to": 400,
                "color": "rgba(200, 50, 50, .75)"
            },
            {
                "from": 3400,
                "to": 4095,
                "color": "rgba(50, 200, 50, .75)"
            }
        ],
        colorPlate: "#fff",
        borderShadowWidth: 0,
        borders: false,
        needleType: "arrow",
        needleWidth: 2,
        needleCircleSize: 7,
        needleCircleOuter: true,
        needleCircleInner: false,
        animationDuration: 1500,
        animationRule: "linear"
    });
    lightGauge.draw();
    lightGauge.value = "0";

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
                tempGauge.value = parseFloat(msg.data.temperature);
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
                lightGauge.value = parseFloat(msg.data.light);
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
