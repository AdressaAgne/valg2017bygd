const breakpoints = {
    mobile: 641,
    tablet: 1024,
    desktop: 1280,
}

const log = (...args) => {
    console.log(args);
}

let w = $(window).width();
window.onresize = function(e) {
    w = $(window).width();
}

function get_permalink() {
    let url = location.href;
    if (url.match(/(.*)(\?k=([a-z]+))/)) {
        return url.replace(/(.*)(\#kommune=([a-z]*))/g, "$3");
    }
    return false;
}
