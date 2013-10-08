/*! nice Validator 0.5.0
 * (c) 2012-2013 Jony Zhang <zj86@live.cn>, MIT Licensed
 * http://niceue.com/validator/
 */
/*jshint browser:true, evil:true*/
(function($, undefined) {
    "use strict";

    var NS = 'validator',
        CLS_MSG_OK = 'n-ok',
        CLS_MSG_ERROR = 'n-error',
        CLS_MSG_TIP = 'n-tip',
        CLS_MSG_LOADING = 'n-loading',
        CLS_INPUT_VALID = 'n-valid',
        CLS_INPUT_INVALID = 'n-invalid',
        CLS_MSG_BOX = 'msg-box',
        ARIA_INVALID = 'aria-invalid',
        DATA_RULE = 'data-rule',
        DATA_TARGET = 'data-target',
        DATA_TIP = 'data-tip',
        DATA_INPUT_STATUS = 'data-inputstatus',
        NOVALIDATE = 'novalidate',
        INPUT_SELECTOR = ':verifiable',

        rRule = /(\w+)(?:\[(.*)\]$|\((.*)\)$)?/,
        rDisplay = /(?:([^:;\(\[]*):)?(.*)/,
        rDoubleBytes = /[^\x00-\xff]/g,
        rPos = /^.*(top|right|bottom|left).*$/,
        rAjaxType = /(?:(post|get):)?(.+)/i,
        rUnsafe = /<|>/g,

        noop = $.noop,
        proxy = $.proxy,
        isFunction = $.isFunction,
        isArray = $.isArray,
        isString = function(s) {
            return typeof s === 'string';
        },
        isObject = function(o) {
            return o && Object.prototype.toString.call(o) === '[object Object]';
        },
        isIE6 = !window.XMLHttpRequest,
        attr = function(el, key, value) {
            if (value !== undefined) {
                if (value === null) el.removeAttribute(key);
                else el.setAttribute(key, '' + value);
            } else {
                return el.getAttribute(key);
            }
        },
        debug = window.console || {
            log: noop,
            info: noop,
            warn: noop
        },

        defaults = {
            debug: 0,
            timely: 1,
            theme: 'default',
            stopOnError: false,
            ignore: '',
            beforeSubmit: noop,
            valid: noop,
            invalid: noop,

            msgWrapper: 'span',
            msgMaker: function(opt) {
                var html,
                    cls = {
                        error: CLS_MSG_ERROR,
                        ok: CLS_MSG_OK,
                        tip: CLS_MSG_TIP,
                        loading: CLS_MSG_LOADING
                    }[opt.type];

                html = '<span class="msg-wrap '+ cls +'" role="alert">';
                html += (opt.arrow || '') + (opt.icon || '') + '<span class="n-msg">' + opt.msg + '</span>';
                html += '</span>';
                return html;
            },
            msgIcon: '<span class="n-icon"></span>',
            msgArrow: '',
            msgClass: '',
            //showOk: true,
            //msgShow: null,
            //msgHide: null,

            defaultMsg: '{0} is not valid.',
            loadingMsg: 'Validating...'
        },
        themes = {
            'default': {
                formClass: 'n-default',
                msgClass: 'n-right',
                showOk: ''
            }
        };

    /** jQuery Plugin
     * @param {Object} options
        debug       {Boolean}   false,      Whether to enable debug mode
        timely      {Boolean}   true,       Whether to enable timely verification
        theme       {String}   'default'    Using which theme
        stopOnError {Boolean}   false,      Whether to stop validate when found an error input
        ignore      {jqSelector}  '',       Ignored fields (Using jQuery selector)
        
        beforeSubmit{Function}              Do something before submitting the form
        valid       {Function}              If form is valid, will trigger this callback
        invalid     {Function}              If form is invalid, will trigger this callback

        msgShow     {Function}  null        When show a message, will trigger this callback
        msgHide     {Function}  null        When hide a message, will trigger this callback
        
        msgWrapper  {String}    'span'      Message wrapper tag name
        msgMaker    {Function}              Message HTML maker
        msgIcon     {String}    ''          Icon template
        msgArrow    {String}    ''          Small arrow template
        msgClass    {String}    ''          Additional added to the message class names
        formClass   {String}    ''          Additional added to the form class names

        defaultMsg  {String}                Default error message
        loadingMsg  {String}                Tips for asynchronous loading
        
        rules       {Object}    null,       Custom rules for the current instance
        messages    {Object}    null,       Custom messages for the current instance
        
        fields      {Object}                Field set to be verified
        {String} key    name|#id
        {String|Object} value               Rule string, or an object is passed more arguments

        fields[key][rule]     {String}      Rule string
        fields[key][tip]      {String}      Custom friendly message when focus the input
        fields[key][ok]       {String}      Custom success message
        fields[key][msg]      {Object}      Custom error message
        fields[key][msgMaker] {Function}    Custom message HTML maker
        fields[key][timely]   {Boolean}     Whether to enable timely verification
        fields[key][target]   {jqSelector}  Verify the current field, but the message can be displayed on target element
     */
    $.fn[NS] = function(options) {
        var that = this,
            args = arguments;
        if (that.is(':input')) return that;
        !that.is('form') && (that = this.find('form'));
        !that.length && (that = this);
        that.each(function() {
            if (isString(options)) {
                if (options.charAt(0) === '_') return;
                var cache = $(this).data(NS);
                if (cache) {
                    cache[options].apply(cache, Array.prototype.slice.call(args, 1));
                }
            } else {
                new Validator(this, options);
            }
        });
        return this;
    };

    // Validate a field, or an area
    $.fn.isValid = function(callback, checkOnly) {
        var me = getInstance(this[0]), $inputs, ret;
        if (!me) return true;
        // By default only verify without prompt message
        if (checkOnly === undefined) checkOnly = true;
        me.checkOnly = checkOnly;
        $inputs = this.is(':input') ? this : this.find(INPUT_SELECTOR);
        ret = me._multiValidate($inputs, function(isValid){
            isFunction(callback) && callback.call(null, isValid);
            me.checkOnly = false;
        }, true);
        // If you pass a callback, we maintain the jQuery object chain
        return isFunction(callback) ? this : ret;
    };

    // A faster selector than ":input:not(:submit,:button,:reset,:disabled,[novalidate])"
    $.expr[":"].verifiable = function(elem) {
        var name = elem.nodeName.toLowerCase();
        return (name === 'input' && elem.type !== 'submit' && elem.type !== 'button' && elem.type !== 'reset' ||
                name === 'select' || name === 'textarea') && elem.disabled === false && !attr(elem, NOVALIDATE);
    };

    // Constructor for validator
    function Validator(element, options) {
        var me = this, themeOpt, dataOpt;
        if (!me instanceof Validator) return new Validator(element, options);
        
        if (isFunction(options)) {
            options = {
                valid: options
            };
        }
        options = options || {};
        if (options.valid) me.isAjaxSubmit = true;

        dataOpt = attr(element, 'data-'+NS+'-option');
        dataOpt = dataOpt && dataOpt.charAt(0) === '{' ? (new Function("return " + dataOpt))() : {};
        themeOpt = themes[ options.theme || dataOpt.theme || defaults.theme ];

        me.options = $.extend({}, defaults, themeOpt, dataOpt, options);
        me.$el = $(element);
        me.rules = new Rules(me.options.rules, true);
        me.messages = new Messages(me.options.messages, true);
        me.elements = {};
        me.fields = {};
        me.deferred = {};
        me.errors = {};
        me.isValid = true;
        me._init();
    }

    Validator.prototype = {
        _init: function() {
            var me = this,
                opt = me.options,
                fields = me.fields;

            // Initialization group verification
            if (isArray(opt.groups)) {
                $.map(opt.groups, function(obj) {
                    if (!isString(obj.fields) || !isFunction(obj.callback)) return null;
                    var $elememts = me.$el.find(keys2selector(obj.fields)),
                        fn = function() {
                            return obj.callback.call(me, $elememts);
                        };
                    $.extend(fn, obj);
                    $.map(obj.fields.split(' '), function(k) {
                        fields[k] = fields[k] || {};
                        fields[k].group = fn;
                    });
                });
            }

            // Processing field information
            if (isObject(opt.fields)) {
                $.each(opt.fields, function(k, v) {
                    if (v) fields[k] = isString(v) ? {
                        rule: v
                    } : v;
                });
            }
            me.$el.find(INPUT_SELECTOR).each(function() {
                me._parse(this);
            });

            // Message parameters
            me.msgOpt = {
                type: 'error',
                pos: getPos(opt.msgClass),
                cls: opt.msgClass,
                style: opt.msgStyle,
                icon: opt.msgIcon,
                arrow: opt.msgArrow,
                show: opt.msgShow,
                hide: opt.msgHide
            };

            // Processing events and cache
            if (!me.$el.data(NS)) {
                me.$el.on('submit.'+NS + ' validate.'+NS, proxy(me, '_submit'))
                    .on('reset.'+NS, proxy(me, '_reset'))
                    .on('validated.field.'+NS, INPUT_SELECTOR, proxy(me, '_validatedField'))
                    .on('validated.rule.'+NS, INPUT_SELECTOR, proxy(me, '_validatedRule'))
                    .on('focusin.'+NS + ' click.'+NS + ' showtip.'+NS, INPUT_SELECTOR, proxy(me, '_focus'))
                    .on('focusout.'+NS + ' validate.'+NS, INPUT_SELECTOR, proxy(me, '_blur'))
                    .on('click.'+NS, ':radio,:checkbox', proxy(me, '_click'));
                if (opt.timely >= 2) {
                    me.$el.on('keyup.'+NS + ' paste.'+NS, INPUT_SELECTOR, proxy(me, '_blur'))
                          .on('change.'+NS, 'select', proxy(me, '_click'));
                }
                me.$el.data(NS, me).addClass('n-' + NS + ' ' + opt.formClass);

                // Initialization is complete, stop off default HTML5 form validation, and as a basis has been initialized
                // jQuery's "attr('novalidate')" in IE7 will complain: "SCRIPT3: Member not found."
                attr(me.$el[0], NOVALIDATE, true);
            }
        },

        // Verify a zone
        _multiValidate: function($inputs, doneCallbacks, must){
            var me = this,
                opt = me.options;
            if (opt.ignore) $inputs = $inputs.not(opt.ignore);

            me.isValid = true;
            me.deferred = {};

            $inputs.each(function(i, el) {
                var field = me.getField(el);
                if (!field) return;

                me._validate(el, field, must);
                if (!me.isValid && opt.stopOnError) {
                    // stop the verification
                    return false;
                }
            });

            // Need to wait for the completion of all field validation (especially asynchronous verification)
            $.when.apply(
                null,
                $.map(me.deferred, function(v){return v;})
            ).done(function(){
                doneCallbacks.call(me, me.isValid);
            });

            // If the form does not contain asynchronous validation, the return value is correct.
            // Otherwise, you should detect whether a form valid through "doneCallbacks".
            return !$.isEmptyObject(me.deferred) ? undefined : me.isValid;
        },

        // Verify the whole form
        _submit: function(e, mark) {
            var me = this,
                opt = me.options,
                form = e.target;
            // Prevent duplicate submission
            if (me.submiting && mark !== 'only') {
                isFunction(me.submiting) && me.submiting.call(me);
                return e.preventDefault();
            }

            // We found the "only" mark, and make the native event continues.
            // Receive the "validate" event only from the form.
            if (mark === 'only' || e.type === 'validate' && form.tagName !== 'FORM') return;
            // If we do not want to submit the form.
            if ( opt.beforeSubmit.call(me, form) === false ) return e.preventDefault();
            
            if (me.isAjaxSubmit === undefined) {
                if ( attr(form, 'action') === null ) me.isAjaxSubmit = true;
                else {
                    // if there is "valid.form" event
                    var events = $[ $._data ? '_data' : 'data' ](me.$el[0], "events");
                    if (events && events.valid &&
                        $.map(events.valid, function(e){
                            return e.namespace.indexOf('form') !== -1 ? 1 : null;
                        }).length
                    ) {
                        me.isAjaxSubmit = true;
                    } else {
                        me.isAjaxSubmit = false;
                    }
                }
            }

            me._reset();
            me.submiting = true;

            me._multiValidate(
                me.$el.find(INPUT_SELECTOR),
                function(isValid){
                    var FOCUS_EVENT = 'focus.field',
                        ret = (isValid || opt.debug === 2) ? 'valid' : 'invalid',
                        errors;

                    if (isValid) {
                        if (!me.isAjaxSubmit) {
                            // trigger the native submit event
                            $(form).trigger('submit', ['only']);
                        }
                    } else {
                        // navigate to the error element
                        var $input = me.$el.find(':input.' + CLS_INPUT_INVALID + ':first');
                        $input.trigger(FOCUS_EVENT);
                        // IE6 has to trigger once again to get the focus
                        isIE6 && $input.trigger(FOCUS_EVENT);
                        errors = $.map(me.errors, function(err){
                            return err;
                        });
                    }

                    opt[ret].call(me, form, errors);
                    me.$el.trigger(ret + '.form', [form, errors]);

                    // releasing submit
                    me.submiting = false;
                },
                true
            );

            if (me.isAjaxSubmit || !$.isEmptyObject(me.deferred)) e.preventDefault();

            return me.isValid;
        },

        _reset: function() {
            var me = this;

            $.each(me.elements, function(k, el){
                attr(el, DATA_INPUT_STATUS, null);
                attr(el, ARIA_INVALID, null);
                $(el).removeClass(CLS_INPUT_VALID + " " + CLS_INPUT_INVALID);
                me.hideMsg(el);
            });
            me.errors = {};
            me.isValid = true;
        },

        _focus: function(e) {
            var el = e.target;
            if (this.submiting || el.value !== '' && (attr(el, ARIA_INVALID) === 'false' || attr(el, DATA_INPUT_STATUS) === 'tip')) return;
            this.showMsg(el, {
                msg: attr(el, DATA_TIP),
                type: 'tip'
            });
        },

        // Handle focusout/validate/keyup/click/paste events
        _blur: function(e, isClick) {
            var me = this,
                opt = me.options,
                field,
                must,
                el = e.target,
                etype = e.type,
                timer = 100;

            if (!isClick && etype !== 'paste') {
                // must be verified, if it is a manual trigger
                if (etype === 'validate') {
                    must = true;
                    timer = 0;
                }
                // or doesn't require real-time verification, exit
                else if ( attr(el, 'notimely') ) return;
                // or it isn't a "keyup" event, exit
                else if (opt.timely >= 2 && etype !== 'keyup') return;

                // if the current field is ignored, exit
                if (opt.ignore && $(el).is(opt.ignore)) return;

                if (etype === 'keyup') {
                    var key = e.keyCode,
                        specialKey = {
                            8: 1,  // Backspace
                            9: 1,  // Tab
                            16: 1, // Shift
                            32: 1, // Space
                            46: 1  // Delete
                        };

                    // only gets focus, no verification
                    if (key === 9 && !el.value) return;

                    // do not validate, if triggered by these keys
                    if (key < 48 && !specialKey[key]) return;

                    // keyboard events, reducing the frequency of verification
                    timer = opt.timely >=100 ? opt.timely : 500;
                }
            }

            field = me.getField(el);
            if (!field) return;

            if (timer) {
                if (field.timeout) clearTimeout(field.timeout);
                field.timeout = setTimeout(function() {
                    me._validate(el, field, must);
                }, timer);
            } else {
                // use synchronous verification for "validate" event
                me._validate(el, field, must);
            }
            
        },

        _click: function(e) {
            this._blur(e, true);
        },

        // Parsing a field
        _parse: function(el) {
            var me = this,
                field,
                key = el.name;

            // if the field has passed the key as id mode, or it doesn't has a name
            if (el.id && ('#' + el.id in me.fields) || !el.name) {
                key = '#' + el.id;
            }
            // doesn't verify a field that has neither id nor name
            if (!key) return attr(el, DATA_RULE, null);

            field = me.fields[key] || {};
            if (!field.rule) field.rule = attr(el, DATA_RULE) || '';
            attr(el, DATA_RULE, null);
            if (!field.rule) return;

            field.key = key;
            field.required = field.rule.indexOf('required') !== -1;
            field.must = field.must || !!field.rule.match(/match|checked/);
            if (field.required) attr(el, 'aria-required', true);
            if ('timely' in field && !field.timely || !me.options.timely) {
                attr(el, 'notimely', true);
            }
            if (isString(field.target)) attr(el, DATA_TARGET, field.target);
            if (isString(field.tip)) attr(el, DATA_TIP, field.tip);

            me.fields[key] = me._parseRule(field);
        },

        // Parsing field rules
        _parseRule: function(field) {
            var arr = rDisplay.exec(field.rule),
                rules;

            if (!arr) return;
            field.display = arr[1];
            field.rules = [];
            rules = (arr[2] || '').split(';');
            $.map(rules, function(rule) {
                var parts = rRule.exec(rule);
                if (!parts) return null;
                if (parts[3]) parts[2] = parts[3];
                field.rules.push({
                    method: parts[1],
                    params: parts[2] ? $.trim(parts[2]).split(', ') : undefined
                });
            });
            field.vid = 0;
            field.rid = field.rules[0].method;
            return field;
        },

        // Validated a field
        _validatedField: function(e, field, ret) {
            var me = this,
                opt = me.options,
                el = e.target,
                isValid = field.isValid = !!ret.valid;

            if (isValid) {
                ret.type = 'ok';
            } else if (me.submiting) {
                me.errors[field.key] = ret.msg;
            }
            $(el).attr(ARIA_INVALID, !isValid)
                .addClass(isValid ? CLS_INPUT_VALID : CLS_INPUT_INVALID)
                .removeClass(isValid ? CLS_INPUT_INVALID : CLS_INPUT_VALID)
                .trigger((isValid ? 'valid' : 'invalid') + '.field', [field, ret]);
            
            field.old.ret = ret;
            me.elements[field.key] = el;

            if (field.msgMaker || opt.msgMaker && !me.checkOnly) {
                // error message or ok message
                if ( (!ret.showOk && ret.msg) || (ret.showOk && opt.showOk !== false ) ) {
                    me.showMsg(el, ret, field);
                } else {
                    me.hideMsg(el, ret);
                }
            }
        },

        // Validated a rule
        _validatedRule: function(e, field, ret, msgOpt) {
            field = field || me.getField(el);
            var me = this,
                opt = me.options,
                el = e.target,
                msg = '',
                method = field.rid,
                isValid = false,
                showOk = false;

            msgOpt = msgOpt || {};

            if (ret === true || ret === undefined) {
                isValid = true;
            }
            // ret may be: false, strings, objects
            else {
                /* rule message priority:
                    1. custom message;
                    2. rule returned message;
                    3. built-in rules message;
                    4. the default message
                */
                msg = getDataMsg(el, field, method);
                if (!msg) {
                    if (isString(ret)) {
                        msg = ret;
                        ret = {error: msg};
                    } else if (isObject(ret)) {
                        if (ret.error) {
                            msg = ret.error;
                        } else {
                            isValid = true;
                            if (ret.ok && isString(ret.ok)) showOk = true;
                            msg = ret.ok;
                        }
                    }
                }
                msgOpt.msg = (isValid ? msg : (msg || me.messages[method] || defaults.defaultMsg)).replace('{0}', field.display || '');
            }

            // message analysis, and throw rule level event
            if (!isValid) {
                me.isValid = false;
                $(el).trigger('invalid.rule', [method, msgOpt.msg]);
            } else {
                msgOpt.valid = true;
                if (!showOk) {
                    var okmsg = field.ok || attr(el, 'data-ok');
                    if (okmsg) {
                        showOk = true;
                        msgOpt.msg = okmsg;
                    } else if (isString(opt.showOk)) {
                        showOk = true;
                        msgOpt.msg = opt.showOk;
                    }
                }
                msgOpt.showOk = showOk;
                $(el).trigger('valid.rule', [method, msgOpt.msg]);
            }

            // output the debug message
            if (opt.debug) {
                debug[isValid ? 'info' : 'warn'](field.vid + ': ' + method + ' -> ' + (msgOpt.msg || true));
            }
            // need to re-verify when the value is changed
            if (isValid && field.old.value !== undefined && field.old.value !== el.value) {
                field.vid = 0;
                me._checkRule(el, field);
            }
            // the current rule has passed, continue to validate
            else if (isValid && field.vid < field.rules.length - 1) {
                field.vid++;
                me._checkRule(el, field);
            }
            // field was invalid, or all fields was valid
            else {
                field.vid = 0;
                $(el).trigger('validated.field', [field, msgOpt]);
            }
        },

        // Verify a rule form a field
        _checkRule: function(el, field) {
            var me = this,
                ret,
                key = field.key,
                rule = field.rules[field.vid],
                method = rule.method,
                params = rule.params;

            // request has been sent, wait it
            if (me.submiting && me.deferred[key]) return;
            field.rid = method;
            field.old.value = el.value;

            ret = (getDataRule(el, method) || me.rules[method] || function() {return true;}).call(me, el, params, field);
            
            if (isObject(ret) && isFunction(ret.then)) {
                var parseData = function(data) {
                        if (isString(data) || (isObject(data) && ('error' in data || 'ok' in data))) return data;
                    };
                me.deferred[key] = ret;
                
                !me.checkOnly && me.showMsg(el, {
                    type: 'loading',
                    msg: me.options.loadingMsg
                }, field);
                ret.then(
                    function(d, textStatus, jqXHR) {
                        var msg = jqXHR.responseText, data;
                        if (msg === '') {
                            msg = true;
                        } else if (msg.charAt(0) === '{') {
                            msg = $.parseJSON(msg) || {};
                            data = parseData(msg);
                            if (data === undefined) data = parseData(msg.data);
                            msg = data || true;
                        }
                        $(el).trigger('validated.rule', [field, msg]);
                    },
                    function(jqXHR, textStatus){
                        $(el).trigger('validated.rule', [field, textStatus]);
                    }
                );
                // not yet know whether the field is valid
                field.isValid = undefined;
            } else {
                $(el).trigger('validated.rule', [field, ret]);
            }
        },

        // Processing the validation
        _validate: function(el, field, must) {
            // doesn't validate the element that has "disabled" attribute or "novalidate" attribute
            if ( el.disabled || attr(el, NOVALIDATE) ) return;
            if ( !field.rules ) this._parse(el);

            var me = this,
                opt = me.options,
                $el = $(el),
                msgOpt = {},
                groupFn = field.group,
                old,
                ret,
                isCurrentTip = attr(el, DATA_INPUT_STATUS) === 'tip',
                isValid = field.isValid = true;

            old = field.old = field.old || {};
            must = must || field.must;

            // group validation
            if (groupFn) {
                $.extend(msgOpt, groupFn);
                ret = groupFn.call(me);
                if (ret !== true) {
                    if (isString(ret)) ret = {error: ret};
                    field.vid = 0;
                    field.rid = 'group';
                    isValid = false;
                } else {
                    ret = undefined;
                    me.hideMsg(el, msgOpt);
                }
            }
            // if the field is not required and it has a blank value
            if (isValid && !field.required && el.value === '') {
                if (isCurrentTip) return;
                else me._focus({target: el});
                old.value = '';
                if (!checkable(el)) {
                    $el.trigger('validated.field', [field, {valid: true}]);
                    return;
                }
            }
            // If the value is not changed, just return the old result
            else if (!must && old && old.ret !== undefined && old.value === el.value) {
                if (!old.ret.valid) me.isValid = false;
                if (isCurrentTip) return;
                if (el.value !== '') {
                    msgOpt = old.ret;
                    $el.trigger('validated.field', [field, msgOpt]);
                    return;
                }
            }

            if (opt.debug) debug.log(field.key);

            // if the results are out (old validation results, or grouping validation results)
            if (ret !== undefined) {
                $el.trigger('validated.rule', [field, ret, msgOpt]);
            } else if (field.rule) {
                me._checkRule(el, field);
            }
        },

        _getMsgOpt: function(obj) {
            return $.extend({}, this.msgOpt, isString(obj) ? {msg: obj} : obj);
        },

        // Get field information
        getField: function(el) {
            var me = this,
                key;

            if (el.id && '#' + el.id in me.fields || !el.name) {
                key = '#' + el.id;
            } else {
                key = el.name;
            }
            if (attr(el, DATA_RULE)) me._parse(el);
            return me.fields[key];
        },

        /* Detecting whether the value of an element that matches a rule
         *
         * @interface: test
         */
        test: function(el, rule) {
            var me = this,
                ret,
                parts = rRule.exec(rule),
                method,
                params;

            if (!parts) return true;
            if (parts[3]) parts[2] = parts[3];
            method = parts[1];
            params = parts[2] ? $.trim(parts[2]).split(', ') : undefined;
            if (method in me.rules) {
                ret = me.rules[method].call(me, el, params);
            }
            return ret === true || ret === undefined || ret;
        },

        // Get a range of validation messages
        getRangeMsg: function(value, params, type, suffix) {
            if (!params) return;
            var me = this,
                msg = me.messages[type] || '',
                p = params[0].split('~'),
                a = p[0],
                b = p[1],
                c = 'rg',
                args = [''],
                isNumber = +value === +value;

            if (p.length === 2) {
                if (a && b) {
                    if (isNumber && value >= +a && value <= +b) return true;
                    args = args.concat(p);
                } else if (a && !b) {
                    if (isNumber && value >= +a) return true;
                    args.push(a);
                    c = 'gt';
                } else if (!a && b) {
                    if (isNumber && value <= +b) return true;
                    args.push(b);
                    c = 'lt';
                }
            } else {
                if (value === +a) return true;
                args.push(a);
                c = 'eq';
            }
            if (msg) {
                if (suffix && msg[c + suffix]) {
                    c += suffix;
                }
                args[0] = msg[c];
            }
            return me.renderMsg.apply(null, args);
        },

        /* @interface: renderMsg
         */
        renderMsg: function() {
            var args = arguments,
                tpl = args[0],
                i = args.length;
            if (!tpl) return;
            while (--i) {
                tpl = tpl.replace('{' + i + '}', args[i]);
            }
            return tpl;
        },

        _getMsgDOM: function(el, opt) {
            var $el = $(el), $msgbox, datafor, tgt;
            
            if ($el.is(':input')) {
                tgt = opt.target || attr(el, DATA_TARGET);
                if (tgt) {
                    tgt = this.$el.find(tgt);
                    if (tgt.length) {
                        if (!tgt.is(':input')) {
                            $msgbox = tgt;
                        } else {
                            el = tgt.get(0);
                        }
                    }
                }
                if (!$msgbox) {
                    datafor = !checkable(el) && el.id ? el.id : el.name;
                    $msgbox = this.$el.find(this.options.msgWrapper + '.' + CLS_MSG_BOX + '[for="' + datafor + '"]');
                }
            } else {
                $msgbox = $el;
            }

            if (!$msgbox.length) {
                $el = this.$el.find(tgt || el);
                $msgbox = $('<'+ this.options.msgWrapper + '>').attr({
                    'class': CLS_MSG_BOX + (opt.cls ? ' '+opt.cls : ''),
                    'style': opt.style || '',
                    'for': datafor
                });
                if (checkable(el)) {
                    var $parent = $el.parent();
                    $msgbox.appendTo( $parent.is('label') ? $parent.parent() : $parent );
                } else {
                    $msgbox[!opt.pos || opt.pos === 'right' ? 'insertAfter' : 'insertBefore']($el);
                }
            }
            return $msgbox;
        },

        /* @interface: showMsg
         */
        showMsg: function(el, opt, /*INTERNAL*/ field) {
            opt = this._getMsgOpt(opt);
            if (!opt.msg && !opt.showOk) return;
            el = $(el).get(0);
            // mark message status
            attr(el, DATA_INPUT_STATUS, opt.type);

            var $msgbox = this._getMsgDOM(el, opt),
                cls = $msgbox[0].className;
                
            !rPos.test(cls) && $msgbox.addClass(opt.cls);
            if ( isIE6 && opt.pos === 'bottom' ) {
                $msgbox[0].style.marginTop = $(el).outerHeight() + 'px';
            }
            $msgbox.html( ( (field || this.getField(el)).msgMaker || this.options.msgMaker ).call(this, opt) );
            $msgbox[0].style.display = '';

            isFunction(opt.show) && opt.show.call(this, $msgbox, opt.type);
        },

        /* @interface: hideMsg
         */
        hideMsg: function(el, opt) {
            el = $(el).get(0);
            opt = this._getMsgOpt(opt);

            var $msgbox = this._getMsgDOM(el, opt);
            if (!$msgbox.length) return;

            if ( isFunction(opt.hide) ) {
                opt.hide.call(this, $msgbox, opt.type);
            } else {
                $msgbox[0].style.display = 'none';
            }
        },

        /* @interface: mapMsg
         */
        mapMsg: function(obj) {
            var me = this;

            $.each(obj, function(name, msg) {
                var el = me.elements[name] || me.$el.find(':input[name="' + name + '"]')[0];
                me.showMsg(el, msg);
            });
        },

        /* @interface: setMsg
         */
        setMsg: function(obj) {
            new Messages(obj, this.messages);
        },

        /* @interface: setRule
         */
        setRule: function(obj) {
            new Rules(obj, this.rules);
            $.map(this.fields, function(field){
                field.old = {};
            });
        },

        /* @interface: setField
         */
        setField: function(key, obj) {
            var me = this,
                fields = {};
            if (isString(key)) {
                // remove this field
                if (obj === null) {
                    $.map(key.split(' '), function(k) {
                        if (k && me.fields[k]) me.fields[k] = null;
                    });
                    return;
                }
                // update this field
                else if (obj) {
                    fields[key] = obj;
                }
            }
            // update fields
            else if (isObject(key)) {
                fields = key;
            }

            if (!me.options.fields) {
                me.options.fields = fields;
            } else {
                $.extend(me.options.fields, fields);
            }
            me._init();
        },

        /* @interface: holdSubmit
         */
        holdSubmit: function(hold) {
            if (hold === undefined) hold = true;
            this.submiting = hold;
        },

        /* @interface: destroy
         */
        destroy: function() {
            this._reset();
            this.$el.off('.'+NS).removeData(NS);
        }
    };


    // Rule class
    function Rules(obj, context) {
        var that = context ? context === true ? this : context : Rules.prototype;

        if (!isObject(obj)) return;
        for (var k in obj) {
            that[k] = getRule(obj[k]);
        }
    }

    // Message class
    function Messages(obj, context) {
        var that = context ? context === true ? this : context : Messages.prototype;

        if (!isObject(obj)) return;
        for (var k in obj) {
            if (!obj[k]) return;
            that[k] = obj[k];
        }
    }

    // Rule converted factory
    function getRule(fn) {
        switch ($.type(fn)) {
            case 'function':
                return fn;
            case 'array':
                return function(el) {
                    return fn[0].test(el.value) || fn[1] || false;
                };
            case 'regexp':
                return function(el) {
                    return fn.test(el.value);
                };
        }
    }

    // Convert space-separated keys to jQuery selector
    function keys2selector(keys) {
        var selector = '';
        $.map(keys.split(' '), function(k) {
            selector += ',' + (k.charAt(0) === '#' ? k : '[name="' + k + '"]');
        });
        return selector.substring(1);
    }

    // Get instance by an element
    function getInstance(el) {
        if (!el || !el.tagName) return;
        var wrap = el;
        switch (el.tagName) {
            case 'INPUT':
            case 'SELECT':
            case 'TEXTAREA':
                wrap = el.form || $(el).closest('.n-' + NS);
                break;
            default:
                wrap = $(el).closest('.n-' + NS);
        }
        return $(wrap).data(NS) || $(wrap)[NS]().data(NS);
    }

    // Get custom rules on the node
    function getDataRule(el, method) {
        var fn = $.trim(attr(el, DATA_RULE + '-' + method));
        if (!fn) return;
        fn = (new Function("return " + fn))();
        if (fn) return getRule(fn);
    }

    // Get custom messages on the node
    function getDataMsg(el, field, item) {
        var msg = field.msg;
        if (isObject(msg) && item) msg = msg[item];
        if (!isString(msg)) {
            msg = attr(el, 'data-msg-' + item) || attr(el, 'data-msg') || '';
        }
        return msg;
    }

    // Get message position
    function getPos(str) {
        var pos;
        if (str) pos = rPos.exec(str);
        return pos ? pos[1] : '';
    }

    // Check whether the element is checkbox or radio
    function checkable(el) {
        return el.tagName === 'INPUT' && el.type === 'checkbox' || el.type === 'radio';
    }


    // Global events
    $(function() {
        $('body').on('focusin', ':input['+DATA_RULE+']', function() {
            var el = this, me = getInstance(el);
            if (me) {
                if (attr(el, DATA_RULE)) me._parse(el);
                $(el).trigger('focusin');
            } else {
                attr(el, DATA_RULE, null);
            }
        }).on('click submit', 'form', function(e) {
            if (attr(this, "novalidate")) return;
            var $form = $(this), me;
            if (!$form.data(NS)) {
                me = $form[NS]().data(NS);
                if (!$.isEmptyObject(me.fields)) {
                    e.type==='submit' && me._submit(e);
                } else {
                    attr(this, NOVALIDATE, true);
                    $form.removeData(NS);
                }
            }
        });
    });


    // Built-in rules (global)
    new Rules({

        /** required
         * @example:
            required
         */
        required: function(element) {
            return !!$.trim(element.value);
        },

        /** integer
         * @example:
            integer
            integer[+]
            integer[+0]
            integer[-]
            integer[-0]
         */
        integer: function(element, params) {
            var re, z = '0|',
                p = '[1-9]\\d*',
                key = params ? params[0] : '*';
            switch (key) {
                case '+':
                    re = p;
                    break;
                case '-':
                    re = '-' + p;
                    break;
                case '+0':
                    re = z + p;
                    break;
                case '-0':
                    re = z + '-' + p;
                    break;
                default:
                    re = z + '-?' + p;
            }
            re = '^(?:' + re + ')$';
            return new RegExp(re).test(element.value) || this.messages.integer[key];
        },

        /** match another field
         * @example:
            match[password]    Match the password field (two values ​​must be the same)
            match[lt, count]   The value must be less than the value of the count field
            match[lte, count]  The value must be less than or equal to the value of the count field
            match[gt, count]   The value must be greater than the value of the count field
            match[gte, count]  The value must be greater than or equal to the value of the count field
         **/
        match: function(element, params, field) {
            var a, b,
                key, msg, type = 'eq',
                selector2, elem2, field2;

            if (!params) return;
            if (params.length === 1) {
                key = params[0];
            } else {
                type = params[0];
                key = params[1];
            }
            selector2 = key.charAt(0) === '#' ? key : ':input[name="' + key + '"]';
            elem2 = this.$el.find(selector2)[0];
            if (!elem2) return;
            field2 = this.getField(elem2);

            if (!field.init_match) {
                this.$el.on('valid.field.'+NS, selector2, function(){
                    if ( !field.isValid && element.value ) $(element).trigger('validate');
                });
                field.init_match = 1;
            }

            msg = this.messages.match[type].replace('{1}', field2.display || key);
            a = element.value;
            b = elem2.value;
            switch (type) {
                case 'lt':
                    return (+a < +b) || msg;
                case 'lte':
                    return (+a <= +b) || msg;
                case 'gte':
                    return (+a >= +b) || msg;
                case 'gt':
                    return (+a > +b) || msg;
                default:
                    return (a === b) || msg;
            }
        },

        /** range numbers
         * @example:
            range[0~99]    Number 0-99
            range[0~]      Number greater than or equal to 0
            range[~100]    Number less than or equal to 100
         **/
        range: function(element, params) {
            return this.getRangeMsg(+element.value, params, 'range');
        },

        /** how many checkbox or radio inputs that checked
         * @example:
            checked;       no empty, same to required
            checked[1~3]   1-3 items
            checked[1~]    greater than 1 item
            checked[~3]    less than 3 items
            checked[3]     3 items
         **/
        checked: function(element, params) {
            if (!checkable(element)) return true;
            var count = this.$el.find('input[name="' + element.name + '"]').filter(function() {
                return !this.disabled && this.checked && $(this).is(':visible');
            }).length;
            if (!params) {
                return !!count || this.messages.required;
            } else {
                return this.getRangeMsg(count, params, 'checked');
            }
        },

        /** length of a characters (You can pass the second parameter "true", will calculate the length in bytes)
         * @example:
            length[6~16]        6-16 characters
            length[6~]          Greater than 6 characters
            length[~16]         Less than 16 characters
            length[~16, true]   Less than 16 characters, non-ASCII characters calculating two-character
         **/
        length: function(element, params) {
            var value = element.value,
                len = (params[1] ? value.replace(rDoubleBytes, 'xx') : value).length;
            if (params && params[0].charAt(0) === '~') params[0] = '0' + params[0];
            return this.getRangeMsg(len, params, 'length', (params[1] ? '_2' : ''));
        },

        /** remote validation
         *  remote([get:]url [, name1, [name2 ...]]);
         *  Adaptation three kinds of results (Front for the successful, followed by a failure):
                1. text:
                    ''  'Error Message'
                2. json:
                    {"ok": ""}  {"error": "Error Message"}
                3. json wrapper:
                    {"status": 1, "data": {"ok": ""}}  {"status": 1, "data": {"error": "Error Message"}}
         * @example:
            The simplest:       remote(path/to/server.php);
            With parameters:    remote(path/to/server.php, name1, name2, ...);
            By GET:             remote(get:path/to/server.php, name1, name2, ...);
         */
        remote: function(element, params) {
            var me = this,
                arr,
                postData = {};

            if (!params) return true;
            arr = rAjaxType.exec(params[0]);
            postData[element.name] = element.value;
            // There are extra fields
            if (params[1]) {
                $.map(params.slice(1), function(name) {
                    postData[name] = me.$el.find(':input[name="' + name + '"]').val();
                });
            }

            // Asynchronous validation need to return jqXHR objects
            return $.ajax({
                url: arr[2],
                async: true,
                type: arr[1] || 'POST',
                data: postData,
                cache: false
            });
        },

        /** filters, direct filtration without prompting error (support custom regular expressions)
         * @example:
         *  filter          filter "<>"
         *  filter(regexp)  filter the "regexp" matched characters
         */
        filter: function(element, params) {
            var reg = params ? (new RegExp("[" + params[0] + "]", "g")) : rUnsafe;
            element.value = element.value.replace(reg, '');
            return true;
        }
    });


    // Static interface
    $[NS] = {

        /** @interface: config
         *  @usage:
            .config( obj )
         */
        config: function(obj) {
            $.each(obj, function(k, o) {
                if (k === 'rules') {
                    new Rules(o);
                } else if (k === 'messages') {
                    new Messages(o);
                } else {
                    defaults[k] = o;
                }
            });
        },

        /** @interface: setTheme
         *  @usage:
            .setTheme( name, obj )
            .setTheme( obj )
         */
        setTheme: function(name, obj) {
            if (isObject(name)) {
                $.each(name, function(i, o) {
                    themes[i] = o;
                });
            } else if (isString(name) && isObject(obj)) {
                themes[name] = obj;
            }
        }
    };

})(jQuery);