var fs = require('fs'),
    Stream = require('stream'),
    path = require('path'),
    gulp = require('gulp'),
    insert = require('gulp-insert'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    stylus = require('gulp-stylus'),
    rename = require('gulp-rename'),
    mochaPhantomJS = require('gulp-mocha-phantomjs');

var pkg = require('./package.json'),
    DIST = 'dist',
    banner = '/*! '+ pkg.name +' '+ pkg.version +'\n'+
             ' * (c) 2012-'+ new Date().getFullYear() +' '+ pkg.author +', MIT Licensed\n'+
             ' * '+ pkg.homepage +'\n'+
             ' */';


// run jshint
gulp.task('lint', function () {
    gulp.src(['src/*.js', 'src/local/*.js', 'test/unit/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
});

// build js
gulp.task('build-js', function () {
    gulp.src('src/jquery.validator.js')
        .pipe(insert.prepend(banner + '\n'))
        .pipe(gulp.dest(DIST))
        .pipe(uglify())
        .pipe(insert.prepend(banner + '\n'))
        .pipe(rename({suffix:'.min'}))
        .pipe(gulp.dest(DIST));
});

// build css
gulp.task('build-css', function () {
    gulp.src('src/jquery.validator.styl')
        .pipe(stylus())
        .pipe(gulp.dest(DIST));
});

// copy images
gulp.task('copy-images', function () {
    gulp.src('src/images/*')
        .pipe(rename({dirname:'images'}))
        .pipe(gulp.dest(DIST));
});

// build local settings
gulp.task('i18n', function () {
    var compiler = tpl( fs.readFileSync( 'src/local/_lang.tpl' ).toString() );

    gulp.src('src/local/*.js')
        .pipe(i18n())
        .pipe(rename({dirname:'local'}))
        .pipe(gulp.dest(DIST));

    function i18n() {
        var stream = new Stream.Transform({objectMode: true});
        stream._transform = function(chunk, encoding, callback) {
            var data = require(chunk.path),
                str = compiler.render(data);

            chunk._contents = new Buffer(str);

            this.push(chunk);
            callback();
        };
        return stream;
    }
});

// run unit tests
gulp.task('test', function () {
    return gulp
        .src('test/index.html')
        .pipe(mochaPhantomJS({
            reporter: 'spec',
            phantomjs: {
                useColors:true
            }
        }));
});

// when release a version
gulp.task('release', ['build', 'test'], function () {
    var zip = require('gulp-zip');
    gulp.src([
            "dist/**", "!images/Thumbs.db",
            "demo/**",
            "package.json",
            "README.md"
        ], {base: './'})
        .pipe(zip(pkg.name + '-' + pkg.version  + '.zip'))
        .pipe(gulp.dest('./'));
});


gulp.task('build', ['lint', 'build-js', 'build-css', 'copy-images', 'i18n']);
gulp.task('default', ['build', 'test']);


// tiny template engine
function Compiler(html) {
    html = html || '';
    if (/\.(?=tpl|html)$/.test(html)) html = fs.readFileSync(html);
    var begin = '<#',
        end = '#>',
        ecp = function(str){
            return str.replace(/('|\\)/g, '\\$1').replace(/\r\n/g, '\\r\\n').replace(/\n/g, '\\n');
        },
        str = "var __='',echo=function(s){__+=s};with(_$||{}){",
        blen = begin.length,
        elen = end.length,
        b = html.indexOf(begin),
        e,
        tmp;
        while(b != -1) {
            e = html.indexOf(end);
            if(e < b) break;
            str += "__+='" + ecp(html.substring(0, b)) + "';";
            tmp = html.substring(b+blen, e).trim();
            if( tmp.indexOf('=') === 0 ) {
                tmp = tmp.substring(1);
                str += "typeof(" + tmp + ")!='undefined'&&(__+=" + tmp + ");";
            } else {
                str += tmp;
            }
            html = html.substring(e + elen);
            b = html.indexOf(begin);
        }
        str += "__+='" + ecp(html) + "'}return __";
        this.render = new Function("_$", str);
}

function tpl(html, data) {
    var me = new Compiler(html);
    return data ? me.render(data) : me;
};