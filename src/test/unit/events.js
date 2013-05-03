//事件
module('events', {
    setup:function() {
    },
    teardown:function() {
    }
});


asyncTest('valid.rule', function(){
    var obj;
    
    obj = $('#form_normal').validator({
        fields: {
            username: 'required;username'
        }
    }).data('validator');
    
    $('#form_normal').find('input[name="username"]')
    .on('valid.rule', function(e, rulename){
        if (rulename==='username') {
            ok(true, 'valid.rule');
            start();
        }
    }).val('jonyzhang').trigger('validate');
});

asyncTest('invalid.rule', function(){
    var obj;
    
    obj = $('#form_normal').validator({
        fields: {
            username: 'required;username'
        }
    }).data('validator');
    
    $('#form_normal').find('input[name="username"]')
    .on('invalid.rule', function(e, rulename){
        if (rulename==='required') {
            ok(true, 'invalid.rule');
            obj.destroy();
            start();
        }
    })
    .val('').trigger('validate');
});

asyncTest('valid.field', function(){
    var obj;
    
    obj = $('#form_normal').validator({
        fields: {
            username: 'required;username'
        }
    }).data('validator');
    
    $('#form_normal').find('input[name="username"]')
    .on('valid.field', function(e, field, data){
        ok(true, 'valid.field');
        obj.destroy();
        start();
    }).val('jonyzhang').trigger('validate');
});

asyncTest('invalid.field', function(){
    var obj;
    
    obj = $('#form_normal').validator({
        fields: {
            username: 'required;username'
        }
    }).data('validator');
    
    $('#form_normal').find('input[name="username"]')
    .on('invalid.field', function(e, field, data){
        ok(true, 'invalid.field');
        obj.destroy();
        start();
    }).val('').trigger('validate');
});

asyncTest('valid.form', function(){
    var obj;
    
    obj = $('#form_normal').validator({
        fields: {
            username: 'required;username'
        }
    }).data('validator');
    
    $('#form_normal').find('input[name="username"]').val('jonyzhang').end()
    .on('valid.form', function(e, field, data){
        ok(true, 'valid.form');
        obj.destroy();
        start();
    }).trigger('submit');
});

asyncTest('invalid.form', function(){
    var obj;
    
    obj = $('#form_normal').validator({
        fields: {
            username: 'required;username'
        }
    }).data('validator');
    
    $('#form_normal').find('input[name="username"]').val('').end()
    .on('invalid.form', function(e, field, data){
        ok(true, 'invalid.form');
        obj.destroy();
        start();
    }).trigger('submit');
});
