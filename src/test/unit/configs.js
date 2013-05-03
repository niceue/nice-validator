//规则
module('configs', {
    setup:function() {
    },
    teardown:function() {
    }
});

//全局配置规则
test('config.rules', function(){
    var obj;

    $.validator.config({
        rules: {
            globalRule1: [/\d*/, "only a test"],
            globalRule2: function(element, params){
                return !!element.value === "" || "only a test";
            } 
        }
    });
    obj = $('#form').validator().data('validator');
    ok(obj.rules.globalRule1, "全局配置规则: 数组");
    ok(obj.rules.globalRule2, "全局配置规则: 函数");
    obj.destroy();
    resetForm('#form');
});

test('config.messages', function(){
    var obj;

    $.validator.config({
        messages: {
            required: 'xxx'
        }
    });
    obj = $('#form').validator().data('validator');
    ok(obj.messages.required === 'xxx', "全局配置消息");
    obj.destroy();
    resetForm('#form');
});

test('config.theme', function(){
    var obj;

    $.validator.config({
        theme: 'simple_bottom'
    });
    obj = $('#form').validator().data('validator');
    ok(obj.options.msgClass === 'n-bottom', "全局配置主题");
    obj.destroy();
    resetForm('#form');
});