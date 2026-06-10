// Configuration
const API_KEY = 'YOUR_API_KEY_HERE'; // Get free API key from openweathermap.org
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const UNITS = 'metric'; // Use Celsius

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const currentWeatherDiv = document.getElementById('currentWeather');
const forecastContainer = document.getElementById('forecastContainer');
const savedCitiesDiv = document.getElementById('savedCities');
const errorMessageDiv = document.getElementById('errorMessage');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSavedCities();
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
});

/**
 * Handle search button click
 */
function handleSearch() {
    const city = searchInput.value.trim();
    if (city) {
        getWeatherData(city);
        searchInput.value = '';
    }
}

/**
 * Fetch current weather and forecast data
 */
async function getWeatherData(city) {
    try {
        clearError();
        showLoadingState();

        // Fetch current weather
        const currentResponse = await fetch(
            `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=${UNITS}`
        );

        if (!currentResponse.ok) {
            throw new Error('City not found');
        }

        const currentData = await currentResponse.json();

        // Fetch forecast
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=${UNITS}`
        );

        const forecastData = await forecastResponse.json();

        // Display data
        displayCurrentWeather(currentData);
        displayForecast(forecastData);
        addToSavedCities(city);

    } catch (error) {
        showError(error.message || 'Failed to fetch weather data');
        console.error('Weather API Error:', error);
    }
}

/**
 * Display current weather
 */
function displayCurrentWeather(data) {
    const { name, sys, main, weather, wind, clouds } = data;

    const iconUrl = `https://openweathermap.org/img/wn/${weather[0].icon}@4x.png`;
    const weatherEmoji = getWeatherEmoji(weather[0].main);

    const html = `
        <div class="weather-card">
            <div class="weather-info">
                <div class="weather-main">
                    <div class="city-name">${name}, ${sys.country}</div>
                    <div class="weather-icon">${weatherEmoji}</div>
                    <div class="temperature">${Math.round(main.temp)}°C</div>
                    <div class="weather-description">${weather[0].description}</div>
                </div>
                <img src="${iconUrl}" alt="Weather icon" style="width: 150px; height: 150px;">
            </div>
            
            <div class="weather-details">
                <div class="detail-item">
                    <div class="detail-label">Feels Like</div>
                    <div class="detail-value">${Math.round(main.feels_like)}°C</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Humidity</div>
                    <div class="detail-value">${main.humidity}%</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Pressure</div>
                    <div class="detail-value">${main.pressure} hPa</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Wind Speed</div>
                    <div class="detail-value">${wind.speed} m/s</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Cloud Cover</div>
                    <div class="detail-value">${clouds.all}%</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Visibility</div>
                    <div class="detail-value">${(data.visibility / 1000).toFixed(1)} km</div>
                </div>
            </div>

            <button class="save-btn" onclick="addToSavedCities('${name}')">
                ⭐ Save City
            </button>
        </div>
    `;

    currentWeatherDiv.innerHTML = html;
}

/**
 * Display 5-day forecast
 */
function displayForecast(data) {
    // Group forecast by day (OpenWeatherMap provides 5-day forecast with 3-hour intervals)
    const forecastByDay = {};

    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

        if (!forecastByDay[day]) {
            forecastByDay[day] = {
                temps: [],
                weather: item.weather[0],
                date: date
            };
        }

        forecastByDay[day].temps.push(item.main.temp);
    });

    const forecastArray = Object.entries(forecastByDay).slice(0, 5);

    let html = '';
    forecastArray.forEach(([day, data]) => {
        const minTemp = Math.round(Math.min(...data.temps));
        const maxTemp = Math.round(Math.max(...data.temps));
        const emoji = getWeatherEmoji(data.weather.main);

        html += `
            <div class="forecast-card">
                <div class="forecast-date">${day}</div>
                <div class="forecast-icon">${emoji}</div>
                <div class="forecast-temp">${maxTemp}°C</div>
                <div class="forecast-temp-range">L: ${minTemp}°C</div>
                <div class="forecast-temp-range">${data.weather.main}</div>
            </div>
        `;
    });

    forecastContainer.innerHTML = html;
}

/**
 * Get weather emoji based on condition
 */
function getWeatherEmoji(condition) {
    const emojis = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Drizzle': '🌦️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Mist': '🌫️',
        'Smoke': '💨',
        'Haze': '🌫️',
        'Dust': '💨',
        'Fog': '🌫️',
        'Sand': '🏜️',
        'Ash': '🌋',
        'Squall': '💨',
        'Tornado': '🌪️'
    };
    return emojis[condition] || '🌤️';
}

/**
 * Add city to saved cities
 */
function addToSavedCities(city) {
    let savedCities = JSON.parse(localStorage.getItem('savedCities')) || [];

    // Avoid duplicates
    if (!savedCities.includes(city)) {
        savedCities.push(city);
        localStorage.setItem('savedCities', JSON.stringify(savedCities));
        loadSavedCities();
        showError(`${city} saved to favorites!`, 'success');
    }
}

/**
 * Load and display saved cities
 */
function loadSavedCities() {
    const savedCities = JSON.parse(localStorage.getItem('savedCities')) || [];

    if (savedCities.length === 0) {
        savedCitiesDiv.innerHTML = '<p>No saved cities yet</p>';
        return;
    }

    let html = '';
    savedCities.forEach(city => {
        html += `
            <button class="city-btn" onclick="getWeatherData('${city}')">
                ${city}
                <button class="remove-city" onclick="removeCity('${city}', event)">✕</button>
            </button>
        `;
    });

    savedCitiesDiv.innerHTML = html;
}

/**
 * Remove city from saved cities
 */
function removeCity(city, event) {
    event.stopPropagation();
    let savedCities = JSON.parse(localStorage.getItem('savedCities')) || [];
    savedCities = savedCities.filter(c => c !== city);
    localStorage.setItem('savedCities', JSON.stringify(savedCities));
    loadSavedCities();
    showError(`${city} removed from favorites`, 'success');
}

/**
 * Show loading state
 */
function showLoadingState() {
    currentWeatherDiv.innerHTML = `
        <div class="weather-card loading">
            <p>Loading weather data...</p>
        </div>
    `;
    forecastContainer.innerHTML = '<p>Loading forecast...</p>';
}

/**
 * Show error message
 */
function showError(message, type = 'error') {
    errorMessageDiv.textContent = message;
    errorMessageDiv.className = `error-message show ${type}`;
    setTimeout(clearError, 4000);
}

/**
 * Clear error message
 */
function clearError() {
    errorMessageDiv.className = 'error-message';
    errorMessageDiv.textContent = '';
}
