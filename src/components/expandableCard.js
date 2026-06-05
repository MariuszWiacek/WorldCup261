import React, { useState, useEffect, useMemo } from 'react';
import '../styles/card.css'; 
import Pagination from './Pagination';
import { DateTime } from 'luxon';
import gameData from '../gameData/data.json'; 

const ExpandableCard = ({ user, bets, results }) => {
  const [currentKolejkaIndex, setCurrentKolejkaIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // GRUPOWANIE ZAKŁADÓW WEDŁUG KOLEJEK (ZGODNIE Z PROJEKTEM GLÓWNYM)
  const groupedBetsByKolejka = useMemo(() => {
    const betsWithDetails = Object.keys(bets).map((key) => {
      const game = gameData.find(g => g.id === parseInt(key, 10));
      return {
        id: key,
        ...bets[key],
        gameId: game ? game.id : 999 // fallback
      };
    });

    const kolejka1 = betsWithDetails.filter(b => b.gameId <= 24);
    const kolejka2 = betsWithDetails.filter(b => b.gameId > 24 && b.gameId <= 48);
    const kolejka3 = betsWithDetails.filter(b => b.gameId > 48 && b.gameId <= 72);
    const fazaPucharowa = betsWithDetails.filter(b => b.gameId > 72);

    return [
      { label: "Kolejka 1", games: kolejka1 },
      { label: "Kolejka 2", games: kolejka2 },
      { label: "Kolejka 3", games: kolejka3 },
      { label: "Faza pucharowa", games: fazaPucharowa }
    ];
  }, [bets]);

  // Automatyczne ustawienie na aktualną/najbliższą aktywną kolejkę turnieju
  useEffect(() => {
    const now = DateTime.now().setZone('Europe/Warsaw');
    let targetIndex = 0;

    for (let i = 0; i < groupedBetsByKolejka.length; i++) {
      const tabGames = groupedBetsByKolejka[i].games;
      
      const hasActiveMatches = tabGames.some(bet => {
        const game = gameData.find(g => g.id === parseInt(bet.id));
        if (!game) return false;
        const kickoff = DateTime.fromISO(`${game.date}T${game.kickoff}:00`, { zone: 'Europe/Warsaw' });
        const minutesSinceKickoff = now.diff(kickoff, 'minutes').minutes;
        return minutesSinceKickoff < 150; // Mecz się jeszcze nie skończył lub nie zaczął
      });

      if (hasActiveMatches) {
        targetIndex = i;
        break;
      }

      if (i === groupedBetsByKolejka.length - 1) {
        targetIndex = i;
      }
    }
    setCurrentKolejkaIndex(targetIndex);
  }, [groupedBetsByKolejka]);

  // SMART TIMER: Śledzi odliczanie kłódek dla wybranej kolejki
  useEffect(() => {
    if (!expanded || !groupedBetsByKolejka[currentKolejkaIndex]) return;

    const timers = [];
    groupedBetsByKolejka[currentKolejkaIndex].games.forEach((bet) => {
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
  }, [expanded, currentKolejkaIndex, groupedBetsByKolejka, refreshTrigger]); 

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

  const activeGroup = groupedBetsByKolejka[currentKolejkaIndex] || { label: '', games: [] };

  return (
    <div className="paper-card" style={{ backgroundColor: 'white', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
      <h4 className="header-style" onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer' }}>
        {user} {expanded ? '-' : '+'}
      </h4>

      {expanded && (
        <div className="card-content">
          <Pagination
            currentPage={currentKolejkaIndex}
            totalPages={groupedBetsByKolejka.length}
            onPageChange={(page) => setCurrentKolejkaIndex(page)}
            label={activeGroup.label}
          />

          {activeGroup.games.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'gray', padding: '10px', fontSize: '12px' }}>
              Brak typów dla tej sekcji.
            </div>
          ) : (
            activeGroup.games.map((bet) => {
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
            })
          )}
          <hr />
        </div>
      )}
    </div>
  );
};

export default ExpandableCard;