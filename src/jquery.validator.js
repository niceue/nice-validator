/*! Validator 1.0.0-pre
 * (c) 2012-2013 Jony Zhang <zj86@live.cn>, MIT Licensed
 * http://niceue.github.io/validator/
 */
/*jshint browser:true, evil:true*/
(function($, undefined) {
    "use strict";

    var NS = 'validator',
        CLS_MSG_VALID = 'n-ok',
        CLS_MSG_INVALID = 'n-error',
        CLS_MSG_TIP = 'n-tip',
        CLS_MSG_LOADING = 'n-loading',
        CLS_INPUT_INVALID = 'n-invalid',
        CLS_MSG_BOX = 'msg-box',
        ARIA_INVALID = 'aria-invalid',
        DATA_INPUT_STATUS = 'data-inputstatus',
        INPUT_SELECTOR = ':input:not(:button,:submit,:reset,:disabled)',

        rRule = /(\w+)(?:[\[\(]([^\]\)]*)[\]\)])?/,
        rDisplay = /(?:([^:\[]*):)?\s*(.*)/,
        rDoubleBytes = /[^\x00-\xff]/g, //全角字符
        rPos = /^.*(top|right|bottom|left).*$/,
        rAjaxType = /(?:(post|get):)?(.+)/i,
        rUnsafe = /[<>\&\/]/g, //危险字符

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
            timely: 'input',
            stopOnError: 0,
            showError: 1,
            showOk: 1,
            defaultMsg: '{0} is not valid.',
            loadingMsg: 'Validating...',
            msgTemplate: '<span>{#msg}</span>',
            msgIcon: '<span class="n-icon"></span>',
            msgArrow: '',
            msgClass: '',
            formClass: 'n-default',
            ignore: '',
            valid: noop,
            invalid: noop
        },
        themes = {
            'default': {
                msgClass: 'n-right',
                showOk: ''
            }
        };

    /** jQuery Plugin
     * @param {Object} options
        debug       {Boolean}   false, 是否启用调试模式（启用后，验证结果会同时在控制台输出，并且不阻止表单提交）
        timely      {Boolean}   true,  是否启用及时验证（表单元素失去焦点时）
        stopOnError {Boolean}   false, 验证出错时是否停止继续验证
        showError   {Boolean|Number}    验证失败时是否显示提示
        ignore      {jqSelector}  '',  忽略的字段(jQuery选择器)
        
        defaultMsg  {String}           默认的错误消息
        loadingMsg  {String}           异步加载中的提示
        msgTemplate {String}           消息模板
        msgIcon     {String}    ''     icon图标模板
        msgArrow    {String}    ''     小箭头模板
        msgClass    {String}    ''     给消息额外添加的class名
        formClass   {String}    ''     给表单额外添加的class名
        
        rules       {Object}    null,  自定义用于当前实例的规则
        messages    {Object}    null,  自定义用于当前实例的消息
        
        valid       {Function}  表单验证成功后的回调
        invalid     {Function}  表单验证失败后的回调

        fields      {Object}     待验证字段规则集合
        {String} key    name|#id
        {String|Object} value
        fields[key][rule]     {String}                    规则字符串
        fields[key][tip]      {String}                    自定义获得焦点时的提示信息
        fields[key][msg]      {Object}                    自定义验证失败的消息
        fields[key][timely]   {Boolean}                   自定义验证失败的消息
        fields[key][target]   {jqSelector}                验证当前字段，但是消息却可以显示在target指向的元素周围
     */
    $.fn.validator = function(options) {
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

    $.fn.isValid = function() {
        var el = this[0],
            me = getInstance(el);
        return me ? me._checkField(el) : true;
    };

    function Validator(element, options) {
        var me = this,
            opt, theme;
        if (!me instanceof Validator) return new Validator(element, options);
        me.$el = $(element);
        if (isFunction(options)) {
            options = {
                success: options
            };
        }
        opt = me.options = $.extend({}, defaults, options);
        theme = opt.theme;
        if (theme && themes[theme]) {
            opt = $.extend(opt, themes[theme], options);
        }
        me.rules = new Rules(opt.rules, true);
        me.messages = new Messages(opt.messages, true);
        me.fields = {};
        me.elements = {};
        me.isValid = true;
        me._init();
    }

    Validator.prototype = {
        _init: function() {
            var me = this,
                opt = me.options,
                fields = me.fields;

            //初始化分组验证
            if (isArray(opt.groups)) {
                $.map(opt.groups, function(obj) {
                    if (!isString(obj.fields) || !isFunction(obj.callback)) return null;
                    var $elememts = $(keys2selector(obj.fields), me.$el),
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

            //处理字段信息
            if (isObject(opt.fields)) {
                $.each(opt.fields, function(k, v) {
                    if (v) fields[k] = isString(v) ? {
                        rule: v
                    } : v;
                });
            }
            $(INPUT_SELECTOR, me.$el).each(function() {
                var el = this,
                    field,
                    key = el.id;

                if (!key || !('#' + key in fields)) key = el.name; //不是Id模式
                if (!key) return; //既没有id也没有name的字段不做验证

                field = fields[key] || {};
                if (!field.rule) field.rule = attr(el, 'data-rule') || '';
                field.rules = [];
                attr(el, 'data-rule', null);
                if (!field.rule) return;

                field.name = field.name || el.name;
                field.key = key;
                field.required = field.rule.indexOf('required') !== -1;
                field.must = field.rule.indexOf('match') !== -1 || field.rule.indexOf('checked') !== -1;
                if (field.required) attr(el, 'aria-required', true);
                if ('timely' in field && !field.timely || !opt.timely) {
                    attr(el, 'notimely', true);
                }
                if (isString(field.target)) attr(el, 'data-target', field.target);
                if (isString(field.tip)) attr(el, 'data-tip', field.tip);

                fields[key] = me._parseField(field);
            });

            //消息的参数
            me.msgOpt = {
                type: 'error',
                tpl: getTpl(opt.msgTemplate),
                pos: getPos(opt.msgClass),
                cls: opt.msgClass,
                icon: opt.msgIcon,
                arrow: opt.msgArrow,
                style: opt.msgStyle,
                effect: opt.effect
            };

            //处理事件与缓存
            if (!me.$el.data(NS)) {
                me.$el.on('submit', proxy(me, '_submit'))
                    .on('reset', proxy(me, '_reset'))
                    .on('validated.field', INPUT_SELECTOR, proxy(me, '_validatedField'))
                    .on('validated.rule', INPUT_SELECTOR, proxy(me, '_validatedRule'))
                    .on('focusin', INPUT_SELECTOR, proxy(me, '_focus'))
                    .on('focusout validate', INPUT_SELECTOR, proxy(me, '_blur'))
                    .on('click', ':radio,:checkbox', proxy(me, '_click'));
                if (opt.timely === 'input') me.$el.on('keyup', INPUT_SELECTOR, proxy(me, '_blur'));
                me.$el.data(NS, me).addClass('n-' + NS + ' ' + opt.formClass);

                //初始化完成，阻止掉HTML5默认的表单验证，同时作为已经初始化的依据
                //jQuery的attr方法在IE7下会报错："SCRIPT3: 找不到成员"
                attr(me.$el[0], 'novalidate', 'true');
            }
        },

        //接收：表单的submit事件
        _submit: function(e) {
            e && e.preventDefault();
            var me = this,
                opt = me.options,
                form = e.target,
                FOCUS_EVENT = 'focus.field',
                ret,
                $inputs = $(INPUT_SELECTOR, me.$el);

            me._reset();
            if (opt.ignore) $inputs = $inputs.not(opt.ignore);
            $inputs.each(function(i, el) {
                if ($(el).is('[novalidate]')) return;
                var field = me.getField(this);
                if (!field) return;
                me._validate(this, field);
                if (!me.isValid && opt.stopOnError) {
                    //Only trigger the default event, does not affect the focusin event.
                    $(this).trigger(FOCUS_EVENT);
                    return false;
                }
            });
            if (!me.isValid && !opt.stopOnError) {
                $(':input.' + CLS_INPUT_INVALID + ':first', me.$el).trigger(FOCUS_EVENT);
            }
            ret = (me.isValid || opt.debug === 2) ? 'valid' : 'invalid';
            opt[ret].call(me, form);
            me.$el.trigger(ret + '.form', [form]);
        },

        //接收：表单的reset事件
        _reset: function() {
            var me = this, showError = me.options.showError;
            if (isString(showError)) {
                $(showError).html('');
            } else {
               $('[data-for].' + CLS_MSG_BOX, me.$el).map(function() {
                    this.style.display = 'none';
                });
                $(INPUT_SELECTOR, me.$el).map(function() {
                    attr(this, DATA_INPUT_STATUS, null);
                    attr(this, ARIA_INVALID, null);
                    $(this).removeClass(CLS_INPUT_INVALID);
                }); 
            }
            me.isValid = true;
        },

        _focus: function(e) {
            var el = e.target;
            if (el.value !== '' && (attr(el, ARIA_INVALID) === 'false' || attr(el, DATA_INPUT_STATUS) === 'tip')) return;
            this.showMsg(el, {
                msg: attr(el, 'data-tip'),
                type: 'tip'
            });
        },

        //接收：focusout/validate/keyup/click 事件
        _blur: function(e, isClick) {
            var me = this,
                opt = me.options,
                field,
                must,
                el = e.target,
                timer = 100;

            if (!isClick) {
                //手动触发的事件, 强制验证
                if (e.type === 'validate') must = true;
                //不是手动触发的验证, 也不是实时的验证, 那就不继续了
                else if ($(el).is('[notimely]')) return;
                //timely为input时, 只在keyup事件触发时验证
                else if (opt.timely === 'input' && e.type !== 'keyup') return;
                //如果当前字段被忽略了
                if (opt.ignore && $(el).is(opt.ignore)) return;

                if (e.type === 'keyup') {
                    var key = e.keyCode,
                        specialKey = {
                            8: 1, //Backspace
                            9: 1, //Tab
                            16: 1, //Shift
                            32: 1, //Space
                            46: 1 //Delete
                        };

                    //这些键不触发验证(包含回车键，回车键触发的是提交表单，防止重复验证)
                    if ((!specialKey[key] && key < 48) || key >= 112) return;

                    //键盘事件，降低验证频率
                    timer = 500;
                }
            }

            field = me.getField(el);
            if (!field) return;

            if (field.timeout) clearTimeout(field.timeout);
            field.timeout = setTimeout(function() {
                me._validate(el, field, must);
            }, timer);
        },

        _click: function(e) {
            this._blur(e, true);
        },

        //解析字段规则
        _parseField: function(field) {
            var arr = rDisplay.exec(field.rule),
                rules;

            if (!arr) return;
            field.display = arr[1];
            rules = (arr[2] || '').split(';');
            $.map(rules, function(rule) {
                var parts = rRule.exec(rule);
                if (!parts) return null;
                field.rules.push({
                    method: parts[1],
                    params: parts[2] ? $.trim(parts[2]).split(', ') : undefined
                });
            });
            field.vid = 0;
            field.rid = field.rules[0].method;
            return field;
        },

        //验证完一个字段
        _validatedField: function(e, field, msgOpt) {
            var me = this,
                opt = me.options,
                showError = opt.showError,
                el = e.target,
                isValid = field.isValid = !!msgOpt.valid;

            isValid && (msgOpt.type = 'ok');
            $(el)[isValid ? 'removeClass' : 'addClass'](CLS_INPUT_INVALID)
                .trigger((isValid ? 'valid' : 'invalid') + '.field', [field, msgOpt])
                .attr(ARIA_INVALID, !isValid);
            
            field.old.ret = msgOpt;
            me.elements[field.key] = el;

            if (!showError) return;
            if (isString(showError)) {
                $(showError).html(msgOpt.msg || '');
            } else {
                if (msgOpt.msg || msgOpt.showOk) {
                    me.showMsg(el, msgOpt);
                } else {
                    el.value && me.hideMsg(el, msgOpt);
                }
            }
        },

        //验证完一个规则
        _validatedRule: function(e, ret, field, msgOpt) {
            field = field || me.getField(el);
            var me = this,
                opt = me.options,
                el = e.target,
                msg = '',
                key = field.key,
                method = field.rid,
                isValid = false,
                showOk = false;

            msgOpt = msgOpt || {};

            //格式化结果和消息
            if (ret !== true) {
                //rule消息优先级：1、自定义消息；2、规则返回的消息；3、内置规则消息；4、默认消息
                msg = getDataMsg(el, field, method);
                if (!msg) {
                    if (isString(ret)) {
                        msg = ret;
                        ret = {
                            error: msg
                        };
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
            } else {
                isValid = true;
            }

            //消息处理, 以及rule级别的事件
            if (!isValid) {
                me.isValid = false;
                //失败的回调
                $(el).trigger('invalid.rule', [method]);
            } else {
                msgOpt.valid = true;
                if (!showOk && isString(opt.showOk)) {
                    showOk = true;
                    msgOpt.msg = opt.showOk;
                }
                if (showOk) msgOpt.showOk = true;
                //成功的回调
                $(el).trigger('valid.rule', [method]);
            }

            //控制台调试信息
            if (opt.debug) {
                debug[isValid ? 'info' : 'warn'](field.vid + ': ' + method + ' -> ' + (msgOpt.msg || true));
            }

            //缓存结果
            field.old = field.old || {};

            //刚刚验证完成，验证前的值却和现在的不一样了(快速输入-_-!), 需重新验证
            if (isValid && field.old.value !== undefined && field.old.value !== el.value) {
                field.vid = 0;
                me._checkRule(el, field);
            }
            //当前规则已通过，继续验证
            else if (isValid && field.vid < field.rules.length - 1) {
                field.vid++;
                me._checkRule(el, field);
            }
            //字段验证失败，或者是字段的全部规则都验证成功
            else {
                field.vid = 0;
                //执行验证完一个字段的回调
                $(el).trigger('validated.field', [field, msgOpt]);
            }
        },

        //验证字段的一个规则
        _checkRule: function(el, field) {
            var me = this,
                ret,
                rule = field.rules[field.vid],
                method = rule.method,
                params = rule.params;

            field.rid = method;
            field.old = {
                value: el.value
            };
            ret = (getDataRule(el, method) || me.rules[method] || function() {
                return true;
            }).call(me, el, params, field);
            //有返回值，直接抛事件（异步验证无返回值）
            if (ret !== undefined) {
                $(el).trigger('validated.rule', [ret, field]);
            } else {
                //暂时冻结验证
                me.isValid = false;
            }
        },

        //验证一个字段
        _checkField: function(el, field) {
            var me = this;

            field = field || me.getField(el);
            if (!field) return true;
            me._validate(el, field, true);

            return field.isValid;
        },

        //执行验证
        _validate: function(el, field, must) {
            var me = this,
                opt = me.options,
                $el = $(el),
                msgOpt = {},
                groupFn = field.group,
                target,
                old,
                ret,
                msgStatus = attr(el, DATA_INPUT_STATUS),
                isValid = field.isValid = true;

            //等待验证状态，后面可能会验证
            if (!field || !field.rules || el.disabled || $el.is('[novalidate]')) {
                return;
            }
            
            old = field.old;
            must = must || field.must; //此为特殊情况必须每次验证

            //如果非必填项且值为空，就没必要继续验证
            if (!field.required && el.value === '' && !groupFn) {
                if (msgStatus === 'tip') return;
                else me._focus({target: el});
                
                if (!$el.is(':checkbox,:radio')) {
                    $el.trigger('validated.field', [field, {
                        valid: true
                    }]);
                    return;
                }
            }

            //如果值没变，就直接返回旧的验证结果
            if (!must && old && old.ret !== undefined && old.value === el.value) {
                if (!old.ret.valid) isValid = me.isValid = false;
                if (msgStatus === 'tip') return;
                if (el.value !== '') {
                    msgOpt = old.ret;
                    $el.trigger('validated.field', [field, msgOpt]);
                    return;
                }
            }
            //如果有分组验证
            else if (groupFn) {
                $.extend(msgOpt, groupFn);
                ret = groupFn.call(me);
                if (ret === true) {
                    ret = undefined;
                    me.hideMsg(el, msgOpt);
                } else {
                    if (isString(ret)) ret = {
                        error: ret
                    };
                    me.hideMsg(el);
                    field.vid = 0;
                    field.rid = 'group';
                    isValid = false;
                }
            }

            //输出调试信息
            if (opt.debug) debug.log(el);

            //如果已经出来结果 (旧的验证结果，或者分组验证结果)
            if (ret !== undefined) {
                $el.trigger('validated.rule', [ret, field, msgOpt]);
            } else if (field.rule) {
                me._checkRule(el, field);
            }
        },

        //根据元素获取字段信息
        getField: function(el) {
            var me = this,
                key;

            if (el.id && '#' + el.id in me.fields || !el.name) {
                key = '#' + el.id;
            } else {
                key = el.name;
            }
            return me.fields[key];
        },

        //检测某个元素的值是否符合某个规则
        test: function(el, rule) {
            var ret,
                parts = rRule.exec(rule),
                method,
                params;

            if (!parts) return true;
            method = parts[1];
            params = parts[2] ? $.trim(parts[2]).split(', ') : undefined;
            if (method in this.rules) {
                ret = this.rules[method].call(this, el, params);
            }
            return ret === true || ret === undefined || ret;
        },

        getRangeMsg: function(value, params, type, prefix) {
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
                if (prefix && (prefix + c) in msg) {
                    c = prefix + c;
                }
                args[0] = msg[c];
            }
            return me.renderMsg.apply(null, args);
        },

        _getMsgOpt: function(obj) {
            if (isString(obj)) obj = {
                msg: obj
            };
            return $.extend({}, this.msgOpt, obj);
        },

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

        //显示消息接口
        showMsg: function(el, opt) {
            opt = this._getMsgOpt(opt);
            if (!opt.msg && !opt.showOk) return;
            //标记消息状态
            attr(el, DATA_INPUT_STATUS, opt.type);
            showMsg(el, opt, this.$el);
        },

        //隐藏消息接口
        hideMsg: function(el, opt) {
            opt = this._getMsgOpt(opt);
            hideMsg(el, opt, this.$el);
        },

        //用来显示服务器的验证消息。(提交表单并且服务器验证完毕后，返回一个name为键、msg为value的json传入此方法中)
        mapMsg: function(obj) {
            var me = this;

            $.each(obj, function(name, msg) {
                var el = me.elements[name] || $(':input[name="' + name + '"]', me.$el)[0];
                me.showMsg(el, msg);
            });
        },

        //自定义消息（优先于内置消息）
        setMsg: function(obj) {
            new Messages(obj, this.messages);
        },

        //自定义规则（注重复用性，完全自定义，就不局限于内置的规则了）
        setRule: function(obj) {
            new Rules(obj, this.rules);
        },

        /* 更新字段信息（如果是新字段就等于添加了一个字段）
         * 删除字段信息（删除后将不再验证该字段）
         */
        setField: function(key, obj) {
            var me = this,
                field = {};
            if (isString(key)) {
                if (obj === null) {
                    $.map(key.split(' '), function(k) {
                        if (k && me.fields[k]) me.fields[k] = null;
                    });
                    return;
                } else if (obj) {
                    field[key] = obj;
                }
            } else if (isObject(key)) {
                field = key;
            }
            $.extend(true, me.options.fields, field);
            me._init();
        },

        destroy: function() {
            this.$el.off().removeData(NS);
        }
    };


    function Rules(obj, context) {
        var that = context ? context === true ? this : context : Rules.prototype;

        if (!isObject(obj)) return;
        for (var k in obj) {
            that[k] = wrapRule(obj[k]);
        }
    }

    function Messages(obj, context) {
        var that = context ? context === true ? this : context : Messages.prototype;

        if (!isObject(obj)) return;
        for (var k in obj) {
            if (!obj[k]) return;
            that[k] = obj[k];
        }
    }

    function wrapRule(fn) {
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

    function keys2selector(keys) {
        var selector = '';
        $.map(keys.split(' '), function(k) {
            selector += ',' + (k.charAt(0) === '#' ? k : '[name="' + k + '"]');
        });
        return selector.substring(1);
    }

    //根据元素获得验证的实例

    function getInstance(el) {
        if (!el || !el.tagName) return;
        var wrap = el;
        switch (el.tagName.toUpperCase()) {
            case 'INPUT':
            case 'SELECT':
            case 'TEXTAREA':
                wrap = el.form || $(el).closest('.n-' + NS);
        }
        return $(wrap).data(NS) || $(wrap).validator().data(NS);
    }

    //获取节点上的相应规则

    function getDataRule(el, method) {
        var fn = $.trim(attr(el, 'data-rule-' + method));
        if (!fn) return;
        fn = (new Function("return " + fn))();
        if (fn) return wrapRule(fn);
    }

    //获取节点上的自定义消息

    function getDataMsg(el, field, item) {
        var msg = field.msg;
        if (isObject(msg) && item) msg = msg[item];
        if (!isString(msg)) {
            msg = attr(el, 'data-msg-' + item) || '';
        }
        return msg;
    }

    function getPos(str) {
        if (!str) return '';
        var pos = rPos.exec(str);
        return pos ? pos[1] : '';
    }

    function getTpl(str) {
        return (str || defaults.msgTemplate).replace('{#msg}', '<span class="msg-wrap"></span>');
    }

    function getMsgDOM(el, opt, context) {
        var $el, $msgbox, datafor, tpl;
        if (opt.target) {
            $el = $(opt.target, context);
            if ($el.length) el = $el[0];
        }
        datafor = el.name || '#' + el.id;
        $msgbox = $('.' + CLS_MSG_BOX + '[data-for=' + datafor + ']', context);
        if (!$msgbox.length) {
            $el = $(attr(el, 'data-target') || el);
            tpl = getTpl(opt.tpl);
            $msgbox = $(tpl).addClass(CLS_MSG_BOX).attr({
                tabindex: -1,
                role: "alert",
                style: opt.style || '',
                'data-for': datafor
            });
            if (opt.cls) $msgbox.addClass(opt.cls);
            $msgbox[!opt.pos || opt.pos === 'right' ? 'insertAfter' : 'insertBefore']($el);
        }
        return $msgbox;
    }

    function showMsg(el, opt, context) {
        var cls, fn, $msgbox, $msg, effect = opt.effect;

        cls = {
            error: CLS_MSG_INVALID,
            ok: CLS_MSG_VALID,
            tip: CLS_MSG_TIP,
            loading: CLS_MSG_LOADING
        }[opt.type || (opt.type = 'error')];

        //多元素共享一个消息DOM
        if ($(el).is(':checkbox,:radio')) {
            el = getGroupTarget(el, opt.pos === 'left');
        }

        $msgbox = getMsgDOM(el, opt, context);
        $msg = $msgbox.find('span.msg-wrap');
        if (!$msg.length) {
            $msg = $('<span class="msg-wrap"></span>').appendTo($msgbox);
        }
        $msg[0].innerHTML = (opt.arrow || '') + (opt.icon || '') + '<span class="n-msg">' + opt.msg + '</span>';
        $msg[0].className = 'msg-wrap ' + cls;
        $msgbox[0].style.display = '';

        if (effect) {
            if (isFunction(effect)) {
                fn = effect;
            } else if (isArray(effect) && isFunction(effect[0])) {
                fn = effect[0];
            }
            fn && fn($msg, opt.type);
        }
    }

    function hideMsg(el, opt, context) {
        opt = opt || {};
        if ($(el).is(':checkbox,:radio')) {
            opt.pos = opt.pos || getPos(defaults.msgTheme);
            el = getGroupTarget(el, opt.pos === 'left');
        }
        var $msgbox = getMsgDOM(el, opt, context),
            $msg,
            effect = opt.effect;
        if (!$msgbox.length) return;
        if (isArray(effect) && isFunction(effect[1])) {
            $msg = $msgbox.find('span.msg-wrap');
            $msgbox[0].style.display = '';
            effect[1]($msg, opt.type);
        } else {
            $msgbox[0].style.display = 'none';
        }
    }

    function getGroupTarget(el, isFirst) {
        return $(el).closest('.n-' + NS).find('input[name="' + el.name + '"]')[isFirst ? 'first' : 'last']()[0];
    }

    $(function() {
        $('body').on('focusin', ':input[data-rule]', function() {
            if (getInstance(this)) {
                $(this).trigger('focusin');
            } else {
                $(this).removeAttr('data-rule');
            }
        }).on('submit', 'form:not([novalidate])', function(e) {
            var $form = $(this),
                me;
            if (!$form.data(NS)) {
                me = $form.validator().data(NS);
                if (!$.isEmptyObject(me.fields)) {
                    me._submit(e);
                } else {
                    $form.attr('novalidate', true).removeData(NS);
                }
            }
        });
    });

    //内置规则
    new Rules({

        /** 必填
         *  required
         */
        required: function(element) {
            return !!$.trim(element.value);
        },

        /** 整数
         *  integer
         *  integer[+]
         *  integer[+0]
         *  integer[-]
         *  integer[-0]
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

        /** 是否匹配另一个字段
         *  match[password]    匹配password字段 (两字段的值必须相同)
         *  match[lt, count]   值必须小于count字段的值
         *  match[lte, count]  值必须小于或等于count字段的值
         *  match[gt, count]   值必须大于count字段的值
         *  match[gte, count]  值必须大于或等于count字段的值
         **/
        match: function(element, params) {
            var a = element.value,
                b,
                key, msg, type = 'eq',
                el2, field2;

            if (!params) return;
            if (params.length === 1) {
                key = params[0];
            } else {
                type = params[0];
                key = params[1];
            }
            el2 = $(key.charAt(0) === '#' ? key : ':input[name="' + key + '"]', this.$el)[0];
            if (!el2) return;
            field2 = this.getField(el2);
            msg = this.messages.match[type].replace('{1}', field2.display || key);
            b = el2.value;
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

        /** 数值范围
         *  range[0~99]    0-99的数
         *  range[0~]      大于0的数
         *  range[~100]    于100的数
         **/
        range: function(element, params) {
            return this.getRangeMsg(+element.value, params, 'range');
        },

        /** 针对checkbox选中的数目, 以及checkbox、radio是否有选中
         *  checked;       不能为空，相当于required
         *  checked[1~3]   选择1-3项
         *  checked[1~]    选择大于1项
         *  checked[~3]    选择少于3项
         *  checked[3]     选择3项
         **/
        checked: function(element, params) {
            if (!$(element).is(':radio,:checkbox')) return true;
            var count = $('input[name="' + element.name + '"]', this.$el).filter(function() {
                return !this.disabled && this.checked && $(this).is(':visible');
            }).length;
            if (!params) {
                return !!count || this.messages.required;
            } else {
                return this.getRangeMsg(count, params, 'checked');
            }
        },

        /** 验证长度 (可以传第二个参数"true", 将会计算字节长度)
         *  length[6~16]    6-16个字符
         *  length[6~]      大于6个字符
         *  length[~16]     小于16个字符
         *  length[~16, true]     小于16个字符, 非ASCII字符计算双字符
         **/
        length: function(element, params) {
            var value = element.value,
                len = (params[1] ? value.replace(rDoubleBytes, 'xx') : value).length;
            if (params && params[0].charAt(0) === '~') params[0] = '0' + params[0];
            return this.getRangeMsg(len, params, 'length', (params[1] ? '2_' : ''));
        },

        /** 远程验证
         *  适配3种结果(前面为成功，后面为失败):
                1.返回text:
                    ''  '错误消息'
                2.返回json:
                    {"ok": ""}  {"error": "错误消息"}
                3.json包装格式:
                    {"status": 1, "ok": ""}  {"status": 1, "error": "错误消息"}
         *  remote(url [name1, [name2 ...]]);
         */
        remote: function(element, params, field) {
            var me = this,
                arr,
                postData = {},
                parseData = function(data) {
                    if (isString(data) || (isObject(data) && ('error' in data || 'ok' in data))) return data;
                };

            if (!params) return true;
            arr = rAjaxType.exec(params[0]);
            postData[element.name] = element.value;
            //有额外字段
            if (params[1]) {
                $.map(params.slice(1), function(name) {
                    postData[name] = $(':input[name="' + name + '"]', this.$el).val();
                });
            }
            me.showMsg(element, {
                type: 'loading',
                msg: me.options.loadingMsg
            });
            $.ajax({
                url: arr[2],
                type: arr[1] || 'POST',
                data: postData,
                cache: false,
                complete: function(res, status) {
                    var msg = res.responseText, data;
                    if (msg === '') {
                        msg = true;
                    } else if (!msg && status === 'error') {
                        msg = 'Net error';
                    } else if (msg.charAt(0) === '{') {
                        msg = $.parseJSON(msg) || {};
                        data = parseData(msg);
                        if (data === undefined) data = parseData(msg.data);
                        msg = data || status === 'success';
                    } 
                    $(element).trigger('validated.rule', [msg, field]);
                }
            });
        },

        /** 过滤器，直接过滤不提示错误(支持自定义正则)
         *  filter          过滤<>&/
         *  filter(regexp)  过滤正则匹配的字符
         */
        filter: function(element, params) {
            var reg = params ? (new RegExp("[" + params[0] + "]", "g")) : rUnsafe;
            element.value = element.value.replace(reg, '');
        }
    });

    //公共静态接口
    Validator.defaults = defaults;
    Validator.showMsg = showMsg;
    Validator.hideMsg = hideMsg;

    /** 设置主题接口
     *  .setTheme( name, obj )
     *  .setTheme( obj )
     */
    Validator.setTheme = function(name, obj) {
        if (isObject(name)) {
            $.each(name, function(i, o) {
                themes[i] = o;
            });
        } else if (isString(name) && isObject(obj)) {
            themes[name] = obj;
        }
    };

    /** 配置参数接口
     *  .config( obj )
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
    $.validator = Validator;

})(jQuery);