/*********************************
 * Themes, rules, and i18n support
 * Locale: <#=local_string#>
 *********************************/
(function(factory) {
    if (typeof define === 'function') {
        define(function(require, exports, module){
            var $ = require('jquery');
            $._VALIDATOR_URI = module.uri;
            require('../src/jquery.validator')($);
            factory($);
        });
    } else {
        factory(jQuery);
    }
}(function($) {
    /* Global configuration
     */
    $.validator.config({
        //stopOnError: false,
        //theme: 'yellow_right',
        defaultMsg: "<#=defaultMsg#>",
        loadingMsg: "<#=loadingMsg#>",
        
        // Custom rules
        rules: {
            digits: [/^\d+$/, "<#=digits#>"]
            <# 
            if (rules) {
                for(var i in rules) {
                    if ( typeof rules[i] === 'object' ) {
                        echo( ',' + i + ': [' + rules[i][0].toString() + ', "' + rules[i][1] + '"]' );
                    } else {
                        echo( ',' + i + ': ' + rules[i].toString().replace(/\n\s{4}/g,'\n            ') );
                    }
            #>
            <# }} #>
        }
    });

    /* Default error messages
     */
    $.validator.config({
        messages: {
            required: "<#=required#>",
            remote: "<#=remote#>",
            integer: {
                '*': "<#=integer_nzp#>",
                '+': "<#=integer_p#>",
                '+0': "<#=integer_pz#>",
                '-': "<#=integer_n#>",
                '-0': "<#=integer_nz#>"
            },
            match: {
                eq: "<#=match_eq#>",
                neq: "<#=match_neq#>",
                lt: "<#=match_lt#>",
                gt: "<#=match_gt#>",
                lte: "<#=match_lte#>",
                gte: "<#=match_gte#>"
            },
            range: {
                rg: "<#=range_rg#>",
                gte: "<#=range_gte#>",
                lte: "<#=range_lte#>"
            },
            checked: {
                eq: "<#=checked_eq#>",
                rg: "<#=checked_rg#>",
                gte: "<#=checked_gte#>",
                lte: "<#=checked_lte#>"
            },
            length: {
                eq: "<#=length_eq#>",
                rg: "<#=length_rg#>",
                gte: "<#=length_gte#>",
                lte: "<#=length_lte#>",
                eq_2: "<#=length_eq_2#>",
                rg_2: "<#=length_rg_2#>",
                gte_2: "<#=length_gte_2#>",
                lte_2: "<#=length_lte_2#>"
            }
        }
    });

    /* Themes
     */
    var TPL_ARROW = '<span class="n-arrow"><b>◆</b><i>◆</i></span>';
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
            msgArrow: TPL_ARROW
        },
        'yellow_right': {
            formClass: 'n-yellow',
            msgClass: 'n-right',
            msgArrow: TPL_ARROW
        },
        'yellow_right_effect': {
            formClass: 'n-yellow',
            msgClass: 'n-right',
            msgArrow: TPL_ARROW,
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