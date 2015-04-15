/*! nice Validator 0.8.0
 * (c) 2012-2014 Jony Zhang <zj86@live.cn>, MIT Licensed
 * http://niceue.com/validator/
 */
/*jshint evil:true*/
(function(factory) {
    if ('function' === typeof define && (define.amd || define.cmd)) {
        // Register as an anonymous module.
        define([], function(){
            return factory;
        });
    } else {
        factory(jQuery);
    }
}(function($, undefined) {
    "use strict";

    var NS = 'validator',
        CLS_NS = '.' + NS,
        CLS_NS_RULE = '.rule',
        CLS_NS_FIELD = '.field',
        CLS_NS_FORM = '.form',
        CLS_WRAPPER = 'nice-' + NS,
        CLS_MSG_BOX = 'msg-box',
        ARIA_REQUIRED = 'aria-required',
        ARIA_INVALID = 'aria-invalid',
        DATA_RULE = 'data-rule',
        DATA_MSG = 'data-msg',
        DATA_TIP = 'data-tip',
        DATA_OK = 'data-ok',
        DATA_TIMELY = 'data-timely',
        DATA_TARGET = 'data-target',
        DATA_MUST = 'data-must',
        NOVALIDATE = 'novalidate',
        INPUT_SELECTOR = ':verifiable',

        rRules = /(&)?(!)?\s?(\w+)(?:\[\s*(.*?\]?)\s*\]|\(\s*(.*?\)?)\s*\))?\s*(;|\||&)?/g,
        rRule = /(\w+)(?:\[\s*(.*?\]?)\s*\]|\(\s*(.*?\)?)\s*\))?/,
        rDisplay = /(?:([^:;\(\[]*):)?(.*)/,
        rDoubleBytes = /[^\x00-\xff]/g,
        rPos = /^.*(top|right|bottom|left).*$/,
        rAjaxType = /(?:(post|get):)?(.+)/i,
        rUnsafe = /[<>'"]|(?:&#)(?:0*\d{2,3}|x[A-Z0-9]{2};)|%[A-Z0-9]{2}/gmi,

        noop = $.noop,
        proxy = $.proxy,
        trim = $.trim,
        isFunction = $.isFunction,
        isString = function(s) {
            return typeof s === 'string';
        },
        isObject = function(o) {
            return o && Object.prototype.toString.call(o) === '[object Object]';
        },
        isIE = document.documentMode || +(navigator.userAgent.match(/MSIE (\d+)/) && RegExp.$1),
        attr = function(el, key, value) {
            if (value !== undefined) {
                if (value === null) el.removeAttribute(key);
                else el.setAttribute(key, '' + value);
            } else {
                return el.getAttribute(key);
            }
        },
        elementValue = function(element) {
            return $(element).val();
        },
        debug = window.console || {
            log: noop,
            info: noop
        },
        submitButton,
        novalidateonce,
        preinitialized = {},

        defaults = {
            debug: 0,
            timely: 1,
            theme: 'default',
            ignore: '',
            //stopOnError: false,
            //focusCleanup: false,
            focusInvalid: true,
            //ignoreBlank: false,
            beforeSubmit: noop,
            //dataFilter: null,
            //valid: null,
            //invalid: null,

            validClass: 'n-valid',
            invalidClass: 'n-invalid',

            msgWrapper: 'span',
            msgMaker: function(opt) {
                var html;
                html = '<span class="msg-wrap n-'+ opt.type +'" role="alert">';
                html += opt.arrow + opt.icon + '<span class="n-msg">' + opt.msg + '</span>';
                html += '</span>';
                return html;
            },
            msgArrow: '',
            msgIcon: '<span class="n-icon"></span>',
            msgClass: '',
            //msgStyle: null,
            //msgShow: null,
            //msgHide: null,
            //showOk: true,
            defaultMsg: "This field is not valid.",
            loadingMsg: 'Validating...'
        },
        themes = {
            'default': {
                formClass: 'n-default',
                msgClass: 'n-right'
            }
        };

    /** jQuery Plugin
     * @param {Object} options
        debug         {Boolean}     false     Whether to enable debug mode
        timely        {Boolean}     true      Whether to enable timely verification
        theme         {String}     'default'  Using which theme
        stopOnError   {Boolean}     false     Whether to stop validate when found an error input
        focusCleanup  {Boolean}     false     Whether to clean up the field message when focus the field
        focusInvalid  {Boolean}     true      Whether to focus the field that is invalid
        ignoreBlank   {Boolean}     false     When the field has no value, whether to ignore verification
        ignore        {jqSelector}    ''      Ignored fields (Using jQuery selector)
        
        beforeSubmit  {Function}              Do something before submit the form
        dataFilter    {Function}              Conversion ajax results
        valid         {Function}              Triggered when the form is valid
        invalid       {Function}              Triggered when the form is invalid
        validClass    {String}                Add the class name to a valid field
        invalidClass  {String}                Add the class name to a invalid field

        display       {Function}
        msgShow       {Function}    null      When show a message, will trigger this callback
        msgHide       {Function}    null      When hide a message, will trigger this callback
        msgWrapper    {String}     'span'     Message wrapper tag name
        msgMaker      {Function}              Message HTML maker
        msgIcon       {String}                Icon template
        msgStyle      {String}                Custom message style
        msgClass      {String}                Additional added to the message class names
        formClass     {String}                Additional added to the form class names

        defaultMsg    {String}                Default error message
        loadingMsg    {String}                Tips for asynchronous loading
        messages      {Object}      null      Custom messages for the current instance
        
        rules         {Object}      null      Custom rules for the current instance

        fields        {Object}                Field set to be verified
        {String} key    name|#id
        {String|Object} value                 Rule string, or an object is passed more arguments

        fields[key][rule]       {String}      Rule string
        fields[key][display]    {String|Function}
        fields[key][tip]        {String}      Custom friendly message when focus the input
        fields[key][ok]         {String}      Custom success message
        fields[key][msg]        {Object}      Custom error message
        fields[key][msgStyle]   {String}      Custom message style
        fields[key][msgClass]   {String}      Additional added to the message class names
        fields[key][msgWrapper] {String}      Message wrapper tag name
        fields[key][msgMaker]   {Function}    Custom message HTML maker
        fields[key][dataFilter] {Function}    Conversion ajax results
        fields[key][valid]      {Function}    Triggered when this field is valid
        fields[key][invalid]    {Function}    Triggered when this field is invalid
        fields[key][must]       {Boolean}     If set true, we always check the field even has remote checking
        fields[key][timely]     {Boolean}     Whether to enable timely verification
        fields[key][target]     {jqSelector}  Verify the current field, but the message can be displayed on target element
     */
    $.fn[NS] = function(options) {
        var that = this,
            args = arguments;

        if (that.is(':input')) return that;
        !that.is('form') && (that = this.find('form'));
        !that.length && (that = this);
        that.each(function() {
            var cache = $(this).data(NS);
            if (cache) {
                if (isString(options)) {
                    if (options.charAt(0) === '_') return;
                    cache[options].apply(cache, Array.prototype.slice.call(args, 1));
                } else if (options) {
                    cache._reset(true);
                    cache._init(this, options);
                }
            } else {
                new Validator(this, options);
            }
        });

        return this;
    };


    // Validate a field, or an area
    $.fn.isValid = function(callback, hideMsg) {
        var me = getInstance(this[0]),
            hasCallback = isFunction(callback),
            ret, opt;

        if (!me) return true;
        me.checkOnly = !!hideMsg;
        opt = me.options;

        ret = me._multiValidate(
            this.is(':input') ? this : this.find(INPUT_SELECTOR),
            function(isValid){
                if (!isValid && opt.focusInvalid && !me.checkOnly) {
                    // navigate to the error element
                    me.$el.find('[' + ARIA_INVALID + ']:input:first').focus();
                }
                hasCallback && callback.call(null, isValid);
                me.checkOnly = false;
            }
        );

        // If you pass a callback, we maintain the jQuery object chain
        return hasCallback ? this : ret;
    };


    // A faster selector than ":input:not(:submit,:button,:reset,:image,:disabled)"
    $.expr[":"].verifiable = function(elem) {
        var name = elem.nodeName.toLowerCase();

        return (name === 'input' && !({submit: 1, button: 1, reset: 1, image: 1})[elem.type] || name === 'select' || name === 'textarea') &&
               elem.disabled === false;
    };

    // any value, but not only whitespace
    $.expr[":"].filled = function(elem) {
        return !!trim(elementValue(elem));
    };


    // Constructor for Validator
    function Validator(element, options) {
        var me = this;

        if (!(me instanceof Validator)) return new Validator(element, options);

        me.$el = $(element);
        if (me.$el.length) {
            if (Validator.loading) {
                $(window).on('validatorready', init);
            } else {
                init();
            }
        } else if(isString(element)) {
            preinitialized[element] = options;
        }

        function init() {
            me._init(me.$el[0], options);
        }
    }

    Validator.prototype = {
        _init: function(element, options) {
            var me = this,
                opt, themeOpt, dataOpt;

            // Initialization options
            if (isFunction(options)) {
                options = {
                    valid: options
                };
            }
            options = options || {};
            dataOpt = attr(element, 'data-'+ NS +'-option');
            dataOpt = dataOpt && dataOpt.charAt(0) === '{' ? (new Function("return " + dataOpt))() : {};
            themeOpt = themes[ options.theme || dataOpt.theme || defaults.theme ];
            opt = me.options = $.extend({}, defaults, themeOpt, me.options, options, dataOpt);

            me.rules = new Rules(opt.rules, true);
            me.messages = new Messages(opt.messages, true);
            me.elements = me.elements || {};
            me.deferred = {};
            me.errors = {};
            me.fields = {};

            // Initialization fields
            me._initFields(opt.fields);

            // Initialization message parameters
            me.msgOpt = {
                type: 'error',
                pos: getPos(opt.msgClass),
                wrapper: opt.msgWrapper,
                cls: opt.msgClass,
                style: opt.msgStyle,
                arrow: opt.msgArrow,
                icon: opt.msgIcon,
                show: opt.msgShow,
                hide: opt.msgHide
            };

            if (isString(opt.target)) {
                me.$el.find(opt.target).addClass('msg-container');
            }

            // Guess whether it use ajax submit
            me.isAjaxSubmit = false;
            if (opt.valid) {
                me.isAjaxSubmit = true;
            } else {
                // if there is a "valid.form" event
                var events = ($._data || $.data)(element, "events");
                if (events && events.valid &&
                    $.map(events.valid, function(e){
                        return ~e.namespace.indexOf('form') ? 1 : null;
                    }).length
                ) {
                    me.isAjaxSubmit = true;
                }
            }

            // Initialization events and make a cache
            if (!me.$el.data(NS)) {
                me.$el.data(NS, me).addClass(CLS_WRAPPER +' '+ opt.formClass)
                      .on('submit'+ CLS_NS +' validate'+ CLS_NS, proxy(me, '_submit'))
                      .on('reset'+ CLS_NS, proxy(me, '_reset'))
                      .on('showmsg'+ CLS_NS, proxy(me, '_showmsg'))
                      .on('hidemsg'+ CLS_NS, proxy(me, '_hidemsg'))
                      .on('focusin'+ CLS_NS +' click'+ CLS_NS, INPUT_SELECTOR, proxy(me, '_focusin'))
                      .on('focusout'+ CLS_NS +' validate'+ CLS_NS, INPUT_SELECTOR, proxy(me, '_focusout'));

                if (opt.timely !== 0) {
                    me.$el.on('keyup'+ CLS_NS +' input'+ CLS_NS, INPUT_SELECTOR, proxy(me, '_focusout'))
                          .on('click'+ CLS_NS, ':radio,:checkbox', 'click', proxy(me, '_focusout'))
                          .on('change'+ CLS_NS, 'select,input[type="file"]', 'change', proxy(me, '_focusout'));
                }

                // cache the novalidate attribute value
                me._novalidate = attr(element, NOVALIDATE);
                // Initialization is complete, stop off default HTML5 form validation
                // If use "jQuery.attr('novalidate')" in IE7 will complain: "SCRIPT3: Member not found."
                attr(element, NOVALIDATE, NOVALIDATE);
            }
        },

        _initFields: function(fields) {
            var me = this,
                clear = fields === null;

            // Processing field information
            if (clear) fields = me.fields;

            if (isObject(fields)) {
                $.each(fields, function(k, v) {
                    // delete a field from settings
                    if (v === null || clear) {
                        var el = me.elements[k];
                        if (el) me._resetElement(el, true);
                        delete me.fields[k];
                    } else {
                        me.fields[k] = isString(v) ? {
                            rule: v
                        } : v;
                    }
                });
            }

            // Parsing DOM rules
            me.$el.find(INPUT_SELECTOR).each(function() {
                me._parse(this);
            });
        },

        // Parsing a field
        _parse: function(el) {
            var me = this,
                field,
                key = el.name,
                dataRule = attr(el, DATA_RULE);

            dataRule && attr(el, DATA_RULE, null);

            // if the field has passed the key as id mode, or it doesn't has a name
            if (el.id && ('#' + el.id in me.fields) || !el.name) {
                key = '#' + el.id;
            }
            // doesn't verify a field that has neither id nor name
            if (!key) return;

            field = me.fields[key] || {};
            field.key = key;
            field.old = {};
            field.rule = field.rule || dataRule || '';
            if (!field.rule) return;

            if (attr(el, DATA_MUST) !== null || /match\(|checked/.test(field.rule)) {
                field.must = true;
            }
            if (~field.rule.indexOf('required')) {
                field.required = true;
                attr(el, ARIA_REQUIRED, true);
            }
            if (!('showOk' in field)) {
                field.showOk = me.options.showOk;
            }

            if ('timely' in field) {
                attr(el, DATA_TIMELY, +field.timely);
            }
            if (isString(field.target)) {
                attr(el, DATA_TARGET, field.target);
            }
            if (isString(field.tip)) {
                attr(el, DATA_TIP, field.tip);
            }

            me.fields[key] = me._parseRule(field);
        },

        // Parsing field rules
        _parseRule: function(field) {
            var arr = rDisplay.exec(field.rule),
                opt = this.options;

            if (!arr) return;
            // current rule index
            field._i = 0;
            if (arr[1]) {
                field.display = arr[1];
            }
            if (!field.display && opt.display) {
                field.display = opt.display;
            }
            if (arr[2]) {
                field.rules = [];
                arr[2].replace(rRules, function(){
                    var args = arguments;
                    args[4] = args[4] || args[5];
                    field.rules.push({
                        and: args[1] === "&",
                        not: args[2] === "!",
                        or: args[6] === "|",
                        method: args[3],
                        params: args[4] ? $.map(args[4].split(', '), function(i){return trim(i)}) : undefined
                    });
                });
            }

            return field;
        },

        // Verify a zone
        _multiValidate: function($inputs, doneCallbacks){
            var me = this,
                opt = me.options;

            me.isValid = true;
            if (opt.ignore) $inputs = $inputs.not(opt.ignore);

            $inputs.each(function(i, el) {
                var field = me.getField(el);
                if (field) {
                    me._validate(el, field);
                    if (!me.isValid && opt.stopOnError) {
                        // stop the verification
                        return false;
                    }
                }
            });

            // Need to wait for the completion of all field validation (especially asynchronous verification)
            if (doneCallbacks) {
                me.verifying = true;
                $.when.apply(
                    null,
                    $.map(me.deferred, function(v){return v;})
                ).done(function(){
                    doneCallbacks.call(me, me.isValid);
                    me.verifying = false;
                });
            }

            // If the form does not contain asynchronous validation, the return value is correct.
            // Otherwise, you should detect whether a form valid through "doneCallbacks".
            return !$.isEmptyObject(me.deferred) ? undefined : me.isValid;
        },

        // Verify the whole form
        _submit: function(e) {
            var me = this,
                opt = me.options,
                form = e.target,
                autoSubmit = e.type === 'submit';

            e.preventDefault();
            if (
                novalidateonce && !!~(novalidateonce = false) ||
                // Prevent duplicate submission
                me.submiting ||
                // Receive the "validate" event only from the form.
                e.type === 'validate' && me.$el[0] !== form ||
                // trigger the beforeSubmit callback.
                opt.beforeSubmit.call(me, form) === false
            ) {
                return;
            }

            opt.debug && debug.log("\n" + e.type);
            
            me._reset();
            me.submiting = true;

            me._multiValidate(
                me.$el.find(INPUT_SELECTOR),
                function(isValid){
                    var ret = (isValid || opt.debug === 2) ? 'valid' : 'invalid',
                        errors;

                    if (!isValid) {
                        if (opt.focusInvalid) {
                            // navigate to the error element
                            me.$el.find('[' + ARIA_INVALID + '="true"]:input:first').focus();
                        }
                        errors = $.map(me.errors, function(err){
                            return err;
                        });
                    }

                    // releasing submit
                    me.submiting = false;

                    // trigger callback and event
                    isFunction(opt[ret]) && opt[ret].call(me, form, errors);
                    me.$el.trigger(ret + CLS_NS_FORM, [form, errors]);

                    if (isValid && !me.isAjaxSubmit && autoSubmit) {
                        novalidateonce = true;
                        // For asp.NET controls
                        if (submitButton && submitButton.name) {
                            me.$el.append('<input type="hidden" name="'+ submitButton.name +'" value="'+ $(submitButton).val() +'">');
                        }
                        form.submit();
                    }
                }
            );
        },

        _reset: function(e) {
            var me = this;

            me.errors = {};
            if (e) {
                me.reseting = true;
                me.$el.find(INPUT_SELECTOR).each( function(i, el){
                    me._resetElement(el);
                });
                delete me.reseting;
            }
        },

        _resetElement: function(el, all) {
            var opt = this.options;
            $(el).removeClass(opt.validClass + ' ' + opt.invalidClass);
            this.hideMsg(el);
            if (all) {
                attr(el, ARIA_REQUIRED, null);
            }
        },

        _focusin: function(e) {
            var me = this,
                opt = me.options,
                el = e.target,
                msg;

            if (me.verifying) return;

            if (opt.focusCleanup) {
                if ( attr(el, ARIA_INVALID) === 'true' ) {
                    $(el).removeClass(opt.invalidClass);
                    me.hideMsg(el);
                }
            }

            msg = attr(el, DATA_TIP);
            if (!msg) return;

            me.showMsg(el, {
                type: 'tip',
                msg: msg
            });
        },

        // Handle "focusout/validate/keyup/click/change/input" events
        _focusout: function(e, elem) {
            var me = this,
                opt = me.options,
                field,
                el = e.target,
                etype = e.type,
                value = elementValue(el),
                special = etype === 'validate',
                timestamp,
                key, specialKey,
                timely,
                timer = 0;

            if (!special) {
                // Just for checkbox and radio
                if (!elem && checkable(el)) {
                    elem = me.$el.find('input[name="'+ el.name +'"]').get(0);
                }
                timely = attr(elem || el, DATA_TIMELY);
                timely = timely !== null ? +timely : +opt.timely;

                if ( timely === 0 ) return;

                if (etype === 'focusout') {
                    if (timely === 2) {
                        if (!opt.focusCleanup) {
                            field = me.getField(el);
                            if (field && field.old.ret) {
                                me._makeMsg(el, field, field.old.ret);
                            }
                        }
                        return;
                    }
                }
                else {
                    if (timely < 2 && !e.data) return;

                    // mark timestamp to reduce the frequency of the received event
                    timestamp = +new Date();
                    if ( timestamp - (el._ts || 0) < 100 ) return;
                    el._ts = timestamp;

                    // handle keyup
                    if (etype === 'keyup') {
                        key = e.keyCode;
                        specialKey = {
                            8: 1,  // Backspace
                            9: 1,  // Tab
                            16: 1, // Shift
                            32: 1, // Space
                            46: 1  // Delete
                        };

                        // only gets focus, no verification
                        if (key === 9 && !value) return;

                        // do not validate, if triggered by these keys
                        if (key < 48 && !specialKey[key]) return;
                    }
                    // keyboard events, reducing the frequency of verification
                    timer = timely >=100 ? timely : 400;
                }
            }

            // if the current field is ignored
            if (opt.ignore && $(el).is(opt.ignore)) return;

            field = me.getField(el);
            if (!field) return;

            clearTimeout(field._t);

            // not validate field unless fill a value
            if (!special && opt.ignoreBlank && !value) {
                me.hideMsg(el);
            }
            else if (timer) {
                field._t = setTimeout(function() {
                    me._validate(el, field);
                }, timer);
            } else {
                if (special) field.old = {};
                me._validate(el, field);
            }
        },

        _showmsg: function(e, type, msg) {
            var me = this,
                el = e.target;

            if ( $(el).is(':input') ) {
                me.showMsg(el, {type: type, msg: msg});
            }
            else if (type === 'tip') {
                me.$el.find(INPUT_SELECTOR +"["+ DATA_TIP +"]", el).each(function(){
                    me.showMsg(this, {type: type, msg: msg});
                });
            }
        },

        _hidemsg: function(e) {
            var $el = $(e.target);

            if ( $el.is(':input') ) {
                this.hideMsg($el);
            }
        },

        // Validated a field
        _validatedField: function(el, field, ret) {
            var me = this,
                opt = me.options,
                isValid = ret.isValid = field.isValid = !!ret.isValid,
                callback = isValid ? 'valid' : 'invalid';

            ret.key = field.key;
            ret.rule = field._r;
            if (isValid) {
                ret.type = 'ok';
            } else {
                if (me.submiting) {
                    me.errors[field.key] = ret.msg;
                }
                me.isValid = false;
            }
            me.elements[field.key] = ret.element = el;
            me.$el[0].isValid = isValid ? me.isFormValid() : isValid;

            field.old.value = elementValue(el);
            field.old.id = el.id;
            field.old.ret = ret;

            // trigger callback and event
            isFunction(field[callback]) && field[callback].call(me, el, ret);
            isFunction(opt.validation) && opt.validation.call(me, el, ret);
            $(el).attr( ARIA_INVALID, isValid ? null : true )
                 .removeClass( isValid ? opt.invalidClass : opt.validClass )
                 .addClass( !ret.skip ? isValid ? opt.validClass : opt.invalidClass : "" )
                 .trigger( callback + CLS_NS_FIELD, [ret, me] );
            me.$el.triggerHandler('validation', [ret, me]);

            if (me.checkOnly) return;
            me._makeMsg.apply(me, arguments);
        },

        _makeMsg: function(el, field, ret) {
            // show or hide the message
            if (field.msgMaker || this.options.msgMaker) {
                this[ ret.showOk || ret.msg ? 'showMsg' : 'hideMsg' ](el, ret, field);
            }
        },

        // Validated a rule
        _validatedRule: function(el, field, ret, msgOpt) {
            field = field || me.getField(el);
            msgOpt = msgOpt || {};

            var me = this,
                opt = me.options,
                msg,
                rule,
                method = field._r,
                transfer,
                temp,
                isValid = false;

            // use null to break validation from a field
            if (ret === null) {
                me._validatedField(el, field, {isValid: true, skip: true});
                return;
            }
            else if (ret === undefined) {
                transfer = true;
            }
            else if (ret === true || ret === '') {
                isValid = true;
            }
            else if (isString(ret)) {
                msg = ret;
            }
            else if (isObject(ret)) {
                if (ret.error) {
                    msg = ret.error;
                } else {
                    msg = ret.ok;
                    isValid = true;
                }
            }

            rule = field.rules[field._i];
            if (rule.not) {
                msg = undefined;
                isValid = method === "required" || !isValid;
            }
            if (rule.or) {
                if (isValid) {
                    while ( field._i < field.rules.length && field.rules[field._i].or ) {
                        field._i++;
                    }
                } else {
                    transfer = true;
                }
            } else if (rule.and) {
                if (!field.isValid) transfer = true;
            }

            if (transfer) {
                isValid = true;
            }
            // message analysis, and throw rule level event
            else {
                if (isValid) {
                    if (field.showOk !== false) {
                        temp = attr(el, DATA_OK);
                        msg = temp === null ? isString(field.ok) ? field.ok : msg : temp;
                        if (!isString(msg) && isString(field.showOk)) {
                            msg = field.showOk;
                        }
                        if (isString(msg)) {
                            msgOpt.showOk = isValid;
                            msgOpt.msg = msg;
                        }
                    }
                    $(el).trigger('valid'+CLS_NS_RULE, [method, msg]);
                } else {
                    field.isValid = false;
                    /* rule message priority:
                        1. custom DOM message
                        2. custom field message;
                        3. global defined message;
                        4. rule returned message;
                        5. default message;
                    */
                    msgOpt.msg = (getDataMsg(el, field, msg || me.messages[method]) || defaults.defaultMsg).replace(/\{0\|?([^\}]*)\}/, function(){
                        return me._getDisplay(el, field.display) || arguments[1];
                    });
                    $(el).trigger('invalid'+CLS_NS_RULE, [method, msgOpt.msg]);
                }
            }
            msgOpt.isValid = isValid;

            // output the debug message
            if (opt.debug) {
                debug.log('   ' + field._i + ': ' + method + ' => ' + (isValid || msgOpt.msg));
            }

            // the current rule has passed, continue to validate
            if (isValid && field._i < field.rules.length - 1) {
                field._i++;
                me._checkRule(el, field);
            }
            // field was invalid, or all fields was valid
            else {
                field._i = 0;
                me._validatedField(el, field, msgOpt);
            }
        },

        // Verify a rule form a field
        _checkRule: function(el, field) {
            var me = this,
                ret,
                old,
                key = field.key,
                rule = field.rules[field._i],
                method = rule.method,
                value = elementValue(el),
                params = rule.params;

            // request has been sent, wait it
            if (me.submiting && me.deferred[key]) return;
            old = field.old;
            field._r = method;

            if ( !field.must && rule.ret !== undefined &&
                 old.rule === rule && old.id === el.id &&
                value && old.value === value )
            {
                // get result from cache
                ret = rule.ret;
            }
            else {
                // get result from current rule
                ret = (getDataRule(el, method) || me.rules[method] || noop).call(me, el, params, field);
            }

            // asynchronous validation
            if (isObject(ret) && isFunction(ret.then)) {
                me.deferred[key] = ret;
                
                // show loading message
                !me.checkOnly && me.showMsg(el, {
                    type: 'loading',
                    msg: me.options.loadingMsg
                }, field);

                // waiting to parse the response data
                ret.then(
                    function(d, textStatus, jqXHR) {
                        var data = jqXHR.responseText,
                            result,
                            dataFilter = field.dataFilter || me.options.dataFilter;

                        if (!isFunction(dataFilter)) {
                            dataFilter = function(data) {
                                if (isString(data) || (isObject(data) && ('error' in data || 'ok' in data))) return data;
                            };
                        }

                        // detect if data is json or jsonp format
                        if (/jsonp?/.test(this.dataType)) {
                            data = d;
                        } else if (trim(data).charAt(0) === '{') {
                            data = $.parseJSON(data) || {};
                        }

                        // filter data
                        result = dataFilter(data);
                        if (result === undefined) result = dataFilter(data.data);

                        old.rule = rule;
                        rule.ret = result;
                        me._validatedRule(el, field, result);
                    },
                    function(jqXHR, textStatus){
                        me._validatedRule(el, field, me.messages[textStatus] || textStatus);
                    }
                ).always(function(){
                    delete me.deferred[key];
                });
                // whether the field valid is unknown
                field.isValid = undefined;
            }
            // other result
            else {
                me._validatedRule(el, field, ret);
            }
        },

        // Processing the validation
        _validate: function(el, field) {
            // doesn't validate the element that has "disabled" or "novalidate" attribute
            if ( el.disabled || attr(el, NOVALIDATE) !== null ) return;

            var me = this;
            if ( !field ) field = me.getField(el);
            field.isValid = true;

            if (!field.rules) me._parse(el);
            if (!field.rules) return;
            if (me.options.debug) debug.info(field.key);

            // if the field is not required, and that has a blank value
            if (!field.required && !field.must && !elementValue(el)) {
                if (!checkable(el)) {
                    me._validatedField(el, field, {isValid: true});
                    return true;
                }
            }

            me._checkRule(el, field);
            return field.isValid;
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

            if (parts) {
                method = parts[1];
                if (method in me.rules) {
                    params = parts[2] || parts[3];
                    params = params ? params.split(', ') : undefined;
                    ret = me.rules[method].call(me, el, params);
                }
            }

            return ret === true || ret === undefined || ret === null;
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
                    c = 'gte';
                } else if (!a && b) {
                    if (isNumber && value <= +b) return true;
                    args.push(b);
                    c = 'lte';
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

        _getDisplay: function(el, str) {
            return !isString(str) ? isFunction(str) ? str.call(this, el) : '' : str;
        },

        _getMsgOpt: function(obj) {
            return $.extend({}, this.msgOpt, isString(obj) ? {msg: obj} : obj);
        },

        _getMsgDOM: function(el, msgOpt) {
            var $el = $(el), $msgbox, datafor, tgt, container;

            if ($el.is(':input')) {
                tgt = msgOpt.target || attr(el, DATA_TARGET);
                if (tgt) {
                    tgt = isFunction(tgt) ? tgt.call(this, el) : this.$el.find(tgt);
                    if (tgt.length) {
                        if (tgt.is(':input')) {
                            el = tgt.get(0);
                        } else if (tgt.hasClass(CLS_MSG_BOX)) {
                            $msgbox = tgt;
                        } else {
                            container = tgt;
                        }
                    }
                }
                if (!$msgbox) {
                    datafor = (!checkable(el) || !el.name) && el.id ? el.id : el.name;
                    $msgbox = this.$el.find(msgOpt.wrapper + '.' + CLS_MSG_BOX + '[for="' + datafor + '"]');
                }
            } else {
                $msgbox = $el;
            }

            if (!$msgbox.length) {
                $el = this.$el.find(tgt || el);
                $msgbox = $('<'+ msgOpt.wrapper + '>').attr({
                    'class': CLS_MSG_BOX + (msgOpt.cls ? ' ' + msgOpt.cls : ''),
                    'style': msgOpt.style || '',
                    'for': datafor
                });
                if (checkable(el)) {
                    var $parent = $el.parent();
                    $msgbox.appendTo( $parent.is('label') ? $parent.parent() : $parent );
                } else {
                    if (container) {
                        $msgbox.appendTo(container);
                    } else {
                        $msgbox[!msgOpt.pos || msgOpt.pos === 'right' ? 'insertAfter' : 'insertBefore']($el);
                    }
                }
            }

            return $msgbox;
        },

        /* @interface: showMsg
         */
        showMsg: function(el, msgOpt, /*INTERNAL*/ field) {
            if (!el) return;
            var me = this,
                opt = me.options,
                msgMaker,
                temp,
                $msgbox;

            if (isObject(el) && !el.jquery && !msgOpt) {
                $.each(el, function(key, msg) {
                    var el = me.elements[key] || me.$el.find(key2selector(key))[0];
                    me.showMsg(el, msg);
                });
                return;
            }

            msgOpt = me._getMsgOpt(msgOpt);
            el = $(el).get(0);

            // ok or tip
            if (!msgOpt.msg && msgOpt.type !== 'error') {
                temp = attr(el, 'data-' + msgOpt.type);
                if (temp !== null) msgOpt.msg = temp;
            }

            if (!isString(msgOpt.msg)) return;

            if ($(el).is(INPUT_SELECTOR)) {
                field = field || me.getField(el);
                if (field) {
                    msgOpt.style = field.msgStyle || msgOpt.style;
                    msgOpt.cls = field.msgClass || msgOpt.cls;
                    msgOpt.wrapper = field.msgWrapper || msgOpt.wrapper;
                    msgOpt.target = field.target || opt.target;
                }
            }
            if (!(msgMaker = (field || {}).msgMaker || opt.msgMaker)) return;
            
            $msgbox = me._getMsgDOM(el, msgOpt);
                
            !rPos.test($msgbox[0].className) && $msgbox.addClass(msgOpt.cls);
            if ( isIE === 6 && msgOpt.pos === 'bottom' ) {
                $msgbox[0].style.marginTop = $(el).outerHeight() + 'px';
            }
            $msgbox.html( msgMaker.call(me, msgOpt) )[0].style.display = '';

            isFunction(msgOpt.show) && msgOpt.show.call(me, $msgbox, msgOpt.type);
        },

        /* @interface: hideMsg
         */
        hideMsg: function(el, msgOpt, /*INTERNAL*/ field) {
            var me = this,
                opt = me.options,
                $msgbox;

            el = $(el).get(0);
            msgOpt = me._getMsgOpt(msgOpt);
            if ($(el).is(INPUT_SELECTOR)) {
                field = field || me.getField(el);
                if (field) {
                    if (field.isValid || me.reseting) attr(el, ARIA_INVALID, null);
                    msgOpt.wrapper = field.msgWrapper || msgOpt.wrapper;
                    msgOpt.target = field.target || opt.target;
                }
            }

            $msgbox = me._getMsgDOM(el, msgOpt);
            if (!$msgbox.length) return;

            if ( isFunction(msgOpt.hide) ) {
                msgOpt.hide.call(me, $msgbox, msgOpt.type);
            } else {
                $msgbox[0].style.display = 'none';
                $msgbox[0].innerHTML = null;
            }
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

        /* @interface: setField
         */
        setField: function(key, obj) {
            var fields = {};

            // update this field
            if (isString(key)) {
                fields[key] = obj;
            }
            // update fields
            else {
                fields = key;
            }

            this._initFields(fields);
        },

        /* @interface: isFormValid
         */
        isFormValid: function() {
            var fields = this.fields, k;
            for (k in fields) {
                if (!fields[k].isValid) {
                    return fields[k].isValid;
                }
            }
            return true;
        },

        /* @interface: holdSubmit
         */
        holdSubmit: function(hold) {
            this.submiting = hold === undefined || hold;
        },

        /* @interface: cleanUp
         */
        cleanUp: function() {
            this._reset(1);
        },

        /* @interface: destroy
         */
        destroy: function() {
            this._reset(1);
            this.$el.off(CLS_NS).removeData(NS);
            attr(this.$el[0], NOVALIDATE, this._novalidate);
        }
    };


    // Rule class
    function Rules(obj, context) {
        if (!isObject(obj)) return;

        var k, that = context ? context === true ? this : context : Rules.prototype;

        for (k in obj) {
            if (checkRuleName(k))
                that[k] = getRule(obj[k]);
        }
    }

    // Message class
    function Messages(obj, context) {
        if (!isObject(obj)) return;

        var k, that = context ? context === true ? this : context : Messages.prototype;

        for (k in obj) {
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
                    return fn[0].test(elementValue(el)) || fn[1] || false;
                };
            case 'regexp':
                return function(el) {
                    return fn.test(elementValue(el));
                };
        }
    }

    // Get instance by an element
    function getInstance(el) {
        var wrap, k, options;

        if (!el || !el.tagName) return;
        switch (el.tagName) {
            case 'INPUT':
            case 'SELECT':
            case 'TEXTAREA':
            case 'BUTTON':
            case 'FIELDSET':
                wrap = el.form || $(el).closest('.' + CLS_WRAPPER);
                break;
            case 'FORM':
                wrap = el;
                break;
            default:
                wrap = $(el).closest('.' + CLS_WRAPPER);
        }

        for (k in preinitialized) {
            if ($(wrap).is(k)) {
                options = preinitialized[k];
                break;
            }
        }

        return $(wrap).data(NS) || $(wrap)[NS](options).data(NS);
    }

    function initByInput(e, elem) {
        var el = elem || e.currentTarget, me;
        if (!el.form || attr(el.form, NOVALIDATE) !== null) return;

        me = getInstance(el);
        if (me) {
            me._parse(el);
            me._focusin(e);
            if (elem) me._focusout(e, elem);
        } else {
            attr(el, DATA_RULE, null);
        }
    }

    // Get custom rules on the node
    function getDataRule(el, method) {
        var fn = trim(attr(el, DATA_RULE + '-' + method));

        if (!fn) return;
        fn = (new Function("return " + fn))();
        if (fn) return getRule(fn);
    }

    // Get custom messages on the node
    function getDataMsg(el, field, m) {
        var msg = field.msg,
            item = field._r;

        if (isObject(msg)) msg = msg[item];
        if (!isString(msg)) {
            msg = attr(el, DATA_MSG + '-' + item) || attr(el, DATA_MSG) || ( m ? isString(m) ? m : m[item] : '');
        }

        return msg;
    }

    // Get message position
    function getPos(str) {
        var pos;

        if (str) pos = rPos.exec(str);
        return pos && pos[1];
    }

    // Check whether the element is checkbox or radio
    function checkable(el) {
        return el.tagName === 'INPUT' && el.type === 'checkbox' || el.type === 'radio';
    }

    // parse date string to timestamp
    function parseDate(str) {
        return Date.parse(str.replace(/\.|\-/g, '/'));
    }

    function checkRuleName(name) {
        return (/^[\w\d]+$/).test(name);
    }

    function key2selector(key) {
        return key.charAt(0) === "#" ? key.replace(/(:|\.|\[|\])/g, "\\$1") : '[name="'+ key +'"]:input';
    }


    // Global events
    $(window).on('beforeunload', function(){
        this.focus();
    });
    
    $(document)
    .on('focusin', '['+DATA_RULE+']:input', function(e) {
        initByInput(e);
    })

    .on('click', 'input,button', function(e){
        var input = this, name = input.name, attrNode, elem;
        if (!input.form) return;

        if (input.type === 'submit') {
            submitButton = input;
            attrNode = input.getAttributeNode('formnovalidate');
            if (attrNode && attrNode.nodeValue !== null || attr(input, NOVALIDATE)!== null) {
                novalidateonce = true;
            }
        }
        else if (attr(input.form, NOVALIDATE) === null) {
            if (name && checkable(input)) {
                elem = input.form.elements[name];
                if (elem.length) elem = elem[0];
                if (attr(elem, DATA_RULE)) {
                    initByInput(e, elem);
                }
            } else {
                initByInput(e);
            }
        }
    })

    .on('submit validate', 'form', function(e) {
        if (attr(this, NOVALIDATE) !== null) return;

        var $form = $(this), me;

        if (!$form.data(NS)) {
            me = getInstance(this);
            if (!$.isEmptyObject(me.fields)) {
                me._submit(e);
            } else {
                attr(this, NOVALIDATE, NOVALIDATE);
                $form.off(CLS_NS).removeData(NS);
            }
        }
    });


    // Built-in rules (global)
    new Rules({

        /** required
         * @example:
            required
            required(anotherRule)
            required(not, -1)
            required(from, .contact)
         */
        required: function(element, params, field) {
            var me = this,
                val = trim(elementValue(element)),
                isValid = true;

            if (params) {
                if (params.length === 1) {
                    if (!checkRuleName(params[0])) {
                        if (!val && !$(params[0], me.$el).length ) {
                            return null;
                        }
                    }
                    else if (me.rules[params[0]]) {
                        if (!val && !me.test(element, params[0]) ) {
                            attr(element, ARIA_REQUIRED, null);
                            return null;
                        } else {
                            attr(element, ARIA_REQUIRED, true);
                        }
                    }
                }
                else if (params[0] === 'not') {
                    $.each(params.slice(1), function() {
                        return (isValid = val !== trim(this));
                    });
                }
                else if (params[0] === 'from') {
                    var $elements = me.$el.find(params[1]),
                        VALIDATED = '_validated_',
                        ret;
                        
                    isValid = $elements.filter(function(){
                        return !!trim(elementValue(this));
                    }).length >= (params[2] || 1);

                    if (isValid) {
                        if (!val) ret = null;
                    } else {
                        ret = getDataMsg($elements[0], field) || false;
                    }

                    if(!$(element).data(VALIDATED)) {
                        $elements.data(VALIDATED, 1).each(function(){
                            if (element !== this) {
                                me._checkRule(this, me.getField(this));
                            }
                        }).removeData(VALIDATED);
                    }

                    return ret;
                }
            }

            return isValid && !!val;
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

            return new RegExp(re).test(elementValue(element)) || this.messages.integer[key];
        },

        /** match another field
         * @example:
            match[password]    Match the password field (two values ​​must be the same)
            match[eq, password]  Ditto
            match[neq, count]  The value must be not equal to the value of the count field
            match[lt, count]   The value must be less than the value of the count field
            match[lte, count]  The value must be less than or equal to the value of the count field
            match[gt, count]   The value must be greater than the value of the count field
            match[gte, count]  The value must be greater than or equal to the value of the count field
            match[gte, startDate, date]
            match[gte, startTime, time]
         **/
        match: function(element, params, field) {
            if (!params) return;

            var me = this,
                a, b,
                key, msg, type = 'eq', parser,
                selector2, elem2, field2;

            if (params.length === 1) {
                key = params[0];
            } else {
                type = params[0];
                key = params[1];
            }

            selector2 = key2selector(key);
            elem2 = me.$el.find(selector2)[0];
            // If the compared field is not exist
            if (!elem2) return;
            field2 = me.getField(elem2);
            a = elementValue(element);
            b = elementValue(elem2);

            if (!field._match) {
                me.$el.on('valid'+CLS_NS_FIELD+CLS_NS, selector2, function(){
                    $(element).trigger('validate');
                });
                field._match = field2._match = 1;
            }

            // If both fields are blank
            if (!field.required && a === "" && b === "") {
                return null;
            }

            parser = params[2];
            if (parser) {
                if (/^date(time)?$/i.test(parser)) {
                    a = parseDate(a);
                    b = parseDate(b);
                } else if (parser === 'time') {
                    a = +a.replace(/:/g, '');
                    b = +b.replace(/:/g, '');
                }
            }

            // If the compared field is incorrect, we only ensure that this field is correct.
            if (type !== "eq" && !isNaN(+a) && isNaN(+b)) {
                return true;
            }

            msg = me.messages.match[type].replace('{1}', me._getDisplay(element, field2.display || key));
            
            switch (type) {
                case 'lt':
                    return (+a < +b) || msg;
                case 'lte':
                    return (+a <= +b) || msg;
                case 'gte':
                    return (+a >= +b) || msg;
                case 'gt':
                    return (+a > +b) || msg;
                case 'neq':
                    return (a !== b) || msg;
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
            return this.getRangeMsg(+elementValue(element), params, 'range');
        },

        /** how many checkbox or radio inputs that checked
         * @example:
            checked;       no empty, same to required
            checked[1~3]   1-3 items
            checked[1~]    greater than 1 item
            checked[~3]    less than 3 items
            checked[3]     3 items
         **/
        checked: function(element, params, field) {
            if (!checkable(element)) return;

            var me = this,
                elem, count;

            if (element.name) {
                count = me.$el.find('input[name="' + element.name + '"]').filter(function() {
                    var el = this;
                    if (!elem && checkable(el)) elem = el;
                    return !el.disabled && el.checked;
                }).length;
            } else {
                elem = element;
                count = elem.checked;
            }

            if (params) {
                return me.getRangeMsg(count, params, 'checked');
            } else {
                return !!count || getDataMsg(elem, field, '') || me.messages.required;
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
            var value = elementValue(element),
                len = (params[1] ? value.replace(rDoubleBytes, 'xx') : value).length;

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
            The simplest:       remote(path/to/server);
            With parameters:    remote(path/to/server, name1, name2, ...);
            By GET:             remote(get:path/to/server, name1, name2, ...);
            Name proxy:         remote(path/to/server, name1, proxyname2:name2, proxyname3:#id3, ...)
            Query String        remote(path/to/server, foo=1&bar=2, name1, name2, ...)
         */
        remote: function(element, params) {
            if (!params) return;

            var me = this,
                arr = rAjaxType.exec(params[0]),
                data = {},
                queryString = '',
                dataType;

            data[element.name] = elementValue(element);
            // There are extra fields
            if (params[1]) {
                $.map(params.slice(1), function(name) {
                    var arr, key;
                    if (~name.indexOf('=')) {
                        queryString += '&' + name;
                    } else {
                        arr = name.split(':');
                        name = trim(arr[0]);
                        key = trim(arr[1]) || name;
                        data[ name ] = me.$el.find( key2selector(key) ).val();
                    }
                });
            }

            // Cross-domain request, force jsonp dataType
            if (/^https?:/.test(arr[2]) && !~arr[2].indexOf(location.host)) {
                dataType = 'jsonp';
            }

            // Asynchronous validation need return jqXHR objects
            return $.ajax({
                url: arr[2],
                type: arr[1] || 'POST',
                data: $.param(data) + queryString,
                dataType: dataType,
                cache: false
            });
        },

        /** validate other fields
         * @example:
         *  validate(name1, #id2)
         */
        validate: function(element, params) {
            var VALIDATED = '_validated_';
            if(!params || $(element).data(VALIDATED)) return;
            this.$el.find( 
                $.map(params, function(key){
                    return key2selector(key);
                }).join(',')
            ).data(VALIDATED, 1).trigger('validate').removeData(VALIDATED);
        },

        /** filters, direct filtration without prompting error (support custom regular expressions)
         * @example:
         *  filter          filtering "<>"
         *  filter(regexp)  filtering the "regexp" matched characters
         */
        filter: function(element, params) {
            element.value = elementValue(element).replace( params ? (new RegExp("[" + params[0] + "]", "gm")) : rUnsafe, '' );
        }
    });


    /** @interface: config
     *  @usage:
        .config( obj )
     */
    Validator.config = function(obj) {
        $.each(obj, function(k, o) {
            if (k === 'rules') {
                new Rules(o);
            } else if (k === 'messages') {
                new Messages(o);
            } else {
                defaults[k] = o;
            }
        });
    };

    /** @interface: setTheme
     *  @usage:
        .setTheme( name, obj )
        .setTheme( obj )
     */
    Validator.setTheme = function(name, obj) {
        if (isObject(name)) {
            $.extend(true, themes, name);
        } else if (isString(name) && isObject(obj)) {
            themes[name] = $.extend(themes[name], obj);
        }
    };

    $[NS] = Validator;

    // Resource loader
    (function(URI){
        var arr, node, i, re, dir, el,
            scripts = document.getElementsByTagName('script');

        if (URI) {
            node = scripts[0];
            arr = URI.match(/(.*)\/local\/(\w{2,5})\.js/);
        } else {
            i = scripts.length;
            re = /(.*validator.js)\?.*local=(\w+)/;
            while (i-- && !arr) {
                node = scripts[i];
                arr = (node.hasAttribute ? node.src : node.getAttribute('src',4)||'').match(re);
            }
        }
        if (arr) {
            dir = arr[0].split('/').slice(0, -1).join('/').replace(/\/(local|src)$/,'')+'/';
            el = document.createElement('link');
            el.rel = 'stylesheet';
            el.href = dir + 'jquery.validator.css';
            node.parentNode.insertBefore(el, node);
            if (!URI) {
                Validator.loading = 1;
                el = document.createElement('script');
                el.src = dir + 'local/' + arr[2].replace('-','_') + '.js';
                i = 'onload' in el ? 'onload' : 'onreadystatechange';
                el[i] = function() {
                    if (!el.readyState || /loaded|complete/.test(el.readyState)) {
                        $(window).trigger('validatorready');
                        delete Validator.loading;
                        el = el[i] = null;
                    }
                };
                node.parentNode.insertBefore(el, node);
            }
        }
    })($._VALIDATOR_URI);

}));