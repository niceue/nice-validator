/*
https://github.com/seajs/seatools/blob/master/tasks/test.js
https://github.com/scottcorgan/tap-spec
*/
var page = require('webpage').create(),
    system = require('system'),
    port = 3000,
    url = system.args[1];


phantom.onError = function(msg, trace) {
  var msgStack = ['PHANTOM ERROR: ' + msg];
  if (trace && trace.length) {
    msgStack.push('TRACE:');
    trace.forEach(function(t) {
      msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function +')' : ''));
    });
  }
  console.error(msgStack.join('\n'));
  phantom.exit(1);
};

page.onError = function(msg, trace) {

  var msgStack = ['ERROR: ' + msg];

  if (trace && trace.length) {
    msgStack.push('TRACE:');
    trace.forEach(function(t) {
      msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function +'")' : ''));
    });
  }
  console.error(msgStack.join('\n'));

};

page.onConsoleMessage = function(msg) {
    var type = 'pass';

    console.log(color(msg, type));

    if (msg.substr(0,6) === '# fail' && +msg.substring(7)) {
        phantom.exit(1);
    } else {
        phantom.exit(0);
    }

    /*if (msg === 'END') {
    var result = page.evaluate(function() {
      return result
    })

    if (result.error.count + result.fail.count) {
      phantom.exit(1)
    } else {
      phantom.exit(0)
    }
    }*/
}



page.open(url, function(status) {
  if (status !== 'success') {
    console.log(color('FAIL to load this address: ' + url))
  }
  console.log(url, status)
})


// https://github.com/loopj/commonjs-ansi-color/blob/master/lib/ansi-color.js
var ANSI_CODES = {
  'fail': 31, // red
  'error': 31, // red
  'pass': 32, // green
  'info': 37 // white
}

function color(str, type) {
  return '\033[' +
      (ANSI_CODES[type] || ANSI_CODES['info']) + 'm  '
      + str + '\033[0m'
}