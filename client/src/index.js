import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "./Components/UserContext.js";
import { ThemeProvider } from "./Components/ThemeContext.js";
import SignUp from "./Components/SignUp.jsx";
import Login from "./Components/Login.jsx";
import Home from "./Components/Home";
import CoinDetail from "./Components/CoinDetail.js";
import Favorite from "./Components/Favorite.jsx";
import Portfolio from "./Components/Portofilo.jsx";
import Search from "./Components/Search.jsx";
import Exchanges from "./Components/Exchange.jsx";
import "./App.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <UserProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/currency/:name" element={<CoinDetail />} />
            <Route path="/favorite" element={<Favorite />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/search" element={<Search />} />
            <Route path="/exchanges" element={<Exchanges />} />
          </Routes>
        </BrowserRouter>
      </UserProvider>
    </ThemeProvider>
  </React.StrictMode>
);
