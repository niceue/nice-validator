$(function () {
    var isIE = document.documentMode || +(navigator.userAgent.match(/MSIE (\d+)/) && RegExp.$1);

    initIcons();
    initNav();
    initToTop();
    initReply();
    initLinks();
    initPostTitle();


    function initNav() {
        if (!$('article.article').length) return;
        var $nav = $('<nav class="article-nav hidden-tb"></nav>');
        var $h2 = $('div.post-content h2'), $h3;
        var html = '<ul class="article-nav-list">';
        $h2.each(function(i){
                html += '<li>' + addLink( $(this), i+1 );
                $h3 = $(this).nextUntil('h2').filter('h3');
                if ($h3.length) {
                    html += '<ul>';
                    $h3.each(function(j){
                        html += '<li>' + addLink($(this), i+1, j+1) + '</li>';
                    });
                    html += '</ul>';
                }   
                html += '</li>';     
        });
        html += '</ul>';
        $nav.append(html).appendTo('#main');
        $navLinks = $nav.find('a');
        $h2 = $h3 = null;

        var body = document.body,
            $h = $('div.post-content').find('h2,h3'), list = $h.get(),
            activeId, activeIndex = 0,
            isUp = 0, lastPosition;

        $(window)
        .on('resize', function(e){
            
        })
        .on('scroll', function(e){
            var scrollTop = body.scrollTop, i = activeIndex, len, diff;
            // 判断滚动方向
            isUp = lastPosition && lastPosition > scrollTop ? 1 : 0;
            // 就近开始循环
            if (isUp) {
                while (i--) {
                    diff = list[i].offsetTop - scrollTop;
                    if ( diff >= 0 && diff <= 80 ) {
                        activeIndex = i;
                        activeId = list[i].id;
                        setCurrentLink();
                        break;
                    }
                }
            } else {
                len = $h.length;
                for (; i<len; i++) {
                    diff = list[i].offsetTop - scrollTop;
                    if ( diff >= 0 && diff <= 80 ) {
                        activeIndex = i;
                        activeId = list[i].id;
                        setCurrentLink();
                        break;
                    }
                }
            }
            
            // 记录当前位置
            lastPosition = scrollTop;
        });

        function setCurrentLink() {
            var $li;
            $nav.find('li.active').removeClass('active');
            $li = $navLinks.filter('[href="#'+ activeId +'"]').parent().addClass('active');
            // 如果是子
            if ( activeId.split('-').length > 2 ) {
                $li.parent().parent().addClass('active');
            }
        }

        function addLink($h, i, j) {
            var text = $h.text(), id = 'section-'+ i + (j ? '-' + j : '');
            $h.prepend( createLink('<i class="icon">&#xe608;</i>', id) ).attr('id', id);
            return createLink(text, id);
        }
        function createLink(text, id) {
            return '<a class="nav-link" href="#'+ id +'">' + text + '</a>';
        }
    }

    function initReply() {
        var $textarea = $('#reply textarea');
        if (!$textarea.length) return;
        var initialHeight = $textarea.height(),
            lineHeight = parseInt($textarea.css('lineHeight')),
            maxHeight = lineHeight * 12,
            timeout;

        $textarea.before('<pre>').on('keyup mouseup', function(){
            timeout && clearTimeout(timeout);
            timeout = setTimeout(function(){
                var $pre = $textarea.prev();
                $pre.html($textarea.val().replace(/[<>]/gim, 'x') + 'x');
                var h = $pre.height();
                if (h<initialHeight - lineHeight) h=initialHeight;
                else if (h>maxHeight) h = maxHeight + lineHeight;
                else h = h += lineHeight;
                $textarea.height(h);
            }, 10);
        });

        $('#reply').on('submit', 'form', function(e){
            if (!validate(this)) {
                e.preventDefault();
                return;
            } else {
                $('button', this).prop('disabled', true).text('处理中...');
            }
        });

        function validate(form) {
            var msg;
            var check = {
                    text: function(value) {
                        return !isBlank(value) || '请填写评论内容';
                    },
                    author: function(value) {
                        return !isBlank(value) || '请填写昵称';
                    },
                    mail: function(value) {
                        if (isBlank(value)) return '请填写电子邮箱，回复后会通知您';
                        if (!/^[\w\+\-]+(\.[\w\+\-]+)*@[a-z\d\-]+(\.[a-z\d\-]+)*\.([a-z]{2,4})$/i.test(value)) {
                            return '请填写有效的邮箱';
                        }
                    }
                };

            $(form.elements).each(function(){
                if (this.name && check[this.name]) {
                    msg = check[this.name](this.value);
                    if (typeof msg === 'string') {
                        this.focus();
                        return false;
                    }
                }
            });

            if (typeof msg === 'string') {
                $('#reply .form-msg').text(msg)
                    .stop(true, true).fadeIn(400).delay(500).fadeOut(100).fadeIn(150).fadeOut(150).fadeIn(200).delay(4000).fadeOut();
                return false;
            }
            return true;
        }
        function isBlank(value) {
            return !$.trim(value);
        }
    }

    function initPostTitle() {
        $('h1.post-title>a').html(function(i, html){
            return html.replace('（', '<span>（').replace('）', '）</span>');
        });
    }

    function initLinks() {
        var origin = location.protocol + '//' + location.host,
            len = origin.length,
            _BLANK = '_blank';
        $('a').attr('target', function(i, value){
            if (this.href.substr(0, 4) === 'http' && this.href.substr(0, len)!==origin) {
                return _BLANK;
            }
        });
    }
    
    function initToTop() {
        $('#main').append('<div class="to-top"><div class="inner"><i class="icon-totop" id="totop" title="回到顶部" style="display:none"></i></div></div>');
        $(window).scroll(function(){
            if ($(window).scrollTop()>300){
                $("#totop").fadeIn(500);
            } else {
                $("#totop").fadeOut(500);
            }
        });
        $("#totop").click(function(e){
            e.preventDefault();
            $('body,html').animate({scrollTop:0},500);
        });
    }

    // 解决 IE7 不支持 :before 伪类
    function initIcons() {
        if (!isIE || isIE > 7) return;
        var icons = {
            'icon-head': '&#xe074;',
            'icon-email': '&#xe002;',
            'icon-url': '&#xe005;',
            'icon-clock': '&#xe014;',
            'icon-tag': '&#xe085;',
            'icon-speech-bubble': '&#xe076;',
            'icon-heart': '&#xe024;',
            'icon-share': '&#xe081;',
            'icon-arrow-left': '&#xe094;',
            'icon-arrow-right': '&#xe095;',
            'icon-link': '&#xe608;',
            'icon-external-link': '&#xe607;',
            'icon-reply': '&#xe039;',
            'icon-search': '&#xe036;',
            'icon-ban': '&#xe107;',
            'icon-github-circle': '&#xe601;',
            'icon-qq-circle': '&#xe606;',
            'icon-email-circle': '&#xe602;',
            'icon-feed-circle': '&#xe600;',
            'icon-shang': '&#xe60a;',
            'icon-coffee': '&#xe604;',
            'icon-sponsor': '&#xe605;',
            'icon-menu': '&#xe120;',
            'icon-totop': '&#xe603;',
            'icon-paper': '&#xe034;',
            'icon-eye': '&#xe000;',
            'icon-download': '&#xe069;',
            'icon-download2': '&#xe609;',
            'icon-cross': '&#xe117;',
            '0': 0
            },
            els = document.getElementsByTagName('*'),
            i, c, el;
        for (i = 0; ; i += 1) {
            el = els[i];
            if(!el) {
                break;
            }
            c = el.className;
            c = c.match(/icon-[^\s'"]+/);
            if (c && icons[c[0]]) {
                addIcon(el, icons[c[0]]);
            }
        }

        function addIcon(el, entity) {
            var html = el.innerHTML;
            el.innerHTML = '<span style="font-family: \'icomoon\'">' + entity + '</span>' + html;
        }
    }

});


// Comments
(function () {
    var commentBody;
    window.TypechoComment = {
        dom : function (id) {
            return document.getElementById(id);
        },
    
        create : function (tag, attr) {
            var el = document.createElement(tag);
        
            for (var key in attr) {
                el.setAttribute(key, attr[key]);
            }
        
            return el;
        },

        reply : function (cid, coid) {
            var comment = this.dom(cid), parent = comment.parentNode,
                reply = this.dom('reply'), input = this.dom('comment-parent'),
                form = 'form' == reply.tagName ? reply : reply.getElementsByTagName('form')[0],
                textarea = reply.getElementsByTagName('textarea')[0];

            if (null == input) {
                input = this.create('input', {
                    'type' : 'hidden',
                    'name' : 'parent',
                    'id'   : 'comment-parent'
                });

                form.appendChild(input);
            }

            input.setAttribute('value', coid);

            if (null == this.dom('comment-form-place-holder')) {
                var holder = this.create('div', {
                    'id' : 'comment-form-place-holder'
                });

                reply.parentNode.insertBefore(holder, reply);
            }

            comment.appendChild(reply);
            this.dom('cancel-comment-reply-link').style.display = '';
            if (commentBody) {
                commentBody.className = commentBody.className.replace(' comment-current', '');
            }
            commentBody = reply.parentNode;
            commentBody.className += ' comment-current';

            if (null != textarea && 'text' == textarea.name) {
                textarea.focus();
            }

            return false;
        },

        cancelReply : function () {
            var reply = this.dom('reply'),
                holder = this.dom('comment-form-place-holder'), input = this.dom('comment-parent');

            if (null != input) {
                input.parentNode.removeChild(input);
            }

            if (null == holder) {
                return true;
            }

            this.dom('cancel-comment-reply-link').style.display = 'none';
            commentBody.className = commentBody.className.replace(' comment-current', '');
            commentBody = null;
            
            holder.parentNode.insertBefore(reply, holder);
            return false;
        }
    };
})();