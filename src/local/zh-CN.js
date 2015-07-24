exports.local = "Chinese; 中文";

exports.rules = {
    digits: [/^\d+$/, "请填写数字"],
    letters: [/^[a-z]+$/i, "请填写字母"], //纯字母
    date: [/^\d{4}-\d{2}-\d{2}$/, "请填写有效的日期，格式:yyyy-mm-dd"],
    time: [/^([01]\d|2[0-3])(:[0-5]\d){1,2}$/, "请填写有效的时间，00:00到23:59之间"],
    email:[/^[\w\+\-]+(\.[\w\+\-]+)*@[a-z\d\-]+(\.[a-z\d\-]+)*\.([a-z]{2,4})$/i, '请填写有效的邮箱'],
    url: [/^(https?|s?ftp):\/\/\S+$/i, "请填写有效的网址"],
    qq: [/^[1-9]\d{4,}$/,"请填写有效的QQ号"],
    IDcard: [/^\d{6}(19|2\d)?\d{2}(0[1-9]|1[012])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)?$/, "请填写正确的身份证号码"],
    tel: [/^(?:(?:0\d{2,3}[\- ]?[1-9]\d{6,7})|(?:[48]00[\- ]?[1-9]\d{6}))$/, "请填写有效的电话号码"],  //办公或家庭电话
    mobile: [/^1[3-9]\d{9}$/, "请填写有效的手机号"],  //移动电话
    zipcode: [/^\d{6}$/, "请检查邮政编码格式"],
    chinese: [/^[\u0391-\uFFE5]+$/, "请填写中文字符"],
    username: [/^\w{3,12}$/, "请填写3-12位数字、字母、下划线"], //用户名
    password: [/^[\S]{6,16}$/, "请填写6-16位字符，不能包含空格"], //密码
    //可接受的后缀名，例如：accept(png|jpg|bmp|gif);
    accept: function(element, params){
        if (!params) return true;
        var ext = params[0],
            value = $(element).val();
        return (ext === '*') ||
               (new RegExp(".(?:" + ext + ")$", "i")).test(value) ||
               this.renderMsg("只接受{1}后缀的文件", ext.replace(/\|/g, ','));
    }
};

exports.lang = {
    fallback: "{0}格式不正确",
    loading: "正在验证...",

    error: "网络异常",
    timeout: "请求超时",

    required: "{0}不能为空",
    remote: "{0}已被使用",

    integer_nzp: "请填写整数",
    integer_p: "请填写正整数",
    integer_pz: "请填写正整数或0",
    integer_n: "请填写负整数",
    integer_nz: "请填写负整数或0",

    match_eq: "{0}与{1}不一致",
    match_neq: "{0}与{1}不能相同",
    match_lt: "{0}必须小于{1}",
    match_gt: "{0}必须大于{1}",
    match_lte: "{0}不能大于{1}",
    match_gte: "{0}不能小于{1}",

    range_rg: "请填写{1}到{2}的数",
    range_gte: "请填写不小于{1}的数",
    range_lte: "请填写最大{1}的数",
    
    checked_eq: "请选择{1}项",
    checked_rg: "请选择{1}到{2}项",
    checked_gte: "请至少选择{1}项",
    checked_lte: "请最多选择{1}项",

    length_eq: "请填写{1}个字符",
    length_rg: "请填写{1}到{2}个字符",
    length_gte: "请至少填写{1}个字符",
    length_lte: "请最多填写{1}个字符",
    length_eq_2: "",
    length_rg_2: "",
    length_gte_2: "",
    length_lte_2: ""
};
