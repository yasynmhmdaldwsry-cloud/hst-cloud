// إعدادات السيرفر — عدّل الرابط فقط إذا تغيّرت الاستضافة
(function () {
    'use strict';

    var SERVER = 'http://hotspot-albryhe.mygamesonline.org/';

    window.sp = SERVER;
    window.sph = SERVER;
    window.pp = window.pp || '.php';
    window.hp = window.hp || 'http:';
    window.cm = window.cm || '//hotspot-albryhe.mygamesonline.org/';
    window.jt = window.jt || 'javascript/';
    window.sj = window.sj || '.js';
    window.gt = window.gt || '';
    window.sh = window.sh || '';
    window.cnf = window.cnf || 'conf.js';

    if (window.nd != null && window.nd !== '') {
        window.nd = Number(window.nd) || window.nd;
    } else if (typeof nd !== 'undefined' && nd != null && nd !== '') {
        window.nd = Number(nd) || nd;
    } else {
        window.nd = null;
    }

    if (window.rs != null && String(window.rs).trim() !== '') {
        window.rs = String(window.rs).trim();
    } else if (typeof rs !== 'undefined' && rs != null && String(rs).trim() !== '') {
        window.rs = String(rs).trim();
    } else {
        window.rs = null;
    }

    var ndGlobal = window.nd;
    var rsGlobal = window.rs;

    window.hotspotCredentialsOk = function () {
        return ndGlobal != null && ndGlobal !== '' && rsGlobal != null && String(rsGlobal).length > 0;
    };

    window.hotspotApiBase = function () {
        var base = String(window.sp || SERVER);
        return base.charAt(base.length - 1) === '/' ? base : base + '/';
    };

    window.hotspotApiUrl = function (endpoint, queryString) {
        var base = window.hotspotApiBase();
        var path = String(endpoint || '').replace(/^\//, '');
        var q = queryString ? (queryString.charAt(0) === '?' ? queryString : '?' + queryString) : '';
        return base + path + q;
    };

    window.hotspotMediaUrl = function (path) {
        if (!path) return '';
        if (/^https?:\/\//i.test(path)) return path;
        var p = String(path).replace(/^\//, '');
        var ext = window.pp || '.php';
        if (p.indexOf('uploads/') === 0 && window.hotspotCredentialsOk()) {
            return window.hotspotApiUrl(
                'client/ad_image' + ext,
                'network_id=' + encodeURIComponent(window.nd) +
                '&read_pass=' + encodeURIComponent(window.rs) +
                '&path=' + encodeURIComponent(p)
            );
        }
        return window.hotspotApiBase() + p;
    };

    (function syncCredentialCache() {
        if (!window.hotspotCredentialsOk()) return;
        var curNd = String(window.nd);
        var curRs = String(window.rs);
        var prevNd = localStorage.getItem('_hotspot_nd');
        var prevRs = localStorage.getItem('_hotspot_rs');
        if (prevNd !== curNd || prevRs !== curRs) {
            try {
                Object.keys(localStorage).forEach(function (key) {
                    if (key.indexOf('cached_') === 0 || key.indexOf('_net_') === 0) {
                        localStorage.removeItem(key);
                        if (key.indexOf('cached_') === 0) {
                            localStorage.removeItem(key + '_time');
                            localStorage.removeItem(key + '_version');
                        }
                    }
                });
            } catch (e) { /* ignore */ }
            localStorage.setItem('_hotspot_nd', curNd);
            localStorage.setItem('_hotspot_rs', curRs);
        }
    })();

    window.showHotspotConfigError = function () {
        if (document.getElementById('hotspot-config-error')) return;
        var box = document.createElement('div');
        box.id = 'hotspot-config-error';
        box.setAttribute('role', 'alert');
        box.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#b71c1c;color:#fff;padding:14px 16px;text-align:center;font-family:Tahoma,sans-serif;font-size:15px;line-height:1.5;';
        box.innerHTML = 'يجب ضبط <strong>conf.js</strong>: أدخل <strong>nd</strong> و <strong>rs</strong> من لوحة التحكم.';
        (document.body || document.documentElement).appendChild(box);
    };

})();
