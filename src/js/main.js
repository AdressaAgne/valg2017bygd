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
                        showInfo.bind(info)();
                    })
                    layer.on('click', function(e) {
                        showInfo.bind(info)();
                    });
                    marker.addTo(map);
                    info.marker = marker;
                    info.layer = layer;

                    var parti_visual = info.data.Parti.charAt(0).toUpperCase() + info.data.Parti.slice(1);
                    info.pv = parti_visual;
                    $(list).prepend(`<li data-id="` + faceName + `" data-party="` + info.data.Parti.toLowerCase() + `" data-status="better" data-kommune="` + info.data.Kommune.toLowerCase() + `" data-head="` + info.data.Ordfører.toLowerCase().replace(/\s/g, '') + `">
	                    <a>
	                        <figure>
	                        </figure>
	                        <ul>
	                            <li class="name">` + info.data.Ordfører + ` (` + parti_visual + `), ` + info.data.Alder + `år</li>
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
                        color: parti[info.data.Parti.toLowerCase()],
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
    "1",
    "2",
    "3",
    "5",
    "7",
    "9",
    "11",
    "13",
    "15",
    "17",
];

// Show in separat list
var infolist = [
    "4", "6", "8", "10", "12", "14", "16",
];

var questions = {
    "1": "Innbyggerantall 2013",
    "2": "Innbyggerantall 2017",
    "3": "Antall skoler 2013",
    "4": "Antall skoler 2017",
    "5": "Antall eldrehjem/omsorgssenter 2013",
    "6": "Antall eldrehjem/omsorgssenter 2017",
    "7": "Antall barnehager 2013",
    "8": "Antall barnehager 2017",
    "9": "Antall idrettshaller og svømmehaller 2013",
    "10": "Antall idrettshaller og svømmehaller i 2017",
    "11": "Antall polutsalg 2013",
    "12": "Antall polutsalg 2017",
    "13": "Antall dagligvarebutikker i 2013",
    "14": "Antall dagligvarebutikker i 2017",
    "15": "Antall statlige arbeidsplasser 2013",
    "16": "Endring i stalige overføringer",
    "17": "Antall nedlagte bruk siste..(SSB)",

    "18": "Har det skjedd en endring i de statlige overføringene til din kommune siste fire år? Hvordan i så fall?",
    "19": "Opplever du at din kommune er utsatt for en sentralisering? Hvordan i så fall?",
    "20": "Har regjeringen gjennomført tiltak som har gitt positiv effekt for din kommune? Hva i så fall?",
    "21": "Har regjeringen gjennomført tiltak som har gitt negativ effekt for din kommune? Hvilke i så fall?",
    "22": "Hva er din kommunes største utfordring?",
    "23": "Klarer dere å levere de tjenestene innbyggerne skal ha?",
    "24": "Hva mener du skal til for å opprettholde levekraftige distrikter?",
    "25": "Hva er det beste og verste med bygda/distriktet?",
    "26": "Hva er det beste og verste med byen?",
    "27": "Hvorfor bor du på bygda/distriktet?",
    "28": "Hvordan ser kommunen din ut om fem år? Er du mest optimistisk eller mest pessimistisk?",
    "29": "Fins det egne verdier på bygda/distriktet?",
    "30": "Hvordan er brannberedskapen i din kommune? Endring?",
    "31": "Hvordan er ambulanseberedskapen i din kommune?",
    "32": "Hvordan er politiberedskapen?",
    "33": "Hvordan er den offentlige kommunikasjonen og infrastrukturen? Endring?",
    "34": "Fortell om din kommunes største suksess siste fire år?",
    "35": "Fortell om din kommunes største fiasko siste fire år?",
    "36": "Har situasjonen i din kommune blitt bedre eller dårligere de siste fire årene? Ingen endring?",
    "37": "Tittel",
    "38": "ingress",
    "39": "Sitat"
};

function getTitel(data) {
    return data[37];
}

function getIngress(data) {
    return data[38];
}

function getSitat(data) {
    return data[39];
}

function getQ(id) {
    return questions[id];
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
        if (q == 16) a = (a.match(/-/) ? 'ned ' : 'opp ') + a.replace(/%/, "prosent") + " siden 2012";

        $('.mode-map--desc').append('<li><strong>' + getQ(q) + ':</strong> ' + a + '</li>');
    } else {
        $('.mode-map--desc').append('<h3>' + getQ(q) + '</h3>');
        $('.mode-map--desc').append('<p>' + a + '</p>');
    }
}


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

    $(infoTab).css('transform', '');

    // Add text to popup
    $('.mode-map-info__bar--title').text(this.data.Ordfører + ' (' + this.pv + '), ' + this.data.Alder + 'år');

    var url = 'http://www.adressa.no/nyheter/sortrondelag/2017/08/11/Skal-avh%C3%B8re-ansatte-og-ledelsen-ved-Ler%C3%B8y-Midt-15139978.ece';
    var ogimage = '123456789';
    url += '?imageid=' + ogimage + '#kommune=' + this.data.ID;
    $('.mode-map-info--ingress').html('<div class="fb-share-button" data-href="' + url + '" data-layout="button" data-size="small" data-mobile-iframe="true"><a class="fb-xfbml-parse-ignore" target="_blank" href="https://www.facebook.com/sharer/sharer.php?u=' + url + '?' + this.data.ID + '%26ogimage%3D' + ogimage + '&amp;src=sdkpreparse">Del på Facebook</a></div>');

    // Intervju
    $('.mode-map--desc').html('<h1>' + getTitel(this.data) + '</h1>');
    for (var question in this.data) {
        if (blacklist.indexOf(question) > -1 || infolist.indexOf(question) > -1) continue;
        printQA(question, this.data[question]);
    }

    // Fakta
    $('.mode-map--desc').append('<ul>');
    $('.mode-map--desc').append('<li><strong>Innbyggertall</strong>: ' + calcInbygger(this.data[1], this.data[2]) + '</li>')
    for (var question in this.data) {
        if (infolist.indexOf(question) < 0) continue;
        var answer = this.data[question];
        printQA(question, this.data[question], true);
    }
    $('.mode-map--desc').append('</ul>');

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
            scrollTop: $('.mode-list ul').scrollTop() + $(this.elm).position().top - 48,
        }, 200);
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
