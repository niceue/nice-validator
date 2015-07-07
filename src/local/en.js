exports.local = "English";

exports.rules = {
    digits: [/^\d+$/, "Please enter only digits."],
    letters: [/^[a-z]+$/i, "Please enter only letters."],
    date: [/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid date, format: yyyy-mm-dd"],
    time: [/^([01]\d|2[0-3])(:[0-5]\d){1,2}$/, "Please enter a valid time, between 00:00 and 23:59"],
    email:[/^[\w\+\-]+(\.[\w\+\-]+)*@[a-z\d\-]+(\.[a-z\d\-]+)*\.([a-z]{2,4})$/i, 'Please enter a valid email address.'],
    url: [/^(https?|s?ftp):\/\/\S+$/i, "Please enter a valid URL."],
    //Acceptable extension, eg. accept(png|jpg|bmp|gif);
    accept: function(element, params){
        if (!params) return true;
        var ext = params[0],
            value = $(element).val();
        return (ext === '*') ||
               (new RegExp(".(?:" + ext + ")$", "i")).test(value) ||
               this.renderMsg("Only accept {1} file extension.", ext.replace(/\|/g, ', '));
    }
};

exports.lang = {
    fallback: "This field is not valid.",
    loading: "Validating...",

    error: "Network Error.",
    timeout: "Request timed out.",

    required: "This field is required.",
    remote: "Please try another name.",

    integer_nzp: "Please enter an integer.",
    integer_p: "Please enter a positive integer.",
    integer_pz: "Please enter a positive integer or 0.",
    integer_n: "Please enter a negative integer.",
    integer_nz: "Please enter a negative integer or 0.",

    match_eq: "{0} must be equal to {1}.",
    match_neq: "{0} must be not equal to {1}.",
    match_lt: "{0} must be less than {1}.",
    match_gt: "{0} must be greater than {1}.",
    match_lte: "{0} must be less than or equal to {1}.",
    match_gte: "{0} must be greater than or equal to {1}.",

    range_rg: "Please enter a number between {1} and {2}.",
    range_gte: "Please enter a number greater than or equal to {1}.",
    range_lte: "Please enter a number less than or equal to {1}.",

    checked_eq: "Please check {1} items.",
    checked_rg: "Please check between {1} and {2} items.",
    checked_gte: "Please check at least {1} items.",
    checked_lte: "Please check no more than {1} items.",

    length_eq: "Please enter {1} characters.",
    length_rg: "Please enter a value between {1} and {2} characters long.",
    length_gte: "Please enter at least {1} characters.",
    length_lte: "Please enter no more than {1} characters.",
    length_eq_2: "",
    length_rg_2: "",
    length_gte_2: "",
    length_lte_2: ""
};
