/*********************************
 * Themes, rules, and i18n support
 * Locale: Chinese; 中文; TW (Taiwan)
 *********************************/
(function(factory) {
    if (typeof define === 'function') {
        define(function(require, exports, module){
            var $ = require('jquery'); $._VALIDATOR_URI = module.uri;
            require('../jquery.validator')($);
            factory($);
        });
    } else {
        factory(jQuery);
    }
}(function($) {
    /* Global configuration
     */
    $.validator.config({
        //stopOnError: true,
        //focusCleanup: true,
        //theme: 'yellow_right',
        //timely: 2,
        defaultMsg: "{0}格式不正確",
        loadingMsg: "正在驗證...",
        
        // Custom rules
        rules: {
            digits: [/^\d+$/, "請輸入數字"]
            ,letters: [/^[a-z]+$/i, "請輸入字母"]
            ,date: [/^\d{4}-\d{1,2}-\d{1,2}$/, "請輸入有效的日期，格式:yyyy-mm-dd"]
            ,time: [/^([01]\d|2[0-3])(:[0-5]\d){1,2}$/, "請輸入有效的時間，00:00到23:59之間"]
            ,email: [/^[\w\+\-]+(\.[\w\+\-]+)*@[a-z\d\-]+(\.[a-z\d\-]+)*\.([a-z]{2,4})$/i, "請輸入有效的電郵"]
            ,url: [/^(https?|s?ftp):\/\/\S+$/i, "請輸入有效的網址"]
            ,accept: function (element, params){
                if (!params) return true;
                var ext = params[0];
                return (ext === '*') ||
                       (new RegExp(".(?:" + ext + ")$", "i")).test(element.value) ||
                       this.renderMsg("只接受{1}後綴的文件", ext.replace(/\|/g, ','));
            }
            
        }
    });

    /* Default error messages
     */
    $.validator.config({
        messages: {
            error: "網絡異常",
            timeout: "請求超時",
            required: "{0}不能為空",
            remote: "{0}已被使用",
            integer: {
                '*': "請輸入整數",
                '+': "請輸入正整數",
                '+0': "請輸入正整數或0",
                '-': "請輸入負整數",
                '-0': "請輸入負整數或0"
            },
            match: {
                eq: "{0}與{1}不一致",
                neq: "{0}與{1}不能相同",
                lt: "{0}必須小於{1}",
                gt: "{0}必須大於{1}",
                lte: "{0}不能大於{1}",
                gte: "{0}不能小於{1}"
            },
            range: {
                rg: "請輸入{1}到{2}的數",
                gte: "請輸入不小於{1}的數",
                lte: "請輸入最大{1}的數"
            },
            checked: {
                eq: "請選擇{1}項",
                rg: "請選擇{1}到{2}項",
                gte: "請至少選擇{1}項",
                lte: "請最多選擇{1}項"
            },
            length: {
                eq: "請輸入{1}個字符",
                rg: "請輸入{1}到{2}個字符",
                gte: "請至少輸入{1}個字符",
                lte: "請最多輸入{1}個字符",
                eq_2: "",
                rg_2: "",
                gte_2: "",
                lte_2: ""
            }
        }
    });

    /* Themes
     */
    var TPL_ICON = '<span class="n-arrow"><b>◆</b><i>◆</i></span><span class="n-icon"></span>';
    $.validator.setTheme({
        'simple_right': {
            formClass: 'n-simple',
            msgClass: 'n-right'
        },
        'simple_bottom': {
            formClass: 'n-simple',
            msgClass: 'n-bottom'
        },
        'yellow_top': {
            formClass: 'n-yellow',
            msgClass: 'n-top',
            msgIcon: TPL_ICON
        },
        'yellow_right': {
            formClass: 'n-yellow',
            msgClass: 'n-right',
            msgIcon: TPL_ICON
        },
        'yellow_right_effect': {
            formClass: 'n-yellow',
            msgClass: 'n-right',
            msgIcon: TPL_ICON,
            msgShow: function($msgbox, type){
                var $el = $msgbox.children();
                if ($el.is(':animated')) return;
                if (type === 'error') {
                    $el.css({
                        left: '20px',
                        opacity: 0
                    }).delay(100).show().stop().animate({
                        left: '-4px',
                        opacity: 1
                    }, 150).animate({
                        left: '3px'
                    }, 80).animate({
                        left: 0
                    }, 80);
                } else {
                    $el.css({
                        left: 0,
                        opacity: 1
                    }).fadeIn(200);
                }
            },
            msgHide: function($msgbox, type){
                var $el = $msgbox.children();
                $el.stop().delay(100).show().animate({
                    left: '20px',
                    opacity: 0
                }, 300, function(){
                    $msgbox.hide();
                });
            }
        }
    });
}));