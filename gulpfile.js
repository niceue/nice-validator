var fs = require('fs'),
    path = require('path'),
    gulp = require('gulp'),
    insert = require('gulp-insert'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    stylus = require('gulp-stylus'),
    mocha = require('gulp-mocha');

var pkg = require('./package');
var banner = '/*! nice Validator '+ pkg.version +'\n'+
          ' * (c) 2012-2014 '+ pkg.author +', MIT Licensed\n'+
          ' * '+ pkg.homepage +'\n'+
          ' */';


// run jshint
gulp.task('lint', function () {
    gulp.src(['src/*.js', 'test/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
});

// run unit tests
gulp.task('test', ['lint'], function () {
    return gulp.src(['test/test-*.js'], { read: false })
        .pipe(mocha({
            reporter: 'spec',
            globals: {
                should: require('should')
            }
        }));
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
        if ( /^[a-z]{2}(?:_[A-Z]{2})?\.js/.test(name) ) {
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
    var JQUERY_JSON = './niceValidator.jquery.json';
    fs.readFile(JQUERY_JSON, function(err, data){
        if (err) throw err;
        fs.writeFile(
            JQUERY_JSON,
            data.toString().replace(/("version":\s")([^"]*)/, "$1" + pkg.version),
            function(err){
                if (err) throw err;
            }
        );
    });
    var zip = require('gulp-zip');
    return gulp.src([
            'src/jquery.validator.js',
            'images/*', '!images/Thumbs.db',
            'local/*',
            'demo/**/*',
            'jquery.validator.js',
            'jquery.validator.css',
            'README.md'
        ], {base: './'})
        .pipe(zip(pkg.name + '-release-' + pkg.version  + '.zip'))
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