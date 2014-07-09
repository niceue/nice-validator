exports.local = "Chinese; 中文";

exports.rules = {
    digits: [/^\d+$/, "请输入数字"],
    letters: [/^[a-z]+$/i, "请输入字母"], //纯字母
    date: [/^\d{4}-\d{1,2}-\d{1,2}$/, "请输入正确的日期,例:yyyy-mm-dd"],
    time: [/^([01]\d|2[0-3])(:[0-5]\d){1,2}$/, "请输入正确的时间,例:14:30或14:30:00"],
    email:[/^[\w\+\-]+(\.[\w\+\-]+)*@[a-z\d\-]+(\.[a-z\d\-]+)*\.([a-z]{2,4})$/i, '请输入有效的邮箱'],
    url: [/^(https?|s?ftp):\/\/\S+$/i, "请输入有效的网址"],
    qq: [/^[1-9]\d{4,}$/,"请输入有效的QQ号"],
    IDcard: [/^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])((\d{4})|\d{3}[A-Z])$/, "请输入正确的身份证号码"],
    tel: [/^(?:(?:0\d{2,3}[\- ]?[1-9]\d{6,7})|(?:[48]00[\- ]?[1-9]\d{6}))$/, "请输入有效的电话号码"],  //办公或家庭电话
    mobile: [/^1[3-9]\d{9}$/, "请输入有效的手机号"],  //移动电话
    zipcode: [/^\d{6}$/, "请检查邮政编码格式"],
    chinese: [/^[\u0391-\uFFE5]+$/, "请输入中文字符"],
    username: [/^\w{3,12}$/, "请输入3-12位数字、字母、下划线"], //用户名
    password: [/^[\S]{6,16}$/, "请输入6-16位字符，不能包含空格"], //密码
    //可接受的后缀名
    accept: function(element, params){
        if (!params) return true;
        var ext = params[0];
        return (ext === '*') ||
               (new RegExp(".(?:" + (ext || "png|jpg|jpeg|gif") + ")$", "i")).test(element.value) ||
               this.renderMsg("只接受{1}后缀", ext.replace('|', ','));
    }
};

exports.lang = {
    defaultMsg: "{0}格式不正确",
    loadingMsg: "正在验证...",

    error: "网络异常",
    timeout: "请求超时",

    required: "{0}不能为空",
    remote: "{0}已被使用",

    integer_nzp: "请输入整数",
    integer_p: "请输入正整数",
    integer_pz: "请输入正整数或0",
    integer_n: "请输入负整数",
    integer_nz: "请输入负整数或0",

    match_eq: "{0}与{1}不一致",
    match_neq: "{0}与{1}不能相同",
    match_lt: "{0}必须小于{1}",
    match_gt: "{0}必须大于{1}",
    match_lte: "{0}必须小于或等于{1}",
    match_gte: "{0}必须大于或等于{1}",

    range_rg: "请输入{1}到{2}的数",
    range_gte: "请输入大于或等于{1}的数",
    range_lte: "请输入小于或等于{1}的数",
    
    checked_eq: "请选择{1}项",
    checked_rg: "请选择{1}到{2}项",
    checked_gte: "请至少选择{1}项",
    checked_lte: "请最多选择{1}项",

    length_eq: "请输入{1}个字符",
    length_rg: "请输入{1}到{2}个字符",
    length_gte: "请至少输入{1}个字符",
    length_lte: "请最多输入{1}个字符",
    length_eq_2: "",
    length_rg_2: "",
    length_gte_2: "",
    length_lte_2: ""
};
