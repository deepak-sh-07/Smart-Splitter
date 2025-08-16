import Navbar from "./Navbar";
import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import styles from './New.module.css';

const New = () => {
  const [title, setTitle] = useState("");
  const [participants, setParticipants] = useState([]);
  const [s, setS] = useState("");
  const navigate = useNavigate();

  const handletitle = (e) => {
    setTitle(e.target.value);
  };

  const handlepeople = (e) => {
    setS(e.target.value);
  };
  const fetchWithAuth = async (url, options = {}) => {
    let accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    // 1️⃣ Try request with current access token
    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    // 2️⃣ If token expired, try refreshing
    if (response.status === 403 && refreshToken) {
      const refreshRes = await fetch("http://localhost:5000/api/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        localStorage.setItem("accessToken", data.accessToken);

        // Retry original request with new token
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
        return { ok: false, status: 403, data: null };
      }
    }

    // 3️⃣ Always safely parse JSON (or return null if no JSON body)
    let data = null;
    try {
      data = await response.json();
    } catch (e) {
      data = null; // fallback if no JSON
    }

    return { ok: response.ok, status: response.status, data };
  };


  const handleAdd = async () => {
    const people = s.split(",").map(p => p.trim()).filter(p => p);
    if (title === "" || people.length === 0) {
      alert("Fill the inputs");
      return;
    }
    setParticipants(people);

    const groupData = {
      title,
      participants: people,
      createdAt: new Date().toISOString(),
    };

    try {
      const result = await fetchWithAuth("http://localhost:5000/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupData),
      });

      if (result.ok && result.data && result.data._id) {
        // ✅ Group created successfully
        navigate("/home");
      } else {
        console.error("Failed to create group:", result);
        alert(result?.data?.error || "Failed to create group");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Something went wrong while creating group");
    }
  };




  return (
    <div className={styles.main}>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.msg}>Enter Info</div>
        <div className={styles.info}>
          <div className={styles.title}>
            Enter Title
            <br />
            <input type="text" onChange={handletitle} />
          </div>
          <div className={styles.participants}>
            Add participants
            <br />
            <input type="paragraph" onChange={handlepeople} />
          </div>
          <button onClick={handleAdd}>Add</button>
        </div>
      </div>
    </div>
  );
};

export default New;
