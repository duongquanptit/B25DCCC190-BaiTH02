import { useEffect, useState } from "react";
import "./App.css";

const weatherInfo = {
  0: ["Trời quang", "☀️"],
  1: ["Trời khá quang", "🌤️"],
  2: ["Có mây", "⛅"],
  3: ["Nhiều mây", "☁️"],
  45: ["Sương mù", "🌫️"],
  48: ["Sương mù dày", "🌫️"],
  51: ["Mưa phùn nhẹ", "🌦️"],
  53: ["Mưa phùn", "🌦️"],
  55: ["Mưa phùn dày", "🌧️"],
  61: ["Mưa nhẹ", "🌦️"],
  63: ["Mưa vừa", "🌧️"],
  65: ["Mưa lớn", "🌧️"],
  71: ["Tuyết nhẹ", "🌨️"],
  73: ["Tuyết vừa", "🌨️"],
  75: ["Tuyết dày", "❄️"],
  80: ["Mưa rào nhẹ", "🌦️"],
  81: ["Mưa rào", "🌧️"],
  82: ["Mưa rào lớn", "⛈️"],
  95: ["Dông", "⛈️"],
  96: ["Dông có mưa đá", "⛈️"],
  99: ["Dông mạnh", "⛈️"],
};

function getWeather(code) {
  return weatherInfo[code] || ["Không xác định", "🌡️"];
}

function App() {
  const [city, setCity] = useState("Hanoi");
  const [input, setInput] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState("C");

  async function searchWeather(cityName) {
    if (!cityName.trim()) {
      setError("Vui lòng nhập tên thành phố.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=vi&format=json`
      );
      if (!geoResponse.ok) throw new Error("Không thể tìm thành phố.");

      const geoData = await geoResponse.json();
      const place = geoData.results?.[0];

      if (!place) throw new Error("Không tìm thấy thành phố này.");

      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}` +
        `&longitude=${place.longitude}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m` +
        `&hourly=temperature_2m,weather_code,precipitation_probability` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
        `&timezone=auto&forecast_days=7`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Không thể tải dữ liệu thời tiết.");

      const data = await response.json();
      setWeather({ ...data, place });
      setCity(place.name);
      setInput("");
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    searchWeather("Hanoi");
  }, []);

  function temperature(value) {
    if (value == null) return "--°";
    const result = unit === "C" ? value : value * 9 / 5 + 32;
    return `${Math.round(result)}°`;
  }

  function dayName(date, options = { weekday: "short" }) {
    return new Date(`${date}T12:00:00`).toLocaleDateString("vi-VN", options);
  }

  const current = weather?.current;
  const currentWeather = current ? getWeather(current.weather_code) : null;
  const daily = weather?.daily;
  const hourly = weather?.hourly;
  const hourIndex = hourly && current
    ? hourly.time.findIndex((time) => time.slice(0, 13) === current.time.slice(0, 13))
    : -1;

  return (
    <main className="app-shell">
      <div className="weather-app">
        <header className="topbar">
          <a className="brand" href="#" aria-label="Weatherly trang chủ">
            <span className="brand-icon">☀</span>
            <span>weatherly</span>
          </a>

          <div className="unit-switch">
            <button className={unit === "C" ? "active" : ""} onClick={() => setUnit("C")}>
              °C
            </button>
            <button className={unit === "F" ? "active" : ""} onClick={() => setUnit("F")}>
              °F
            </button>
          </div>
        </header>

        <form
          className="search-bar"
          onSubmit={(event) => {
            event.preventDefault();
            searchWeather(input);
          }}
        >
          <span>⌕</span>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Tìm kiếm thành phố..."
            aria-label="Tên thành phố"
          />
          <button type="submit" disabled={loading}>
            {loading ? "Đang tìm..." : "Tìm kiếm"}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        {loading && !weather && <div className="loading">Đang tải dữ liệu thời tiết...</div>}

        {weather && current && (
          <>
            <section className="hero-card">
              <div className="hero-top">
                <div>
                  <p className="eyebrow">THỜI TIẾT HIỆN TẠI</p>
                  <h1>{weather.place.name}</h1>
                  <p className="location">
                    {weather.place.admin1 ? `${weather.place.admin1}, ` : ""}
                    {weather.place.country}
                  </p>
                  <p className="today">
                    {new Date().toLocaleDateString("vi-VN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                </div>
                <div className="hero-weather-icon">{currentWeather[1]}</div>
              </div>

              <div className="temperature-row">
                <div className="temperature">{temperature(current.temperature_2m)}</div>
                <div className="weather-description">
                  <h2>{currentWeather[0]}</h2>
                  <p>Cảm giác như {temperature(current.apparent_temperature)}</p>
                </div>
              </div>

              <div className="hero-divider" />

              <div className="sun-info">
                <div>
                  <span>🌅</span>
                  <div><small>Mặt trời mọc</small><strong>{daily?.sunrise?.[0]?.slice(11, 16) || "--:--"}</strong></div>
                </div>
                <div>
                  <span>🌇</span>
                  <div><small>Mặt trời lặn</small><strong>{daily?.sunset?.[0]?.slice(11, 16) || "--:--"}</strong></div>
                </div>
                <div>
                  <span>{current.is_day ? "☀️" : "🌙"}</span>
                  <div><small>Thời điểm</small><strong>{current.is_day ? "Ban ngày" : "Ban đêm"}</strong></div>
                </div>
              </div>
            </section>

            <section className="section-block">
              <div className="section-heading">
                <div><span className="heading-icon">▦</span><h2>Thông số thời tiết</h2></div>
                <span className="subheading">Cập nhật hiện tại</span>
              </div>

              <div className="stats-grid">
                <article className="stat-card">
                  <span className="stat-icon humidity">💧</span>
                  <p>Độ ẩm</p>
                  <strong>{current.relative_humidity_2m}%</strong>
                  <small>Độ ẩm không khí</small>
                </article>
                <article className="stat-card">
                  <span className="stat-icon wind">🌬️</span>
                  <p>Tốc độ gió</p>
                  <strong>{Math.round(current.wind_speed_10m)} <i>km/h</i></strong>
                  <small>Gió gần mặt đất</small>
                </article>
                <article className="stat-card">
                  <span className="stat-icon rain">🌧️</span>
                  <p>Lượng mưa</p>
                  <strong>{current.precipitation} <i>mm</i></strong>
                  <small>Lượng mưa hiện tại</small>
                </article>
              </div>
            </section>

            <section className="section-block">
              <div className="section-heading">
                <div><span className="heading-icon">◷</span><h2>Dự báo theo giờ</h2></div>
                <span className="subheading">Trong 24 giờ tới</span>
              </div>

              <div className="hourly-list">
                {(hourIndex >= 0 ? hourly.time.slice(hourIndex, hourIndex + 24).map((time, index) => ({
                  time,
                  temp: hourly.temperature_2m[hourIndex + index],
                  code: hourly.weather_code[hourIndex + index],
                  rain: hourly.precipitation_probability[hourIndex + index],
                })) : []).map((item, index) => (
                  <article className={`hour-item ${index === 0 ? "now" : ""}`} key={item.time}>
                    <span className="hour-time">{index === 0 ? "Bây giờ" : item.time.slice(11, 16)}</span>
                    <span className="hour-icon">{getWeather(item.code)[1]}</span>
                    <strong>{temperature(item.temp)}</strong>
                    <small>💧 {item.rain ?? 0}%</small>
                  </article>
                ))}
              </div>
            </section>

            <section className="section-block">
              <div className="section-heading">
                <div><span className="heading-icon">▤</span><h2>Dự báo 7 ngày</h2></div>
                <span className="subheading">Tổng quan tuần</span>
              </div>

              <div className="daily-list">
                {daily.time.map((date, index) => {
                  const info = getWeather(daily.weather_code[index]);
                  return (
                    <article className="daily-item" key={date}>
                      <span className="daily-day">{index === 0 ? "Hôm nay" : dayName(date)}</span>
                      <span className="daily-icon">{info[1]}</span>
                      <span className="daily-description">{info[0]}</span>
                      <div className="daily-range">
                        <strong>{temperature(daily.temperature_2m_max[index])}</strong>
                        <div className="range-track"><span /></div>
                        <span>{temperature(daily.temperature_2m_min[index])}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )}

        <footer className="footer">
          <span>☀ weatherly</span>
          <p>Dữ liệu thời tiết từ Open-Meteo · Dự báo có thể thay đổi</p>
        </footer>
      </div>
    </main>
  );
}

export default App;