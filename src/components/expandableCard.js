import React, { useState, useEffect, useMemo } from 'react';
import '../styles/card.css'; 
import Pagination from './Pagination';
import { DateTime } from 'luxon';
import gameData from '../gameData/data.json'; 

const ExpandableCard = ({ user, bets, results }) => {
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // GRUPOWANIE ZAKŁADÓW WEDŁUG UNIKALNYCH DAT Z GAMEDATA
  const groupedBetsByDate = useMemo(() => {
    const betsWithDates = Object.keys(bets).map((key) => {
      const game = gameData.find(g => g.id === parseInt(key, 10));
      return {
        id: key,
        ...bets[key],
        date: game ? game.date : 'Unknown'
      };
    });

    const uniqueDates = [...new Set(betsWithDates.map(b => b.date))]
      .filter(d => d !== 'Unknown')
      .sort((a, b) => DateTime.fromISO(a).milliseconds - DateTime.fromISO(b).milliseconds);

    return uniqueDates.map((date) => {
      return betsWithDates.filter(b => b.date === date);
    });
  }, [bets]);

  const totalDays = groupedBetsByDate.length;

  // Automatyczne ustawienie na aktualny dzień turnieju
  useEffect(() => {
    if (totalDays > 0) {
      const now = new Date();
      const nextGame = gameData.find(game => new Date(`${game.date}T${game.kickoff}:00+02:00`) > now);
      if (nextGame) {
        const targetIndex = groupedBetsByDate.findIndex(day => day[0]?.date === nextGame.date);
        setCurrentDayIndex(targetIndex !== -1 ? targetIndex : 0);
      } else {
        setCurrentDayIndex(0);
      }
    }
  }, [totalDays, groupedBetsByDate]);

  // SMART TIMER: Śledzi odliczanie kłódek dla wybranego Dnia
  useEffect(() => {
    if (!expanded || !groupedBetsByDate[currentDayIndex]) return;

    const timers = [];
    groupedBetsByDate[currentDayIndex].forEach((bet) => {
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
  }, [expanded, currentDayIndex, groupedBetsByDate, refreshTrigger]); 

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

  // Ładny polski nagłówek daty pod paginacją
  const currentFormattedDate = useMemo(() => {
    const currentDayMatches = groupedBetsByDate[currentDayIndex];
    if (!currentDayMatches || currentDayMatches.length === 0) return '';
    return DateTime.fromISO(currentDayMatches[0].date).setLocale('pl').toFormat('cccc, dd.MM');
  }, [groupedBetsByDate, currentDayIndex]);

  return (
    <div className="paper-card" style={{ backgroundColor: 'white', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
      <h4 className="header-style" onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer' }}>
        {user} {expanded ? '-' : '+'}
      </h4>

      {expanded && (
        <div className="card-content">
          <Pagination
            currentPage={currentDayIndex}
            totalPages={totalDays}
            onPageChange={(page) => setCurrentDayIndex(page)}
            label="Dzień"
          />

          <div style={{ textAlign: 'center', fontWeight: 'bold', margin: '5px 0', fontSize: '11px', color: '#555' }}>
            {currentFormattedDate}
          </div>

          {groupedBetsByDate[currentDayIndex]?.map((bet) => {
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
          <hr />
        </div>
      )}
    </div>
  );
};

export default ExpandableCard;
