requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: 'scripts/libs',
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
        app: '../'
    }
});

requirejs(['jquery', 'https://unpkg.com/leaflet@1.1.0/dist/leaflet.js'], function($, L){

var domain = 'http://172.22.177.48/';
//var domain = 'http://spesial.adressa.no/valgkart2017/';

var breakpoints = {
    mobile: 737,
    tablet: 1024,
    desktop: 1280,
}

function log(args){
    //console.log(args);
}

var w = $(window).width();
window.onresize = function(e) {
    w = $(window).width();
}

function get_permalink() {
    var url = location.href;
    if (url.match(/(.*)(\&kommune=([a-z]+)(.*))/)) {
        return url.replace(/(.*)(\&kommune=([a-z]+)(.*))/g, "$3");
    }
    return false;
}


var parti = {
    "ap": '#E4002B',
    "h": '#004E8B',
    "sp": '#69BE28',
    "felleslista-for-bygdeutvikling": 'gray',
}


var map = L.map('trondelag').setView([63.4448229, 10.393319], 8);

var CartoDB_PositronNoLabels = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
    maxZoom: 14,

});

CartoDB_PositronNoLabels.addTo(map);

// loading data

// backdata helping with mobile slideback feature
var backData = null;
var list = $('.mode-list > ul');

//Todo: add json/geosjon as jsfiles to include under gulp
$.getJSON(domain+'data/kommuner.geojson').done(function(kommuner) {
    $.getJSON(domain+'data/kommune.json').done(function(data) {
        window.geoMap = L.geoJSON(kommuner, {
            onEachFeature: function(f, layer) {
                var faceName = f.properties.navn;
                faceName = faceName.toLowerCase().replace(/ø/g, "o").replace(/å/g, "a").replace(/æ/g, "ae").replace(/\s/g, "_");

                if (data[faceName] != undefined) {
                    var info = {};
                    info.data = data[faceName];
                    var faceIcon = L.divIcon({
                        className: 'icon-face-' + faceName + ' parti parti-' + info.data.Parti.toLowerCase().replace(/\s/g, '-'),
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
                    }).on('click', function() {
                        showInfo.bind(info)();
                    })
                    layer.on('click', function() {
                        showInfo.bind(info)();
                    });
                    marker.addTo(map);
                    info.marker = marker;
                    info.layer = layer;

                    var parti_visual = info.data.Parti.charAt(0).toUpperCase() + info.data.Parti.slice(1);
                    info.pv = parti_visual;
                    $(list).prepend(
                        '<li data-id="' + faceName + '" data-party="' + info.data.Parti.toLowerCase().replace(/\s/g, '-') + '" data-status="better" data-kommune="' + info.data.Kommune.toLowerCase() + '" data-head="' + info.data.Ordfører.toLowerCase().replace(/\s/g, '') + '">' +
	                    '<a>'+
	                        '<figure class="icon-face-' + faceName + '">'+
	                        '</figure>'+
	                        '<ul>'+
	                            '<li class="name">' + info.data.Ordfører + ' (' + parti_visual + '), ' + info.data.Alder + ' år</li>'+
	                            '<li class="county">' + info.data.Kommune + '</li>'+
	                        '</ul>'+
	                    '</a>'+
	                '</li>');
                    info.elm = $('[data-id=' + faceName + ']');
                    backData = info;


                    $(info.elm).click(function() {
                        if ($(this).hasClass('open')) {
                            return hide();
                        }
                        showInfo.bind(info)();
                    });

                    layer.setStyle({
                        color: parti[info.data.Parti.toLowerCase().replace(/\s/, '-')],
                        weight: 1,
                        fillOpacity: .1
                    });
                }
            }
        }).addTo(map);

        var permalink = get_permalink();
        if (permalink !== false) {
            $('.list-search').val(permalink);
            $('[data-kommune=' + permalink + ']').click();
        }

    });
});



// Functions
var infoTab = $('.mode-map-info');
var lastLayer = null;

// Do not show
var blacklist = [
    'ID',
    'Kommune',
    'Parti',
    'Tittel',
    'Ordfører',
    'Alder',
    'ingress',
    'Sitat',
    "Innbyggerantall 2013",
    "Innbyggerantall 2017",
    "Rank",
    "Antall skoler 2013",
    "Antall eldrehjem/omsorgssenter 2013",
    "Antall barnehager 2013",
    "Antall idrettshaller og svømmehaller 2013",
    "Antall polutsalg 2013",
    "Antall dagligvarebutikker i 2013",
    "Antall statlige arbeidsplasser 2013",
    "imageid",
];

// Show in separat list
var infolist = [
    "Endring stalige overføringer",
    "Antall skoler 2017",
    "Antall eldrehjem/omsorgssenter 2017",
    "Antall barnehager 2017",
    "Antall idrettshaller og svømmehaller i 2017",
    "Antall polutsalg 2017",
    "Antall dagligvarebutikker i 2017",
    "Antall nedlagte bruk siste..(SSB)",
];

function getSitat(data) {
    return '«'+data['Sitat']+'»';
}

function getQ(q) {
    return '<strong>'+q+'</strong>';
}

function calcInbygger(y13, y17) {
    // y17 (x ferre|flere|mer|mindre|likt enn i y13)
    var diff = y17 - y13;
    var text = "";
    var formulering = Math.abs(diff) > 1 ? ['færre enn', 'flere enn'] : ['mindre enn', 'mer enn'];
    text += diff < 0 ? formulering[0] : (diff == 0 ? 'likt som' : formulering[1]);
    text += ' i 2013';
    diff = (diff == 0 ? '' : Math.abs(diff));
    return y17 + ' (' + diff + ' ' + text + ')';
}

function printQA(q, a, list) {
    if (typeof list === undefined) list = false;
    if (a == '' || a == null || typeof a == undefined) return;

    if (list) {
        if (q == "Endring stalige overføringer"){
            a = (a.match(/-/) ? 'ned ' : 'opp ') + a.replace(/%/, 'prosent') + " siden 2012";
        }
        $('.mode-map--desc').append('<li>' + getQ(q) +': '+ a + '</li>');
    } else {
        $('.mode-map--desc').append('<h3>' + getQ(q) + '</h3>');
        $('.mode-map--desc').append('<p> - ' + a + '</p>');
    }
}


function showInfo() {
    // remove all current active elements
    hide(false);
    // Remove active map polygon
    if (lastLayer === null || typeof lastLayer === undefined) {
        lastLayer = window.geoMap.getLayer(this.faceName);
    } else {
        lastLayer.setStyle({
            weight: 1,
            fillOpacity: .1
        });
        lastLayer = window.geoMap.getLayer(this.faceName);
    }

    $('.mode-map--image').css('background-image', 'url(http://spesial.adressa.no/valgkart2017/images/livingroom/'+this.faceName+'-560.jpg)')

    $(infoTab).css('transform', '');

    // Add text to popup
    $('.mode-map-info__bar--title').text(this.data.Ordfører + ' (' + this.pv + '), ' + this.data.Alder + ' år');

    var url = 'http://www.adressa.no/pluss/nyheter/article15191195.ece'; // replace with real url
    url += '?imageid=' + this.data.imageid + '&kommune=' + this.faceName;
    $('.mode-map-info--ingress').html('<small>'+this.data['Kommune']+'</small><blockquote class="sitat">'+getSitat(this.data)+'<blockquote>');
    $('.mode-map-info--ingress').append('<div class="fb-share-button" data-href="' + url + '" data-layout="button" data-size="small" data-mobile-iframe="true"><a class="fb-xfbml-parse-ignore" target="_blank" href="https://www.facebook.com/sharer/sharer.php?u=' + url + '&amp;src=sdkpreparse">Del på Facebook</a></div>');



    // Intervju
    $('.mode-map--desc').html('');
    for (var question in this.data) {
        if (blacklist.indexOf(question) > -1 || infolist.indexOf(question) > -1) continue;
        printQA(question, this.data[question]);
    }

    // Fakta
    $('.mode-map--desc').append('<ul>');
    $('.mode-map--desc').append('<li><strong>Innbyggertall</strong>: ' + calcInbygger(this.data['Innbyggerantall 2013'], this.data['Innbyggerantall 2017']) + '</li>')
    for (var question in this.data) {
        if (infolist.indexOf(question) < 0) continue;
        var answer = this.data[question];
        printQA(question, this.data[question], true);
    }
    $('.mode-map--desc').append('</ul>');

    $('.mode-map--desc').append('<div class="fb-share-button" data-href="' + url + '" data-layout="button" data-size="small" data-mobile-iframe="true"><a class="fb-xfbml-parse-ignore" target="_blank" href="https://www.facebook.com/sharer/sharer.php?u=' + url + '&amp;src=sdkpreparse">Del på Facebook</a></div>');

    // Set current active map polygon
    window.geoMap.getLayer(this.faceName).setStyle({
        weight: 2,
        fillOpacity: .5
    });
    // if its not on mobile view
    if (w > breakpoints.mobile) {
        // Insert popup under current active elm
        $('.mode-map-info').insertAfter(this.elm);
        $(this.elm).addClass('active').addClass('open');
        map.flyTo([this.lng, this.lat]);
        $(infoTab).slideDown(200);
        $('.mode-list ul').animate({
            scrollTop: $('.mode-list ul').scrollTop() + $(this.elm).position().top - 48,
        }, 0);
        $('.mode-map-info__bar').hide();
        return;
    }
    $('.mode-map-info__bar').show();
    // on mobile view:
    // set the info tab as active, for mobile slide
    $(infoTab).show().addClass('active');
    // for touch-drag back
    backData = this;
}

//Reset
function hide(map) {
    if (map == undefined) map = true;
    $('li[data-kommune]').show();
    $('li[data-kommune]').removeClass('active').removeClass('open');
    if (map) showMap();
}

$('.list-search').on('keyup click changed', function() {
    hide();

    //strip search values
    var value = $(this).val().toLowerCase().replace(/[^a-zA-ZæøåÆØÅ]/g, '');

    if (value.length < 2) {
        hide();
        return;
    };

    // find elements
    var elm = $('[data-kommune^=' + value + ']');
    if (elm.length < 1) elm = $('[data-head*=' + value + ']');

    if (elm.length < 1) {
        hide();
        return;
    };

    $('.mode-list ul').animate({
        scrollTop: $('.mode-list ul').scrollTop() + $(elm).position().top - 32,
    }, 200);


    $('li[data-kommune]').hide().removeClass('active');
    $(elm).show();
});

function showMap() {
    if (lastLayer !== null) {
        lastLayer.setStyle({
            weight: 1,
            fillOpacity: .1
        });
    }
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
    hide();
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


$('#switch_mode-list').click(function() {
    $('.mode-map').addClass('hide');
    $('.mode-list').addClass('show');
});

$('#switch_mode-map').click(function() {
    $('.mode-map').removeClass('hide');
    $('.mode-list').removeClass('show');
});
});
