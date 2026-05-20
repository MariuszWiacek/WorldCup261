import React, { useState, useEffect, useMemo } from 'react';
import '../styles/card.css'; 
import Pagination from './Pagination';
import { DateTime } from 'luxon';
import gameData from '../gameData/data.json'; 

const ExpandableCard = ({ user, bets, results }) => {
  const [currentKolejka, setCurrentKolejka] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 1. GRUPOWANIE TYPÓW UŻYTKOWNIKA NA 3 TYGODNIE (Zgodnie z ID meczów)
  const groupedBets = useMemo(() => {
    const weeks = [[], [], []]; // 3 puste "koszyki" na 3 tygodnie

    Object.keys(bets).forEach((key) => {
      const betID = parseInt(key, 10);
      let weekIndex = 0;

      // Logika identyczna jak w bets.js
      if (betID <= 24) weekIndex = 0;
      else if (betID <= 48) weekIndex = 1;
      else weekIndex = 2;

      weeks[weekIndex].push({ id: key, ...bets[key] });
    });
    return weeks;
  }, [bets]);

  const totalKolejkas = groupedBets.length; // Zawsze będzie 3

  // Ustawia kartę na aktualnym tygodniu (domyślnie ostatnim aktywnym)
  useEffect(() => {
    if (totalKolejkas > 0) {
      // Wykrywamy aktualny tydzień na podstawie czasu, podobnie jak w bets.js
      const now = new Date();
      const nextGameIndex = gameData.findIndex(game => new Date(`${game.date}T${game.kickoff}:00+02:00`) > now);
      
      if (nextGameIndex !== -1) {
        const nextGameId = gameData[nextGameIndex].id;
        if (nextGameId <= 24) setCurrentKolejka(0);
        else if (nextGameId <= 48) setCurrentKolejka(1);
        else setCurrentKolejka(2);
      } else {
        setCurrentKolejka(0);
      }
    }
  }, [totalKolejkas]);

  // SMART TIMER: Monitoruje tylko mecze w wybranym Tygodniu
  useEffect(() => {
    if (!expanded || !groupedBets[currentKolejka]) return;

    const timers = [];
    groupedBets[currentKolejka].forEach((bet) => {
      const game = gameData.find(g => g.id === parseInt(bet.id));
      if (game) {
        const now = DateTime.now().setZone('Europe/Warsaw');
        const kickoff = DateTime.fromISO(`${game.date}T${game.kickoff}:00`, { zone: 'Europe/Warsaw' });
        const msUntilKickoff = kickoff.diff(now).milliseconds;

        if (msUntilKickoff > 0) {
          const timer = setTimeout(() => {
            setRefreshTrigger(prev => prev + 1);
          }, msUntilKickoff + 500); 
          timers.push(timer);
        }
      }
    });

    return () => timers.forEach(clearTimeout);
  }, [expanded, currentKolejka, groupedBets, refreshTrigger]); 

  const hasGameStarted = (betId) => {
    const game = gameData.find(g => g.id === parseInt(betId));
    if (!game) return false;
    const now = DateTime.now().setZone('Europe/Warsaw');
    const kickoff = DateTime.fromISO(`${game.date}T${game.kickoff}:00`, { zone: 'Europe/Warsaw' });
    return now >= kickoff;
  };

  const getTypeFromResult = (result) => {
    if (!result) return null;
    const [homeScore, awayScore] = result.split(':');
    if (homeScore === awayScore) return 'X';
    return homeScore > awayScore ? '1' : '2';
  };

  return (
    <div className="paper-card" style={{ backgroundColor: 'white', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
      <h4 className="header-style" onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer' }}>
        {user} {expanded ? '-' : '+'}
      </h4>

      {expanded && (
        <div className="card-content">
          <Pagination
            currentPage={currentKolejka}
            totalPages={totalKolejkas}
            onPageChange={(page) => setCurrentKolejka(page)}
            label="Tydzień"
          />

          {groupedBets[currentKolejka]?.map((bet) => {
            const isCurrentlyHidden = bet.isHidden && !hasGameStarted(bet.id);

            return (
              <div key={bet.id} style={{ marginBottom: '5px' }}>
                <div style={{ fontSize: '10px' }}>
                  <span style={{ color: 'black' }}>{bet.home} vs. </span>
                  <span style={{ color: 'black' }}>{bet.away} |{' '}</span>
                  
                  {isCurrentlyHidden ? (
                    <>
                      <span style={{ color: 'green' }}>Typ: [ 🔒 ]</span> |{' '}
                      <span style={{ color: 'green' }}>[ 🔒 ]</span>
                    </>
                  ) : (
                    <>
                      <span style={{ color: 'blue' }}>Typ: [ {bet.bet} ]</span> |{' '}
                      <span style={{ color: 'black' }}>{bet.score}</span>
                    </>
                  )}

                  <span className="results-style"> Wynik: </span>
                  <span style={{ color: 'black' }}>{results[bet.id]}</span>
                  
                  {!isCurrentlyHidden && bet.score === results[bet.id] && <span className="correct-score">✅</span>}
                  {!isCurrentlyHidden && getTypeFromResult(results[bet.id]) === bet.bet && <span className="correct-type">☑️</span>}
                </div>
              </div>
            );
          })}
          
          {/* Informacja, jeśli użytkownik nie ma typów w danym tygodniu */}
          {groupedBets[currentKolejka].length === 0 && (
            <div style={{ fontSize: '10px', color: 'grey', textAlign: 'center', padding: '10px' }}>
              Brak typów na ten tydzień.
            </div>
          )}
          <hr />
        </div>
      )}
    </div>
  );
};

export default ExpandableCard;
