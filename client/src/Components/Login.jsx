import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "./UserContext";
import Header from "./Header";
import "../App.css";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { loginUser } = useUser();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        loginUser(data.user, data.token); // from UserContext
        navigate("/");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <>
    < Header />
      <section className="wrapper">
        <div className="form sing">
          <header>Login</header>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              name="email"
              required
            />
            <input
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              name="password"
              required
            />
            <input type="submit" value="Login" />
          </form>
          <a href="/signup">I don't have account yet? Signup</a>
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </section>
    </>
  );
}

export default Login;
