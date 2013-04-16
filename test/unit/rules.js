//规则
module('rules', {
    setup:function() {
    },
    teardown:function() {
    }
});

//全局配置规则
test('config.rules', function(){
    var obj;
    expect(2);

    $.validator.config({
        rules: {
            globalRule1: [/\d*/, "only a test"],
            globalRule2: function(element, params){
                return !!element.value === "" || "only a test";
            } 
        }
    });
    obj = $('#form').validator().data('validator');
    ok(obj.rules.globalRule1, "数组定义规则");
    ok(obj.rules.globalRule2, "函数定义规则");
    obj.destroy();
    resetForm('#form');
});

//调用时传递局部规则
test('options.rules', function(){
    var obj;
    expect(1);

    obj = $('#form').validator({
        rules: {
            testRule1: [/\d*/, "only a test"]
        }
    }).data('validator');
    ok(obj.rules.testRule1, "调用时传递局部规则");
    obj.destroy();
    resetForm('#form');
});

//调用后对规则的操作
test('setRule()', function(){
    var obj, T, F,
        $el = $('#form').find('input[name="username"]');;
    expect(1);

    obj = $('#form').validator({
        rules: {
            testRule1: [/^\d+$/, "only a test"]
        },
        fields: {
            username: 'testRule1'
        }
    }).data('validator');

    F = $el.val('test').isValid();
    obj.setRule({
        testRule1: [/^test$/, "only a test"]
    });
    T = $el.isValid();

    ok( T === true && F === false, "调用后对规则的操作");
    obj.destroy();
    resetForm('#form');
});

//##############################################
//内置规则验证

test('required', function(){
    var obj, T, F,
        $el = $('#form').find('input[name="username"]');
    expect(3);

    obj = $('#form_normal').validator({
        username: 'required'
    }).data('validator');

    F = $el.val('').isValid();
    ok( F === false, 'false: String ""');

    F = $el.val('  ').isValid();
    ok( F === false, 'false: String "   "');

    T = $el.val('0').isValid();
    ok( T === true, 'true: String "0"');
    
    obj.destroy();
    resetForm('#form');
});

test('integer', function(){
    var obj, T, F,
        $el = $('#form_normal').find('input[name="field1"]');
    expect(5);

    obj = $('#form_normal').validator({
        fields: {
            field1: 'integer'
        }
    }).data('validator');

    //integer
    F = $el.val('test').isValid();
    ok( F === false, 'integer');
    //integer[+]
    obj.updateField({field1: 'integer[+]'});
    F = $el.val('0').isValid();
    T  = $el.val('1').isValid();
    ok( T === true && F === false, 'integer[+]');
    //integer[+0]
    obj.updateField({field1: 'integer[+0]'});
    F = $el.val('-1').isValid();
    T  = $el.val('0').isValid();
    ok( T === true && F === false, 'integer[+0]');
    //integer[-]
    obj.updateField({field1: 'integer[-]'});
    F = $el.val('0').isValid();
    T  = $el.val('-1').isValid();
    ok( T === true && F === false, 'integer[-]');
    //integer[-0]
    obj.updateField({field1: 'integer[-0]'});
    F = $el.val('1').isValid();
    T  = $el.val('0').isValid();
    ok( T === true && F === false, 'integer[-0]');

    obj.destroy();
    resetForm('#form');
});

test('match', function(){
    var obj, T, F,
        $el1 = $('#form_normal').find('input[name="field1"]').val('test'),
        $el2 = $('#form_normal').find('input[name="field2"]');
    expect(5);

    obj = $('#form_normal').validator({
        fields: {
            field1: 'required',
            field2: 'match[field1]'
        }
    }).data('validator');

    //match[]
    F = $el2.val('test2').isValid();
    T = $el2.val('test').isValid();
    ok( T === true && F === false, 'match[field1]');

    $el1.val('10');

    //match[lt, field1]
    obj.updateField({field2: 'match[lt, field1]'});
    F = $el2.val('11').isValid();
    T = $el2.val('9').isValid();
    ok( T === true && F === false, 'match[lt, field1]');
    //match[lte, field1]
    obj.updateField({field2: 'match[lte, field1]'});
    F = $el2.val('11').isValid();
    T = $el2.val('10').isValid();
    ok( T === true && F === false, 'match[lte, field1]');
    //match[gt, field1]
    obj.updateField({field2: 'match[gt, field1]'});
    F = $el2.val('9').isValid();
    T = $el2.val('11').isValid();
    ok( T === true && F === false, 'match[gt, field1]');
    //match[gte, field1]
    obj.updateField({field2: 'match[gte, field1]'});
    F = $el2.val('9').isValid();
    T = $el2.val('10').isValid();
    ok( T === true && F === false, 'match[gte, field1]');

    obj.destroy();
});

test('range', function(){
    var obj, T, F,
        $el = $('#form_normal').find('input[name="field1"]');
    expect(3);

    obj = $('#form_normal').validator({
        fields: {
            field1: 'range[0~99]'
        }
    }).data('validator');

    //range[0~99]
    F = $el.val('100').isValid();
    T = $el.val('0').isValid();
    ok( T === true && F === false, 'range[0~99]');
    //range[0~]
    obj.updateField({field1: 'range[0~]'});
    F = $el.val('-1').isValid();
    T = $el.val('0').isValid();
    ok( T === true && F === false, 'range[0~]');
    //range[~99]
    obj.updateField({field1: 'range[~99]'});
    F = $el.val('100').isValid();
    T = $el.val('99').isValid();
    ok( T === true && F === false, 'range[~99]');

    obj.destroy();
});

test('checked', function(){
    var obj, T, F,
        $els = $('#form_normal').find('input[name="checkbox"]');
    expect(5);

    $els.prop('checked', false);

    obj = $('#form_normal').validator({
        fields: {
            checkbox: 'checked'
        }
    }).data('validator');

    //checked
    F = $els.eq(0).isValid();
    T = $els.eq(0).prop('checked', true).isValid();
    ok( T === true && F === false, 'checked');
    //checked[2~3]
    obj.updateField({checkbox: 'checked[2~3]'});
    F = $els.eq(0).isValid();
    T = $els.eq(1).prop('checked', true).isValid();
    ok( T === true && F === false, 'checked[2~3]');
    //checked[2~]
    obj.updateField({checkbox: 'checked[2~]'});
    $els.prop('checked', false).eq(0).prop('checked', true);
    F = $els.eq(0).isValid();
    T = $els.eq(1).prop('checked', true).isValid();
    ok( T === true && F === false, 'checked[2~]');
    //checked[~2]
    obj.updateField({checkbox: 'checked[~2]'});
    $els.prop('checked', true);
    F = $els.eq(0).isValid();
    T = $els.eq(0).prop('checked', false).isValid();
    ok( T === true && F === false, 'checked[~2]');
    //checked[2]
    obj.updateField({checkbox: 'checked[2]'});
    $els.prop('checked', true);
    F = $els.eq(0).isValid();
    T = $els.eq(0).prop('checked', false).isValid();
    ok( T === true && F === false, 'checked[2]');

    obj.destroy();
});

test('length', function(){
    var obj, T, F,
        $el = $('#form_normal').find('input[name="field1"]');
    expect(4);

    obj = $('#form_normal').validator({
        fields: {
            field1: 'length[4~10]'
        }
    }).data('validator');

    //length[4~10]
    F = $el.val('123').isValid();
    T = $el.val('1234').isValid();
    ok( T === true && F === false, 'length[4~10]');
    //length[4~]
    obj.updateField({field1: 'length[4~]'});
    F = $el.val('123').isValid();
    T = $el.val('1234').isValid();
    ok( T === true && F === false, 'length[4~]');
    //length[~4]
    obj.updateField({field1: 'length[~4]'});
    F = $el.val('12345').isValid();
    T = $el.val('1234').isValid();
    ok( T === true && F === false, 'length[~4]');
    //length[~4, true]
    obj.updateField({field1: 'length[~4, true]'});
    F = $el.val('测试1').isValid();
    T = $el.val('测试').isValid();
    ok( T === true && F === false, 'length[~4, true]');

    obj.destroy();
});
/*
asyncTest('remote', 1, function(){
    var obj, T, F,
        $el = $('#form').find('input[name="username"]');
    
    obj = $('#form').validator({
        fields: {
            username: 'remote[../valid_username.php]'
        }
    }).data('validator');
    
    $el.on('valid.field', function(e, field, data){
        ok(true, 'remote[../../valid_username.php]');
        start();
    });
    
    $el.val('jony').trigger('validate');
    
});
*/