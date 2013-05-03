//规则
module('rules', {
    setup:function() {
    },
    teardown:function() {
    }
});

//调用时传递局部规则
test('options.rules', function(){
    var obj;

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
    var obj,
        $el = $('#form').find('input[name="username"]');

    obj = $('#form_normal').validator({
        username: 'required'
    }).data('validator');

    ok( $el.val('').isValid() === false, 'false: String ""');

    ok( $el.val('  ').isValid() === false, 'false: String "   "');

    ok( $el.val('0').isValid() === true, 'true: String "0"');
    
    obj.destroy();
    resetForm('#form');
});

test('integer', function(){
    var obj,
        $el = $('#form_normal').find('input[name="field1"]');

    obj = $('#form_normal').validator({
        fields: {
            field1: 'integer'
        }
    }).data('validator');

    //integer
    ok( $el.val('abc').isValid() === false &&
        $el.val('3.14').isValid() === false &&
        $el.val('1').isValid() === true
    , 'integer');
    
    //integer[+]
    obj.setField({field1: 'integer[+]'});
    ok( $el.val('0').isValid() === false && 
        $el.val('1').isValid() === true && 
        $el.val('-1').isValid() === false &&
        $el.val('abc').isValid() === false 
    , 'integer[+]');
    
    //integer[+0]
    obj.setField({field1: 'integer[+0]'});
    ok( $el.val('0').isValid() === true && 
        $el.val('1').isValid() === true && 
        $el.val('-1').isValid() === false
    , 'integer[+0]');
    
    //integer[-]
    obj.setField({field1: 'integer[-]'});
    ok( $el.val('0').isValid() === false && 
        $el.val('1').isValid() === false && 
        $el.val('-1').isValid() === true
    , 'integer[-]');
    
    //integer[-0]
    obj.setField({field1: 'integer[-0]'});
    ok( $el.val('0').isValid() === true && 
        $el.val('1').isValid() === false &&
        $el.val('-1').isValid() === true
    , 'integer[-0]');

    obj.destroy();
    resetForm('#form');
});

test('match', function(){
    var obj,
        $el1 = $('#form_normal').find('input[name="field1"]').val('test'),
        $el2 = $('#form_normal').find('input[name="field2"]');

    obj = $('#form_normal').validator({
        fields: {
            field1: 'required',
            field2: 'match[field1]'
        }
    }).data('validator');

    //match[]
    ok( $el2.val('test').isValid() === true && 
        $el2.val('test2').isValid() === false
    , 'match[field1]');

    $el1.val('10');

    //match[lt, field1]
    obj.setField({field2: 'match[lt, field1]'});
    ok( $el2.val('9').isValid() === true && 
        $el2.val('10').isValid() === false && 
        $el2.val('11').isValid() === false
    , 'match[lt, field1]');
    
    //match[lte, field1]
    obj.setField({field2: 'match[lte, field1]'});
    ok( $el2.val('9.5').isValid() === true && 
        $el2.val('10').isValid() === true && 
        $el2.val('11').isValid() === false
    , 'match[lte, field1]');
    
    //match[gt, field1]
    obj.setField({field2: 'match[gt, field1]'});
    ok( $el2.val('9').isValid() === false && 
        $el2.val('10').isValid() === false && 
        $el2.val('10.5').isValid() === true
    , 'match[gt, field1]');
    
    //match[gte, field1]
    obj.setField({field2: 'match[gte, field1]'});
    ok( $el2.val('9').isValid() === false && 
        $el2.val('10').isValid() === true && 
        $el2.val('10.5').isValid() === true
    , 'match[gte, field1]');

    obj.destroy();
});

test('range', function(){
    var obj,
        $el = $('#form_normal').find('input[name="field1"]');

    obj = $('#form_normal').validator({
        fields: {
            field1: 'range[0~99]'
        }
    }).data('validator');

    //range[0~99]
    ok( $el.val('0').isValid() === true && 
        $el.val('0.5').isValid() === true && 
        $el.val('99').isValid() === true && 
        $el.val('abc').isValid() === false && 
        $el.val('100').isValid() === false
    ,'range[0~99]');
    
    //range[0~]
    obj.setField({field1: 'range[0~]'});
    ok( $el.val('0').isValid() === true && 
        $el.val('0.5').isValid() === true && 
        $el.val('-1').isValid() === false
    ,'range[0~]');
    
    //range[~99]
    obj.setField({field1: 'range[~99]'});
    ok( $el.val('-1').isValid() === true && 
        $el.val('99').isValid() === true && 
        $el.val('100').isValid() === false
    ,'range[~99]');

    obj.destroy();
});

test('checked', function(){
    var obj,
        $els = $('#form_normal').find('input[name="checkbox"]').prop('checked', false);

    obj = $('#form_normal').validator({
        fields: {
            checkbox: 'checked'
        }
    }).data('validator');

    //checked
    ok( $els.eq(0).isValid() === false && 
        $els.eq(0).prop('checked', true).isValid() === true
    , 'checked');
    
    //checked[2~3]
    obj.setField({checkbox: 'checked[2~3]'});
    ok( $els.eq(0).isValid() === false && 
        $els.eq(1).prop('checked', true).isValid() === true
    , 'checked[2~3]');
    
    //checked[2~]
    obj.setField({checkbox: 'checked[2~]'});
    $els.prop('checked', false).eq(0).prop('checked', true);
    ok( $els.eq(0).isValid() === false && 
        $els.eq(1).prop('checked', true).isValid() === true
    , 'checked[2~]');
    
    //checked[~2]
    obj.setField({checkbox: 'checked[~2]'});
    $els.prop('checked', true);
    ok( $els.eq(0).isValid() === false && 
        $els.eq(0).prop('checked', false).isValid() === true
    , 'checked[~2]');
    
    //checked[2]
    obj.setField({checkbox: 'checked[2]'});
    $els.prop('checked', true);
    ok( $els.eq(0).isValid() === false && 
        $els.eq(0).prop('checked', false).isValid() === true
    , 'checked[2]');

    obj.destroy();
});

test('length', function(){
    var obj,
        $el = $('#form_normal').find('input[name="field1"]');

    obj = $('#form_normal').validator({
        fields: {
            field1: 'length[4~10]'
        }
    }).data('validator');

    //length[4~10]
    ok( $el.val('1234').isValid() === true && 
        $el.val('abcdefghij').isValid() === true && 
        $el.val('abcde.fghij').isValid() === false && 
        $el.val('123').isValid() === false
    , 'length[4~10]');
    
    //length[4~]
    obj.setField({field1: 'length[4~]'});
    ok( $el.val('1234').isValid() === true && 
        $el.val('123').isValid() === false
    , 'length[4~]');
    
    //length[~4]
    obj.setField({field1: 'length[~4]'});
    ok( $el.val('1234').isValid() === true && 
        $el.val('12345').isValid() === false
    , 'length[~4]');
    
    //length[~4, true]
    obj.setField({field1: 'length[~4, true]'});
    ok( $el.val('测试').isValid() === true && 
        $el.val('测试1').isValid() === false
    , 'length[~4, true]');

    obj.destroy();
});

if (document.domain) {
    asyncTest('remote', 2, function(){
        var obj;
        
        obj = $('#form_normal').validator({
            fields: {
                username: 'remote[../valid_username.php]'
            }
        }).data('validator');
        
        $('#form_normal').find('input[name="username"]')
        .on('valid.field', function(e, field, data){
            ok(true, 'new');
            $(this).val('123').trigger('validate');
        })
        .on('invalid.field', function(e, field, data){
            ok(true, 'exist');
            obj.destroy();
            start();
        }).val('jonyzhang').trigger('validate');
          
    });
}