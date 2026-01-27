// Переключение темы
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    themeToggle.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌓';
});

// Переключение языка
const langSwitcher = document.getElementById('langSwitcher');
const elementsToTranslate = document.querySelectorAll('[data-ru]');

langSwitcher.addEventListener('change', (e) => {
    const lang = e.target.value;
    
    elementsToTranslate.forEach(el => {
        // Меняем текст
        if (el.dataset[lang]) {
            el.textContent = el.dataset[lang];
        }
        // Меняем placeholder если есть
        if (el.dataset[`${lang}Placeholder`]) {
            el.placeholder = el.dataset[`${lang}Placeholder`];
        }
    });
});