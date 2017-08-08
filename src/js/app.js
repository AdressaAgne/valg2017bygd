function log(...args) {
    console.log(args);
}

var w = $(window).width();
var breakpoints = {
    mobile: 641,
    tablet: 1024,
    desktop: 1280,
}

window.onresize = function(e){
    w = $(window).width();
}


var map = L.map('trondelag').setView([63.4448229, 10.393319], 8);

var CartoDB_PositronNoLabels = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
    maxZoom: 14,

});

CartoDB_PositronNoLabels.addTo(map);

// loading data

var parti = {
    "Ap": '#E4002B',
    "H": '#004E8B',
    "Sp": '#69BE28',
    "Bygdeliste": 'gray',
}

var backData = null;
var list = $('.mode-list > ul');
var geoMap;
$.getJSON('data/kommuner.geojson').done(function(kommuner) {
    $.getJSON('data/kommune.json').done(function(data) {
        geoMap = L.geoJSON(kommuner, {
            onEachFeature : function(f, layer) {
                var faceName = f.properties.navn;
                faceName = faceName.toLowerCase().replace(/ø/g, "o").replace(/å/g, "a").replace(/æ/g, "ae").replace(/\s/g, "_");

                if (data[faceName] != undefined) {
                    var info = data[faceName];
                    var faceIcon = L.divIcon({
                        className: 'icon-face-' + faceName + ' parti parti-' + info.Parti.toLowerCase(),
                        iconSize: 32
                    });
                    var center = L.latLngBounds(f.geometry.coordinates).getCenter();

                    info.faceName = faceName;
                    info.lat = center.lat;
                    info.lng = center.lng;
                    layer._leaflet_id = faceName;

                    var marker = L.marker([center.lng, center.lat], {
                        icon: faceIcon,
                        data: info,
                    }).on('click', function(e) {
                        showInfo.bind(info)();
                    });
                    marker.addTo(map);
                    info.marker = marker;
                    info.layer = layer;

                    $(list).prepend(`<li data-id="` + faceName + `" data-party="` + info.Parti.toLowerCase() + `" data-status="better">
	                    <a>
	                        <figure>
	                        </figure>
	                        <ul>
	                            <li class="name">` + info.Ordfører + `</li>
	                            <li class="county">` + info.Kommune + `</li>
	                        </ul>
	                    </a>
	                </li>`);
                    info.elm = $('[data-id=' + faceName + ']');
                    backData = info;


                    $(info.elm).click(function() {
                        showInfo.bind(info)();
                    });
                    layer.setStyle({
                        color: parti[info.Parti],
                        weight: 1,
                        fillOpacity: .1
                    });
                }
            }
        }).addTo(map);
    });
});



// Functions
var infoTab = $('.mode-map-info');
var lastLayer = null;
function showInfo() {
    log(map);
    $('.mode-list > ul li').removeClass('active');
    if(lastLayer === null){
        lastLayer = geoMap.getLayer(this.faceName);
    } else {
        lastLayer.setStyle({
            weight: 1,
            fillOpacity: .1
        });
        lastLayer = geoMap.getLayer(this.faceName);
    }
    $('.mode-map-info__bar--title').text(this.Kommune);
    $('.mode-map-info--subheader').text(this.Ordfører).attr('data-parti', this.Parti.toLowerCase());
    $('.mode-map-info__image').addClass('icon-face-' + this.faceName);
    $('.mode-map-info--description').text('hei på deg');

    $(infoTab).css('transform', '');

    $('.mode-map-info').insertAfter(this.elm);
    geoMap.getLayer(this.faceName).setStyle({
        weight: 2,
        fillOpacity: .5
    });

    if (w > breakpoints.mobile) {
        $(this.elm).addClass('active');
        map.flyTo([this.lng, this.lat]);
        $(infoTab).slideDown(200);
        $('.mode-list').animate({
            scrollTop: $('.mode-list').scrollTop() + $(this.elm).position().top,
        }, 200);
        return;
    }

    $(infoTab).addClass('active');
    $(infoTab).show();
    backData = this;
}

function showMap() {
    if (w > breakpoints.mobile) {
        $(infoTab).slideUp(200);
        return;
    }
    $(infoTab).css('transform', '');
    $(infoTab).removeClass('active');
    setTimeout(function() {
        $(infoTab).hide();
    }, 400);
}

$('.mode-map-info__bar--close').click(function() {
    showMap();
});


// Touch slide back
var touch = false;
var start = 0;
var diff = 0;

$('.mode-map-info').on('touchstart', function(e) {
    $(infoTab).css('transition', 'none');
    touch = true;
    start = e.changedTouches[0].clientX;
});

$('.mode-map-info').on('touchend', function(e) {
    $(infoTab).css('transition', 'all .2s ease');
    touch = false;
    start = 0;
    // 20% left then show the map again, else back to info
    if (diff > 20) {
        showMap();
    } else {
        showInfo.bind(backData)();
    }
});

$('.mode-map-info').on('touchmove', function(e) {
    diff = (e.changedTouches[0].clientX - start) / w * 100;
    if (diff > 0) {
        $(infoTab).css('transform', 'translateX(' + (diff) + "%" + ')');
    }
});

// --touch slide back
