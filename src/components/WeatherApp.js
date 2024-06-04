import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './WeatherApp.css';

const WeatherApp = () => {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [clickedIndex, setClickedIndex] = useState(null);
  const [buttonClicked, setButtonClicked] = useState(false);

  // upadte your API key here
  const apiKey = process.env.REACT_APP_API_KEY;
  const apiUrl = `https://api.openweathermap.org/data/2.5/forecast`;

  const getDayFromDate = (dateString) => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    return daysOfWeek[dayOfWeek];
  };

  const getWeather = useCallback(async () => {
    try {
      const response = await axios.get(apiUrl, {
        params: {
          q: city,
          appid: apiKey,
          units: 'metric',
        },
      });

      const currentWeather = response.data.list[0];
      const currentTemperature = currentWeather.main.temp;
      const currentWeatherDescription = currentWeather.weather[0].description;

      const forecastData = response.data.list.slice(1).reduce((acc, forecast) => {
        const date = forecast.dt_txt.split(' ')[0];
        const time = forecast.dt_txt.split(' ')[1];

        if (!acc[date]) {
          acc[date] = {
            date,
            times: [],
          };
        }

        acc[date].times.push({
          time,
          temperature: forecast.main.temp,
          weather: forecast.weather[0].description,
        });

        return acc;
      }, {});

      const currentDate = new Date();
      const currentTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setWeather({
        city: response.data.city,
        currentTemperature,
        currentTime,
        currentWeatherDescription,
        forecastData: Object.values(forecastData),
      });

      setError(null);
    } catch (err) {
      console.error('Error:', err);
      setWeather(null);
      setError('City not found');
    }
  }, [city, apiKey, apiUrl]);

  const fetchData = useCallback(async () => {
    await getWeather();
  }, [getWeather]);

  useEffect(() => {
    let intervalId;

    if (buttonClicked && city) {
      fetchData();
      intervalId = setInterval(fetchData, 60000);

      return () => {
        clearInterval(intervalId)
        setButtonClicked(false);
      };
    }
  }, [buttonClicked, city, fetchData]);

  const handleClick = (dayIndex, timeIndex) => {
    setClickedIndex({ dayIndex, timeIndex });
  };

  const handleButtonClick = () => {
    setButtonClicked(true);
    getWeather();
  };

  const handleInputChange = (e) => {
    setCity(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      setButtonClicked(true);
      getWeather();
    }
  };

  return (
    <div className="weather-app">
      <h1>Weather App</h1>
      <input
        type="text"
        placeholder="Enter city"
        value={city}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
      />
      <button onClick={handleButtonClick}>Get Weather</button>

      {weather && weather.city && (
        <>
          <h2>{weather.city.name}, {weather.city.country}</h2>
          <div className='currentWeather'>
            <h3>Today Weather</h3>
            <p>Current Time: {weather.currentTime}</p>
            <p>Current Temperature: {weather.currentTemperature} °C</p>
            <p>Current Weather: {weather.currentWeatherDescription}</p>
          </div>
        </>
      )}

      {weather &&
        weather.forecastData.slice(0, 5).map((day, dayIndex) => (
          <div key={dayIndex} className="weather-card">
            <h3 className="day-header">{getDayFromDate(day.date)}, {day.date}</h3>
            <ul className="time-forecast">
              {day.times.map((timeForecast, timeIndex) => (
                <li key={timeIndex} className={`time-slot ${clickedIndex?.dayIndex === dayIndex && clickedIndex?.timeIndex === timeIndex ? 'clicked' : ''}`}
                  onClick={() => handleClick(dayIndex, timeIndex)}>
                  <p className="time">{timeForecast.time}</p>
                  <p className="temperature">{timeForecast.temperature} °C</p>
                  <p className="weather-description">{timeForecast.weather}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default WeatherApp;
