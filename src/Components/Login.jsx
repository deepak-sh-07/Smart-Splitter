import styles from "./login.module.css";
import logo from "../assets/Logo2.svg";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../utils/fetchWithAuth.js";

const Login = () => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  const handleToggle = () => {
    setIsRegister(!isRegister);
    setFormData({ name: "", email: "", password: "" });
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async () => {
    const { name, email, password } = formData;
    if (!name || !email || !password) return alert("Fill all fields");

    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Registration failed");

      alert("Registration successful!");
      handleToggle();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  const handleLogin = async () => {
    const { email, password } = formData;
    if (!email || !password) return alert("Fill all fields");

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Login failed");

      // Save tokens & user info
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/home");
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  return (
    <div className={styles.main}>
      <div className={styles.header}>
        <div className={styles.top}>
          <div className={styles.logo}><img src={logo} alt="Logo" /></div>
          <div className={styles.new} onClick={handleToggle}>
            {isRegister ? "Back to Login" : "New User?"}
          </div>
        </div>
        <div className={styles.name}>
          <div className={styles.appname}>Smart Splitter</div>
          <div className={styles.desc}>Easily split bills and track expenses with friends.</div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.login}>
          {isRegister ? (
            <>
              <div className={styles.name}>Enter Name
                <input type="text" name="name" value={formData.name} onChange={handleChange} />
              </div>
              <div className={styles.email}>Enter Email
                <input type="text" name="email" value={formData.email} onChange={handleChange} />
              </div>
              <div className={styles.pass}>Password
                <input type="password" name="password" value={formData.password} onChange={handleChange} />
              </div>
              <div className={styles.signin}>
                <button onClick={handleRegister}>Register</button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.usename}>Enter Email
                <input type="text" name="email" value={formData.email} onChange={handleChange} />
              </div>
              <div className={styles.pass}>Enter Password
                <input type="password" name="password" value={formData.password} onChange={handleChange} />
              </div>
              <div className={styles.Log_btn}>
                <button onClick={handleLogin}>Login</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
