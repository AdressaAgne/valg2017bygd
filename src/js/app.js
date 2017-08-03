// leaflet setup

function log(...args){
	console.log(args);
}

var map = L.map('tronderlag').setView([63.4448229,10.393319], 13);

var CartoDB_PositronNoLabels = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
	subdomains: 'abcd',
	maxZoom: 14,

});

CartoDB_PositronNoLabels.addTo(map);

// loading data

var parti = {
	"Ap" : 'red',
	"H" : 'blue',
	"Sp" : 'green',
	"Bygdeliste" : 'gray',
}

var nope = ['eide', 'averoy', 'gjemnes', 'tingvold', 'sundal', 'surnadal', 'rundal', 'halsa', 'smola', 'aure', 'trondheim']


$.getJSON('data/Kart_Midt-NorgeOK.json').done(function(kommuner) {
	$.getJSON('data/kommune.json').done(function(data) {
		L.geoJSON(kommuner, {
			style : function(f) {
				var center = L.latLngBounds(f.geometry.coordinates).getCenter();

				var faceName = f.properties.NAVN;
				faceName = faceName.toLowerCase().replace(/ø/g, "o").replace(/å/g, "a").replace(/æ/g, "ae").replace(/\s/g, "_");

				var faceIcon = L.divIcon({className: 'icon-face-' + faceName });
				L.marker([center.lat, center.lng], {icon : faceIcon}).addTo(map);

				if(data[faceName] != undefined)
					return {
							color : parti[data[faceName].Parti],
							weight : 1,
							fillOpacity : .1
						}
				return {color : "white"};
			}
		}).addTo(map);


	});





});
