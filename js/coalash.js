function loadLayers (data) { 
    $.ajax({
            type:"GET",
            url: data,
            dataType:"text",
            success: parseData
    });   
}
function parseData(data){
        dataObj = $.parseJSON(data);
        console.log(dataObj);
}


// ****DEFINE VARIABLES
var map
var cities
var center



$( document ).ready(function() {
    console.log("document ready")
    loadLayers('data/impoundments.geojson');
    buildMap();
    $('#layers-list').dropdown('toggle');
    $('#cover').fadeOut(1);
});





//****** BUILDING MAP 
function buildMap() {
    L.mapbox.accessToken = 'pk.eyJ1IjoiZWxjdXJyIiwiYSI6IkZMekZlUEEifQ.vsXDy4z_bxRXyhSIvBXc2A';    
    map = L.mapbox.map('map', {
            minZoom: 6,
            zoomControl: false,
        })
        .setView([34.2190, -83.5266], 6);
        
        // Disable drag and zoom handlers.
        //map.dragging.disable();
        //map.touchZoom.disable();
        //map.doubleClickZoom.disable();
        //map.scrollWheelZoom.disable();

    new L.Control.Zoom({ position: 'topright' }).addTo(map);
    
    /// BASE MAP    
    var osm_HOT = L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, Tiles courtesy of <a href="http://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
    })//.addTo(map);
    
    var osm_BW = L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    
    var imagery = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    })
    
    
    //// ADDING USA 
    base_USA = omnivore.geojson('data/other_states-simple.json')
        .on('ready', function(go) {
                this.eachLayer(function(polygon) {
                    polygon.setStyle ( {
                                    color: '#C3C3BE', 
                                    opacity: 1,
                                    weight: 2, 
                                    fillColor: '#D9D8D2',  
                                    fillOpacity: .7
                    });
                }) 
        })
        .setZIndex(1)
        .addTo(map);
        
    
    /// ADD ZOOM LISTENER HERE! "ONLY IF ZOOM >= 6": 
    /*states.on('mouseover', function(e) {
        e.layer.setStyle({
                            color: '#fff',
                            opacity: 0,
                            weight: 3,
                            fillColor: '#fff',//'#3E4E8C',
                            fillOpacity: 0.2, 
                        });
    });
    states.on('mouseout', function(e) {
        e.layer.setStyle ( {
                            color: '#C3C3BE',
                            opacity: 1,
                            weight: 2, 
                            fillOpacity: 0, 
                    });
    });*/
    
    /// HEATMAP OPTIONS: https://github.com/Leaflet/Leaflet.heat        
    heat = L.heatLayer([], {
            maxZoom: 10,
            radius: 20,
            minOpacity: .8,
            blur: 30,
            gradient: {0.45: 'blue', .55: 'cyan', 0.65: 'lime', .75:'yellow', .85: 'orange', 1: 'red'}
    })
    .addTo(map)
    console.log(heat)
    
    

    //// ADDING IMPOUNDMENTS
    ponds = omnivore.geojson('data/impoundments.geojson')
        .on('ready', function(go) {
                this.eachLayer(function(polygon) {
                    polygon.setStyle ( {
                                    color: '#FFA500', 
                                    opacity: 0,
                                    weight: 20, 
                                    //fillColor: '#ff0000',  
                                    fillOpacity: 0
                    });
                    var ll = [Number(polygon.feature.properties.latitude), Number(polygon.feature.properties.longitude)]
                    heat.addLatLng(ll);
                    /// BUILD LABEL
                    var label = polygon.feature.properties.plant_labe
                    polygon.bindLabel(label)
                    /// BUILD NEW OBJECT
                    polygon.on('click', function(e){
                        var ONE = polygon.feature.properties.plant_full
                        var geojson = []
                        ponds.eachLayer(function(polygon) {
                            if (polygon.feature.properties.plant_full == ONE) {
                                var newObject = {}
                                newObject['type'] = 'Feature'
                                newObject['properties'] =  polygon.feature.properties
                                newObject['geometry'] = polygon.feature.geometry
                                geojson.push(newObject)
                            }
                        });
                        map.setView(ll, 14);
                        buildPoly(geojson)
                        /// POPULATE INFO PANE
                        var plant ="<h3>" + polygon.feature.properties.plant_full + "</h3>"
                            plant +="<p> Owned and Operated by " + polygon.feature.properties.utility + "</p>"
                            plant +="<p>"
                            plant +="Location: " + polygon.feature.properties.city +", "+ polygon.feature.properties.st + "</br>"
                            plant +="Year Built: " + polygon.feature.properties.yr_built + "</br>"
                            plant +="Status: " + polygon.feature.properties.plant_stat + "</br>"
                            plant +="Nearest Water Body: " + polygon.feature.properties.receiv_wat + "</br>"
                            plant +="River Basin/SubBasin: " + polygon.feature.properties.basin_name +" / "+ polygon.feature.properties.subbasin_n + "</br>"
                            plant +="Number of Ash Storage Facilities: " + geojson.length + "</br>"
                            plant +="</p>"  
                        document.getElementById('plant-info').innerHTML = plant;
                    })
                }) 
        })
        .setZIndex(100)
        .addTo(map)
    
    //// MAP ZOOM COMMANDS 
    map.on('zoomend', function(){
            if (map.getZoom()>11) {
                //map.removeLayer(heat);
                map.removeLayer(osm_BW);
                imagery.addTo(map);
                heat.setOptions({
                    radius: 1,
                })
            } else if (map.getZoom()<=11){
                //heat.addTo(map);
                map.removeLayer(imagery);
                osm_BW.addTo(map);
                heat.setOptions({
                    radius:20,
                })
                /*ponds.setStyle ({
                                    color: '#FFA500', 
                                    opacity: 0,
                                    weight: 20, 
                                    fillColor: '#ff0000',  
                                    fillOpacity: 0
                        });*/
            } else if (map.getZoom()<=9) {
                map.removeLayer(imagery);
                osm_BW.addTo(map);
            }
    })  
}

function buildPoly(object) {
    table = document.getElementById('impnds');
    
    geojson = L.geoJson(object)
    .addTo(map)
    .eachLayer(function(poly) {
        poly.setStyle({
            color: '#FFB700',
            opacity: .6,
            weight: 4,
            fillOpacity: 0,
        })
        var content ="<h4>" + poly.feature.properties.impoundmen + "</h4>"
                        content +="<p> Status: " + poly.feature.properties.impnd_stat + "</br>"
                        content +="Capacity: " + poly.feature.properties.gallons + " gallons</br>"
                        content +="Hazard Rating: " + poly.feature.properties.epa_haz_po + "</br>"
                        content +="Condition Rating: " + poly.feature.properties.epa_con_as + "</br>"
                        content +="Leachate: " + poly.feature.properties.leachate + "</br>"
                        content +="Lined: " + poly.feature.properties.lined + "</br>"
                        content +="Fly ash: " + poly.feature.properties.fly_ash + "</br>"
                        content +="Bottom ash: " + poly.feature.properties.fly_ash + "</p>"
        poly.bindLabel(content)
        
        newRow = document.getElementById('impnds').appendChild(document.createElement('tr'))
        newRow.innerHTML += '<td>' + poly.feature.properties.impoundmen + '</td>'
        newRow.innerHTML += '<td>' + poly.feature.properties.epa_haz_po + '</td>'
        newRow.onmouseenter= function(){
            poly.setStyle ({
                //color: 'red'
                opacity: 1,
                weight: 6,
            })
        }
        newRow.onmouseout = function(){
            poly.setStyle ({
                opacity: .6,
                weight: 4,
            })
        }
        
        })       

}

   






    
