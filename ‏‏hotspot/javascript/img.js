var cachedImages = [];
var imagesLoaded = false;
var sliderIntervals = {};

function applyImagesData(data) {
    if (!data || data.error) return;
    cachedImages = Array.isArray(data) ? data : (data.images || []);
    imagesLoaded = cachedImages.length > 0;
    if (cachedImages.length > 0) {
        initializeAllSliders();
    }
}

function img() {
    if (typeof hotspotCredentialsOk === 'function' && !hotspotCredentialsOk()) return;
    var url = (typeof hotspotApiUrl === 'function')
        ? hotspotApiUrl('client/getimg' + (window.pp || '.php'), 'network_id=' + window.nd + '&type=images&read_pass=' + encodeURIComponent(window.rs))
        : (window.sp + 'client/getimg' + (window.pp || '.php') + '?network_id=' + window.nd + '&type=images&read_pass=' + encodeURIComponent(window.rs));
    CacheManager.fetchWithCache(url, 'cached_images')
        .then(applyImagesData)
        .catch(function () { console.warn('فشل تحميل الصور'); });
}

function initializeAllSliders() {
    Object.keys(sliderIntervals).forEach(function (key) {
        if (sliderIntervals[key]) {
            clearInterval(sliderIntervals[key]);
            sliderIntervals[key] = null;
        }
    });
    initializeSlider('slider-container-top', 'image-indicator-top', 'prev-button-top', 'next-button-top');
    initializeSlider('slider-container', 'image-indicator-vewu', 'prev-buttonvewu', 'next-buttonvewu');
    initializeSlider('image-slider', 'image-indicator', 'prev-button', 'next-button');
    initializeProSlider('image-slider2');
}

function initializeSlider(sliderId, indicatorId, prevBtnId, nextBtnId) {
    var sliderContainer = document.getElementById(sliderId);
    var indicator = document.getElementById(indicatorId);
    if (!sliderContainer || !indicator) return;

    var currentIndex = 0;
    sliderContainer.querySelectorAll('img').forEach(function (img) { img.remove(); });
    indicator.innerHTML = '';
    if (cachedImages.length === 0) return;

    cachedImages.forEach(function (imageData, index) {
        var imgEl = document.createElement('img');
        imgEl.src = (typeof hotspotMediaUrl === 'function') ? hotspotMediaUrl(imageData.image_path) : (window.sp + imageData.image_path);
        imgEl.style.display = index === 0 ? 'block' : 'none';
        sliderContainer.appendChild(imgEl);
        var dot = document.createElement('span');
        dot.className = index === 0 ? 'active' : '';
        dot.dataset.index = index;
        dot.addEventListener('click', function () { goToSlide(index); });
        indicator.appendChild(dot);
    });

    var prevBtn = document.getElementById(prevBtnId);
    var nextBtn = document.getElementById(nextBtnId);
    if (prevBtn) {
        var newPrev = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrev, prevBtn);
        newPrev.addEventListener('click', function () { changeSlide('prev'); });
    }
    if (nextBtn) {
        var newNext = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNext, nextBtn);
        newNext.addEventListener('click', function () { changeSlide('next'); });
    }

    sliderIntervals[sliderId] = setInterval(function () { changeSlide('next'); }, 7000);

    function changeSlide(direction) {
        var images = sliderContainer.getElementsByTagName('img');
        if (images.length === 0) return;
        if (images[currentIndex]) images[currentIndex].style.display = 'none';
        if (indicator.children[currentIndex]) indicator.children[currentIndex].classList.remove('active');
        if (direction === 'next') {
            currentIndex = (currentIndex + 1) % images.length;
        } else {
            currentIndex = (currentIndex - 1 + images.length) % images.length;
        }
        if (images[currentIndex]) images[currentIndex].style.display = 'block';
        if (indicator.children[currentIndex]) indicator.children[currentIndex].classList.add('active');
    }

    function goToSlide(index) {
        var images = sliderContainer.getElementsByTagName('img');
        if (images.length === 0 || index >= images.length) return;
        if (images[currentIndex]) images[currentIndex].style.display = 'none';
        if (indicator.children[currentIndex]) indicator.children[currentIndex].classList.remove('active');
        currentIndex = index;
        if (images[currentIndex]) images[currentIndex].style.display = 'block';
        if (indicator.children[currentIndex]) indicator.children[currentIndex].classList.add('active');
    }
}

function initializeProSlider(sliderId) {
    var carousel = document.querySelector('#image-slider2 .carousel');
    if (!carousel || cachedImages.length === 0) return;
    carousel.querySelectorAll('img').forEach(function (img) { img.remove(); });
    var angleStep = 360 / cachedImages.length;
    carousel.innerHTML = '';
    cachedImages.forEach(function (imageData, index) {
        var slide = document.createElement('div');
        slide.classList.add('slide');
        slide.style.transform = 'rotateY(' + (index * angleStep) + 'deg) translateZ(180px)';
        var src = (typeof hotspotMediaUrl === 'function') ? hotspotMediaUrl(imageData.image_path) : (window.sp + imageData.image_path);
        slide.innerHTML = '<img src="' + src + '" alt="">';
        carousel.appendChild(slide);
    });
}

window.addEventListener('cacheUpdated', function (e) {
    if (typeof CacheManager !== 'undefined' && CacheManager.isCacheEvent(e, 'cached_images')) {
        applyImagesData(e.detail.data);
    }
});

if (typeof CacheManager !== 'undefined') {
    img();
} else {
    setTimeout(img, 50);
}
