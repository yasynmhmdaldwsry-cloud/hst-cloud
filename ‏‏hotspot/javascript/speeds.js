(function(){
    'use strict';
    
    var CACHE_KEY_SPEEDS = 'cached_speeds';
    var CACHE_KEY_SETTINGS = 'cached_settings';
    
    var sp = window.sp || '';
    var nd = window.nd || '';
    var rs = window.rs || '';
    var pp = window.pp || '.php';
    
    // ===== معالجة بيانات السرعات مع الإعدادات =====
    function processSpeeds(speedsData, settings) {
        var defaultBuiltinSpeed = (speedsData && speedsData.default_builtin_speed) || '';
        var s = Array.isArray(speedsData) ? speedsData : (speedsData && speedsData.speeds ? speedsData.speeds : []);
        var df = (window.defaultSpeedsConfig || []).slice(); // نسخة جديدة
        
        if(settings && typeof settings === 'object'){
            if(settings["512K"]==="on") df = df.filter(function(x){return x.download !== '512K'});
            if(settings["1M"]==="on") df = df.filter(function(x){return x.download !== '1024K' && x.download !== '1M'});
            if(settings["2M"]==="on") df = df.filter(function(x){return x.download !== '2048K' && x.download !== '2M'});
            if(settings["4M"]==="on") df = df.filter(function(x){return x.download !== '4096K' && x.download !== '4M'});
            if(settings["8M"]==="on") df = df.filter(function(x){return x.download !== '8192K' && x.download !== '8M'});
            
            // جعل السرعة الافتراضية هي المختارة فقط إذا كان الخيار مفعلاً
            if(settings["disable-speed-selection"]==="on"){
                df = df.map(function(item){
                    return Object.assign({}, item, {is_default: 0});
                });
                // تأكد من إضافة السرعة الافتراضية إذا لم تكن موجودة
                var hasDefault = df.some(function(x){ return x.download === '0' || x.name === 'سرعة أفتراضية' });
                if(!hasDefault) {
                    df.push({upload: '0', download: '0', name: 'سرعة أفتراضية', className: '', is_default: 1});
                } else {
                    df = df.map(function(x){
                        if(x.download === '0' || x.name === 'سرعة أفتراضية') return Object.assign({}, x, {is_default: 1});
                        return x;
                    });
                }
            }
            if(settings["16M"]==="on" && window.speed16MConfig){
                var speed16M = Object.assign({}, window.speed16MConfig);
                delete speed16M.className;
                df.push(speed16M);
            }
            if(settings["hide-hotspot-cards"]==="on"){
                window.hideHotspotCards = true;
            }
        }
        
        if(defaultBuiltinSpeed){
            df = df.map(function(item){
                var spVal = item.upload + '/' + item.download;
                return {upload: item.upload, download: item.download, name: item.name, className: item.className, is_default: spVal === defaultBuiltinSpeed ? 1 : 0};
            });
        }
        
        if(!speedsData || speedsData.error){
            return df;
        }
        
        if(Array.isArray(s) && s.length > 0){
            var cd = s.filter(function(x){return x.is_default == 1});
            var co = s.filter(function(x){return x.is_default != 1});
            var dfDefault = df.filter(function(x){return x.is_default == 1});
            var dfOther = df.filter(function(x){return !x.is_default});
            if(cd.length > 0){
                return cd.concat(dfOther).concat(co);
            } else if(dfDefault.length > 0){
                return dfDefault.concat(dfOther).concat(co);
            } else {
                return df.concat(s);
            }
        }
        
        return df;
    }
    
    // ===== مقارنة السرعات =====
    function speedsChanged(oldSpeeds, newSpeeds) {
        try {
            return JSON.stringify(oldSpeeds) !== JSON.stringify(newSpeeds);
        } catch(e) { return true; }
    }
    
    // ===== تطبيق السرعات على الواجهة =====
    function applySpeeds(speeds, isUpdate) {
        window.speedsConfig = speeds;
        
        // حفظ في الكاش
        if(typeof CacheManager !== 'undefined') {
            CacheManager.set(CACHE_KEY_SPEEDS, speeds);
        } else {
            try {
                localStorage.setItem(CACHE_KEY_SPEEDS, JSON.stringify(speeds));
                localStorage.setItem(CACHE_KEY_SPEEDS + '_time', Date.now().toString());
            } catch(e){}
        }
        
        if(typeof loadSpeedsFromConfig === 'function') {
            // عند التحديث من السيرفر، لا نعيد بناء الواجهة إلا إذا تغيرت البيانات فعلاً
            if(!isUpdate || !window.speedsLoaded) {
                loadSpeedsFromConfig();
            }
        }
    }
    
    // ===== الخطوة 1: تحميل من الكاش فوراً =====
    var cachedSpeeds = null;
    try {
        if(typeof CacheManager !== 'undefined') {
            cachedSpeeds = CacheManager.get(CACHE_KEY_SPEEDS);
        } else {
            var raw = localStorage.getItem(CACHE_KEY_SPEEDS);
            if(raw) cachedSpeeds = JSON.parse(raw);
        }
    } catch(e){}
    
    if(cachedSpeeds && cachedSpeeds.length > 0) {
        // عرض فوري من الكاش
        applySpeeds(cachedSpeeds, false);
    } else if(typeof window.defaultSpeedsConfig !== 'undefined') {
        // لا يوجد كاش - استخدام الافتراضي مؤقتاً
        applySpeeds(window.defaultSpeedsConfig.slice(), false);
    }
    
    // ===== الخطوة 2: تحديث من السيرفر في الخلفية =====
    if (!window.sp || window.nd == null || !window.rs) {
        return;
    }

    if (typeof hotspotCredentialsOk === 'function' && !hotspotCredentialsOk()) return;
    var pp = window.pp || '.php';
    var speedsUrl = (typeof hotspotApiUrl === 'function')
        ? hotspotApiUrl('client/getspeeds' + pp, 'network_id=' + window.nd + '&read_pass=' + encodeURIComponent(window.rs))
        : (window.sp + 'client/getspeeds' + pp + '?network_id=' + window.nd + '&read_pass=' + encodeURIComponent(window.rs));
    var settingsUrl = (typeof hotspotApiUrl === 'function')
        ? hotspotApiUrl('client/getsettings' + pp, 'action=get_settings&network_id=' + window.nd + '&read_pass=' + encodeURIComponent(window.rs))
        : (window.sp + 'client/getsettings' + pp + '?action=get_settings&network_id=' + window.nd + '&read_pass=' + encodeURIComponent(window.rs));
    
    // إلغاء الطلبات بعد 4 ثوانٍ لتجنب التهنيج
    var abortCtrl = null;
    var fetchTimeout = null;
    try { abortCtrl = new AbortController(); } catch(e){}
    
    var fetchOpts = abortCtrl ? {signal: abortCtrl.signal} : {};
    
    if(abortCtrl) {
        fetchTimeout = setTimeout(function(){
            abortCtrl.abort();
        }, 4000);
    }
    
    var speedsPromise = fetch(speedsUrl, fetchOpts)
        .then(function(r){ return r.json(); })
        .catch(function(){ return {error: true}; });
    
    var settingsPromise = fetch(settingsUrl, fetchOpts)
        .then(function(r){ return r.json(); })
        .catch(function(){ return {}; });
    
    Promise.all([speedsPromise, settingsPromise]).then(function(results){
        if(fetchTimeout) clearTimeout(fetchTimeout);
        var speedsData = results[0];
        var settings = results[1];
        
        // حفظ الإعدادات في الكاش
        if(settings && !settings.error && typeof CacheManager !== 'undefined') {
            CacheManager.set(CACHE_KEY_SETTINGS, settings);
        }
        
        // معالجة السرعات
        var processedSpeeds = processSpeeds(speedsData, settings);
        
        if(!processedSpeeds || processedSpeeds.length === 0) return;
        
        // مقارنة مع ما هو معروض حالياً
        var currentSpeeds = window.speedsConfig || [];
        
        if(speedsChanged(currentSpeeds, processedSpeeds)) {
            // البيانات تغيرت - تحديث الكاش والواجهة
            applySpeeds(processedSpeeds, true);
            
            // إذا لم يكن هناك كاش سابق (أول مرة)، يجب بناء الواجهة
            if(!cachedSpeeds || cachedSpeeds.length === 0) {
                if(typeof loadSpeedsFromConfig === 'function') loadSpeedsFromConfig();
            }
        } else {
            // البيانات لم تتغير - حفظ في الكاش فقط بدون تحديث الواجهة
            if(typeof CacheManager !== 'undefined') {
                CacheManager.set(CACHE_KEY_SPEEDS, processedSpeeds);
            }
        }
        
    }).catch(function(e){
        if(fetchTimeout) clearTimeout(fetchTimeout);
    });

    
})();
