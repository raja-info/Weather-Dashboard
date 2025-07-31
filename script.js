const apiKey = '2535503ee6b393eef26b2ca3ec8b9ed8';
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
const weatherCard = document.getElementById('weather-card');
const forecastCard = document.getElementById('forecast');
const recentSearchesContainer = document.getElementById('recent-searches');
const darkModeToggleBtn = document.getElementById('toggle-dark-btn');
const geoBtn = document.getElementById('geo-btn');

const recentSearchesKey = 'weatherRecentSearches';
let recentSearches = JSON.parse(localStorage.getItem(recentSearchesKey)) || [];
let isDark = false;

darkModeToggleBtn.addEventListener('click', () => {
    isDark = !isDark;
    document.body.classList.toggle('dark-mode', isDark);
    localStorage.setItem('darkModeEnabled', isDark);
});

if (localStorage.getItem('darkModeEnabled') === 'true') {
    isDark = true;
    document.body.classList.add('dark-mode');
}

function kelvinToCelsius(k) {
    return (k - 273.15).toFixed(1);
}

function renderWeather(data) {
    const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
    weatherCard.innerHTML = `
        <div class="weather-main">
            <img src="${iconUrl}" alt="${data.weather[0].description}" class="weather-icon" />
            <h2>${data.name}, ${data.sys.country}</h2>
            <p class="desc">${data.weather[0].description}</p>
        </div>
        <div class="weather-details">
            <div>🌡️ ${kelvinToCelsius(data.main.temp)} °C</div>
            <div>💧 ${data.main.humidity}% humidity</div>
            <div>💨 ${data.wind.speed} m/s wind</div>
        </div>
    `;
    addRecentSearch(data.name);
}

function renderForecast(data) {
    forecastCard.style.display = 'block';
    const daily = data.list.filter(f => f.dt_txt.includes('12:00:00')).slice(0, 5);
    const html = daily.map(day => {
        const date = new Date(day.dt_txt).toLocaleDateString(undefined, { weekday:'short' });
        const icon = `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;
        return `
            <div class="forecast-day">
                <div>${date}</div>
                <img src="${icon}" alt="" />
                <div>${kelvinToCelsius(day.main.temp)}°C</div>
                <div class="desc">${day.weather[0].description}</div>
            </div>`;
    }).join('');
    forecastCard.innerHTML = `<h3>5-Day Forecast</h3><div class="forecast-days">${html}</div>`;
}

function showError(msg) {
    weatherCard.innerHTML = `<p style="color:red;">${msg}</p>`;
    forecastCard.style.display = 'none';
}

function addRecentSearch(city) {
    if (!recentSearches.includes(city)) {
        recentSearches.unshift(city);
        if (recentSearches.length > 5) recentSearches.pop();
        localStorage.setItem(recentSearchesKey, JSON.stringify(recentSearches));
    }
    renderRecentSearches();
}

function renderRecentSearches() {
    recentSearchesContainer.innerHTML = '';
    recentSearches.forEach(city => {
        const btn = document.createElement('button');
        btn.textContent = city;
        btn.className = 'recent-btn';
        btn.onclick = () => fetchWeather(city);
        recentSearchesContainer.appendChild(btn);
    });
}

async function fetchWeather(city) {
    if (!city) return showError('Please enter a city name.');
    weatherCard.innerHTML = '<p>Loading...</p>';
    forecastCard.style.display = 'none';

    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}`);
        if (!res.ok) return showError('City not found.');
        const data = await res.json();
        renderWeather(data);

        const fRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}`);
        if (fRes.ok) renderForecast(await fRes.json());
    } catch {
        showError('Network error.');
    }
}

geoBtn.addEventListener('click', () => {
    if (!navigator.geolocation) return showError('Geolocation not supported.');
    geoBtn.disabled = true; geoBtn.textContent = '⏳';
    navigator.geolocation.getCurrentPosition(async pos => {
        await fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
        geoBtn.disabled = false; geoBtn.textContent = '📍';
    }, () => {
        showError('Could not get location.');
        geoBtn.disabled = false; geoBtn.textContent = '📍';
    });
});

async function fetchWeatherByCoords(lat, lon) {
    weatherCard.innerHTML = '<p>Loading...</p>';
    forecastCard.style.display = 'none';
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`);
        if (!res.ok) return showError('Failed to load data.');
        const data = await res.json();
        renderWeather(data);

        const fRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`);
        if (fRes.ok) renderForecast(await fRes.json());
    } catch {
        showError('Network error.');
    }
}

searchBtn.onclick = () => fetchWeather(cityInput.value.trim());
cityInput.onkeydown = e => { if (e.key === 'Enter') fetchWeather(cityInput.value.trim()); };

// Init
renderRecentSearches();
