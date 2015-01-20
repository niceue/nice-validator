describe('Rules', function(){
    var $form = $('#form'),
        elems = $form[0].elements,
        me = $form.validator().data('validator');

    function test(input, val) {
        var result;
        if (val !== undefined) input.value = val;
        result = me._validate(input);
        return  result === true || result === undefined || result === null;
    }

    afterEach(function(){
        var data = $form.data('validator');
        if (data) {
            data.setField(null);
        }
    });

    describe('required', function(){

        it('required', function(){
            var input;
            
            me.setField({
                field1: 'required',
                field2: 'digits',
                field_novalidate: 'required',
                field_readonly: 'required',
                field_hidden: 'required',
                field_textarea: 'required',
                field_select: 'required'
            });

            input = elems['field1'];
            assert.ok( !test(input, '') && test(input, 'test'), 'field1' );

            input = elems['field2'];
            assert.ok( test(input, ''), 'field2' );

            input = elems['field_novalidate'];
            assert.ok( test(input, ''), 'field_novalidate' );

            input = elems['field_hidden'];
            assert.ok( !test(input, '') && test(input, 'test'), 'field_hidden' );

            input = elems['field_readonly'];
            assert.ok( !test(input, '') && test(input, 'test'), 'field_readonly' );

            input = elems['field_textarea'];
            assert.ok( !test(input, '') && test(input, 'test'), 'field_textarea' );

            input = elems['field_select'];
            assert.ok( !test(input, '') && test(input, '0'), 'field_select' );
        });

        it('required(anotherRule)', function(){
            var input;

            $form.validator({
                rules: {
                    anotherRule: function() {
                        return !!$('#field2').val().length;
                    }
                },
                fields: {
                    field1: 'required(anotherRule)'
                }
            });

            input = elems['field1'];
            elems['field2'].value = '';
            assert.ok( test(input, ''), 'field1 ignore' );
            elems['field2'].value = 'test';
            assert.ok( !test(input, '') && test(input, 'test'), 'field1 need' );
        });

        it('required(selector)', function(){
            var input;

            me.setField({
                field1: 'required(#field2:filled)'
            });

            input = elems['field1'];
            elems['field2'].value = '';
            assert.ok( test(input, ''), 'field1 ignore' );
            elems['field2'].value = 'test';
            assert.ok( !test(input, '') && test(input, 'test'), 'field1 need' );
        });

        it('required(not, 0)', function(){
            var input;

            me.setField({
                field1: 'required(not, 0)',
                field_select: 'required(not, 0)'
            });

            input = elems['field1'];
            assert.ok( !test(input, '') && !test(input, '0') && test(input, '1'), 'field1' );
            input = elems['field_select'];
            assert.ok( !test(input, '') && !test(input, '0') && test(input, '1'), 'field_select' );
        });

        it('required(from, .group)', function(){
            var input1, input2;

            me.setField({
                field1: 'required(from, .group)',
                field2: 'required(from, .group)'
            });

            $('#field1,#field2').addClass('group').val('');

            input1 = elems['field1'];
            input2 = elems['field2'];

            assert.ok( !test(input1) && !test(input2), 'both blank' );
            input1.value = '1';
            assert.ok( test(input1) && test(input2), 'filled one' );
        });

        it('required(from, .group, 2)', function(){
            var input1, input2, input3;

            me.setField({
                field1: 'required(from, .group, 2)',
                field2: 'required(from, .group, 2)',
                field3: 'required(from, .group, 2)'
            });

            $('#field1,#field2,#field3').addClass('group').val('');

            input1 = elems['field1'];
            input2 = elems['field2'];
            input3 = elems['field3'];

            assert.ok( !test(input1) && !test(input2) && !test(input3), 'both blank' );
            input1.value = '1';
            input2.value = '2';
            assert.ok( test(input1) && test(input2), 'filled two' );
        });
    });

    describe('integer', function(){
        it('integer', function(){
            var input;

            me.setField({
                field1: 'integer'
            });

            input = elems['field1'];
            assert.ok( !test(input, 'abc') && !test(input, '3.14') && test(input, '123'), 'field1' );
        });

        it('integer[+]', function(){
            var input;

            me.setField({
                field1: 'integer[+]'
            });

            input = elems['field1'];
            assert.ok( !test(input, 'abc') && !test(input, '-1') && !test(input, '0') && test(input, '1'), 'field1' );
        });

        it('integer[+0]', function(){
            var input;

            me.setField({
                field1: 'integer[+0]'
            });

            input = elems['field1'];
            assert.ok( !test(input, 'abc') && !test(input, '-1') && test(input, '0') && test(input, '1'), 'field1' );
        });

        it('integer[-]', function(){
            var input;

            me.setField({
                field1: 'integer[-]'
            });

            input = elems['field1'];
            assert.ok( !test(input, 'abc') && test(input, '-1') && !test(input, '0') && !test(input, '1'), 'field1' );
        });

        it('integer[-0]', function(){
            var input;

            me.setField({
                field1: 'integer[-0]'
            });

            input = elems['field1'];
            assert.ok( !test(input, 'abc') && test(input, '-1') && test(input, '0') && !test(input, '1'), 'field1' );
        });
    });

    describe('match', function(){
        it('match(field1)', function(){
            var input1, input2;

            me.setField({
                field1: 'required',
                field2: 'match(field1)'
            });

            input1 = elems['field1'];
            input2 = elems['field2'];
            input1.value = 'abc';
            assert.ok( test(input1) && !test(input2, '123') && test(input2, 'abc'), 'field1' );
        });

        it('match(eq, field1)', function(){
            var input1, input2;

            me.setField({
                field1: 'required',
                field2: 'match(eq, field1)'
            });

            input1 = elems['field1'];
            input2 = elems['field2'];
            input1.value = 'abc';
            assert.ok( test(input1) && !test(input2, '123') && test(input2, 'abc'), 'field1' );
        });

        it('match(neq, field1)', function(){
            var input1, input2;

            me.setField({
                field1: 'required',
                field2: 'match(neq, field1)'
            });

            input1 = elems['field1'];
            input2 = elems['field2'];
            input1.value = 'abc';
            assert.ok( test(input1) && test(input2, '123') && !test(input2, 'abc'), 'field1' );
        });

        it('match(lt, field1)', function(){
            var input1, input2;

            me.setField({
                field1: 'required',
                field2: 'match(lt, field1)'
            });

            input1 = elems['field1'];
            input2 = elems['field2'];
            input1.value = '5';
            assert.ok( test(input1) && test(input2, '4') && !test(input2, '5') && !test(input2, '6'), 'field1' );
        });

        it('match(lte, field1)', function(){
            var input1, input2;

            me.setField({
                field1: 'required',
                field2: 'match(lte, field1)'
            });

            input1 = elems['field1'];
            input2 = elems['field2'];
            input1.value = '5';
            assert.ok( test(input1) && test(input2, '4') && test(input2, '5') && !test(input2, '6'), 'field1' );
        });

        it('match(gt, field1)', function(){
            var input1, input2;

            me.setField({
                field1: 'required',
                field2: 'match(gt, field1)'
            });

            input1 = elems['field1'];
            input2 = elems['field2'];
            input1.value = '5';
            assert.ok( test(input1) && !test(input2, '4') && !test(input2, '5') && test(input2, '6'), 'field1' );
        });

        it('match(gte, field1)', function(){
            var input1, input2;

            me.setField({
                field1: 'required',
                field2: 'match(gte, field1)'
            });

            input1 = elems['field1'];
            input2 = elems['field2'];
            input1.value = '5';
            assert.ok( test(input1) && !test(input2, '4') && test(input2, '5') && test(input2, '6'), 'field1' );
        });

        it('match(lt, field1, date)', function(){
            var input1, input2;

            me.setField({
                field1: 'required',
                field2: 'match(lt, field1, date)'
            });

            input1 = elems['field1'];
            input2 = elems['field2'];
            input1.value = '2014-12-12';
            assert.ok( test(input2, '2014-12-11') && !test(input2, '2014-12-12'), 'field1' );
        });

        it('match(lt, field1, datetime)', function(){
            var input1, input2;

            me.setField({
                field1: 'required',
                field2: 'match(lt, field1, datetime)'
            });

            input1 = elems['field1'];
            input2 = elems['field2'];
            input1.value = '2014-12-12 12:12:12';
            assert.ok( test(input2, '2014-12-11 12:12:12') && test(input2, '2014-12-12 12:12:11') && !test(input2, '2014-12-12 12:12:12'), 'field1' );
        });

        it('match(lt, field1, time)', function(){
            var input1, input2;

            me.setField({
                field1: 'required',
                field2: 'match(lt, field1, time)'
            });

            input1 = elems['field1'];
            input2 = elems['field2'];
            input1.value = '12:12:12';
            assert.ok( test(input2, '12:11:11') && !test(input2, '12:12:13'), 'field1' );
        });
    });

    describe('range', function(){
        it('range[0~99]', function(){
            var input;

            me.setField({
                field1: 'range[0~99]'
            });

            input = elems['field1'];
            assert.ok(
                !test(input, 'abc') && !test(input, '-1') && !test(input, '100') &&
                 test(input, '0') && test(input, '0.5') && test(input, '99'),
                'field1'
            );
        });

        it('range[0~]', function(){
            var input;

            me.setField({
                field1: 'range[0~]'
            });

            input = elems['field1'];
            assert.ok(
                !test(input, 'abc') && !test(input, '-1') &&
                 test(input, '0') && test(input, '0.5') && test(input, '100'),
                'field1'
            );
        });

        it('range[~99]', function(){
            var input;

            me.setField({
                field1: 'range[~99]'
            });

            input = elems['field1'];
            assert.ok(
                !test(input, 'abc') && !test(input, '100') &&
                 test(input, '-1') && test(input, '0') && test(input, '0.5') && test(input, '99'),
                'field1'
            );
        });
    });

    describe('checked', function(){
        it('checked', function(){
            var inputs = document.getElementsByName('category[]');

            me.setField({
                'category[]': 'checked'
            });

            assert.ok( !test(inputs[0]) && !test(inputs[1]) );
            inputs[0].checked = true;
            assert.ok( test(inputs[0]) && test(inputs[1]) );
        });

        it('checked[1~2]', function(){
            var inputs = document.getElementsByName('category[]');

            me.setField({
                'category[]': 'checked[1~2]'
            });

            $(inputs).prop('checked', false);

            inputs[0].checked = true;
            assert.ok( test(inputs[0]) && test(inputs[1]) && test(inputs[2]) );
            inputs[1].checked = true;
            assert.ok( test(inputs[0]) && test(inputs[1]) && test(inputs[2]) );
            inputs[2].checked = true;
            assert.ok( !test(inputs[0]) && !test(inputs[1]) && !test(inputs[2]) );
        });

        it('checked[2]', function(){
            var inputs = document.getElementsByName('category[]');

            me.setField({
                'category[]': 'checked[2]'
            });

            $(inputs).prop('checked', false);

            assert.ok( !test(inputs[0]) && !test(inputs[1]) && !test(inputs[2]) );
            inputs[0].checked = true;
            assert.ok( !test(inputs[0]) && !test(inputs[1]) && !test(inputs[2]) );
            inputs[1].checked = true;
            assert.ok( test(inputs[0]) && test(inputs[1]) && test(inputs[2]) );
            inputs[2].checked = true;
            assert.ok( !test(inputs[0]) && !test(inputs[1]) && !test(inputs[2]) );
        });

        it('checked[2~]', function(){
            var inputs = document.getElementsByName('category[]');

            me.setField({
                'category[]': 'checked[2~]'
            });

            $(inputs).prop('checked', false);

            inputs[0].checked = true;
            assert.ok( !test(inputs[0]) && !test(inputs[1]) && !test(inputs[2]) );
            inputs[1].checked = true;
            assert.ok( test(inputs[0]) && test(inputs[1]) && test(inputs[2]) );
            inputs[2].checked = true;
            assert.ok( test(inputs[0]) && test(inputs[1]) && test(inputs[2]) );
        });

        it('checked[~2]', function(){
            var inputs = document.getElementsByName('category[]');

            me.setField({
                'category[]': 'checked[~2]'
            });

            $(inputs).prop('checked', false);

            assert.ok( test(inputs[0]) && test(inputs[1]) && test(inputs[2]) );
            inputs[0].checked = true;
            assert.ok( test(inputs[0]) && test(inputs[1]) && test(inputs[2]) );
            inputs[1].checked = true;
            assert.ok( test(inputs[0]) && test(inputs[1]) && test(inputs[2]) );
            inputs[2].checked = true;
            assert.ok( !test(inputs[0]) && !test(inputs[1]) && !test(inputs[2]) );

            $(inputs).prop('checked', false);
        });
    });

    describe('length', function(){
        it('length[~5]', function(){
            var input;

            me.setField({
                field1: 'length[~5]'
            });

            input = elems['field1'];
            assert.ok( test(input, '1234') && test(input, '12345') && !test(input, '123456'), 'field1' );
        });

        it('length[5]', function(){
            var input;

            me.setField({
                field1: 'length[5]'
            });

            input = elems['field1'];
            assert.ok( !test(input, '1234') && test(input, '12345') && !test(input, '123456'), 'field1' );
        });

        it('length[5~8]', function(){
            var input;

            me.setField({
                field1: 'length[5~8]'
            });

            input = elems['field1'];
            assert.ok( !test(input, '1234') && test(input, '12345') && test(input, '12345678') && !test(input, '123456789'), 'field1' );
        });

        it('length[5~]', function(){
            var input;

            me.setField({
                field1: 'length[5~]'
            });

            input = elems['field1'];
            assert.ok( !test(input, '1234') && test(input, '12345') && test(input, '123456789'), 'field1' );
        });

        it('length[~4, true]', function(){
            var input;

            me.setField({
                field1: 'length[~4, true]'
            });

            input = elems['field1'];
            assert.ok( test(input, '1234') && test(input, '测试') && test(input, '测1') && !test(input, '测试1'), 'field1' );
        });
    });

    describe('remote', function(){
        
    });

});