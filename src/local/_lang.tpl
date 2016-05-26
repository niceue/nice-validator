/*********************************
 * Themes, rules, and i18n support
 * Locale: <#=local#>
 *********************************/
(function(factory) {
    'function' === typeof define && (define.amd || define.cmd) ? define(function(require, exports, module){
        var $ = require('jquery')||jQuery; $._VALIDATOR_URI = module.uri;
        require('../jquery.validator.min')($);
        factory($);
    }) : factory(jQuery);
}(function($) {

    /* Global configuration
     */
    $.validator.config({
        //stopOnError: true,
        //focusCleanup: true,
        //theme: 'yellow_right',
        //timely: 2,

        // Custom rules
        rules: {
            <#
            if (rules) {
                var mark, i;
                for(i in rules) {
                    if (!mark) {
                        mark = true;
                    } else {
                        echo(',');
                    }
                    if ( typeof rules[i] === 'object' ) {
                        echo( i + ': [' + rules[i][0].toString() + ', "' + rules[i][1] + '"]' );
                    } else {
                        echo( i + ': ' + rules[i].toString().replace(/\n\s{4}/g,'\n            ') );
                    }
            #>
            <# }} #>
        },

        // Default error messages
        messages: {
            0: "<#=lang[0]#>",
            fallback: "<#=lang.fallback#>",
            loading: "<#=lang.loading#>",
            error: "<#=lang.error#>",
            timeout: "<#=lang.timeout#>",
            required: "<#=lang.required#>",
            remote: "<#=lang.remote#>",
            integer: {
                '*': "<#=lang.integer_nzp#>",
                '+': "<#=lang.integer_p#>",
                '+0': "<#=lang.integer_pz#>",
                '-': "<#=lang.integer_n#>",
                '-0': "<#=lang.integer_nz#>"
            },
            match: {
                eq: "<#=lang.match_eq#>",
                neq: "<#=lang.match_neq#>",
                lt: "<#=lang.match_lt#>",
                gt: "<#=lang.match_gt#>",
                lte: "<#=lang.match_lte#>",
                gte: "<#=lang.match_gte#>"
            },
            range: {
                rg: "<#=lang.range_rg#>",
                gte: "<#=lang.range_gte#>",
                lte: "<#=lang.range_lte#>",
                gtlt: "<#=lang.range_gtlt#>",
                gt: "<#=lang.range_gt#>",
                lt: "<#=lang.range_lt#>"
            },
            checked: {
                eq: "<#=lang.checked_eq#>",
                rg: "<#=lang.checked_rg#>",
                gte: "<#=lang.checked_gte#>",
                lte: "<#=lang.checked_lte#>"
            },
            length: {
                eq: "<#=lang.length_eq#>",
                rg: "<#=lang.length_rg#>",
                gte: "<#=lang.length_gte#>",
                lte: "<#=lang.length_lte#>",
                eq_2: "<#=lang.length_eq_2#>",
                rg_2: "<#=lang.length_rg_2#>",
                gte_2: "<#=lang.length_gte_2#>",
                lte_2: "<#=lang.length_lte_2#>"
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
                    $el.css({left: '20px', opacity: 0})
                        .delay(100).show().stop()
                        .animate({left: '-4px', opacity: 1}, 150)
                        .animate({left: '3px'}, 80)
                        .animate({left: 0}, 80);
                } else {
                    $el.css({left: 0, opacity: 1}).fadeIn(200);
                }
            },
            msgHide: function($msgbox, type){
                var $el = $msgbox.children();
                $el.stop().delay(100).show()
                    .animate({left: '20px', opacity: 0}, 300, function(){
                        $msgbox.hide();
                    });
            }
        }
    });
}));