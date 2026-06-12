import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { faHome, faTableList, faFutbol, faComments } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from 'firebase/database';
import Chatbox from '../pages/chatbox'; 

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCGD41f7YT-UQyGZ7d1GzzB19B9wDNbg58",
  authDomain: "guestbook-73dfc.firebaseapp.com",
  databaseURL: "https://guestbook-73dfc-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "guestbook-73dfc",
  storageBucket: "guestbook-73dfc.appspot.com",
  messagingSenderId: "674344514507",
  appId: "1:674344514507:web:fc587317fa516369a3bc4e",
  measurementId: "G-1TZ4B0BK9D"
};

// Initialize Firebase outside to prevent multi-instance memory leaks
const secondaryApp = initializeApp(firebaseConfig, 'navbar-firebase');
const db = getDatabase(secondaryApp);

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isChatboxOpen, setIsChatboxOpen] = useState(false);
  
  // Track unread status globally in Navbar
  const [unreadCount, setUnreadCount] = useState(0);
  const totalMessagesRef = useRef(0);
  const isFirstLoad = useRef(true);

  // Monitor Window Scroll
  useEffect(() => {
    const handleScroll = () => setScrollPosition(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen for Live Messages to Update Unread Badge Count
  useEffect(() => {
    const entriesRef = ref(db, 'guestbookEntries');
    
    const unsubscribe = onValue(entriesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const currentTotal = data ? Object.keys(data).length : 0;

        if (isFirstLoad.current) {
          totalMessagesRef.current = currentTotal;
          isFirstLoad.current = false;
        } else if (!isChatboxOpen) {
          // If chat is closed and new messages came in, increment badge
          const newMessagesCount = currentTotal - totalMessagesRef.current;
          if (newMessagesCount > 0) {
            setUnreadCount(prev => prev + newMessagesCount);
          }
          totalMessagesRef.current = currentTotal;
        } else {
          // If chat is open, just keep the total synced without bumping unread
          totalMessagesRef.current = currentTotal;
        }
      }
    });

    return () => unsubscribe();
  }, [isChatboxOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);
  
  const toggleChatbox = () => {
    setIsChatboxOpen(prev => {
      if (!prev) setUnreadCount(0); // Clear unread count when opening
      return !prev;
    });
  };

  const menuClass = isMenuOpen ? 'collapse navbar-collapse show' : 'collapse navbar-collapse';

  // --- Inline Styles Stylesheet ---
  const styles = {
    navbar: {
      position: 'fixed',
      top: 0,
      width: '100%',
      background: scrollPosition > 0 ? '#0A0F2C' : 'black',
      zIndex: 1000,
      transition: 'background-color 0.3s ease',
    },
    brand: {
      display: 'flex',
      alignItems: 'center',
      textDecoration: 'none',
      fontSize: '24px',
      fontWeight: 'bold',
      color: scrollPosition > 0 ? 'orange' : 'black',
      transition: 'color 0.3s ease',
    },
    links: {
      marginLeft: 'auto',
      fontWeight: '700',
    },
    messageContainer: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      height: '50px',
      backgroundColor: 'black',
      zIndex: 999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      boxSizing: 'border-box'
    },
    toggleButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      color: 'aliceblue',
      fontSize: '16px',
      fontWeight: 'bold',
      position: 'relative', // Context for badge placement
    },
    icon: {
      color: '#0274ff',
      fontSize: '20px'
    },
    navBadge: {
      position: 'absolute',
      top: '-8px',
      right: '-10px',
      backgroundColor: '#ff3b30',
      color: 'white',
      fontSize: '11px',
      borderRadius: '10px',
      padding: '2px 6px',
      fontWeight: 'bold',
      boxShadow: '0 0 4px rgba(0,0,0,0.5)'
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light navbar-white" style={styles.navbar}>
        <div className="container">
          <motion.div
            key="superliga"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 10, duration: 1.5 }}
          >
            <Link to="/" className="navbar-brand" style={styles.brand}>
              <h5 className="glossy-text">EKSTRABET.</h5>
            </Link>
          </motion.div>

          <button className={`navbar-toggler ${isMenuOpen ? 'open' : ''}`} type="button" onClick={toggleMenu}>
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
          
          <div className={menuClass} id="navbarNav">
            <ul className="navbar-nav" style={styles.links}>
              {['bets', 'table', 'results', 'stats', 'rules', 'history', 'admin'].map((route) => (
                <li className="nav-item" key={route}>
                  <Link to={`/${route}`} className="nav-link" onClick={closeMenu}>
                    {route.charAt(0).toUpperCase() + route.slice(1)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>

      {/* Footer Navigation Bar */}
      <div style={styles.messageContainer}>
        <Link to="/"><FontAwesomeIcon icon={faHome} style={styles.icon} /></Link>
        <Link to="/bets"><FontAwesomeIcon icon={faFutbol} style={styles.icon} /></Link>
        <Link to="/table"><FontAwesomeIcon icon={faTableList} style={styles.icon} /></Link>
        
        {/* Chatbox Button with Badge Counter */}
        <button onClick={toggleChatbox} style={styles.toggleButton}>
          <h5 style={{ color: 'aliceblue', marginRight: '8px', marginBottom: 0 }}>chatbox</h5>
          <FontAwesomeIcon icon={faComments} style={styles.icon} />
          {!isChatboxOpen && unreadCount > 0 && (
            <span style={styles.navBadge}>{unreadCount}</span>
          )}
        </button>
      </div>

      {/* Render Chatbox Exactly Once */}
      <Chatbox isOpen={isChatboxOpen} toggleChatbox={toggleChatbox} externalUnreadCount={unreadCount} />
    </>
  );
};

export default Navbar;
