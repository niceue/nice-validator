#!/usr/local/bin/node

var fs = require('fs'),
    path = require('path'),
    tpl = require('./tpl.js'),
    LOCAL_DIR = 'local/',
    OUT_DIR = '../local/',
    compiler = tpl( fs.readFileSync( LOCAL_DIR + '_lang.tpl' ).toString() );

console.log('building...');
task(LOCAL_DIR);

function task(src){
    fs.readdirSync(src).forEach(function(f){
        var name = path.basename(f);
        if ( /^[a-z]{2}(?:_[A-Z]{2})?\.js/.test(name) ) {
            build( name );
        }
    });
}

function build(name) {
    var obj = require('../' + LOCAL_DIR + name),
        data = obj.lang,
        outfile = path.join(OUT_DIR, name),
        str;

        data.local_string = obj.local;
        data.rules = obj.rules;
        str = compiler.render(data);

        fs.writeFileSync(outfile, str);
        console.log( 'ok: '+outfile );
}
