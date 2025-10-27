import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "./UserContext.js";
import Header from "./Header";
import LoadingSpinner from "./LoadingSpinner.jsx";
import "../App.css";

function Favorite() {
  const { user, token } = useUser();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !token) {
      navigate("/signup");
      return;
    }
    const fetchFavorites = async () => {
      try {
        const res = await fetch("/favorite", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setFavorites(data);
      } catch (err) {
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, [user, token, navigate]);

  // Helper to show a filled star for favorites (all are favorites here)
  const renderStar = () => (
    <span className="favorite-hover-wrapper" style={{ display: "inline-block", position: "relative" }}>
      <i className="fa-star fa-solid" style={{ fontSize: 15, backgroundColor: "transparent", color: "#FFD700" }}></i>
    </span>
  );

  return (
    <div>
      <Header />
      <div className="main">
        <h2 className="main-title">Your Favorite Coins</h2>
        <div className="table-container">
          {loading ? (
            <LoadingSpinner />
          ) : favorites.length === 0 ? (
            <p style={{ textAlign: "center", fontWeight: 500 }}>No favorites yet.</p>
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
                {favorites.map((item, idx) => (
                  <tr key={item.id || item.slug} style={{ cursor: "pointer" }} onClick={() => navigate(`/currency/${item.slug || item.name}`)}>
                    <td style={{ position: "relative" }}>{renderStar()}</td>
                    <td>{item.cmc_rank}</td>
                    <td className="name-column">
                      <img src={item.logo} alt={item.name} style={{ width: 23, height: 23, marginRight: 10, borderRadius: "50%" }} />
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
                    <td style={{ color: item.percent_change_1h < 0 ? "rgb(234, 57, 67)" : "rgb(22, 199, 132)" }}>
                      <i className={`fa fa-caret-${item.percent_change_1h < 0 ? "down" : "up"}`} style={{ margin: 5 }}></i>
                      <span>
                        {item.percent_change_1h ? Math.abs(item.percent_change_1h).toFixed(2) : "N/A"}%
                      </span>
                    </td>
                    <td style={{ color: item.percent_change_24h < 0 ? "rgb(234, 57, 67)" : "rgb(22, 199, 132)" }}>
                      <i className={`fa fa-caret-${item.percent_change_24h < 0 ? "down" : "up"}`} style={{ margin: 5 }}></i>
                      {item.percent_change_24h ? Math.abs(item.percent_change_24h).toFixed(2) : "N/A"}%
                    </td>
                    <td style={{ color: item.percent_change_7d < 0 ? "rgb(234, 57, 67)" : "rgb(22, 199, 132)" }}>
                      <i className={`fa fa-caret-${item.percent_change_7d < 0 ? "down" : "up"}`} style={{ margin: 5 }}></i>
                      {item.percent_change_7d ? Math.abs(item.percent_change_7d).toFixed(2) : "N/A"}%
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
                          }).format(item.market_cap.toFixed(2))
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

export default Favorite;