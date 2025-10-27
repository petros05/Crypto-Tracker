import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "./UserContext";
import Header from "./Header";
import "../App.css";


function SignUp() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const { loginUser } = useUser();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Check password match
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json(); // Fetch requires .json()

      if (response.ok) {
        loginUser(data.user, data.token); // Login user from context
        navigate("/");
      } else {
        setError(data.message || "Signup failed");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <>
    < Header />
      <section className="wrapper">
        <div className="form signup">
          <header>Signup</header>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder="First Name"
              required
            />
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder="Last Name"
              required
            />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              required
            />
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              required
            />
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              required
            />
            <input type="submit" value="Sign Up" />
          </form>
          <a href="/login">Already have an account? Login</a>
        </div>
      </section>

      {error && (
        <p style={{ color: "red", textAlign: "center", fontSize: "20px" }}>
          {error}
        </p>
      )}
    </>
  );
}

export default SignUp;
