import Navbar from "./Navbar";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./New.module.css";
import { fetchWithAuth } from "../utils/fetchWithAuth.js";

const New = () => {
  const [title, setTitle] = useState("");
  const [participants, setParticipants] = useState("");
  const navigate = useNavigate();

  const handleAdd = async () => {
    const people = participants
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    if (!title || people.length === 0) {
      alert("Please fill in all fields.");
      return;
    }

    const groupData = { title, participants: people };

    try {
      const data = await fetchWithAuth("http://localhost:5000/api/groups", {
        method: "POST",
        body: JSON.stringify(groupData),
      });

      if (data?._id || data?.id) {
        navigate("/home");
      } else {
        alert(data?.error || "Failed to create group");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong while creating group");
    }
  };

  return (
    <div className={styles.main}>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.msg}>Create New Group</h2>
          <div className={styles.info}>
            <label>
              Group Title
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Music Lovers" />
            </label>
            <label>
              Add Participants (comma-separated)
              <input type="text" value={participants} onChange={(e) => setParticipants(e.target.value)} placeholder="e.g. user1, user2, user3" />
            </label>
            <button onClick={handleAdd}>Create</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default New;
