const slider = document.querySelector('.angle-slider');
const display = document.querySelector('.angle-display');
const circle = document.querySelector('.gradient-circle');
const stick = document.querySelector('.stick');
let angle = slider.value;

function updateGradient() {
    angle = slider.value;
    display.textContent = `${angle}°`;
    const rgbaColor1 = pickr.getColor().toRGBA().toString();
    const rgbaColor2 = pickr2.getColor().toRGBA().toString();
    const gradient = `linear-gradient(${angle}deg, ${rgbaColor1}, ${rgbaColor2})`;

    circle.style.background = gradient;
    stick.style.transform = `rotate(${angle}deg)`;

    const elementSelector = document.getElementById('element-selector').value;
    if (elementSelector) {
        applyColorToElement(elementSelector, gradient);
        updatedStyles[elementSelector] = gradient;
        updateCssOutput();
    }
}

slider.addEventListener('input', updateGradient);

const pickr = Pickr.create({
    el: '#color-picker',
    theme: 'classic',
    swatches: [
        'rgba(244, 67, 54, 1)',
        'rgba(233, 30, 99, 0.95)',
        'rgba(156, 39, 176, 0.9)',
        'rgba(103, 58, 183, 0.85)',
        'rgba(63, 81, 181, 0.8)',
        'rgba(33, 150, 243, 0.75)',
        'rgba(3, 169, 244, 0.7)',
        'rgba(0, 188, 212, 0.7)',
        'rgba(0, 150, 136, 0.75)',
        'rgba(76, 175, 80, 0.8)',
        'rgba(139, 195, 74, 0.85)',
        'rgba(205, 220, 57, 0.9)',
        'rgba(255, 235, 59, 0.95)',
        'rgba(255, 193, 7, 1)'
    ],
    components: {
        preview: true,
        opacity: true,
        hue: true,
        interaction: {
            hex: false,
            rgba: false,
            hsla: false,
            hsva: false,
            cmyk: false,
            input: false,
            clear: true,
            save: false
        }
    }
});

const pickr2 = Pickr.create({
    el: '#color-picker2',
    theme: 'classic',
    swatches: pickr.options.swatches,
    components: pickr.options.components
});

function updateGradientFromPickr() {
    updateGradient();
}

pickr.on('change', updateGradientFromPickr);
pickr2.on('change', updateGradientFromPickr);

function applyColorToElement(selector, color) {
    const elements = document.querySelectorAll('.' + selector);
    elements.forEach(element => {
        element.style.background = color;
        if (selector === 'btn_color') {
            element.style.color = '#ffffff';
        }
    });
    if (selector === 'bd_color') {
        document.body.style.background = color;
    }
}

function updateCssOutput() {
    const cssOutput = document.getElementById('css-code');
    cssOutput.textContent = '';
    for (const [selector, style] of Object.entries(updatedStyles)) {
        cssOutput.textContent += `.${selector} { background: ${style}; }\n`;
        if (selector === 'btn_color') {
            cssOutput.textContent += `.${selector} { color: #ffffff; }\n`;
        }
    }
}

const updatedStyles = {};

document.getElementById('apply-color').addEventListener('click', () => {
    updateGradient();
    const elementSelector = document.getElementById('element-selector').value;
    const gradient = updatedStyles[elementSelector];
    if (elementSelector && gradient) {
        saveColorChange(elementSelector, gradient);
    }
});

document.getElementById('reset-colors').addEventListener('click', () => {
    const data = new URLSearchParams();
    data.append('action', 'reset');
    data.append('network_id', networkId);

    fetch(window.location.href, {
        method: 'POST',
        body: data
    })
    .then(response => response.text())
    .then(response => {
        console.log(response);
        location.reload();
    });
});

function saveColorChange(elementSelector, color) {
    const data = new URLSearchParams();
    data.append('action', 'update');
    data.append('network_id', networkId);
    data.append('element', elementSelector);
    data.append('color', color);

    fetch(window.location.href, {
        method: 'POST',
        body: data
    })
    .then(response => response.text())
    .then(response => console.log(response));
}

let currentColors = {};

fetch(`template_colors.php?network_id=${networkId}`)
    .then(response => response.json())
    .then(templates => {
        const select = document.getElementById('template-select');

        templates.forEach((template, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = template.name;
            option.dataset.colors = JSON.stringify(template.colors);
            select.appendChild(option);
        });

        if (templates.length > 0) {
            select.selectedIndex = 0;
            const defaultColors = templates[0].colors;
            applyTemplate(defaultColors);
            currentColors = defaultColors;
        }

        select.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption && selectedOption.value) {
                const colors = JSON.parse(selectedOption.dataset.colors);
                applyTemplate(colors);
                currentColors = colors;
            }
        });

        document.getElementById('prev-template').addEventListener('click', function() {
            if (select.selectedIndex > 0) {
                select.selectedIndex--;
                select.dispatchEvent(new Event('change'));
            }
        });

        document.getElementById('next-template').addEventListener('click', function() {
            if (select.selectedIndex < select.options.length - 1) {
                select.selectedIndex++;
                select.dispatchEvent(new Event('change'));
            }
        });
    });

function applyTemplate(colors) {
    const styleElement = document.getElementById('dynamic-styles');
    let styles = '';

    for (const element in colors) {
        styles += `.${element} { background: ${colors[element]}; }\n`;
        if (element === 'btn_color') {
            styles += `.${element} { color: #ffffff; }\n`;
        }
    }

    styleElement.innerHTML = styles;
}

document.getElementById('save-template').addEventListener('click', function() {
    fetch('template_colors.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            network_id: networkId,
            colors: currentColors
        })
    })
    .then(response => response.text())
    .then(data => {
        alert('تم تحديث القالب الافتراضي بنجاح');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('حدث خطأ أثناء تحديث القالب');
    });
});
