let currentTab = 't16';
const searchValues = {
    t16: '',
    t165: ''
};

document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('search');
    const copyButton = document.querySelector('.copy-button');
    const clearButton = document.querySelector('.clear-button');
    const toggleExclamation = document.getElementById('toggleExclamation');
    const propertySearchInput = document.getElementById('propertySearchInput');
    const themeToggle = document.getElementById('themeToggle');

    // Делегированный обработчик кликов по .option
    document.addEventListener('click', function(event) {
        const option = event.target.closest('.option');
        if (!option) return;
        const container = option.closest('.options-container');
        if (!container || container.getAttribute('data-tab') !== currentTab) return;
        option.classList.toggle('selected');
        updateSearchInput();
		reorderOptions();
    });

	async function loadOptions(tab) {
    try {
        const response = await fetch(`${tab}.html`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const optionsHTML = await response.text();
        const container = document.getElementById(`optionsContainer${tab}`);
        if (container) {
            container.innerHTML = optionsHTML;

            // Сохраняем исходный порядок опций через data-index
            container.querySelectorAll('.option').forEach((option, index) => {
                option.setAttribute('data-index', index);
            });

            // Восстановление выделения из searchValues
            const savedRegexes = extractRegexesFromSearchValue(searchValues[tab]);
            container.querySelectorAll('.option').forEach(option => {
                if (savedRegexes.includes(option.getAttribute('data-regex'))) {
                    option.classList.add('selected');
                }
            });

            reorderOptions();
            updateSearchInput(); // Обновляем после загрузки и сортировки
        } else {
            console.error(`Container for tab ${tab} not found.`);
        }
    } catch (error) {
        console.error('Error loading options:', error);
    }
}


	// Вспомогательная функция для парсинга строки с выбранными regex
	function extractRegexesFromSearchValue(value) {
		if (!value) return [];
		// Убираем кавычки и возможный "!" в начале, разбиваем по "|"
		return value.replace(/^"!?/, '').replace(/"$/, '').split('|');
	}


    // Обработчик переключения вкладок
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', async () => {
            const tab = button.getAttribute('data-tab');
            searchValues[currentTab] = searchInput.value;

            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            button.classList.add('active');

            currentTab = tab;

            document.querySelectorAll('.tab-group').forEach(container => {
                const isCurrent = container.getAttribute('data-tab') === currentTab;
                container.style.display = isCurrent ? 'block' : 'none';
                if (!isCurrent) {
                    container.querySelectorAll('.option.selected').forEach(opt => opt.classList.remove('selected'));
                }
            });

            searchInput.value = '';
            propertySearchInput.value = '';

            await loadOptions(currentTab);

            const currentOptionsContainer = document.querySelector(`.options-container[data-tab="${currentTab}"]`);
            if (currentOptionsContainer) {
                currentOptionsContainer.querySelectorAll('.option').forEach(option => option.style.display = 'block');
            }
        });
    });

    // Кнопка копирования
    copyButton.addEventListener('click', async function() {
        try {
            await navigator.clipboard.writeText(searchInput.value);
            copyButton.textContent = 'Скопировано!';
            setTimeout(() => { copyButton.textContent = 'Копировать'; }, 1000);
        } catch (err) {
            console.error('Ошибка копирования:', err);
            copyButton.textContent = 'Ошибка';
        }
    });

    // Кнопка очистки
    clearButton.addEventListener('click', function() {
        const currentOptionsContainer = document.querySelector(`.options-container[data-tab="${currentTab}"]`);
        if (currentOptionsContainer) {
            currentOptionsContainer.querySelectorAll('.option.selected').forEach(option => option.classList.remove('selected'));
            currentOptionsContainer.querySelectorAll('.option').forEach(option => option.style.display = 'block');
        }
        searchInput.value = '';
        propertySearchInput.value = '';
        updateSearchInput();
    });

    // Переключатель "восклицательного знака"
    toggleExclamation.addEventListener('click', function() {
        this.classList.toggle('active');
        this.innerHTML = this.classList.contains('active') ? `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="lucide lucide-eye">
                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
        ` : `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="lucide lucide-eye-off">
                <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"></path>
                <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"></path>
                <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"></path>
                <path d="m2 2 20 20"></path>
            </svg>
        `;
        updateSearchInput();
    });

    // Фильтр поиска по свойствам
    propertySearchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const currentOptionsContainer = document.querySelector(`.options-container[data-tab="${currentTab}"]`);
        if (!currentOptionsContainer) return;
        currentOptionsContainer.querySelectorAll('.option').forEach(option => {
            const text = option.textContent.toLowerCase();
            option.style.display = text.includes(searchTerm) ? 'block' : 'none';
        });
		reorderOptions();
    });

    // Переключатель темы
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-theme');
    });
	
	{ 
function reorderOptions() {
    const container = document.querySelector(`.options-container[data-tab="${currentTab}"]`);
    if (!container) return;

    // Сохраняем позицию прокрутки и активный элемент
    const prevScrollTop = container.scrollTop;
    const active = document.activeElement;

    const options = Array.from(container.children).filter(opt => opt.style.display !== 'none');

    options.sort((a, b) => {
        const aSelected = a.classList.contains('selected') ? 0 : 1;
        const bSelected = b.classList.contains('selected') ? 0 : 1;
        if (aSelected !== bSelected) return aSelected - bSelected;

        // Сохраняем исходный порядок среди выбранных и невыбранных
        return Number(a.getAttribute('data-index')) - Number(b.getAttribute('data-index'));
    });

    // Переупорядочиваем, не меняя display (чтобы не сбрасывать прокрутку)
    options.forEach(option => container.appendChild(option));

    // Принудительный reflow без смены display (если нужен)
    container.offsetHeight;

    // Восстанавливаем прокрутку
    container.scrollTop = prevScrollTop;

    // Если фокус до операции был внутри контейнера — восстановим его
    if (active && container.contains(active)) {
        try { active.focus(); } catch (e) { /* ignore */ }
    }
}
}
	
    // Функция обновления текста результата
    function updateSearchInput() {
        const currentOptionsContainer = document.querySelector(`.options-container[data-tab="${currentTab}"]`);
        if (!currentOptionsContainer) {
            searchInput.value = '';
            return;
        }
        const selectedRegexes = Array.from(currentOptionsContainer.querySelectorAll('.option.selected'))
            .map(option => option.getAttribute('data-regex'));
        let result = `"${selectedRegexes.join('|')}"`;
        if (toggleExclamation.classList.contains('active') && selectedRegexes.length > 0) {
            result = `"!${selectedRegexes.join('|')}"`;
        }
        searchInput.value = result;
        searchValues[currentTab] = result;
		
    }

    // Инициализация при загрузке
    (async () => {
        document.querySelectorAll('.tab-group').forEach(container => {
            const isCurrent = container.getAttribute('data-tab') === currentTab;
            container.style.display = isCurrent ? 'block' : 'none';
        });

        document.querySelectorAll('.tab-button').forEach(button => {
            const tab = button.getAttribute('data-tab');
            button.classList.toggle('active', tab === currentTab);
        });

        await loadOptions(currentTab);
        updateSearchInput();
    })();
});
