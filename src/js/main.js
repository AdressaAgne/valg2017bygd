const parti = {
    "ap": '#E4002B',
    "h": '#004E8B',
    "sp": '#69BE28',
    "bygdeliste": 'gray',
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
var geoMap;

//Todo: add json/geosjon as jsfiles to include under gulp
$.getJSON('data/kommuner.geojson').done(function(kommuner) {
    $.getJSON('data/kommune.json').done(function(data) {
        geoMap = L.geoJSON(kommuner, {
            onEachFeature: function(f, layer) {
                var faceName = f.properties.navn;
                faceName = faceName.toLowerCase().replace(/ø/g, "o").replace(/å/g, "a").replace(/æ/g, "ae").replace(/\s/g, "_");

                if (data[faceName] != undefined) {
                    var info = {};
                    info.data = data[faceName];
                    var faceIcon = L.divIcon({
                        className: 'icon-face-' + faceName + ' parti parti-' + info.data.Parti.toLowerCase(),
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
                        log('makerClick');
                        showInfo.bind(info)();
                    })
                    layer.on('click', function(e) {
                        log('LayerClicked');
                        showInfo.bind(info)();
                    });
                    marker.addTo(map);
                    info.marker = marker;
                    info.layer = layer;

                    $(list).prepend(`<li data-id="` + faceName + `" data-party="` + info.data.Parti.toLowerCase() + `" data-status="better" data-kommune="` + info.data.Kommune.toLowerCase() + `" data-head="` + info.data.Ordfører.toLowerCase().replace(/\s/g, '') + `">
	                    <a>
	                        <figure>
	                        </figure>
	                        <ul>
	                            <li class="name">` + info.data.Ordfører + `</li>
	                            <li class="county">` + info.data.Kommune + `</li>
	                        </ul>
	                    </a>
	                </li>`);
                    info.elm = $('[data-id=' + faceName + ']');
                    backData = info;


                    $(info.elm).click(function() {
                        if ($(this).hasClass('open')) {
                            return hide();
                        }
                        showInfo.bind(info)();
                    });

                    layer.setStyle({
                        color: parti[info.data.Parti],
                        weight: 1,
                        fillOpacity: .1
                    });
                }
            }
        }).addTo(map);

        var permalink = get_permalink();
        if (permalink !== false) {
            log(permalink);
            $('.list-search').val(permalink);
            $('[data-kommune=' + permalink + ']').click();
        }

    });
});



// Functions
var infoTab = $('.mode-map-info');
var lastLayer = null;
var blacklist = [
    'ID',
    'Kommune',
    'Parti',
    'Tittel',
    'Ordfører',
    "Antall skoler 2013",
    "Antall skoler 2017",
    "Antall eldrehjem/omsorgssenter 2013",
    "Antall eldrehjem/omsorgssenter 2017",
    "Antall barnehager 2013",
    "Antall barnehager 2017",
    "Antall idrettshaller og svømmehaller 2013",
    "Antall idrettshaller og svømmehaller i 2017",
    "Antall polutsalg 2013",
    "Antall polutsalg 2017",
    "Antall dagligvarebutikker i 2013",
    "Antall dagligvarebutikker i 2017",
    "Antall statlige arbeidsplasser 2013",
    "Antall statlige arbeidsplasser 2017",
    "Antall nedlagte bruk siste..(SSB)",
    "Innbyggerantall 2013",
    "Innbyggerantall 2017",
];
function showInfo() {
    // remove all current active elements
    hide(false);
    // Remove active map polygon
    if (lastLayer === null) {
        lastLayer = geoMap.getLayer(this.faceName);
    } else {
        lastLayer.setStyle({
            weight: 1,
            fillOpacity: .1
        });
        lastLayer = geoMap.getLayer(this.faceName);
    }


    // Add text to popup
    $('.mode-map-info__bar--title').text(this.data.Kommune + ' - ' + this.data.Ordfører);

    $('.mode-map-info__image').addClass('icon-face-' + this.faceName);
    $('.mode-map-info--ingress').text('Ingress');
    var url = 'http://www.adressa.no/nyheter/sortrondelag/2017/08/11/Skal-avh%C3%B8re-ansatte-og-ledelsen-ved-Ler%C3%B8y-Midt-15139978.ece';
    var ogimage = '123456789';
    $('.mode-map-info--ingress').prepend('<div class="fb-share-button" data-href="'+url+'?k='+this.data.ID+'&ogimage='+ogimage+'" data-layout="button" data-size="small" data-mobile-iframe="true"><a class="fb-xfbml-parse-ignore" target="_blank" href="https://www.facebook.com/sharer/sharer.php?u='+url+'?'+this.data.ID+'%26ogimage%3D'+ogimage+'&amp;src=sdkpreparse">Del på Facebook</a></div>');
    $(infoTab).css('transform', '');

    $('.mode-map--desc').html('<h1>'+this.data['Tittel']+'</h1>');
    log(this.data);
    for (var question in this.data) {
        if(blacklist.indexOf(question) > -1) continue;
        var answer = this.data[question];
        $('.mode-map--desc').append('<h3>'+question+'</h3>');
        $('.mode-map--desc').append('<p>'+answer+'</p>');
        $('.mode-map--desc').append('<br />');
    }

    // Set current active map polygon
    geoMap.getLayer(this.faceName).setStyle({
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
            scrollTop: $('.mode-list ul').scrollTop() + $(this.elm).position().top - 32,
        }, 200);
        $('.mode-map-info__bar').hide();
        return;
    }
    log('Mobile View');
    $('.mode-map-info__bar').show();
    // on mobile view:
    // set the info tab as active, for mobile slide
    $(infoTab).show().addClass('active');
    log($(infoTab))
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
    log(this);
    $('.mode-map').addClass('hide');
    $('.mode-list').addClass('show');
});

$('#switch_mode-map').click(function() {
    $('.mode-map').removeClass('hide');
    $('.mode-list').removeClass('show');
});
