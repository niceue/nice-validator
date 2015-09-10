## nice Validator
[![Build Status](https://travis-ci.org/niceue/nice-validator.png)](https://travis-ci.org/niceue/nice-validator)
[![License MIT](https://img.shields.io/badge/license-MIT-blue.svg)](http://niceue.com/licenses/MIT-LICENSE.txt)

Simple, smart and pleasant validation solution.

### Getting started
#####Download the [last release](https://github.com/niceue/nice-validator/releases)  
or installation by package manager via [npm](https://www.npmjs.com/)
```bash
$ npm install nice-validator
```
width [Bower](http://bower.io/)
```bash
$ bower install nice-validator
```
#####Include [jQuery 1.7+](http://jquery.com)  
#####Include nice-validator to your project
width `<script>` tag
```html
<script src="path/to/nice-validator/jquery.validator.js?local=en"></script>
```
via [Requirejs](http://requirejs.org/)
```javascript
requirejs.config({
    paths: {
        validator: 'path/to/nice-validator/local/en'
    }
});
```
via [Sea.js](http://seajs.org/docs/en.html)
```javascript
seajs.config({
    alias: {
        validator: 'path/to/nice-validator/local/zh-CN'
    }
});
```

### Documention
[English](https://github.com/niceue/nice-validator/wiki/Getting-Started)  
[简体中文](http://validator.niceue.com/)  

### Browser Support
  * IE6+
  * Chrome
  * Safari 4+
  * Firefox 3.5+
  * Opera


### Bugs / Contributions
- [Report a bug](https://github.com/niceue/nice-validator/issues)
- To contribute or send an idea, github message me or fork the project

### Build
Make sure [node.js](http://nodejs.org/) v0.10+ have installed.
Then first run the following command to install dependencies:
```bash
$ npm install -g gulp
$ npm install
```
Run the unit test and build:
```bash
$ gulp
```


### License
nice-validator is available under the terms of the [MIT License](http://niceue.com/licenses/MIT-LICENSE.txt).
