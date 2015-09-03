var fs = require('fs'),
    path = require('path'),
    gulp = require('gulp'),
    cp = require('child_process'),
    insert = require('gulp-insert'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    stylus = require('gulp-stylus');

var pkg = require('./package');
var banner = '/*! nice Validator '+ pkg.version +'\n'+
          ' * (c) 2012-2015 '+ pkg.author +', MIT Licensed\n'+
          ' * '+ pkg.homepage +'\n'+
          ' */';


// run jshint
gulp.task('lint', function () {
    gulp.src(['src/*.js', 'src/local/*.js', 'test/unit/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
});

// run unit tests
gulp.task('test', ['lint'], function (done) {
    cp.exec('mocha-phantomjs test/index.html', function (error, stdout, stderr){
        console.log(stdout);
        if (stderr) console.log(stderr);
        if (error) console.log('exec error: ' + error);
        done();
    });
    
});

// build main files
gulp.task('build', ['test'], function () {
    gulp.src('src/jquery.validator.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(insert.transform(function(contents) {
            return contents.replace(/\/\*\![\s\S]+?\*\//, banner);
        }))
        .pipe(gulp.dest('src'))
        .pipe(uglify())
        .pipe(insert.prepend(banner + '\n'))
        .pipe(gulp.dest('./'));

    gulp.src('src/jquery.validator.styl')
        .pipe(stylus(/*{compress: true}*/))
        .pipe(gulp.dest('./'));
});

// build local settings
gulp.task('i18n', function () {
    var compiler = tpl( fs.readFileSync( 'src/local/_lang.tpl' ).toString() );
    
    fs.readdirSync('src/local/').forEach(function(f){
        var name = path.basename(f);
        if ( /^[a-z]{2}(?:-[A-Z]{2})?\.js/.test(name) ) {
            i18n( name );
        }
    });

    function i18n(name) {
        var obj = require('./src/local/' + name),
            data = obj.lang,
            outfile = path.join('./local/', name),
            str;

            data.local_string = obj.local;
            data.rules = obj.rules;
            str = compiler.render(data);

            fs.writeFileSync(outfile, str);
            console.log( 'ok: '+ outfile );
    }
});

// when release a version
gulp.task('release', ['build', 'i18n'], function () {
    gulp.src('./niceValidator.jquery.json')
        .pipe(insert.transform(function(contents) {
            return contents.replace(/("version":\s")([^"]*)/, "$1" + pkg.version);
        }))
        .pipe(gulp.dest('./'));

    var zip = require('gulp-zip');
    gulp.src([
            "src/jquery.validator.js",
            "images/*", "!images/Thumbs.db",
            "local/*",
            "demo/**/*",
            "jquery.validator.js",
            "jquery.validator.css",
            "README.md"
        ], {base: './'})
        .pipe(zip(pkg.name + '-' + pkg.version  + '.zip'))
        .pipe(gulp.dest('./'));
});

gulp.task('default', ['build', 'i18n']);


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