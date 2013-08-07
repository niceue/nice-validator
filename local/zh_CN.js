/*********************************
 * 主题，规则定义，以及国际化支持
 *********************************/
(function ($) {
    /* 全局配置
     * 可以覆盖默认配置, 也会被主题配置和调用时的传参覆盖
     */
    $.validator.config({
        //stopOnError: false,
        //theme: 'yellow_right',
        defaultMsg: '{0}格式不正确',
        loadingMsg: '正在验证...',
        
        //自定义规则
        rules: {
            digits: [/^\d*$/, "{0}只能输入数字"], //纯数字
            letters: [/^[a-z]*$/i, "{0}只能输入字母"], //纯字母
            tel: [/^(?:(?:0\d{2,3}[- ]?[1-9]\d{6,7})|(?:[48]00[- ]?[1-9]\d{6}))$/, "电话格式不正确"],  //办公或家庭电话
            mobile: [/^1[3-9]\d{9}$/, "手机号格式不正确"],  //移动电话
            email: [/^(?:[a-z0-9]+[_\-+.]?)*[a-z0-9]+@(?:([a-z0-9]+-?)*[a-z0-9]+.)+([a-z]{2,})+$/i, "邮箱格式不正确"],
            qq: [/^[1-9]\d{4,}$/,"QQ号格式不正确"],
            date: [/^\d{4}-\d{1,2}-\d{1,2}$/, "请输入正确的日期,例:yyyy-mm-dd"],
            time: [/^([01]\d|2[0-3])(:[0-5]\d){1,2}$/, "请输入正确的时间,例:14:30或14:30:00"],
            ID_card: [/^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])((\d{4})|\d{3}[A-Z])$/, "请输入正确的身份证号码"],
            url: [/^(https?|ftp):\/\/[^\s]*$/i, "网址格式不正确"],
            postcode: [/^[1-9]\d{5}$/, "邮政编码格式不正确"],
            chinese: [/^[\u0391-\uFFE5]+$/, "请输入中文"],
            username: [/^\w{3,12}$/, "请输入3-12位数字、字母、下划线"], //用户名
            password: [/^[0-9a-zA-Z]{6,16}$/, "密码由6-16位数字、字母组成"], //密码
            //可接受的后缀名
            accept: function(element, params){
                if (!params) return true;
                var ext = params[0];
                return (ext === '*') 
                    || (new RegExp(".(?:" + (ext || "png|jpg|jpeg|gif") + ")$", "i")).test(element.value) 
                    || this.renderMsg("只接受{1}后缀", ext.replace('|', ','));
            }
        }
    });

    /* 配置默认规则的错误消息
     */
    $.validator.config({
        messages: {
            required: "{0}不能为空",
            remote: "{0}已被使用",
            integer: {
                '*': "请输入整数",
                '+': "请输入正整数",
                '+0': "请输入正整数或0",
                '-': "请输入负整数",
                '-0': "请输入负整数或0"
            },
            match: {
                eq: "{0}与{1}不一致",
                lt: "{0}必须小于{1}",
                gt: "{0}必须大于{1}",
                lte: "{0}必须小于或等于{1}",
                gte: "{0}必须大于或等于{1}"
            },
            range: {
                rg: "请输入{1}到{2}的数",
                gt: "请输入大于或等于{1}的数",
                lt: "请输入小于或等于{1}的数"
            },
            checked: {
                eq: "请选择{1}项",
                rg: "请选择{1}到{2}项",
                gt: "请至少选择{1}项",
                lt: "请最多选择{1}项"
            },
            length: {
                eq: "请输入{1}个字符",
                rg: "请输入{1}到{2}个字符",
                gt: "请输入大于{1}个字符",
                lt: "请输入小于{1}个字符",
                "2_eq": "请输入{1}个字符,中文算双字符",
                "2_rg": "请输入{1}到{2}个字符,中文算双字符",
                "2_gt": "请输入大于{1}个字符,中文算双字符",
                "2_lt": "请输入小于{1}个字符,中文算双字符"
            }
        }
    });
    
    /* 配置主题
     * 可以覆盖全局配置，同时也会被调用时的传参覆盖
     * 所谓主题，是通过配置表单的class、消息模板以及其他一些参数实现的不同展现效果
     * 所有参数(除了rules和messages), 都可以用来配置主题; 主题名字可以随意定义
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
        'yellow_right': {
            formClass: 'n-yellow',
            msgClass: 'n-right',
            msgArrow: TPL_ARROW
        },
        'yellow_right_effect': {
            formClass: 'n-yellow',
            msgClass: 'n-right',
            msgArrow: TPL_ARROW,
            msgShow: function($el, type){
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
            msgHide: function($el, type){
                $el.stop().delay(100).show().animate({
                    left: '20px',
                    opacity: 0
                }, 300);
            }
        }
    });
})(jQuery);