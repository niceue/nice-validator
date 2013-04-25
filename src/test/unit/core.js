//核心
module('core', {
    setup:function() {
    },
    teardown:function() {
    }
});

test('validator()', function(){
    var obj;
    expect(4);

    obj = $('#form').validator().data('validator');
    ok( obj && obj.fields.username, "无参调用" );
    obj.destroy();
    resetForm('#form');

    obj = $('#form_normal').validator({
        fields: {
            username: 'required'
        }
    }).data('validator');
    ok( obj && obj.fields.username, "传参调用" );
    obj.destroy();

    $('#username').trigger('focusin');
    obj = $('#form').data('validator');
    ok( obj, "不调用, focus字段时自动初始化" );
    obj.destroy();
    resetForm('#form');

    $('#form_submit').trigger('submit');
    obj = $('#form_submit').data('validator');
    ok( obj, "不调用, submit表单时自动初始化" );
    obj.destroy();

    resetForm('#form');
    resetForm('#form_submit');
});

test('isValid()', function(){
    var obj;
    expect(2);

    obj = $('#form').validator().data('validator');
    ok( $('#username').val('jony').isValid() === true, "Assert true" );
    ok( $('#username').val('').isValid() === false, "Assert false" );
    obj.destroy();
    resetForm('#form');
});