// معالجة مشكلة التوجيه الخاطئ في MikroTik
(function() {
    'use strict';
    
    // فحص URL الحالي للتأكد من عدم وجود توجيه خاطئ
    function checkForBadRedirect() {
        const currentUrl = window.location.href;
        
        // إذا كان URL يحتوي على f.com أو توجيه خاطئ
        if (currentUrl.includes('f.com') || currentUrl.includes('login?dst=')) {
            console.warn('Detected bad redirect, fixing...');
            
            // محاولة العودة للصفحة الصحيحة
            const correctUrl = window.location.origin + '/index.html';
            
            // تنبيه المستخدم
            const alertDiv = document.createElement('div');
            alertDiv.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; right: 0; background: #f44336; color: white; padding: 15px; text-align: center; z-index: 10000;">
                    <strong>تم اكتشاف خطأ في التوجيه - جارٍ الإصلاح...</strong>
                    <button onclick="window.location.href='${correctUrl}'" style="margin-left: 10px; padding: 5px 10px; background: white; color: #f44336; border: none; border-radius: 3px;">انقر هنا للمتابعة</button>
                </div>
            `;
            document.body.appendChild(alertDiv);
            
            // إعادة توجيه تلقائي بعد 3 ثواني
            setTimeout(() => {
                window.location.href = correctUrl;
            }, 3000);
            
            return true;
        }
        return false;
    }
    
    // معالجة مشكلة النموذج
    function fixFormSubmission() {
        const loginForm = document.querySelector('form[name="login"]');
        if (!loginForm) return;
        
        // التأكد من وجود action صحيح
        if (!loginForm.action || loginForm.action.includes('f.com')) {
            loginForm.action = '/login';
        }
        
        // التأكد من method صحيح
        loginForm.method = 'post';
        
        // إضافة hidden field للتأكد من التوجيه الصحيح
        const dstField = document.createElement('input');
        dstField.type = 'hidden';
        dstField.name = 'dst';
        dstField.value = window.location.origin + '/status.html';
        loginForm.appendChild(dstField);
    }
    
    // تشغيل الإصلاحات عند تحميل الصفحة
    document.addEventListener('DOMContentLoaded', function() {
        // فحص التوجيه الخاطئ
        if (checkForBadRedirect()) {
            return; // إيقاف المعالجة إذا تم اكتشاف توجيه خاطئ
        }
        
        // إصلاح النموذج
        fixFormSubmission();
        
        // مراقبة التغييرات في URL
        let lastUrl = window.location.href;
        setInterval(() => {
            if (window.location.href !== lastUrl) {
                lastUrl = window.location.href;
                checkForBadRedirect();
            }
        }, 1000);
    });
    
})();
