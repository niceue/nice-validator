/*********************************
 * Themes, rules, and i18n support
 * Locale: English
 *********************************/
(function ($) {
    /* Global configuration
     */
    $.validator.config({
        //stopOnError: false,
        //theme: 'yellow_right',
        defaultMsg: "This field is not valid.",
        loadingMsg: "Validating...",
        
        // Custom rules
        rules: {
            digits: [/^\d*$/, "Please enter only digits."]
            
        }
    });

    /* Default error messages
     */
    $.validator.config({
        messages: {
            required: "This field is required.",
            remote: "{0} is already in use.",
            integer: {
                '*': "Please enter an integer.",
                '+': "Please enter a positive integer.",
                '+0': "Please enter a positive integer or 0.",
                '-': "Please enter a negative integer.",
                '-0': "Please enter a negative integer or 0."
            },
            match: {
                eq: "{0} must be equal to {1}.",
                neq: "{0} must be not equal to {1}.",
                lt: "{0} must be less than {1}.",
                gt: "{0} must be greater than {1}.",
                lte: "{0} must be less than or equal to {1}.",
                gte: "{0} must be greater than or equal to {1}."
            },
            range: {
                rg: "Please enter a number between {1} and {2}.",
                gt: "Please enter a number greater than or equal to {1}.",
                lt: "Please enter a number less than or equal to {1}."
            },
            checked: {
                eq: "Please check {1} items.",
                rg: "Please check between {1} and {2} items.",
                gt: "Please check at least {1} items.",
                lt: "Please check no more than {1} items."
            },
            length: {
                eq: "Please enter {1} characters.",
                rg: "Please enter a value between {1} and {2} characters long.",
                gt: "Please enter at least {1} characters.",
                lt: "Please enter no more than {1} characters.",
                eq_2: "",
                rg_2: "",
                gt_2: "",
                lt_2: ""
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
})(jQuery);