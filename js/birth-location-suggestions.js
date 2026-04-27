(function () {
    const DATALIST_SELECTOR = 'datalist#birth-place-suggestions';

    function populateDatalist(datalist, locations) {
        if (!datalist || !Array.isArray(locations) || locations.length === 0) return;

        datalist.replaceChildren();
        locations.forEach((location) => {
            if (!location?.name) return;

            const option = document.createElement('option');
            option.value = location.name;
            if (location.country) {
                option.label = location.country;
            }
            datalist.appendChild(option);
        });
    }

    async function loadBirthLocationSuggestions() {
        const datalists = [...document.querySelectorAll(DATALIST_SELECTOR)];
        if (!datalists.length) return;

        try {
            const apiBase = window.API_CONFIG?.BASE_URL || '/api';
            const response = await fetch(`${apiBase}/birth-locations`, {
                credentials: 'include'
            });
            if (!response.ok) return;

            const data = await response.json();
            if (!Array.isArray(data.locations)) return;

            datalists.forEach((datalist) => populateDatalist(datalist, data.locations));
        } catch {
            // Keep static fallback options when the API is unavailable.
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadBirthLocationSuggestions);
    } else {
        loadBirthLocationSuggestions();
    }
}());
