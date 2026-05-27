(function() {
    var isLoading = false;
    var isLoaded = false;
    
    function renderPoints(data) {
        var pointsEl = document.getElementById("sell-points");
        if (!pointsEl) return;
        
        pointsEl.innerHTML = "";
        
        var localPoints = (typeof hotspotConfig !== 'undefined' && hotspotConfig['sell-points']) ? hotspotConfig['sell-points'] : [];
        var serverPoints = (data && !data.error) ? (Array.isArray(data) ? data : []) : [];
        var allPoints = localPoints.concat(serverPoints);
        
        if (allPoints.length === 0) return;
        
        allPoints.forEach(function(point) {
            var row = document.createElement("tr");
            row.innerHTML = '<td>' + point.name + '</td>';
            pointsEl.appendChild(row);
        });
    }
    
    function loadPoints() {
        if (isLoading || isLoaded) return;
        isLoading = true;
        
        if (typeof hotspotCredentialsOk === 'function' && !hotspotCredentialsOk()) return;
        var url = (typeof hotspotApiUrl === 'function')
            ? hotspotApiUrl('client/getpoints' + (window.pp || '.php'), 'network_id=' + window.nd + '&type=sell_points&read_pass=' + encodeURIComponent(window.rs))
            : (window.sp + 'client/getpoints' + (window.pp || '.php') + '?network_id=' + window.nd + '&type=sell_points&read_pass=' + encodeURIComponent(window.rs));
        
        CacheManager.fetchWithCache(url, 'cached_points')
            .then(function(data) {
                renderPoints(data);
                isLoaded = true;
            })
            .catch(function() {})
            .finally(function() {
                isLoading = false;
            });
    }
    
    if (typeof CacheManager !== 'undefined') {
        loadPoints();
    } else {
        setTimeout(loadPoints, 50);
    }
    
    window.addEventListener('cacheUpdated', function(e) {
        if (e.detail.key === 'cached_points') {
            renderPoints(e.detail.data);
        }
    });
})();
