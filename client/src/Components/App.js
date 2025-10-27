import React from "react";
import { UserProvider } from "./UserContext.js";
import { ThemeProvider } from "./ThemeContext.js";
import Header from "./Header";
import Login from "./Login";
import Signup from "./SignUp";

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <Header />
        <Login />
        <Signup />
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;