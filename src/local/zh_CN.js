exports.local = "Chinese; 中文";

exports.rules = {
    letters: [/^[a-z]+$/i, "{0}只能输入字母"], //纯字母
    tel: [/^(?:(?:0\d{2,3}[\- ]?[1-9]\d{6,7})|(?:[48]00[\- ]?[1-9]\d{6}))$/, "电话格式不正确"],  //办公或家庭电话
    mobile: [/^1[3-9]\d{9}$/, "手机号格式不正确"],  //移动电话
    email:[/^[\w\+\-]+(\.[\w\+\-]+)*@[a-z\d\-]+(\.[a-z\d\-]+)*\.([a-z]{2,4})$/i, '邮箱格式不正确'],
    qq: [/^[1-9]\d{4,}$/,"QQ号格式不正确"],
    date: [/^\d{4}-\d{1,2}-\d{1,2}$/, "请输入正确的日期,例:yyyy-mm-dd"],
    time: [/^([01]\d|2[0-3])(:[0-5]\d){1,2}$/, "请输入正确的时间,例:14:30或14:30:00"],
    ID_card: [/^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])((\d{4})|\d{3}[A-Z])$/, "请输入正确的身份证号码"],
    url: [/^(https?|ftp):\/\/[^\s]+$/i, "网址格式不正确"],
    postcode: [/^[1-9]\d{5}$/, "邮政编码格式不正确"],
    chinese: [/^[\u0391-\uFFE5]+$/, "请输入中文"],
    username: [/^\w{3,12}$/, "请输入3-12位数字、字母、下划线"], //用户名
    password: [/^[0-9a-zA-Z]{6,16}$/, "密码由6-16位数字、字母组成"], //密码
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

    digits: "请输入数字",

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
