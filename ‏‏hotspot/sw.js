// Service Worker - كاش ملفات CSS و JS و الخطوط و الصور
// ===== لتحديث الكاش: غيّر رقم الإصدار هنا =====
var CACHE_VERSION = 11;
var CACHE_NAME = 'hotspot-v' + CACHE_VERSION;
// كاش منفصل لصور السيرفر (لا يتأثر بتحديث الملفات المحلية)
var IMAGES_CACHE = 'hotspot-images-v1';
// مدة صلاحية صور السيرفر: 3 أيام
var SERVER_IMAGE_MAX_AGE = 3 * 24 * 60 * 60 * 1000;

var FILES_TO_CACHE = [
    'css/fontello.min.css',
    'css/style.min.css',
    'css/color.min.css',
    'css/colot.css',
    'css/mood.css',
    'css/modern.css',
    'css/wifi.css',
    'css/wifi2.css',
    'css/wifi3.css',
    'css/imgscro.css',
    'fonts/Almarai.css',
    'js/init.min.js',
    'js/main.min.js',
    'js/hotInImprover.min.js',
    'js/hotCookie.min.js',
    'js/hotOptions.min.js',
    'js/hotBlocker.min.js',
    'js/options.js',
    'js/templates.min.js',
    'js/mus.min.js',
    'javascript/cg.js',
    'javascript/cache.js',
    'javascript/color.js',
    'javascript/sp.js',
    'javascript/speeds.js',
    'javascript/profiles.js',
    'javascript/points.js',
    'javascript/txt.js',
    'javascript/img.js',
    'javascript/ops1.js',
    'javascript/ops2.js',
    'javascript/ops3.js',
    'javascript/sr.js',
    'javascript/en.js',
    'javascript/template.js',
    'config/speeds.js',
    'img/logo.jpg'
];

// تثبيت - تحميل الملفات مسبقاً
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return Promise.all(
                FILES_TO_CACHE.map(function(url) {
                    return cache.add(url).catch(function() {
                        console.warn('فشل تخزين:', url);
                    });
                })
            );
        }).then(function() {
            // تفعيل فوري بدون انتظار
            return self.skipWaiting();
        })
    );
});

// تنشيط - حذف الكاش القديم عند تغيير الإصدار
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(name) {
                    // حذف أي كاش محلي قديم (غير الإصدار الحالي وغير كاش الصور)
                    return name !== CACHE_NAME && name !== IMAGES_CACHE;
                }).map(function(name) {
                    console.log('حذف كاش قديم:', name);
                    return caches.delete(name);
                })
            );
        }).then(function() {
            // التحكم فوراً في كل التبويبات المفتوحة
            return self.clients.claim();
        })
    );
});

// استقبال رسائل من الصفحة (مسح الكاش يدوياً)
self.addEventListener('message', function(event) {
    if (event.data === 'clearCache') {
        caches.keys().then(function(names) {
            return Promise.all(names.map(function(name) {
                return caches.delete(name);
            }));
        }).then(function() {
            // إعادة تحميل الملفات المحلية
            return caches.open(CACHE_NAME).then(function(cache) {
                return Promise.all(
                    FILES_TO_CACHE.map(function(url) {
                        return cache.add(url).catch(function() {});
                    })
                );
            });
        });
    }
    if (event.data === 'clearImages') {
        caches.delete(IMAGES_CACHE);
    }
});

// جلب الملفات
self.addEventListener('fetch', function(event) {
    var url = event.request.url;

    // تجاهل الطلبات غير GET
    if (event.request.method !== 'GET') return;

    // تجاهل طلبات API (بيانات ديناميكية)
    if (url.indexOf('/client/') !== -1 || url.indexOf('getcolor') !== -1 ||
        url.indexOf('getspeeds') !== -1 || url.indexOf('getsettings') !== -1 ||
        url.indexOf('getimg') !== -1 || url.indexOf('getprofiles') !== -1 ||
        url.indexOf('getpoints') !== -1 || url.indexOf('gettext') !== -1 ||
        url.indexOf('/login') !== -1 || url.indexOf('/status') !== -1) {
        return;
    }

    // صور السيرفر الخارجي (uploads, images, storage)
    var isServerImage = url.indexOf('/uploads/') !== -1 || url.indexOf('/images/') !== -1 || url.indexOf('/storage/') !== -1;

    if (isServerImage) {
        // صور السيرفر: كاش أولاً → إذا لم تكن موجودة جلب من الشبكة
        event.respondWith(
            caches.open(IMAGES_CACHE).then(function(cache) {
                return cache.match(event.request).then(function(cachedResponse) {
                    if (cachedResponse) {
                        // تحديث الصور في الخلفية
                        fetch(event.request).then(function(networkResponse) {
                            if (networkResponse && networkResponse.status === 200) {
                                cache.put(event.request, networkResponse);
                            }
                        }).catch(function() {});
                        return cachedResponse;
                    }
                    // صورة جديدة - جلب وتخزين
                    return fetch(event.request).then(function(networkResponse) {
                        if (networkResponse && networkResponse.status === 200) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(function() {
                        return new Response('', { status: 503 });
                    });
                });
            })
        );
        return;
    }

    // ملفات محلية (CSS, JS, خطوط, صور محلية)
    // استراتيجية: stale-while-revalidate (كاش فوري + تحديث في الخلفية)
    var isStaticFile = url.match(/\.(css|js|woff2?|ttf|eot|jpg|jpeg|png|gif|svg|webp|ico)(\?.*)?$/i);

    if (isStaticFile) {
        event.respondWith(
            caches.open(CACHE_NAME).then(function(cache) {
                return cache.match(event.request).then(function(cachedResponse) {
                    // جلب من الشبكة في الخلفية دائماً (للتحديث)
                    var fetchPromise = fetch(event.request).then(function(networkResponse) {
                        if (networkResponse && networkResponse.status === 200) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(function() {
                        return null;
                    });

                    // إذا لدينا نسخة في الكاش، نعيدها فوراً
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // لا توجد نسخة في الكاش - ننتظر الشبكة
                    return fetchPromise.then(function(response) {
                        return response || new Response('', { status: 503 });
                    });
                });
            })
        );
    }
});
