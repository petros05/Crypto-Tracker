import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useUser } from "./UserContext.js";
import Header from "./Header";
import LoadingSpinner from "./LoadingSpinner.jsx";
import "../App.css";

function Home({ isUserSignin }) {
  const [favorite, setFavorite] = useState({ message: "", status: null });
  const { user, token } = useUser();
  const [coins, setCoins] = useState([]);
  const [userFavorites, setUserFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user's favorite coins when user is logged in
  const fetchUserFavorites = useCallback(async () => {
    try {
      const response = await axios.get("/favorites", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUserFavorites(response.data);
    } catch (err) {
      console.error("Error fetching favorites:", err);
    }
  }, [token]);

  useEffect(() => {
    if (user && token) {
      fetchUserFavorites();
    }
  }, [user, token, fetchUserFavorites]);

  // Check if a coin is in user's favorites
  const isFavorite = (symbol, slug) => {
    return userFavorites.some(
      (fav) => fav.symbol === symbol && fav.slug === slug
    );
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const res = await axios.get("/coin-api");
        if (isMounted) {
          setCoins(res.data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();
    const intervalId = setInterval(fetchData, 100000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (favorite.status) {
      const timer = setTimeout(
        () => setFavorite({ message: "", status: null }),
        3000
      );
      return () => clearTimeout(timer);
    }
  }, [favorite.status]);

  const handleRowClick = async (coin) => {
    try {
      const response = await axios.get(`/currency/${coin}`);
      if (response.statusText === "OK") {
        navigate(`/currency/${coin}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFavorite = async (e, coinId, coinName, symbol, slug) => {
    e.stopPropagation();
    if (user && token) {
      try {
        if (isFavorite(symbol, slug)) {
          // Remove from favorites
          const response = await axios.delete(`/favorite/${coinName}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            data: { symbol, slug },
          });

          if (response.status === 200) {
            setFavorite({
              message: response.data.message,
              status: response.status,
            });
            // Refresh favorites list
            fetchUserFavorites();
          }
        } else {
          // Add to favorites
          const response = await axios.post(
            `/favorite/${coinName}`,
            {
              coinName,
              symbol,
              slug,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.status === 200) {
            setFavorite({
              message: response.data.message,
              status: response.status,
            });
            // Refresh favorites list
            fetchUserFavorites();
          }
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

  return (
    <div>
      <Header isUserSignin={isUserSignin} />
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
      <div className="main">
        <h2 className="main-title">Today's Cryptocurrency Prices by Papit</h2>
        <div className="table-container">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <table className="coins-table">
              <thead>
                <tr>
                  <th></th>
                  <th>#</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>1h</th>
                  <th>24h</th>
                  <th>7d</th>
                  <th>Volume(24h)</th>
                  <th>Market Cap</th>
                  <th>Circulating Supply</th>
                </tr>
              </thead>
              <tbody>
                {coins.map((item) => (
                  <tr
                    key={item.id}
                    style={{ cursor: "pointer" }}
                    onClick={(e) => handleRowClick(item.slug)}
                  >
                    <td style={{ position: "relative" }}>
                      <span
                        className="favorite-hover-wrapper"
                        style={{
                          display: "inline-block",
                          position: "relative",
                        }}
                      >
                        <i
                          className={`fa-star ${
                            isFavorite(item.symbol, item.slug) ? "fa-solid" : "fa-regular"
                          }`}
                          style={{
                            fontSize: 15,
                            backgroundColor: "transparent",
                            cursor: "pointer",
                            color: isFavorite(item.symbol, item.slug) ? "#FFD700" : "inherit",
                          }}
                          onClick={(e) =>
                            handleFavorite(
                              e,
                              item.id,
                              item.name,
                              item.symbol,
                              item.slug
                            )
                          }
                        ></i>
                      </span>
                    </td>
                    <td>{item.cmc_rank}</td>
                    <td className="name-column">
                      <img src={item.logo} alt={item.name} style={{ width: 23, height: 23, marginRight: 10, borderRadius: "50%"}} />
                      <span style={{ fontWeight: 600 }}>{item.name}</span>{" "}
                      <span className="symbol" style={{ fontWeight: 300 }}>
                        ({item.symbol})
                      </span>
                    </td>
                    <td>
                      {item.price
                        ? new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(item.price.toFixed(2))
                        : "N/A"}
                    </td>
                    <td
                      style={{
                        color:
                          item.percent_change_1h < 0
                            ? "rgb(234, 57, 67)"
                            : "rgb(22, 199, 132)",
                      }}
                    >
                      <i
                        className={`fa fa-caret-${
                          item.percent_change_1h < 0 ? "down" : "up"
                        }`}
                        style={{ margin: 5 }}
                      ></i>
                      <span>
                        {item.percent_change_1h
                          ? Math.abs(item.percent_change_1h).toFixed(
                              2
                            )
                          : "N/A"}
                        %
                      </span>
                    </td>
                    <td
                      style={{
                        color:
                          item.percent_change_24h < 0
                            ? "rgb(234, 57, 67)"
                            : "rgb(22, 199, 132)",
                      }}
                    >
                      <i
                        className={`fa fa-caret-${
                          item.percent_change_24h < 0
                            ? "down"
                            : "up"
                        }`}
                        style={{ margin: 5 }}
                      ></i>
                      {item.percent_change_24h
                        ? Math.abs(item.percent_change_24h).toFixed(2)
                        : "N/A"}
                      %
                    </td>
                    <td
                      style={{
                        color:
                          item.percent_change_7d < 0
                            ? "rgb(234, 57, 67)"
                            : "rgb(22, 199, 132)",
                      }}
                    >
                      <i
                        className={`fa fa-caret-${
                          item.percent_change_7d < 0 ? "down" : "up"
                        }`}
                        style={{ margin: 5 }}
                      ></i>
                      {item.percent_change_7d
                        ? Math.abs(item.percent_change_7d).toFixed(2)
                        : "N/A"}
                      %
                    </td>
                    <td>
                      {item.volume_24h
                        ? new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(item.volume_24h.toFixed(2))
                        : "N/A"}
                    </td>
                    <td>
                        {item.market_cap
                        ? new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(
                            item.market_cap.toFixed(2)
                          )
                        : "N/A"}
                    </td>
                    <td>
                      {item.circulating_supply
                        ? new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(item.circulating_supply.toFixed(2))
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
