#!/usr/local/bin/node

var fs = require('fs'),
    U2 = require("uglify-js"),
    stylus = require('stylus');

var NS = 'validator',
    VERSION = '1.0',
    COPYRIGHT = '/*! Nice Validator '+ VERSION +'\n'
              + '* (c) 2012-2013 Jony Zhang (www.niceue.com), MIT Licensed\n'
              + '* http://niceue.github.io/validator\n'
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
        .set('compress', true)
        .render(function(err, css){
            if (err) throw err;
            fs.writeFile(__dirname + '/' + name, COPYRIGHT + '\n' + css);
        });
}
