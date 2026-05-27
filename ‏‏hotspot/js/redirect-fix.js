// إصلاح مشكلة التوجيه في MikroTik
document.addEventListener('DOMContentLoaded', function() {
    
    // التحقق من URL الحالي لمعرفة إذا كان هناك توجيه خاطئ
    const currentUrl = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    
    // إذا كان هناك معامل dst في URL
    if (urlParams.has('dst')) {
        const destinationUrl = decodeURIComponent(urlParams.get('dst'));
        console.log('Destination URL detected:', destinationUrl);
        
        // إعادة توجيه بعد تسجيل الدخول الناجح
        window.addEventListener('loginSuccess', function() {
            setTimeout(() => {
                window.location.href = destinationUrl;
            }, 2000);
        });
    }
    
    // معالج إرسال النموذج
    const loginForm = document.querySelector('form[name="login"]');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const speedField = document.getElementById('speed');
            const usernameField = document.getElementById('username');
            
            // التأكد من تحديد السرعة
            if (!speedField.value || speedField.value.trim() === '') {
                e.preventDefault();
                alert('يرجى اختيار السرعة المطلوبة');
                speedField.focus();
                return false;
            }
            
            // التأكد من إدخال اسم المستخدم
            if (!usernameField.value || usernameField.value.trim() === '' || usernameField.value === '$(username)') {
                e.preventDefault();
                alert('يرجى إدخال رقم الكرت');
                usernameField.focus();
                return false;
            }
            
            // إظهار رسالة التحميل
            showLoginProgress();
        });
    }
    
    function showLoginProgress() {
        const wifiLoader = document.getElementById('wifi-loaders');
        if (wifiLoader) {
            wifiLoader.style.display = 'block';
        }
        
        // إخفاء نموذج تسجيل الدخول
        const loginDiv = document.getElementById('login');
        if (loginDiv) {
            loginDiv.style.opacity = '0.5';
        }
    }
    
    // فحص حالة الاتصال
    function checkConnectionStatus() {
        fetch('/status')
            .then(response => {
                if (response.ok) {
                    // نجح تسجيل الدخول
                    const event = new CustomEvent('loginSuccess');
                    window.dispatchEvent(event);
                }
            })
            .catch(error => {
                console.log('Still connecting...', error);
            });
    }
    
    // فحص دوري لحالة الاتصال بعد الإرسال
    let connectionChecker;
    
    window.addEventListener('formSubmitted', function() {
        connectionChecker = setInterval(checkConnectionStatus, 2000);
        
        // إيقاف الفحص بعد 30 ثانية
        setTimeout(() => {
            if (connectionChecker) {
                clearInterval(connectionChecker);
            }
        }, 30000);
    });
    
    // إيقاف الفحص عند نجاح تسجيل الدخول
    window.addEventListener('loginSuccess', function() {
        if (connectionChecker) {
            clearInterval(connectionChecker);
        }
        
        // إخفاء رسالة التحميل
        const wifiLoader = document.getElementById('wifi-loaders');
        if (wifiLoader) {
            wifiLoader.style.display = 'none';
        }
        
        // إظهار رسالة النجاح
        const statusDiv = document.getElementById('status');
        if (statusDiv) {
            statusDiv.style.display = 'block';
        }
    });
});
