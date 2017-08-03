//--------------------------------------------------//
// Todo
//--------------------------------------------------//

    // * string replacements
    // * setup basic files

//--------------------------------------------------//
// Options
//--------------------------------------------------//

let options = {

    // Uncompressed production files are compiled to:
    source_folder : 'prod',
    // Distribution files are compiled to:
    destination_folder : 'dist',

    // lastest versions of browsers to support
    autoprefixer : 4,

    // Name of destination_folder/css/filename.css
    main_css_file : 'main.css',

    // Sourcemaps
    sourcemaps : true,

    // HTML minify
    enable_htmlmin : true,
    htmlmin : {
        collapseWhitespace: true
    },

    // Javascript
    js_concat_all : true,
    js_concat_name : 'app.js',
    // concats these if js_concat_all = false
    js_concat_some : ['js/filename1.js', 'js/filename2.js', 'js/etc.js'],

    images : {
        '**/*.{png,gif,jpg}': [
            {
                width: 1920,
                rename :  { suffix: '-1920' },
            }, {
                width: 1800,
                rename :  { suffix: '-1800' },
            }, {
                width: 1680,
                rename :  { suffix: '-1680' },
            }, {
                width: 1440,
                rename :  { suffix: '-1440' },
            }, {
                width: 1280,
                rename :  { suffix: '-1280' },
            }, {
                width: 1024,
                rename :  { suffix: '-1024' },
            }, {
                width: 800,
                rename :  { suffix: '-800' },
            }, {
                width: 640,
                rename :  { suffix: '-640' },
            }, {
                width: 480,
                rename :  { suffix: '-480' },
            }, {
                width: 320,
                rename :  { suffix: '-320' },
            }, {
                width: 160,
            }
        ]
    },
};

//--------------------------------------------------//
// Require
//--------------------------------------------------//

const gulp              = require('gulp');

const concat            = require('gulp-concat');
const uglify            = require('gulp-uglify');

// Pump: Source will not be destroyed when using gulp.dest(x)
// https://github.com/mafintosh/pump
const pump              = require('pump');

// Require sharp: npm install sharp
const responsive        = require('gulp-responsive');
const imagemin          = require('gulp-imagemin');
const changed           = require('gulp-changed');

const sass              = require('gulp-sass');
const postcss           = require('gulp-postcss');
const autoprefixer      = require('autoprefixer');
const cssnano           = require('gulp-cssnano');
const sourcemaps        = require('gulp-sourcemaps');
const gulpif            = require('gulp-if');

const watch             = require('gulp-watch');


const del               = require('del');

// Replace string in files
const replace           = require('gulp-replace');

// Gulp Utilities - Console log
const gutil             = require('gulp-util');
// Colors for gutil
const chalk             = require('chalk');
const htmlmin           = require('gulp-htmlmin');

// Allow to run one task after another
const runSequence       = require('run-sequence');

// Paths
let paths = {
    scss: 'src/scss/**/*',
    js: 'src/js/**/*',
    html: 'src/html/**/*',
    scale: 'src/scale/images/**/*',
    images: options.source_folder+'/images/'
};

//--------------------------------------------------//
// Production Tasks
//--------------------------------------------------//

// Scss / css
gulp.task('scss', function() {
    return gulp.src(paths.scss+'.scss')
            //Compile Scss
            .pipe(sass().on('error', sass.logError))

            // sourcemaps start
            .pipe(gulpif(options.sourcemaps, sourcemaps.init()))

            // Add autoprefixer
            .pipe(postcss([
                autoprefixer({
                    browsers: ['last '+options.autoprefixer+' versions']
                }),
            ]))

            // Write sourcemaps
            .pipe(gulpif(options.sourcemaps, sourcemaps.write()))

            // Concat to app.css
            //.pipe(concat('app.css'))

            // Deliver to src/css
            .pipe(gulp.dest(options.source_folder+'/css/')).on('end', function() {
                gutil.log('Source compiled');
            })
});


gulp.task('js', function() {
    return gulp.src(gulpif(options.js_concat_all, paths.js+'.js', options.js_concat_some))
        .pipe(concat(options.js_concat_name))
        .pipe(gulp.dest(options.source_folder+'/js/'));
});

gulp.task('html', function(){
    return gulp.src('src/**/*.html')
        .pipe(gulp.dest(options.source_folder+'/'));
});

// Churn deeze images
gulp.task('rs-img', function () {
    var dest = options.source_folder+'/images';
    return gulp.src(paths.scale)
        // cachename can be anything, does not need to be rs-img
        .pipe(changed(paths.images))
        .pipe(responsive(options.images).on('error', function() {
            gutil.log('Responsive image error');
        }))
        .pipe(gulp.dest(paths.images))
});


//--------------------------------------------------//
// Distribution Tasks
//--------------------------------------------------//

// Compress images from prod to dist
gulp.task('dist:compress', function() {
    return gulp.src(paths.images+'**/*')
        .pipe(changed(options.destination_folder+'/images'))
        .pipe(imagemin())
        .pipe(gulp.dest(options.destination_folder+'/images'))
});

// Build distribution javascript
gulp.task('dist:js', function() {
    return gulp.src(options.source_folder+'/js/'+options.js_concat_name)
        .pipe(uglify())
        .pipe(gulp.dest(options.destination_folder+'/js/'));
});

// Build distribution css
gulp.task('dist:css', function() {
    return gulp.src(options.source_folder+'/css/**/*.css')
        // Css concatination
        .pipe(concat(options.main_css_file))

        // Minify css
        .pipe(cssnano())

        // Deliver to dist/css
        .pipe(gulp.dest(options.destination_folder+'/css/')).on('end', function() {
            gutil.log('Source -> Dist Concat');
        })
});

// Build distribution html file
gulp.task('dist:html', function(){
    return gulp.src(options.source_folder+'/**/*.html')
        .pipe(gulpif(options.enable_htmlmin, htmlmin(options.htmlmin)))
        .pipe(gulp.dest(options.destination_folder+'/'));
});

//--------------------------------------------------//
// Task Bundles
//--------------------------------------------------//

// Watch deeze folders
gulp.task('watch', function() {
    gulp.watch(paths.scss, ['scss']);
    gulp.watch(paths.js, ['js']);
    gulp.watch(paths.scale, ['rs-img']);
    gulp.watch('src/**/*.html', ['html']);
});

// Default (when i gulp)
gulp.task('img', ['rs-img']);

// Clear production and distribution folder
gulp.task('build:clear', function() {
    return gulpif(options.source_folder !== 'src', del([options.source_folder+'**/*', options.source_folder, options.destination_folder+'**/*', options.destination_folder]));
});


gulp.task('build:source', ['scss', 'js', 'html', 'rs-img']);

// Distribution task
gulp.task('build:dist', function() {
    runSequence('build:source', 'dist:css', 'dist:html', 'dist:js', 'dist:compress', function() {
        gutil.log(chalk.bold.green('Your Project is now ready for the web!'));
    });
});

// Build all
gulp.task('build', ['build:source', 'build:dist']);

// Default task, run on $ Gulp
gulp.task('default', ['watch', 'build:source']);

const green = chalk.green;
const bold = chalk.bold.green;
gulp.task('help', function () {
    gutil.log(`


                                                            _
             /\\                                            | |
            /  \\    __ _  _ __    ___    ___    __ _       | |  ___   _ __    __ _  ___
           / /\\ \\  / _' || '_ \\  / _ \\  / _ \\  / _' |  _   | | / _ \\ | '_ \\  / _' |/ __|
          / ____ \\| (_| || | | ||  __/ | (_) || (_| | | |__| || (_) || | | || (_| |\\__ \\
         /_/    \\_\\\\__, ||_| |_| \\___|  \\___/  \\__, |  \\____/  \\___/ |_| |_| \\__,_||___/
                    __/ |                       __/ |
                   |___/                       |___/


    ${green('$ gulp')}

    ${green('$ gulp help')}
        this message

    ${bold('build: [source|dist|clear]')}

    ${green('$ gulp build')}
        Build Source and Dist

    ${green('$ gulp build:source')}
        Build a production enviorment for the project.
        Will not compress any files.
        adds sourcemaps

    ${green('$ gulp build:dist')}
        Build a distribution enviorment for the project.
        will compress all files, no sourcemaps

    ${green('$ gulp build:clear')}
        will delete both distribution and production enviorments.

    ${bold('Single actions Production:')}

    ${green('$ gulp scss')}
        Compile and concat scss

    ${green('$ gulp js')}
        Compile and concat js to `+options.source_folder+`/js/`+options.js_concat_name+`

    ${green('$ gulp html')}
        Send src/*.html to `+options.source_folder+`/*.html

    ${green('$ gulp rs-img')}
        will compile compressed versions of all files under scale/images/**
        works with jpg,png and gif

    ${green('$ gulp img')}
        Alias of $ gulp rs-img

    ${bold('Single actions Distribution:')}

    ${green('$ gulp dist:compress')}
        Compress images from Production to `+options.destination_folder+`/

    ${green('$ gulp dist:html')}
        Compress html to `+options.destination_folder+`/

    ${green('$ gulp dist:css')}
        Compress scss/css to `+options.destination_folder+`/css/`+options.main_css_file+`

    ${green('$ gulp dist:js')}
        Compress and concat js to `+options.destination_folder+`/js/`+options.js_concat_name+`


    `);

});
