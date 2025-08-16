import styles from './navbar.module.css';
import logo from '../assets/Logo2.svg';

const Navbar = () => {
  return (
    <div className={styles.header}>
      <div className={styles.top}>
        <div className={styles.logo}>
          <img src={logo} alt="Logo" />
        </div>
        <div className={styles.links}>
          <a href="">Home</a>
          <a href="">About</a>
          <a href="">Search</a>
          <a href="">Menu</a>
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
  );
};

export default Navbar;
