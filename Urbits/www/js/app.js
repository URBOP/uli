var map;
var topic = true;
var featureGroup;
var temp;
$.getJSON('http://urbits.com/php/dataUli.php',
    function (data, s) {
        console.log(s);
        temp = data;
    }
);
$(document).ready(function () {
    // Provide your access token
    L.mapbox.accessToken = 'pk.eyJ1Ijoiam9zZWp1YW5xbSIsImEiOiJOMjZVWnVNIn0.htjPtbkmRMLFw4U58Qb-nQ';
    // Create a map in the div #map
    map = L.mapbox.map('map', 'mapbox.streets-basic');

    $('#map').hammer({
        time: 700
    }).bind('panright', function (ev) {
        if (ev.gesture.deltaX > 200) {
            $('#map').addClass('sided');
            $('#control').css('z-index', '0');
        }
    });

    map.on('click', function (e) {
        if (!topic) {
            $.get('https://api.mapbox.com/v4/geocode/mapbox.places/' + e.latlng.lng + ',' + e.latlng.lat + '.json?access_token=pk.eyJ1Ijoiam9zZWp1YW5xbSIsImEiOiJOMjZVWnVNIn0.htjPtbkmRMLFw4U58Qb-nQ', function (res, s) {
                var text = res.features[3]["text"];
                $.getJSON('json/countryboundaries.json', function (res, s) {
                    for (var i = 0; i < res.length; i++) {
                        console.log(res[i]['FIELD7'] + " " + text);
                        if (res[i]['FIELD7'] == text) {
                            var obj = $.xml2json("<xml>" + res[i]['FIELD1'] + "</xml>");
                            console.log(obj);
                            var coordlen = obj.MultiGeometry.Polygon[0].outerBoundaryIs.LinearRing.coordinates.split(',0');
                            var pol = [];
                            var len = coordlen.length - 1;
                            for (var x = 0; x < len; x++) {
                                pol.push([parseFloat(coordlen[x].split(',')[1]), parseFloat(coordlen[x].split(',')[0])]);
                            }
                            console.log(pol);
                            L.polygon(pol).addTo(map);
                            getRegionData(pol, false);
                        }
                    }
                });
            });
        }
    });

    $('#control').find('div').find('h1').click(function () {
        if ($(this).hasClass('ion-pound')) {
            topic = true;
            $('#map').addClass('sideright');
            $(this).next('h1').css('opacity', '0.1');
            $('#control').append('<input id="topic-search" type="text" placeholder=""/>');
            $('#topic-search').change(function () {
                $.get('http://urbits.com/php/data.php?query=' + $(this).attr('value'), function (res, s) {
                    alert("s");
                    $('.leaflet-marker-pane').empty();
                    for (var i = 0; i < res.length; i++) {
                        var d = res[i];
                        try {
                            var icn = L.divIcon({
                                className: 'marker'
                            });
                            L.marker([d['coordinates_lat'], d['coordinates_long']], {
                                icon: icn
                            }).addTo(map);
                        } catch (err) {

                        }
                    }
                    $('#map').removeClass('sideright');
                    $('#map').removeClass('sided');
                    $('#control').css('z-index', '-1');
                    $('.ion-qr-scanner').css('opacity', '1');
                    $('#topic-search').remove();
                });
            });
            setTimeout(function () {
                $('#topic-search').attr('placeholder', 'Type Topic...');
            }, 700);
        } else {
            topic = false;
            featureGroup = L.featureGroup().addTo(map);
            var drawControl = new L.Control.Draw({
                edit: {
                    featureGroup: featureGroup
                }
            }).addTo(map);
            close_tray();
        }
    });

    map.on('draw:created', function (e) {
        getRegionData(e);
    });
});

function open_tray() {
    $('#map').addClass('sided');
    $('#control').css('z-index', '0');
}

function close_tray() {
    $('#map').removeClass('sideright');
    $('#map').removeClass('sided');
    $('#control').css('z-index', '-1');
    $('.ion-qr-scanner').css('opacity', '1');
    $('#topic-search').remove();
}

function getRegionData(e, b) {
    var inta = setInterval(function () {

        clearInterval(inta);
        //featureGroup.addLayer(e.layer);
        var polygons = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                            [

                            ]
                        ]
                }
                }]
        };
        if (b) {
            for (var l = 0; l < e.layer._latlngs.length; l++) {
                polygons.features[0]['geometry']['coordinates'][0].push([e.layer._latlngs[l]['lat'], e.layer._latlngs[l]['lng']]);
            }
        } else {
            for (var l = 0; l < e.length; l++) {
                polygons.features[0]['geometry']['coordinates'][0].push([e[l][0], e[l][1]]);
            }
        }
        var markedPolygon = polygons;

        //console.log(polygons);
        var points = {
            "type": "FeatureCollection",
            "features": []
        };

        $('.leaflet-marker-pane').empty();
        for (var i = 0; i < temp.length; i++) {
            points.features.push({
                "type": "Feature",
                "properties": {
                    "user": temp[i]['user_name'],
                    "time": temp[i]['time_code'],
                    "source": temp[i]['source_id'],
                    "date" : temp[i]['day_code'],
                    "color": '#000000'
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [temp[i]['coordinates_lat'], temp[i]['coordinates_long']]
                }
            });
        }
        //                $('#map').removeClass('sideright');
        //                $('#map').removeClass('sided');
        //                $('#control').css('z-index', '-1');
        //                $('.ion-qr-scanner').css('opacity', '1');
        //                $('#topic-search').remove();

        var ctx = turf.within(points, markedPolygon);

        console.log(ctx);
        var resultant = [];
        for (var x = 0; x < ctx.features.length; x++) {
            var icn = L.divIcon({
                className: 'marker'
            });
            L.marker([ctx.features[x]['geometry']['coordinates'][0], ctx.features[x]['geometry']['coordinates'][1]], {
                icon: icn
            }).addTo(map);
            resultant.push({'user_name': ctx.features[x]['properties']['user'], 'time_code': ctx.features[x]['properties']['time'], 'source_id': ctx.features[x]['properties']['source'], 'day_code': ctx.features[x]['properties']['date']});
        }
        getResults(resultant);
    }, 1000);
}

function getResults(data) {
    var loc = 0;
    var usr = 0;
    var users = [];
    $('#twit-num').html(data.length);
    for (var i = 0; i < data.length; i++) {
        try {
            var m = data[i];
            if (users.indexOf(m.user_name) < 0)
                users.push(m.user_name);
            var cssIcon = L.divIcon({
                className: 'css-icon'
            });
            var marker = L.marker([m.coordinates_lat, m.coordinates_long], {
                icon: cssIcon
            });
            loc++;
        } catch (err) {
            //console.log(err);
        }
    }

    $('#twit-loc').html(loc);
    $('#usr-num').html(users.length);

    new Chartist.Line('.ct-chart', {
        labels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
        series: [
                        getHourSeries(data, 'inter')
                    ]
    }, {
        low: 0,
        showArea: true
    });

    new Chartist.Bar('.ct-devices', {
        labels: ['iPhone', 'Android', 'Otros'],
        series: [
                        getDevices(data, 'inter')
                    ]
    }).on('draw', function (dataa) {
        if (dataa.type === 'bar') {
            dataa.element.attr({
                style: 'stroke-width: 30px'
            });
        }
    });

    $('#map').animate({
        opacity: 1
    }, 1000);
    $('#results').animate({
        right: 0,
        opacity: 1
    }, 1000);

    $('.load-wrap').fadeOut();
}

function getHourSeries(d, t) {
    console.log(d);
    var series = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (t == 'inter') {
        for (var i = 0; i < d.length; i++) {
            if (d[i].day_code == 0) {
                var h = parseInt(d[i].time_code.split(':')[0]);
                series[h] ++;
            }
        };
    } else {
        for (var i = 0; i < d.length; i++) {
            if (d[i].day_code == 1) {
                var h = parseInt(d[i].time_code.split(':')[0]);
                series[h] ++;
            }
        };
    }
    
    console.log(series);
    for (var i = 0; i < 6; i++) {
        series.push(series.shift());
    };
    console.log(series);
    return series;
}

function getDevices(d, t) {
    var series = [0, 0, 0];
    if (t == 'inter') {
        for (var i = 0; i < d.length; i++) {
            if (d[i].day_code == 0) {
                series[d[i].source_id] ++;
            }
        };
    } else {
        for (var i = 0; i < d.length; i++) {
            if (d[i].day_code == 1) {
                series[d[i].source_id] ++;
            }
        };
    }

    return series;
}