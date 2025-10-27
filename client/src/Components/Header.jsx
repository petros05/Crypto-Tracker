import { React, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "./UserContext.js";
import { useTheme } from "./ThemeContext.js";
import "../App.css";
import logo from "../logo192.png";

function Header() {
  const { user, logoutUser, token } = useUser();
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <nav className="nav_bar">
      <div className="left-section">
        <a href="/">
          <img className="logo" src={logo} alt="Logo" />
        </a>

        <div className="nav-links" style={{ display: "flex", gap: "1.5rem" }}>
          <a href="/">Cryptos</a>
          <a href="/exchanges">Exchanges</a>
        </div>
      </div>
      <div className="right-section">
        <button className="dark_mood_btn" onClick={toggleDarkMode}>
          <i className={darkMode ? "fas fa-sun" : "fas fa-moon"}></i>
        </button>
        <div className="search" onClick={() => navigate("/search")}>
          <i className="fa fa-search"></i>
          <input
            type="search"
            className="searchInput"
            name="search"
            placeholder="Search for asset..."
            readOnly
          />
        </div>

        {!user && !token ? (
          <div>
            <button onClick={() => navigate("/signup")} className="auth-btn">
              SignUp
            </button>
            <button onClick={() => navigate("/login")} className="auth-btn">
              Login
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="profile-btn"
            >
              <i className="fi fi-rr-user"></i>
              <span className="profile-name">{user.first_name}</span>
            </button>
            {showMenu && (
              <div className="profile-menu">
                <ul>
                  <li>
                    <button onClick={() => navigate("/profile")}>
                      <i className="fi fi-rr-user"></i> My Profile
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate("/favorite")}>
                      <i className="fas fa-star" style={{color: "#ffd43b"}} ></i> Favorite
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate("/portfolio")}>
                      <i className="fa fa-briefcase"></i> Portfolio
                    </button>
                  </li>
                  <li>
                    <button style={{ color: "red" }} onClick={logoutUser}>
                      <i className="fa fa-sign-out"></i> Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </nav>
  );
}

export default Header;
