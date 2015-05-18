/*
https://github.com/seajs/seatools/blob/master/tasks/test.js
https://github.com/scottcorgan/tap-spec
*/
var fs = require('fs');
var path = require('path');
var print = require('util').print;
var http = require('http');
var spawn = require('child_process').spawn;
var Static = require('node-static');


createServer('test/index.html?console', function(code) {
    printResult(' code is ' + code);
});



function createServer(filepath, callback, port) {
    port = parseInt(port || 3000, 10);
    var fileServer = new Static.Server(fs.realpathSync('./'));

    var server = http.createServer(function(request, response) {
        request.addListener('end',function() {
            fileServer.serve(request, response);
        }).resume();
    });

    server.listen(port, function() {
        var url =  'http://localhost:' + port + '/' + filepath;
        var runner = spawn(
                process.platform === "win32" ? "phantomjs.cmd" : "phantomjs",
                [path.join(__dirname, './phantom.js'), url]
            );

        runner.stdout.on('data', function(data) {
            printResult(data.valueOf());
        });

        runner.on('exit', function(code) {
            if (code === 127) {
                print('phantomjs not available');
            }
            server.close();
            callback(code);
        });
    });
}

function printResult(value) {
    var prefix = '         result:';

    value = value.toString()
    .split(/\n/)
    .map(function(item) {
      if (item) {
        return prefix + item;
      } else {
        return item;
      }
    })
    .join('\n');
    print(value);
}