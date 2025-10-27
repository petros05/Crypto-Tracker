// src/components/CoinDetail.js
import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import LoadingSpinner from "./LoadingSpinner.jsx";
import Chart from "./Chart.js"; // PriceChart component
import Header from "./Header.jsx";

// Optional: set in .env as REACT_APP_API_BASE
const API_BASE = "http://localhost:3001";

/** Format timestamp to fallback time label if backend sends raw data */
function formatTimeLabel(ts) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Format large numbers to M (millions) or B (billions) format */
function formatLargeNumber(num) {
  if (num === null || num === undefined || num === 0) return "0";
  
  const numValue = parseFloat(num);
  if (numValue >= 1e9) {
    return `${(numValue / 1e9).toFixed(2)}B`;
  } else if (numValue >= 1e6) {
    return `${(numValue / 1e6).toFixed(2)}M`;
  } else if (numValue >= 1e3) {
    return `${(numValue / 1e3).toFixed(2)}K`;
  } else {
    return numValue.toLocaleString();
  }
}

const CoinDetail = () => {
  const { name: coinParam } = useParams(); // e.g., bitcoin
  const [rawData, setRawData] = useState(null);
  const [error, setError] = useState(null);
  const [days, setDays] = useState("1");
  const [info, setInfo] = useState(null);

  // Mapping for percent change keys based on selected days
  const percentChangeMap = {
    1: "percent_change_1d",
    7: "percent_change_7d",
    30: "percent_change_30d",
    90: "percent_change_90d",
    365: "percent_change_365d",
  };

  useEffect(() => {
    if (!coinParam) return;
    axios
      .get(`${API_BASE}/currency/${coinParam}`, { params: { days } })
      .then((res) => {
        setRawData(res.data);
        setError(null);
        setInfo(res.data.info);
      })
      .catch((err) => {
        console.error("Chart fetch error:", err);
        setError("Failed to load chart.");
      });
  }, [coinParam, days]);
  // Normalize backend → { time, price }
  const chartData = useMemo(() => {
    if (!rawData) return null;

    // Preferred shape from backend
    if (Array.isArray(rawData.labels) && Array.isArray(rawData.prices)) {
      return { time: rawData.labels, price: rawData.prices };
    }

    // Handle { time, price }
    if (Array.isArray(rawData.time) && Array.isArray(rawData.price)) {
      return rawData;
    }

    // Handle raw CoinGecko passthrough { prices: [[ts,p],...] }
    if (Array.isArray(rawData.prices) && rawData.prices[0]?.length === 2) {
      const times = rawData.prices.map(([ts]) => formatTimeLabel(ts));
      const prices = rawData.prices.map(([, p]) => p);
      return { time: times, price: prices };
    }

    return null;
  }, [rawData]);

  // Get the correct percent change value based on selected days
  const percentChangeKey = percentChangeMap[days] || "percent_change_24h";
  const percentChangeValue = info
    ? parseFloat(info[percentChangeKey] ?? info.percent_change_24h)
    : 0;

  if (error) return <div className="coin-detail-error">{error}</div>;
  if (!chartData) return <LoadingSpinner />;

  return (
    <div>
      <Header />
      <div className="coin-detail-container">
        <div className="back-btn-container">
          <button className="back-btn" onClick={() => window.history.back()}>
            <i className="fa fa-arrow-left"></i>
            <span>Back</span>
          </button>
        </div>
        {/* Header Section */}
        <div className="coin-detail-header">
          <div className="coin-detail-title-section">
            <img src={info.logo} alt="Coin Logo" className="coin-detail-logo" />
            <div className="coin-detail-name-symbol">
              <h2 className="coin-detail-title">{info.name}</h2>
              <span className="coin-detail-symbol">{info.symbol?.toUpperCase()}</span>
            </div>
            <div className="coin-detail-rank-badge">#{info.cmc_rank || 'N/A'}</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="coin-detail-nav-tabs"></div>

        {/* Main Content - Two Column Layout */}
        <div className="coin-detail-main-content">
          {/* Left Column - Chart */}
          <div className="coin-detail-chart-column">
            {/* Chart Sub-navigation */}
            <div className="coin-detail-chart-nav"></div>

            {/* Time Range Selector */}
            <div className="coin-detail-time-selector">
              {[
                { label: "1D", val: "1" },
                { label: "7D", val: "7" },
                { label: "1M", val: "30" },
                { label: "3M", val: "90" },
                { label: "1Y", val: "365" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setDays(opt.val)}
                  className={`coin-detail-time-btn ${
                    days === opt.val ? "active" : ""
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Chart Container */}
            <div className="coin-detail-chart-container">
              <Chart coin={chartData} />
            </div>
          </div>

          {/* Right Column - Information Panel */}
          <div className="coin-detail-info-column">
            <div className="coin-detail-info-panel">
              {/* Current Price */}
              <div className="coin-detail-price-section">
                <h2 className="coin-detail-price">
                  ${parseFloat(info.price).toLocaleString()}
                </h2>
                <div
                  className="coin-detail-price-change"
                  style={{
                    color:
                      percentChangeValue < 0
                        ? "rgb(234, 57, 67)"
                        : "rgb(22, 199, 132)",
                    fontWeight: 500,
                    fontSize: "1.1em",
                    marginTop: "4px",
                  }}
                >
                  {percentChangeValue < 0 ? (
                    <i
                      className="fa fa-caret-down"
                      style={{ marginRight: 4 }}
                    ></i>
                  ) : (
                    <i
                      className="fa fa-caret-up"
                      style={{ marginRight: 4 }}
                    ></i>
                  )}
                  {Math.abs(percentChangeValue).toFixed(2)}%
                  <span
                    style={{ marginLeft: 4, color: "#888", fontWeight: 400 }}
                  >
                    ({days === "365" ? "1Y" : days + "D"})
                  </span>
                </div>
              </div>

              {/* Key Statistics */}
              <div className="coin-detail-stats-section">
                {[
                  {
                    label: "Market Cap",
                    value: `$${(parseFloat(info.market_cap) / 1e9).toFixed(
                      2
                    )}B`,
                  },
                  {
                    label: "Volume (24h)",
                    value: (
                      <>
                        <span
                          style={{
                            color:
                              parseFloat(info.volume_change_24h) < 0
                                ? "rgb(234, 57, 67)"
                                : "rgb(22, 199, 132)",
                            fontWeight: 500,
                            marginRight: 8,
                          }}
                        >
                          {parseFloat(info.volume_change_24h) < 0 ? (
                            <i
                              className="fa fa-caret-down"
                              style={{ marginRight: 2 }}
                            ></i>
                          ) : (
                            <i
                              className="fa fa-caret-up"
                              style={{ marginRight: 2 }}
                            ></i>
                          )}
                          {Math.abs(
                            parseFloat(info.volume_change_24h || 0)
                          ).toFixed(2)}
                          %
                        </span>
                        <span>
                          $
                          {((parseFloat(info.volume_24h) || 0) / 1e9).toFixed(
                            2
                          )}
                          B
                        </span>
                      </>
                    ),
                  },
                  {
                    label: "Total Supply",
                    value: `${formatLargeNumber(info.total_supply)} ${info.symbol?.toUpperCase()}`,
                  },
                  {
                    label: "Max. Supply",
                    value:
                      info.max_supply == null
                        ? "∞"
                        : `${formatLargeNumber(info.max_supply)} ${info.symbol?.toUpperCase()}`,
                  },
                  {
                    label: "Circulating Supply",
                    value: `${formatLargeNumber(info.circulating_supply)} ${info.symbol?.toUpperCase()}`,
                  },
                ].map((stat, index) => (
                  <div key={index} className="coin-detail-stat-row">
                    <span className="coin-detail-stat-label">{stat.label}</span>
                    <div className="coin-detail-stat-value">
                      <span className="coin-detail-stat-text">
                        {stat.value}
                      </span>
                      {stat.change && (
                        <span
                          className={`coin-detail-stat-change ${
                            stat.isPositive ? "positive" : "negative"
                          }`}
                        >
                          {stat.change}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Links */}
              <div className="coin-detail-links-section">
                <div>
                  <button
                    className="coin-detail-link-btn"
                    onClick={() => {
                      if (info.website) {
                        window.open(
                          info.website,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }
                    }}
                  >
                    <span>🌐 Website</span>
                    <span>↗</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="coin-detail-about-section">
          <h3 className="coin-detail-about-title">About {info.name}</h3>
          <p className="coin-detail-about-text">{info.description}</p>
        </div>
      </div>
    </div>
  );
};

export default CoinDetail;
