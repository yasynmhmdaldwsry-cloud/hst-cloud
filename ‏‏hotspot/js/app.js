// تعريف المتغيرات العامة
var sph = window.location.origin;
var loggedIn = false;

// دالة التحقق من وجود العناصر
function checkElement(id) {
    return document.getElementById(id) !== null;
}

// دالة التحقق من وجود ملفات CSS
function checkCSSFiles() {
    const cssFiles = [
        'css/fontello.min.css',
        'css/style.min.css',
        'css/color.min.css',
        'css/colot.css',
        'css/mood.css'
    ];
    
    cssFiles.forEach(file => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = file;
        link.onerror = () => console.warn(`CSS file not found: ${file}`);
        document.head.appendChild(link);
    });
}

// دالة إعداد الأحداث
function setupEventListeners() {
    // التحقق من وجود العناصر قبل إضافة الأحداث
    if (checkElement('showQrReaderButton')) {
        document.getElementById('showQrReaderButton').addEventListener('click', showQrReader);
    }
    
    if (checkElement('showOptionsButton')) {
        document.getElementById('showOptionsButton').addEventListener('click', showOptions);
    }
}

// دوال النوافذ المنبثقة
function showQrReader() {
    const modal = document.getElementById('QrReaderModal');
    if (modal) modal.style.display = 'block';
}

function showOptions() {
    const modal = document.getElementById('optionsModal');
    if (modal) modal.style.display = 'block';
}

// إعداد إغلاق النوافذ المنبثقة
function setupModals() {
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close');
    
    closeButtons.forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });
    
    // إغلاق النوافذ بالنقر خارجها
    window.addEventListener('click', function(event) {
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// دالة التحقق من حالة الشبكة
function checkNetworkStatus() {
    // محاكاة فحص حالة الشبكة
    return navigator.onLine;
}

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupModals();
    checkCSSFiles();
    
    // إخفاء رسالة التحميل
    setTimeout(() => {
        const loader = document.getElementById('wifi-loaders');
        if (loader) loader.style.display = 'none';
    }, 3000);
});
