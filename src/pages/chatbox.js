import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue } from 'firebase/database';
import '../styles/guestbook.css';

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

// INITIALIZE OUTSIDE COMPONENT - Prevents re-initialization loops on every render
const secondaryApp = initializeApp(firebaseConfig, 'secondary');
const db = getDatabase(secondaryApp);

const Chatbox = ({ isOpen, toggleChatbox }) => {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [guestbookEntries, setGuestbookEntries] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const chatContainerRef = useRef(null);
  const isFirstLoad = useRef(true);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Reset unread count when chatbox opens
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      // Small timeout ensures DOM elements have rendered before scrolling
      setTimeout(scrollToBottom, 50);
    }
  }, [isOpen]);

  // Fetch entries from Firebase
  useEffect(() => {
    const entriesRef = ref(db, 'guestbookEntries');
    
    const unsubscribe = onValue(entriesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data) {
          // Firebase keys are sorted chronologically. Convert to array.
          const entries = Object.values(data); 
          
          // Track unread messages if chatbox is closed
          if (!isOpen && !isFirstLoad.current) {
            setUnreadCount(prev => prev + (entries.length - guestbookEntries.length));
          }
          
          setGuestbookEntries(entries);
          isFirstLoad.current = false;
          
          if (isOpen) {
            setTimeout(scrollToBottom, 50);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [isOpen, guestbookEntries.length]);

  // Listen to LocalStorage for Username changes
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem('selectedUser');
      setUsername(storedUser || '');
    };
  
    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
  
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const entriesRef = ref(db, 'guestbookEntries');
    const formattedDateAndTime = new Date().toISOString();

    push(entriesRef, {
      name: username || 'Anonim',
      message: message.trim(),
      dateAndTime: formattedDateAndTime,
    });

    localStorage.setItem('username', username);
    setMessage('');
  };

  return (
    <div style={{ ...styles.chatbox, bottom: isOpen ? '0' : '-440px', backgroundColor: isOpen ? '#1e1e1e' : '#fff' }}>
      
      {/* Header with Notification Badge */}
      <div style={styles.header} onClick={!isOpen ? toggleChatbox : undefined}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Chatbox</span>
          {!isOpen && unreadCount > 0 && (
            <span style={styles.badge}>{unreadCount}</span>
          )}
        </div>
        <button style={styles.closeButton} onClick={(e) => { e.stopPropagation(); toggleChatbox(); }}>
          {isOpen ? '✕' : '▲'}
        </button>
      </div>

      {/* Messages Container */}
      <div style={styles.messagesContainer} ref={chatContainerRef}>
        <div style={styles.messageList}>
          {guestbookEntries.map((entry, index) => (
            <div key={index} style={styles.messageWrapper}>
              <div style={styles.metaRow}>
                <span style={styles.username}>{entry.name || 'Anonim'}:</span>
                <span style={styles.dateTime}>
                  {new Date(entry.dateAndTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <div style={styles.messageContent}>{entry.message}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Użytkownik"
          value={username}
          readOnly
          required
          style={styles.inputDisabled}
        />
        <div style={styles.inputGroup}>
          <input
            type="text"
            placeholder="Napisz wiadomość..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            style={styles.inputMessage}
          />
          <button type="submit" style={styles.sendButton}>
            Wyślij
          </button>
        </div>
      </form>
    </div>
  );
};

// Modern, Scannable Styles Object
const styles = {
  chatbox: {
    position: 'fixed',
    right: '20px',
    width: '320px',
    height: '440px',
    boxShadow: '0px 8px 24px rgba(0,0,0,0.25)',
    borderRadius: '12px 12px 0 0',
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  },
  header: {
    backgroundColor: '#008131',
    color: 'white',
    padding: '14px',
    fontWeight: 'bold',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none'
  },
  badge: {
    backgroundColor: '#ff3b30',
    color: 'white',
    fontSize: '11px',
    borderRadius: '10px',
    padding: '2px 7px',
    fontWeight: 'bold',
    animation: 'pulse 1.5s infinite'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '4px'
  },
  messagesContainer: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#121212',
    overflowY: 'auto',
    scrollbarWidth: 'thin',
  },
  messageList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  messageWrapper: {
    backgroundColor: '#242424',
    padding: '8px 12px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    // FIXES HORIZONTAL SCROLL: forces long words/links to split up nicely
    wordBreak: 'break-word', 
    overflowWrap: 'anywhere' 
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline'
  },
  username: {
    color: '#4cd964',
    fontSize: '13px',
    fontWeight: '600'
  },
  dateTime: {
    color: '#8e8e93',
    fontSize: '10px'
  },
  messageContent: {
    color: '#f5f5f7',
    fontSize: '14px',
    lineHeight: '1.4'
  },
  form: {
    padding: '12px',
    backgroundColor: '#1e1e1e',
    borderTop: '1px solid #2c2c2e',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  inputDisabled: {
    width: '100%',
    padding: '6px 10px',
    backgroundColor: '#2c2c2e',
    border: 'none',
    borderRadius: '6px',
    color: '#aeaeae',
    fontSize: '12px',
    boxSizing: 'border-box'
  },
  inputGroup: {
    display: 'flex',
    gap: '6px'
  },
  inputMessage: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#2c2c2e',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px'
  },
  sendButton: {
    backgroundColor: '#008131',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '0 16px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '13px'
  }
};

export default Chatbox;
