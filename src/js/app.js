function log(...args) {
    console.log(args);
}

function get_permalink() {
    var url = location.href;
    if (url.match(/(.*)(\?k=([a-z]*))/)) {
        return url.replace(/(.*)(\?k=([a-z]*))/g, "$3");
    }
    return false;
}

function generate_share_btn(picture, caption, description) {
    var url = location.href;

    var tempalte = `https://www.facebook.com/dialog/feed?app_id=1389892087910588
&redirect_uri=` + url + `
&link=` + url + `
&picture=` + picture + `
&caption=` + caption + `

&description=` + description;
    var button = `<br><div class="fb-share-button" data-href="`+tempalte+`" data-layout="button" data-size="small" data-mobile-iframe="true"><a class="fb-xfbml-parse-ignore" target="_blank" href="https://www.facebook.com/sharer/sharer.php?u=`+tempalte+`">Share</a></div>`;

    return button;
}

var w = $(window).width();
var breakpoints = {
    mobile: 641,
    tablet: 1024,
    desktop: 1280,
}
var parti = {
    "Ap": '#E4002B',
    "H": '#004E8B',
    "Sp": '#69BE28',
    "Bygdeliste": 'gray',
}
window.onresize = function(e) {
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



var backData = null;
var list = $('.mode-list > ul');
var geoMap;
$.getJSON('data/kommuner.geojson').done(function(kommuner) {
    $.getJSON('data/kommune.json').done(function(data) {
        geoMap = L.geoJSON(kommuner, {
            onEachFeature: function(f, layer) {
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
                        log('showInfo');
                        showInfo.bind(info)();
                    });
                    marker.addTo(map);
                    info.marker = marker;
                    info.layer = layer;

                    $(list).prepend(`<li data-id="` + faceName + `" data-party="` + info.Parti.toLowerCase() + `" data-status="better" data-kommune="` + info.Kommune.toLowerCase() + `" data-head="` + info.Ordfører.toLowerCase().replace(/\s/g, '') + `">
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
                        if ($(this).hasClass('open')) {
                            return hide();
                        }
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
    $('.mode-map-info__bar--title').text(this.Kommune + ' - ' + this.Ordfører);

    $('.mode-map-info__image').addClass('icon-face-' + this.faceName);
    $('.mode-map-info--description').text('Ingress');
    $('.mode-map-info--description').append(generate_share_btn('images/oorjG.png', this.Kummune, this.Ordfører));


    $(infoTab).css('transform', '');


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
    var value = $(this).val().toLowerCase().replace(/\s/g, '');

    if ($(this).val().length < 2) {
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
