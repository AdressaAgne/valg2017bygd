// leaflet setup

function log(...args){
	console.log(args);
}

var map = L.map('trondelag').setView([63.4448229,10.393319], 8);

var CartoDB_PositronNoLabels = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
	subdomains: 'abcd',
	maxZoom: 14,

});

CartoDB_PositronNoLabels.addTo(map);

// loading data

var parti = {
	"Ap" : '#E4002B',
	"H" : '#004E8B',
	"Sp" : '#69BE28',
	"Bygdeliste" : 'gray',
}

var nope = ['eide', 'averoy', 'gjemnes', 'tingvold', 'sundal', 'surnadal', 'rundal', 'halsa', 'smola', 'aure', 'trondheim']

var help = [];

$.getJSON('data/Kart_Midt-NorgeOK.json').done(function(kommuner) {
	$.getJSON('data/kommune.json').done(function(data) {
		L.geoJSON(kommuner, {
			style : function(f) {
				var faceName = f.properties.NAVN;
				faceName = faceName.toLowerCase().replace(/ø/g, "o").replace(/å/g, "a").replace(/æ/g, "ae").replace(/\s/g, "_");

				if(data[faceName] != undefined) {
					var faceIcon = L.divIcon({
						className: 'icon-face-' + faceName,
						iconSize : 40
					});
					var center = L.latLngBounds(f.geometry.coordinates).getCenter();
					var info = data[faceName];
					var marker = L.marker([center.lng, center.lat], {
							icon : faceIcon,
							data : info,
					}).on('click', function(e) {
						showInfo.bind(this.options.data)();
					});

					marker.addTo(map);
					return {
							color : parti[info.Parti],
							weight : 1,
							fillOpacity : .1
						}
				}
				return {
					color : "white",
					fillOpacity : 0
				};
			}
		}).addTo(map);
	});
});

// Functions
var infoTab = $('.mode-map-info');
function showInfo(obj) {
	$(infoTab).show();
	$('.mode-map-info__bar--title').text(this.Kommune);
	$('.mode-map-info--parti').className = 'mode-map-info--parti ' + this.Parti;
	$('.mode-map-info--subheader').text(this.Ordfører);
	$('.mode-map-info--description').text('hei på deg');
	$(infoTab).css('left', '0%');
	log('show', infoTab);
}

function showMap(){
	$(infoTab).css('left', '100%');
	setTimeout(function() {
		$(infoTab).hide();
	}, 400);
	log('hide');
}

$('.mode-map-info__bar--close').click(function() {
	showMap();
});

var touch = false;
var start = 0;
var diff = 0;
var w = $(window).width();
$('.mode-map-info').on('touchstart', function(e){
	touch = true;
	start = e.changedTouches[0].clientX;
});

$('.mode-map-info').on('touchend', function(e){
	touch = false;
	start = 0;
	log(parseInt($(infoTab).css('left')));
	if(parseInt($(infoTab).css('left')) > 35){
		showMap();
	} else {
		showInfo();
	}
});

$('.mode-map-info').on('touchmove', function(e){
	diff = (e.changedTouches[0].clientX - start) / w * 100;
	log(w, diff, window)
	if(diff > 0){
		$(infoTab).css('left', diff+"%");
	}

//	if(diff < -100) showMap();
});
