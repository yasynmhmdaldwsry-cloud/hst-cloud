(function() {
    'use strict';
    
    var CACHE_CONFIG = {
        enabled: true,
        version: '1.0',
        expiryHours: 72,
        maxRetries: 2,
        timeout: 2500
    };
    
    var CACHE_KEYS = {
        profiles: 'cached_profiles',
        points: 'cached_points',
        text: 'cached_text',
        images: 'cached_images',
        colors: 'cached_colors',
        settings: 'cached_settings',
        speeds: 'cachedSpeeds'
    };
    
    window.CacheManager = {
        
        pendingRequests: {},
        
        isApiError: function(data) {
            return data && typeof data === 'object' && !Array.isArray(data) && data.error;
        },
        
        resolveCacheKey: function(baseKey) {
            if (typeof window.hotspotCredentialsOk === 'function' && window.hotspotCredentialsOk()) {
                return baseKey + '_' + String(window.nd);
            }
            return baseKey + '_noauth';
        },

        isCacheEvent: function(e, baseKey) {
            if (!e || !e.detail) return false;
            var base = e.detail.baseKey || '';
            var key = e.detail.key || '';
            return base === baseKey || key.indexOf(baseKey + '_') === 0;
        },
        
        isValid: function(key) {
            try {
                var timestamp = localStorage.getItem(key + '_time');
                if (!timestamp) return false;
                
                var now = Date.now();
                var age = now - parseInt(timestamp);
                var maxAge = CACHE_CONFIG.expiryHours * 60 * 60 * 1000;
                
                return age < maxAge;
            } catch (e) {
                console.warn('خطأ في فحص صلاحية الكاش:', e);
                return false;
            }
        },
        
        set: function(key, data) {
            if (!CACHE_CONFIG.enabled) return false;
            
            try {
                localStorage.setItem(key, JSON.stringify(data));
                localStorage.setItem(key + '_time', Date.now().toString());
                localStorage.setItem(key + '_version', CACHE_CONFIG.version);
                return true;
            } catch (e) {
                console.warn('خطأ في حفظ الكاش:', e);
                this.clearOldCache();
                try {
                    localStorage.setItem(key, JSON.stringify(data));
                    localStorage.setItem(key + '_time', Date.now().toString());
                    return true;
                } catch (e2) {
                    console.error('فشل حفظ الكاش بعد التنظيف:', e2);
                    return false;
                }
            }
        },
        
        get: function(key) {
            if (!CACHE_CONFIG.enabled) return null;
            
            try {
                if (!this.isValid(key)) return null;
                
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : null;
            } catch (e) {
                console.warn('خطأ في جلب الكاش:', e);
                return null;
            }
        },
        
        remove: function(key) {
            try {
                localStorage.removeItem(key);
                localStorage.removeItem(key + '_time');
                localStorage.removeItem(key + '_version');
            } catch (e) {
                console.warn('خطأ في حذف الكاش:', e);
            }
        },
        
        clearOldCache: function() {
            try {
                var self = this;
                var keys = Object.keys(localStorage);
                var now = Date.now();
                var maxAge = CACHE_CONFIG.expiryHours * 60 * 60 * 1000;
                
                keys.forEach(function(key) {
                    if (key.endsWith('_time')) {
                        var timestamp = localStorage.getItem(key);
                        if (timestamp && (now - parseInt(timestamp) > maxAge)) {
                            var baseKey = key.replace('_time', '');
                            self.remove(baseKey);
                        }
                    }
                });
            } catch (e) {
                console.warn('خطأ في تنظيف الكاش:', e);
            }
        },
        
        clearAll: function() {
            try {
                var self = this;
                Object.values(CACHE_KEYS).forEach(function(key) {
                    self.remove(key);
                });
            } catch (e) {
                console.warn('خطأ في حذف كل الكاش:', e);
            }
        },
        
        compareData: function(oldData, newData) {
            try {
                var oldStr = JSON.stringify(oldData);
                var newStr = JSON.stringify(newData);
                return oldStr !== newStr;
            } catch (e) {
                return true;
            }
        },
        
        fetchWithCache: function(url, baseKey, options) {
            options = options || {};
            var self = this;
            var cacheKey = baseKey;

            if (typeof window.hotspotCredentialsOk === 'function' && !window.hotspotCredentialsOk()) {
                return Promise.reject(new Error('missing_hotspot_credentials'));
            }

            cacheKey = self.resolveCacheKey(baseKey);
            
            if (this.pendingRequests[cacheKey]) {
                return this.pendingRequests[cacheKey];
            }
            
            var promise = new Promise(function(resolve, reject) {
                var cached = self.get(cacheKey);
                if (cached && self.isApiError(cached)) {
                    cached = null;
                    self.remove(cacheKey);
                }
                var resolved = false;
                
                // الكاش موجود → رد فوري بدون انتظار
                if (cached && !window.is_preview) {
                    resolve(cached);
                    resolved = true;
                }
                
                // إلغاء الطلب فعلياً عند انتهاء الوقت
                var controller = null;
                var timeoutId = null;
                try { controller = new AbortController(); } catch(e){}
                
                if (controller) {
                    timeoutId = setTimeout(function() {
                        controller.abort();
                        if (!resolved) {
                            if (cached) {
                                resolve(cached);
                            } else {
                                reject(new Error('timeout'));
                            }
                            resolved = true;
                        }
                        delete self.pendingRequests[cacheKey];
                    }, CACHE_CONFIG.timeout);
                }
                
                var fetchOptions = {};
                for (var key in options) {
                    if (options.hasOwnProperty(key)) {
                        fetchOptions[key] = options[key];
                    }
                }
                if (controller) fetchOptions.signal = controller.signal;
                
                fetch(url, fetchOptions)
                .then(function(response) {
                    if (timeoutId) clearTimeout(timeoutId);
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(function(data) {
                    if (!data) return;
                    if (self.isApiError(data)) {
                        self.remove(cacheKey);
                        if (!resolved) {
                            reject(new Error(data.error || 'api_error'));
                            resolved = true;
                        }
                        delete self.pendingRequests[cacheKey];
                        return;
                    }
                    
                    var hasChanges = self.compareData(cached, data);
                    
                    if (hasChanges || !cached) {
                        self.set(cacheKey, data);
                        if (!resolved) {
                            resolve(data);
                            resolved = true;
                        } else {
                            // البيانات تغيرت بعد عرض الكاش
                            window.dispatchEvent(new CustomEvent('cacheUpdated', {
                                detail: { key: cacheKey, baseKey: baseKey, data: data }
                            }));
                        }
                    }
                    
                    delete self.pendingRequests[cacheKey];
                })
                .catch(function(error) {
                    if (timeoutId) clearTimeout(timeoutId);
                    if (error && error.name === 'AbortError') return; // تم الإلغاء
                    
                    delete self.pendingRequests[cacheKey];
                    
                    if (!resolved) {
                        if (cached) {
                            resolve(cached);
                        } else {
                            reject(error);
                        }
                        resolved = true;
                    }
                });
            });
            
            this.pendingRequests[cacheKey] = promise;
            
            return promise;
        },
        
        buildUrl: function(endpoint, params) {
            params = params || {};
            var urlParams = new URLSearchParams(params);
            return window.sp + endpoint + (window.pp || '.php') + '?' + urlParams.toString();
        },
        
        getStatus: function() {
            var self = this;
            var status = {};
            var keys = Object.keys(CACHE_KEYS);
            keys.forEach(function(key) {
                var cacheKey = CACHE_KEYS[key];
                var data = self.get(cacheKey);
                var timestamp = localStorage.getItem(cacheKey + '_time');
                status[key] = {
                    cached: !!data,
                    timestamp: timestamp ? parseInt(timestamp) : null,
                    age: timestamp ? Date.now() - parseInt(timestamp) : null
                };
            });
            return status;
        },
        
        clearServiceWorkerCache: function() {
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage('clearCache');
            }
            this.clearAll();
            console.log('تم مسح جميع البيانات المخزنة');
        },

        pollLive: function(baseKey, url) {
            var self = this;
            if (typeof window.hotspotCredentialsOk === 'function' && !window.hotspotCredentialsOk()) return;
            var sep = url.indexOf('?') >= 0 ? '&' : '?';
            fetch(url + sep + '_live=' + Date.now(), { cache: 'no-store', credentials: 'omit' })
                .then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); })
                .then(function (data) {
                    if (!data || self.isApiError(data)) return;
                    var cacheKey = self.resolveCacheKey(baseKey);
                    var prev = self.get(cacheKey);
                    if (!self.compareData(prev, data)) return;
                    self.set(cacheKey, data);
                    window.dispatchEvent(new CustomEvent('cacheUpdated', {
                        detail: { key: cacheKey, baseKey: baseKey, data: data }
                    }));
                })
                .catch(function () {});
        },

        startLiveSync: function(intervalMs) {
            if (window.is_preview || window.__hotspotLiveSyncOn) return;
            window.__hotspotLiveSyncOn = true;
            var ms = intervalMs || 3000;
            var self = this;
            var tick = function () {
                if (!window.sp || window.nd == null || !window.rs) return;
                var ext = window.pp || '.php';
                var q = 'network_id=' + encodeURIComponent(window.nd) + '&read_pass=' + encodeURIComponent(window.rs);
                var api = typeof window.hotspotApiUrl === 'function' ? window.hotspotApiUrl : function (p, qs) { return window.sp + p + '?' + qs; };
                self.pollLive('cached_settings', api('client/getsettings' + ext, 'action=get_settings&' + q));
                self.pollLive('cached_images', api('client/getimg' + ext, 'type=images&' + q));
                self.pollLive('cached_colors', api('client/getcolor' + ext, q));
                self.pollLive('cached_speeds', api('client/getspeeds' + ext, q));
            };
            setTimeout(tick, 600);
            setInterval(tick, ms);
            document.addEventListener('visibilitychange', function () {
                if (!document.hidden) tick();
            });
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            window.CacheManager.clearOldCache();
            window.CacheManager.startLiveSync(3000);
        });
    } else {
        window.CacheManager.clearOldCache();
        window.CacheManager.startLiveSync(3000);
    }

})();
