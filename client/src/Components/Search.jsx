import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner.jsx";
import axios from "axios";
import Header from "./Header.jsx";
import { useUser } from "./UserContext.js";
import "../App.css";

// Debounce hook for search optimization
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const Search = () => {
  const [coins, setCoins] = useState([]);
  const [filteredCoins, setFilteredCoins] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [favorite, setFavorite] = useState({ message: "", status: null });
  const navigate = useNavigate();
  const { user } = useUser();

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch all coins on component mount
  useEffect(() => {
    const fetchAllCoins = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get("/coin-api");
        const coinsData = response.data || [];
        setCoins(coinsData);
        setFilteredCoins(coinsData);
      } catch (err) {
        console.error("Error fetching coins:", err);
        setError("Failed to load coins. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllCoins();
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchQuery.trim()) {
        setFilteredCoins(coins);
        setShowDropdown(false);
        return;
      }

      try {
        setSearchLoading(true);
        setError(null);

        const response = await axios.get(
          `/search?q=${encodeURIComponent(debouncedSearchQuery)}`
        );
        const searchResults = response.data || [];
        setFilteredCoins(searchResults);
        setShowDropdown(true);
      } catch (err) {
        console.error("Search error:", err);
        setError("Search failed. Please try again.");
        setFilteredCoins([]);
      } finally {
        setSearchLoading(false);
      }
    };

    performSearch();
  }, [debouncedSearchQuery, coins]);

  // Handle coin selection
  const handleCoinSelect = (coin) => {
    navigate(`/currency/${coin.slug || coin.name.toLowerCase()}`);
    setSearchQuery("");
    setShowDropdown(false);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(value.length > 0);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (searchQuery.length > 0) {
      setShowDropdown(true);
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".search-container")) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle favorite functionality
  const handleFavorite = async (e, coinId, coinName, symbol, slug) => {
    e.stopPropagation();
    if (user) {
      try {
        const response = await axios.post(`/favorite/${coinName}`, {
          id: coinId,
          userId: user.id,
          coinName,
          symbol,
          slug,
        });

        if (response.status === 200) {
          setFavorite({
            message: response.data.message,
            status: response.status,
          });
        }
      } catch (err) {
        if (err.response && err.response.status === 409) {
          setFavorite({
            message: "Coin already added",
            status: err.response.status,
          });
        } else {
          setFavorite({
            message: "Unexpected error",
            status: err.response.status,
          });
        }
      }
    } else {
      navigate("/signup");
    }
  };

  // Clear favorite message after 3 seconds
  useEffect(() => {
    if (favorite.status) {
      const timer = setTimeout(
        () => setFavorite({ message: "", status: null }),
        3000
      );
      return () => clearTimeout(timer);
    }
  }, [favorite.status]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="search-page">
          <div className="search-header">
            <h1 className="search-title">Search Cryptocurrencies</h1>
          </div>
          <LoadingSpinner />
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      {favorite.status && (
        <p
          className="favorite-message"
          style={{
            color:
              favorite.status === 200
                ? "#155724"
                : favorite.status === 409
                ? "#d32f2f"
                : "inherit",
            backgroundColor:
              favorite.status === 200
                ? "#e6f4ea"
                : favorite.status === 409
                ? "#fdecea"
                : "inherit",
          }}
        >
          {favorite.message}
        </p>
      )}
      <div className="search-page">
        <div className="search-header">
          <div className="back-btn-container">
            <button className="back-btn" onClick={() => window.history.back()}>
              <i className="fa fa-arrow-left"></i>
              <span>Back</span>
            </button>
          </div>
          <h1 className="search-title">Search Cryptocurrencies</h1>
          <p className="search-subtitle">
            Find and explore more than 10,000 cryptocurrencies
          </p>
        </div>

        <div className="search-container">
          <div className="search-input-wrapper">
            <div className="search-input-container">
              <i className="fa fa-search search-icon"></i>
              <input
                type="text"
                className="search-input-field"
                placeholder="Search for a cryptocurrency..."
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
              />
              {searchLoading && (
                <div className="search-loading">
                  <div className="search-spinner"></div>
                </div>
              )}
            </div>

            {error && (
              <div className="search-error">
                <i className="fa fa-exclamation-triangle"></i>
                <span>{error}</span>
              </div>
            )}

            {showDropdown && (
              <div className="search-dropdown">
                {filteredCoins.length === 0 ? (
                  <div className="search-no-results">
                    <i className="fa fa-search"></i>
                    <p>No cryptocurrencies found</p>
                    <span>Try a different search term</span>
                  </div>
                ) : (
                  <div className="search-results">
                    {filteredCoins.slice(0, 20).map((coin) => (
                      <div
                        key={coin.id}
                        className="search-result-item"
                        onClick={() => handleCoinSelect(coin)}
                      >
                        <div className="coin-info">
                          <span className="coin-name">
                            #{coin.cmc_rank || coin.rank} {coin.name}
                          </span>
                          <span className="coin-symbol">({coin.symbol})</span>
                        </div>
                        <div className="search-result-actions">
                          <span
                            className="favorite-hover-wrapper"
                            style={{
                              display: "inline-block",
                              position: "relative",
                            }}
                          >
                            <i
                              className="fa-regular fa-star"
                              style={{
                                fontSize: 15,
                                backgroundColor: "transparent",
                                cursor: "pointer",
                              }}
                              onClick={(e) =>
                                handleFavorite(
                                  e,
                                  coin.id,
                                  coin.name,
                                  coin.symbol,
                                  coin.slug
                                )
                              }
                              onMouseEnter={(e) => {
                                const wrapper = e.currentTarget.parentElement;
                                const tooltip =
                                  wrapper.querySelector(".favorite-tooltip");
                                if (tooltip) tooltip.style.display = "block";
                              }}
                              onMouseLeave={(e) => {
                                const wrapper = e.currentTarget.parentElement;
                                const tooltip =
                                  wrapper.querySelector(".favorite-tooltip");
                                if (tooltip) tooltip.style.display = "none";
                              }}
                            ></i>
                            <span
                              className="favorite-tooltip"
                              style={{
                                display: "none",
                                position: "fixed",
                                left: "unset",
                                right: "auto",
                                top: "unset",
                                minWidth: "140px",
                                zIndex: 2000,
                                padding: "5px 12px",
                                borderRadius: "4px",
                                fontSize: "13px",
                                whiteSpace: "nowrap",
                                marginLeft: "-100px",
                                marginTop: "10px",
                              }}
                            >
                              Add {coin.name} to favorite list
                            </span>
                          </span>
                          <i className="fa fa-chevron-right"></i>
                        </div>
                      </div>
                    ))}
                    {filteredCoins.length > 20 && (
                      <div className="search-more-results">
                        <span>+{filteredCoins.length - 20} more results</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {!showDropdown && !searchQuery && (
            <div className="search-suggestions">
              <h3 className="suggestions-title">Popular Cryptocurrencies</h3>
              <div className="suggestions-grid">
                {coins.slice(0, 12).map((coin) => (
                  <div
                    key={coin.id}
                    className="suggestion-card"
                    onClick={() => handleCoinSelect(coin)}
                  >
                    <div className="suggestion-coin-info">
                      <div className="suggestion-coin-details">
                        <span className="suggestion-coin-name">
                          #{coin.cmc_rank || coin.rank}{" "}
                          {coin.logo && (
                            <img
                              src={coin.logo}
                              alt={`${coin.name} logo`}
                              className="suggestion-coin-logo"
                              style={{
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                marginLeft: "10px",
                              }}
                            />
                          )}{" "}
                          {coin.name + " "}
                        </span>
                        <span className="suggestion-coin-symbol">
                          ({coin.symbol})
                        </span>
                      </div>
                    </div>

                    <div className="suggestion-actions">
                      <span
                        className="favorite-hover-wrapper"
                        style={{
                          display: "inline-block",
                          position: "relative",
                        }}
                      >
                        <i
                          className="fa-regular fa-star"
                          style={{
                            fontSize: 15,
                            backgroundColor: "transparent",
                            cursor: "pointer",
                          }}
                          onClick={(e) =>
                            handleFavorite(
                              e,
                              coin.id,
                              coin.name,
                              coin.symbol,
                              coin.slug
                            )
                          }
                          onMouseEnter={(e) => {
                            const wrapper = e.currentTarget.parentElement;
                            const tooltip =
                              wrapper.querySelector(".favorite-tooltip");
                            if (tooltip) tooltip.style.display = "block";
                          }}
                          onMouseLeave={(e) => {
                            const wrapper = e.currentTarget.parentElement;
                            const tooltip =
                              wrapper.querySelector(".favorite-tooltip");
                            if (tooltip) tooltip.style.display = "none";
                          }}
                        ></i>
                        <span
                          className="favorite-tooltip"
                          style={{
                            display: "none",
                            position: "fixed",
                            left: "unset",
                            right: "auto",
                            top: "unset",
                            minWidth: "140px",
                            zIndex: 2000,
                            padding: "5px 12px",
                            borderRadius: "4px",
                            fontSize: "13px",
                            whiteSpace: "nowrap",
                            marginLeft: "-100px",
                            marginTop: "10px",
                          }}
                        >
                          Add {coin.name} to favorite list
                        </span>
                      </span>
                      <i className="fa fa-arrow-right"></i>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Search;
