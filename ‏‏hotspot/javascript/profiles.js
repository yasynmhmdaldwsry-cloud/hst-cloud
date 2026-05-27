(function() {
    var isLoading = false;
    var isLoaded = false;
    
    function renderProfiles(data) {
        var profilesEl = document.getElementById("profiles");
        if (!profilesEl) return;
        
        profilesEl.innerHTML = "";
        
        var localProfiles = (typeof hotspotConfig !== 'undefined' && hotspotConfig.profiles) ? hotspotConfig.profiles : [];
        var serverProfiles = (data && !data.error) ? (Array.isArray(data) ? data : []) : [];
        var allProfiles = localProfiles.concat(serverProfiles);
        
        if (allProfiles.length === 0) return;
        
        allProfiles.forEach(function(profile) {
            var row = document.createElement("tr");
            row.innerHTML = '<td>' + profile.price + '</td><td>' + profile.time + '</td><td>' + profile.transfer + '</td><td>' + profile.validity + '</td>';
            profilesEl.appendChild(row);
        });
    }
    
    function loadProfiles() {
        if (isLoading || isLoaded) return;
        isLoading = true;
        
        if (typeof hotspotCredentialsOk === 'function' && !hotspotCredentialsOk()) return;
        var url = (typeof hotspotApiUrl === 'function')
            ? hotspotApiUrl('client/getprofiles' + (window.pp || '.php'), 'network_id=' + window.nd + '&type=prices&read_pass=' + encodeURIComponent(window.rs))
            : (window.sp + 'client/getprofiles' + (window.pp || '.php') + '?network_id=' + window.nd + '&type=prices&read_pass=' + encodeURIComponent(window.rs));
        
        CacheManager.fetchWithCache(url, 'cached_profiles')
            .then(function(data) {
                renderProfiles(data);
                isLoaded = true;
            })
            .catch(function() {})
            .finally(function() {
                isLoading = false;
            });
    }
    
    if (typeof CacheManager !== 'undefined') {
        loadProfiles();
    } else {
        setTimeout(loadProfiles, 50);
    }
    
    window.addEventListener('cacheUpdated', function(e) {
        if (e.detail.key === 'cached_profiles') {
            renderProfiles(e.detail.data);
        }
    });
})();
