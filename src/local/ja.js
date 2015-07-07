exports.local = "Japanese; 日本語";

exports.rules = {
    digits: [/^\d+$/, "数字だけを入力してください"],
    letters: [/^[a-z]+$/i, "手紙のみでお願いします"],
    date: [/^\d{4}-\d{2}-\d{2}$/, "有効な日付を入力してください、，フォーマット：YYYY-MM-DD"],
    time: [/^([01]\d|2[0-3])(:[0-5]\d){1,2}$/, "有効な時刻を入力してください，00:00~23:59の間"],
    email:[/^[\w\+\-]+(\.[\w\+\-]+)*@[a-z\d\-]+(\.[a-z\d\-]+)*\.([a-z]{2,4})$/i, '有効なメールアドレスを入力してください'],
    url: [/^(https?|s?ftp):\/\/\S+$/i, "有効なURLを入力してください"],
    //許容可能なファイル拡張子，など：accept(png|jpg|bmp|gif);
    accept: function(element, params){
        if (!params) return true;
        var ext = params[0],
            value = $(element).val();
        return (ext === '*') ||
               (new RegExp(".(?:" + ext + ")$", "i")).test(value) ||
               this.renderMsg("ファイル拡張子を{1}のみを受け入れる", ext.replace(/\|/g, '、'));
    }
};

exports.lang = {
    fallback: "このフィールドは有効ではありません",
    loading: "検証プロセス...",

    error: "ネットワークエラー",
    timeout: "要求がタイムアウトしました",

    digits: "番号を入力してください",

    required: "このフィールドは必須です",
    remote: "この値が使用されている",

    integer_nzp: "整数を入力してください",
    integer_p: "正の整数を入力してください",
    integer_pz: "正の整数または0を入力してください",
    integer_n: "負の整数を入力してください",
    integer_nz: "負の整数または0を入力してください",

    match_eq: "{0}と{1}と同じでなければなりません",
    match_neq: "{0}と{1}は同じにすることはできません",
    match_lt: "{0}未満{1}なければならない",
    match_gt: "{0}より{1}大なければならない",
    match_lte: "{0}小なりイコール{1}なければならない",
    match_gte: "{0}大なりイコール{1}なければならない",

    range_rg: "を入力してください。{1}から{2}の数",
    range_gte: "を入力して大なりイコール{1}の数",
    range_lte: "を入力してください小なりイコール{1}の数",
    
    checked_eq: "{1}項目を選択してください",
    checked_rg: "{1}から{2}の項目を選択してください",
    checked_gte: "少なくとも{1}の項目を選択してください",
    checked_lte: "{1}の項目まで選択してください",

    length_eq: "{1}文字を入力してください",
    length_rg: "{1}文字から{2}文字までの値を入力してください",
    length_gte: "{1}文字以上で入力してください",
    length_lte: "{1}文字以内で入力してください",
    length_eq_2: "",
    length_rg_2: "",
    length_gte_2: "",
    length_lte_2: ""
};
