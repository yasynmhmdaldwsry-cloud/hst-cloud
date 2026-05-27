(function() {
    var isLoading = false;
    var isLoaded = false;
    
    function loadScrollingText() {
        if (typeof hotspotCredentialsOk === 'function' && !hotspotCredentialsOk()) return;
        if (isLoading || isLoaded) return;
        isLoading = true;
        
        var url = (typeof hotspotApiUrl === 'function')
            ? hotspotApiUrl('client/gettxt' + (window.pp || '.php'), 'network_id=' + window.nd + '&type=text&read_pass=' + encodeURIComponent(window.rs))
            : (window.sp + 'client/gettxt' + (window.pp || '.php') + '?network_id=' + window.nd + '&type=text&read_pass=' + encodeURIComponent(window.rs));
        
        CacheManager.fetchWithCache(url, 'cached_text')
            .then(function(data) {
                if (data && !data.error && data.text) {
                    var els = document.querySelectorAll('#scroll-text-content');
                    els.forEach(function(el){ el.innerText = data.text; });
                    isLoaded = true;
                }
            })
            .catch(function() {})
            .finally(function() {
                isLoading = false;
            });
    }
    
    if (typeof CacheManager !== 'undefined') {
        loadScrollingText();
    } else {
        setTimeout(loadScrollingText, 50);
    }
    
    window.addEventListener('cacheUpdated', function(e) {
        if (e.detail.key === 'cached_text') {
            var data = e.detail.data;
            if (data && !data.error && data.text) {
                var els = document.querySelectorAll('#scroll-text-content');
                els.forEach(function(el){ el.innerText = data.text; });
            }
        }
    });
})();
