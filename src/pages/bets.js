import React, { useState, useEffect, useMemo } from 'react';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import usersData from '../gameData/users.json';
import gameData from '../gameData/data.json';
import teamsData from '../gameData/teams.json';
import { getAuth } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import ExpandableCard from '../components/expandableCard';
import Pagination from '../components/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { DateTime } from 'luxon';
import InstallPWAButton from '../components/PWA';
import Flag from 'react-world-flags';

const firebaseConfig = {
  apiKey: "AIzaSyBnSIOvM6OkqRqujx_kDWzo8RhFBPS7aVw",
  authDomain: "wc2026-396b7.firebaseapp.com",
  databaseURL: "https://wc2026-396b7-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "wc2026-396b7",
  storageBucket: "wc2026-396b7.firebasestorage.app",
  messagingSenderId: "723842578362",
  appId: "1:723842578362:web:3e5e7f8fce7c2015168f83",
  measurementId: "G-KLLLNCET00"
};

if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}
const auth = getAuth();
const database = getDatabase();

const isFrozenGame = (gameId) => gameId >= 12 && gameId <= 18;

const Bets = () => {
  const [allGames, setAllGames] = useState(gameData);
  const [currentTab, setCurrentTab] = useState(1); // Domyślnie otwiera na 1 (Bieżące)
  const [selectedUser, setSelectedUser] = useState('');
  const [submittedData, setSubmittedData] = useState({});
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);
  const [results, setResults] = useState({});
  const [areInputsEditable, setAreInputsEditable] = useState(true);
  const [isHiddenActive, setIsHiddenActive] = useState(false);

  const [modalConfig, setModalConfig] = useState({
    show: false,
    title: "",
    message: "",
    type: "info"
  });

  // DYNAMICZNY PODZIAŁ: ZAKOŃCZONE DO ARCHIWUM, MAX 10 NASTĘPNYCH NA BIEŻĄCE
  const tabsData = useMemo(() => {
    const now = DateTime.now().setZone('Europe/Warsaw');

    // 1. Szukamy meczów, które jeszcze się nie zaczęły LUB trwają (mniej niż 2.5h od startu)
    const activeCandidates = allGames.filter((game) => {
      const kickoff = DateTime.fromISO(`${game.date}T${game.kickoff}:00`, { zone: 'Europe/Warsaw' });
      const hoursSinceKickoff = now.diff(kickoff, 'hours').hours;

      return hoursSinceKickoff < 2.5; 
    }).sort((a, b) => a.id - b.id);

    // 2. Ścisły limit na stronie głównej: dokładnie 10 najbliższych meczów
    const currentActiveGames = activeCandidates.slice(0, 10);

    // 3. ARCHIWUM: Wszystko co ma mniejsze ID niż najwcześniejszy mecz z zakładki "Bieżące"
    const firstActiveId = currentActiveGames[0]?.id || 999;
    const archiveGames = allGames.filter(g => g.id < firstActiveId).sort((a, b) => a.id - b.id);

    return [
      { id: 0, label: "Archiwum", games: archiveGames },
      { id: 1, label: "Bieżące", games: currentActiveGames }
    ];
  }, [allGames]);

  // Cykliczny sprawdzacz czasu – co minutę odświeża i przesuwa mecze z "Bieżące" do "Archiwum"
  useEffect(() => {
    const timer = setInterval(() => {
      setAllGames([...gameData]); 
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const lastChosenUser = localStorage.getItem('selectedUser');
    if (lastChosenUser) setSelectedUser(lastChosenUser);
    auth.onAuthStateChanged((user) => { if (user) setSelectedUser(user.displayName); });
    onValue(ref(database, 'submittedData'), (snapshot) => {
      const data = snapshot.val();
      if (data) { setSubmittedData(data); setIsDataSubmitted(true); }
    });
    onValue(ref(database, 'results'), (snapshot) => {
      const data = snapshot.val();
      if (data) setResults(data);
    });
  }, []);

  const isReadOnly = (user, gameId) => submittedData[user] && submittedData[user][gameId];

  const gameStarted = (gameDate, gameKickoff) => {
    const now = DateTime.now().setZone('Europe/Warsaw');
    const kickoff = DateTime.fromISO(`${gameDate}T${gameKickoff}:00`, { zone: 'Europe/Warsaw' });
    return now >= kickoff;
  };

  const autoDetectBetType = (score) => {
    const [home, away] = score.split(':').map(Number);
    if (home === away) return 'X';
    return home > away ? '1' : '2';
  };

  const handleScoreChange = (gameId, scoreInput) => {
    if (isFrozenGame(gameId)) return;
    const cleaned = scoreInput.replace(/[^0-9:]/g, '');
    const formatted = cleaned.replace(/^(?:(\d))([^:]*$)/, '$1:$2');
    
    setAllGames(prev => prev.map(game => game.id === gameId ? { ...game, score: formatted, bet: autoDetectBetType(formatted) } : game));
  };

  const handleSubmit = () => {
    if (!selectedUser) {
      setModalConfig({ show: true, title: "Brak użytkownika", message: "Proszę wybrać użytkownika przed wysłaniem zakładów.", type: "info" });
      return;
    }

    const userSubmittedBets = submittedData[selectedUser] || {};
    const currentGames = tabsData[currentTab].games;
    
    const newBetsToSubmit = currentGames.reduce((acc, game) => {
      if (game.score && !userSubmittedBets[game.id] && !isFrozenGame(game.id)) {
        acc[game.id] = {
          home: game.home, away: game.away, score: game.score,
          bet: autoDetectBetType(game.score), kolejkaId: Math.floor(game.id / 9) + 1,
          isHidden: isHiddenActive 
        };
      }
      return acc;
    }, {});

    if (Object.keys(newBetsToSubmit).length === 0) {
      setModalConfig({ show: true, message: "Wszystkie zakłady zostały już przesłane lub gry są zablokowane.", type: "info" });
      return;
    }

    update(ref(database, `submittedData/${selectedUser}`), newBetsToSubmit)
      .then(() => {
        setModalConfig({ show: true, message: "Zakłady zostały pomyślnie przesłane!", type: "success" });
      })
      .catch((error) => {
        console.error('Błąd:', error);
        setModalConfig({ show: true, title: "Błąd", message: "Nie udało się zapisać danych.", type: "error" });
      });
  };

  const getTeamLogo = (name) => teamsData[name]?.logo || null;
  const toggleEditableOff = () => setAreInputsEditable(false);
  const toggleEditableOn = () => setAreInputsEditable(true);

  const modalOverlayStyle = {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999
  };
  const modalStyle = {
    background: "#015f01a9", padding: "25px", borderRadius: "20px", width: "85%", maxWidth: "350px", textAlign: "center", color: "red"
  };
  const modalButtonStyle = {
    backgroundColor: "#DC3545", color: "white", border: "none", padding: "10px 30px", borderRadius: "15px", fontWeight: "bold", marginTop: "15px", cursor: "pointer"
  };

  const flagStyle = {
    width: '32px', height: '22px', verticalAlign: 'middle', marginRight: '8px', marginLeft: '8px', display: 'inline-block', borderRadius: '3px', boxShadow: '0px 1px 3px rgba(0,0,0,0.3)', objectFit: 'cover'
  };

  return (
    <div className="fade-in" style={{ textAlign: 'center', color: 'yellow' }}>
      {modalConfig.show && (
        <div style={modalOverlayStyle} onClick={() => setModalConfig({...modalConfig, show: false})}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: modalConfig.type === 'success' ? '#28a745' : '#333', marginTop: 0 }}>{modalConfig.title}</h2>
            <p style={{ fontSize: "16px", lineHeight: "1.4" }}>{modalConfig.message}</p>
            <button style={modalButtonStyle} onClick={() => setModalConfig({...modalConfig, show: false})}>OK</button>
          </div>
        </div>
      )}

      <FontAwesomeIcon icon={faUser} style={{ marginRight: '8px', fontSize: '14px', color: 'yellow' }} />
      <select
        style={{ margin: '1px', backgroundColor: 'pink', fontWeight: 'bold', fontFamily: 'Rubik' }}
        value={selectedUser}
        onChange={(e) => { setSelectedUser(e.target.value); localStorage.setItem('selectedUser', e.target.value); }}
      >
        {Object.keys(usersData).map((user) => (<option key={user} value={user}>{user}</option>))}
      </select>
      

      <div style={{ backgroundColor: '#212529ab', color: 'aliceblue', padding: '20px', textAlign: 'center', marginBottom: '10px', marginTop: '5%' }}>
        
        {/* Kontrola zakładek przez istniejący komponent Pagination */}
        <Pagination 
          currentPage={currentTab} 
          totalPages={2} 
          onPageChange={(page) => setCurrentTab(page)} 
          label={currentTab === 1 ? "Widok: Bieżące" : "Widok: Archiwum"} 
        />
        
        {tabsData[currentTab].games.length === 0 ? (
          <div style={{ padding: '20px', color: 'gold' }}>Brak meczów w tej sekcji.</div>
        ) : (
          <table style={{ width: '100%', border: '0.5px solid #444', borderCollapse: 'collapse', marginTop: '5%' }}>
            <thead>
              <tr>
                <th style={{ borderBottom: '0.5px solid #444' }}></th>
                <th style={{ borderBottom: '0.5px solid #444' }}>Gospodarz</th>
                <th style={{ borderBottom: '0.5px solid #444' }}></th>
                <th style={{ borderBottom: '0.5px solid #444' }}>Gość</th>
                <th style={{ borderBottom: '0.5px solid #444' }}>Wynik</th>
                <th style={{ borderBottom: '0.5px solid #444' }}>1X2</th>
                <th style={{ borderBottom: '0.5px solid #444' }}>Typ</th>
              </tr>
            </thead>
            <tbody>
              {tabsData[currentTab].games.map((game, index) => (
                <React.Fragment key={index}>
                  <tr style={{ opacity: game.disabled || isFrozenGame(game.id) ? '0.5' : '1', backgroundColor: gameStarted(game.date, game.kickoff) ? '#214029ab' : 'transparent' }}>
                    <td colSpan="12" className="date" style={{ textAlign: 'left', color: 'gold', fontSize: '10px', paddingLeft: '10%' }}>
                      &nbsp;&nbsp;&nbsp; {game.date} &nbsp;&nbsp;&nbsp; {game.kickoff} &nbsp;&nbsp;&nbsp; {game.message} {isFrozenGame(game.id) ? '🔒 ZAMROŻONE' : ''}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #444', opacity: game.disabled || isFrozenGame(game.id) ? '0.5' : '1', backgroundColor: gameStarted(game.date, game.kickoff) ? '#214029ab' : 'transparent' }}>
                    <td><p style={{ color: 'grey' }}>{game.id}.</p></td>
                    
                    <td style={{ textAlign: 'center', paddingRight: '10px', fontSize: '20px' }}>
                      <Flag code={getTeamLogo(game.home)} style={flagStyle} fallback={<span>🏳️ </span>} />
                      {game.home}
                    </td>
                    
                    <td style={{ textAlign: 'center', fontSize: '20px' }}>-</td>
                    
                    <td style={{ textAlign: 'left', paddingLeft: '10px', fontSize: '20px' }}>
                      <Flag code={getTeamLogo(game.away)} style={flagStyle} fallback={<span>🏳️ </span>} />
                      {game.away}
                    </td>
                    
                    <td style={{ textAlign: 'center', fontSize: '20px' }}>{results[game.id]}</td>
                    <td style={{ textAlign: 'center' }}>
                      <select value={game.bet || ''} disabled>
                        <option value="1">1</option><option value="X">X</option><option value="2">2</option>
                      </select>
                    </td>
                    <td>
                      <input
                        style={{ 
                          width: '50px', 
                          backgroundColor: isFrozenGame(game.id) ? '#ddd' : game.score ? isReadOnly(selectedUser, game.id) ? 'transparent' : 'white' : 'white', 
                          color: 'red' 
                        }}
                        type="text"
                        placeholder={isReadOnly(selectedUser, game.id) ? '✔️' : 'x:x'}
                        value={game.score || ''}
                        onChange={(e) => handleScoreChange(game.id, e.target.value)}
                        maxLength="3"
                        readOnly={areInputsEditable && isReadOnly(selectedUser, game.id)}
                        disabled={areInputsEditable && (gameStarted(game.date, game.kickoff) || isFrozenGame(game.id))}
                      />
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}

        {currentTab === 1 && (
          <>
            <div style={{ marginTop: '15px' }}>
              <label style={{ color: 'white', fontSize: '12px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={isHiddenActive} 
                  onChange={(e) => setIsHiddenActive(e.target.checked)} 
                  style={{ marginRight: '5px' }}
                />
                Ukryj moje typy 🔒
              </label>
            </div>

            <button 
              style={{ backgroundColor: '#DC3545', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'inline-block', margin: '10px', fontSize: '14px', width: '60%' }} 
              onClick={handleSubmit}
            >
              Prześlij {isHiddenActive ? '🔒' : ''}
            </button>
          </>
        )}

        {isDataSubmitted && Object.keys(submittedData).map((user) => (
          <ExpandableCard key={user} user={user} bets={submittedData[user]} results={results} />
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button style={{ backgroundColor: '#28a745', color: 'white', padding: '10px 1px', border: 'none', borderRadius: '5px', marginRight: '10px', cursor: 'pointer' }} onClick={toggleEditableOff}>..</button>
        <button style={{ backgroundColor: '#007bff', color: 'white', padding: '10px 1px', border: 'none', borderRadius: '5px', cursor: 'pointer' }} onClick={toggleEditableOn}>..</button>
      </div>
      
      <InstallPWAButton />
    </div>
  );
};

export default Bets;
