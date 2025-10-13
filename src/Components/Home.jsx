import { useEffect } from "react";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";
import styles from "./home.module.css";
import group from "../assets/group.svg";
import add from "../assets/add.svg";

const Home = () => {
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const user = localStorage.getItem("user");
    if (!token || !user) navigate("/login");
  }, [navigate]);

  const handleCreate = () => navigate("/New");
  const handleGroups = () => navigate("/Groups");

  return (
    <div className={styles.main}>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.create} onClick={handleCreate}>
          <div className={styles.img}><img src={add} alt="Create" /></div>
          <div className={styles.info}>Create Bill</div>
        </div>

        <div className={styles.groups} onClick={handleGroups}>
          <div className={styles.img}><img src={group} alt="Groups" /></div>
          <div className={styles.info}>View Groups</div>
        </div>
      </div>
    </div>
  );
};

export default Home;
