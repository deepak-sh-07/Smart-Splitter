import styles from './login.module.css'; 
import logo from '../assets/Logo2.svg';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
const Login = () => {
  const navigate = useNavigate();
  const [reg,setReg] = useState(false);
  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const handlenew = ()=>{
    setReg(true);
  }
  
  const addnew = async () => {
  if (!name || !email || !password) {
    alert("Fill all the fields");
    return;
  }

  const data = { name, email, password };

  try {
    const response = await fetch("http://localhost:5000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      // Show backend's error message if available
      alert(result.error || "Registration failed");
      return;
    }
    alert("Registration successful!");
    setName("");
    setEmail("");
    setPassword("");
    setReg(false);
  } catch (error) {
    console.error("Error registering user:", error);
    alert("Something went wrong. Please try again.");
  }
};
  const Loginuser = async () => {
  if (!email || !password) {
    alert("Fill all the fields");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Login failed");
      return;
    }

    // ✅ Save tokens for later use
    localStorage.setItem("accessToken", result.accessToken);
    localStorage.setItem("refreshToken", result.refreshToken);

    alert("Login successful!");
    navigate("/home");
  } catch (error) {
    console.error("Error logging in:", error);
    alert("Something went wrong. Try again later.");
  }
};
const fetchWithAuth = async (url, options = {}) => {
  let accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  // If access token expired, try refreshing
  if (response.status === 403 && refreshToken) {
    const refreshRes = await fetch("http://localhost:5000/api/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      localStorage.setItem("accessToken", data.accessToken);

      // Retry the original request with new token
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${data.accessToken}`,
          "Content-Type": "application/json",
        },
      });
    } else {
      alert("Session expired, please log in again.");
      localStorage.clear();
      window.location.href = "/";
      return;
    }
  }

  return response.json();
};



  return (
    <div className={styles.main}>
      <div className={styles.header}>
            <div className={styles.top}>
              <div className={styles.logo}>
                <img src={logo} alt="Logo" />
              </div>
              <div className={styles.new} onClick={handlenew}>
                new user?
              </div>
            </div>
            <div className={styles.name}>
              <div className={styles.appname}>
                Smart Splitter
              </div>
              <div className={styles.desc}>
                Easily split bills and track expenses with friends.
              </div>
            </div>
          </div>
      <div className={styles.container}>
        <div className={styles.login}>
          {!reg &&(
            <>
            <div className={styles.usename}>
                Enter Email
                <input type="text" onChange={(e)=>setEmail(e.target.value)} />
            </div>
            <div className={styles.pass} >
                Enter Password
                <input type="text" onChange={(e)=>setPassword(e.target.value)}  />
            </div>
            <div className={styles.Log_btn}>
                <button onClick={Loginuser}> LOGIN</button>
            </div>
            </>
          )
          }
            
            {reg &&(
              <div className={styles.register}>
                <div className={styles.name}>
                  Enter Name
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}/>
                </div>
                <div className={styles.email}>
                 Enter Email
                  <input type="text" value={email} onChange={(e) => setEmail(e.target.value)}/>
                </div>
                <div className={styles.pass} >
                  Password
                  <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className={styles.signin}>
                  <button onClick={addnew}>ADD</button>
                </div>
              </div>
            )

            }
        </div>
        </div>
    </div>
  )
}

export default Login;