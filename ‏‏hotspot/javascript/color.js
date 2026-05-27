(function() {
    'use strict';

    function applyColors(colors) {
        if (!colors || colors.error) return;

        Object.keys(colors).forEach(function(colorKey) {
            var value = colors[colorKey];
            if (!value) return;

            document.querySelectorAll('.' + colorKey).forEach(function(el) {
                el.style.setProperty('background', value, 'important');
                if (colorKey === 'btn_color') {
                    el.style.setProperty('color', '#ffffff', 'important');
                }
            });

            if (colorKey === 'bd_color') {
                document.body.style.setProperty('background', value, 'important');
                var st = document.getElementById('hotspot-custom-bd-style');
                if (!st) {
                    st = document.createElement('style');
                    st.id = 'hotspot-custom-bd-style';
                    document.head.appendChild(st);
                }
                st.textContent =
                    'body.bd, body.bd_color { background: ' + value + ' !important; }' +
                    'body.bd::before, body.bd::after { display: none !important; }';
            }
        });
    }

    function fetchColorsDirect() {
        if (typeof hotspotCredentialsOk === 'function' && !hotspotCredentialsOk()) return;
        if (!window.sp || window.nd == null || !window.rs) return;

        var url = (typeof hotspotApiUrl === 'function')
            ? hotspotApiUrl('client/getcolor' + (window.pp || '.php'), 'network_id=' + encodeURIComponent(window.nd) + '&read_pass=' + encodeURIComponent(window.rs))
            : (window.sp + 'client/getcolor' + (window.pp || '.php') + '?network_id=' + encodeURIComponent(window.nd) + '&read_pass=' + encodeURIComponent(window.rs));
            + '&_t=' + Date.now();

        fetch(url, { cache: 'no-store', credentials: 'omit' })
            .then(function(r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(function(data) {
                if (!data || data.error) {
                    console.warn('getcolor:', data && data.error ? data.error : 'فارغ');
                    return;
                }
                applyColors(data);
                if (typeof CacheManager !== 'undefined') {
                    CacheManager.set(CacheManager.resolveCacheKey('cached_colors'), data);
                }
            })
            .catch(function(err) {
                console.warn('فشل جلب الألوان — تأكد من رفع client/getcolor.php على الاستضافة:', err.message || err);
            });
    }

    function fetchColors() {
        if (typeof CacheManager === 'undefined') {
            fetchColorsDirect();
            return;
        }
        var url = (typeof hotspotApiUrl === 'function')
            ? hotspotApiUrl('client/getcolor' + (window.pp || '.php'), 'network_id=' + encodeURIComponent(window.nd) + '&read_pass=' + encodeURIComponent(window.rs))
            : (window.sp + 'client/getcolor' + (window.pp || '.php') + '?network_id=' + encodeURIComponent(window.nd) + '&read_pass=' + encodeURIComponent(window.rs));

        CacheManager.fetchWithCache(url, 'cached_colors')
            .then(function(colors) {
                if (!colors || colors.error) {
                    fetchColorsDirect();
                    return;
                }
                applyColors(colors);
            })
            .catch(function() {
                fetchColorsDirect();
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fetchColors);
    } else {
        fetchColors();
    }

    window.addEventListener('cacheUpdated', function(e) {
        if (typeof CacheManager !== 'undefined' && CacheManager.isCacheEvent(e, 'cached_colors')) {
            applyColors(e.detail.data);
        }
    });
})();
