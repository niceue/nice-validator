#!/usr/local/bin/node

var fs = require('fs'),
    //https://github.com/mishoo/UglifyJS2
    U2 = require("uglify-js"),
    //http://learnboost.github.io/stylus/
    stylus = require('stylus');

var pkg = JSON.parse(fs.readFileSync(__dirname + '/package.json')),
    NS = pkg.name,
    COPYRIGHT = '/*! '+ pkg.title +' '+ pkg.version +'\n'
              + '* (c) 2012-2013 '+ pkg.author +', MIT Licensed\n'
              + '* '+ pkg.homepage +'\n'
              + '*/',
    js = fs.readFileSync(__dirname + '/src/'+ NS +'.js').toString(),
    css = fs.readFileSync(__dirname + '/src/'+ NS +'.styl').toString();
    
console.log('building and minifying...');
buildJS(js, NS + '.js');
buildCSS(css, NS+'.css');
console.log('done');

function buildJS(js, name) {
    var ast = U2.parse(js),
        compressor,
        code = '';
    
    compressor = U2.Compressor({
        unsafe: true
    });

    ast.figure_out_scope();
    ast = ast.transform(compressor);

    ast.figure_out_scope();
    ast.compute_char_frequency();
    ast.mangle_names();

    code = ast.print_to_string();
    fs.writeFile(__dirname + '/' + name, COPYRIGHT + '\n' + code);
}

function buildCSS(css, name) {
    stylus(css)
        .set('filename', NS + '.styl')
        .set('paths', [__dirname + '/src'])
        .set('compress', true)
        .render(function(err, css){
            if (err) throw err;
            fs.writeFile(__dirname + '/' + name, COPYRIGHT + '\n' + css);
        });
}
