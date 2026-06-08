import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { Row, Col, Container } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Firebase configuration
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

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Stats = () => {
  const [results, setResults] = useState({});
  const [submittedData, setSubmittedData] = useState({});
  const [generalStats, setGeneralStats] = useState({
    mostChosenCorrectScore: '',
    mostMatchedCorrectScore: '',
    mostChosenCorrectScoreCount: 0,
    mostMatchedCorrectScoreCount: 0,
    mostDraws: 0,
    userWithMostDraws: '',
    mostForgetfulUser: '',
    mostForgetfulCount: 0,
  });
  const [userStats, setUserStats] = useState([]);

  useEffect(() => {
    const resultsRef = ref(database, 'results');
    onValue(resultsRef, (snapshot) => {
      setResults(snapshot.val() || {});
    });

    const submittedDataRef = ref(database, 'submittedData');
    onValue(submittedDataRef, (snapshot) => {
      setSubmittedData(snapshot.val() || {});
    });
  }, []);

  useEffect(() => {
    if (!submittedData || !results) return;

    // 1. Group match IDs by day to map chronological progress (Max 104 matches)
    const matchDayMap = {};
    
    Object.entries(submittedData).forEach(([user, userBets]) => {
      Object.entries(userBets || {}).forEach(([matchId, bet]) => {
        // Safe mapping strategy: Grouping either via string date or artificial match blocks
        const matchDate = bet.date || `Dzień ${Math.ceil(parseInt(matchId.replace(/\D/g, '')) / 4) || 1}`;
        if (!matchDayMap[matchDate]) {
          matchDayMap[matchDate] = [];
        }
        if (!matchDayMap[matchDate].includes(matchId)) {
          matchDayMap[matchDate].push(matchId);
        }
      });
    });

    const chronologicalDays = Object.keys(matchDayMap).sort((a, b) => {
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

    const userStatsData = [];
    const scoreCount = {};
    const matchedScores = {};
    const drawCount = {};
    const emptyScoreCount = {};

    Object.keys(submittedData).forEach((user) => {
      const bets = submittedData[user] || {};
      const userStats = {
        user,
        chosenTeams: {},
        failureTeams: {},
        successTeams: {},
      };

      Object.entries(bets).forEach(([id, bet]) => {
        if (bet.score === ':::' || !bet.score) {
          emptyScoreCount[user] = (emptyScoreCount[user] || 0) + 1;
          return;
        }

        const result = results[id];
        if (!result || !bet.home || !bet.away || !bet.bet) return;

        const { home: homeTeam, away: awayTeam, bet: betOutcome, score: betScore } = bet;
        const [actualHomeScore, actualAwayScore] = result.split(':').map(Number);
        const actualOutcome = actualHomeScore === actualAwayScore ? 'X' : actualHomeScore > actualAwayScore ? '1' : '2';

        if (betOutcome !== 'X') {
          const chosenTeam = betOutcome === '1' ? homeTeam : awayTeam;
          userStats.chosenTeams[chosenTeam] = (userStats.chosenTeams[chosenTeam] || 0) + 1;
          if (actualOutcome === betOutcome) {
            userStats.successTeams[chosenTeam] = (userStats.successTeams[chosenTeam] || 0) + 1;
          } else {
            userStats.failureTeams[chosenTeam] = (userStats.failureTeams[chosenTeam] || 0) + 1;
          }
        }

        if (actualOutcome === 'X' && betOutcome === 'X') {
          drawCount[user] = (drawCount[user] || 0) + 1;
        }

        scoreCount[betScore] = (scoreCount[betScore] || 0) + 1;
        if (betScore === result) {
          matchedScores[betScore] = (matchedScores[betScore] || 0) + 1;
        }
      });

      // 2. Map running points strictly without minus point conditions
      let runningTotalPoints = 0;
      const dailyPointsTimeline = [0]; // Baseline starts at zero
      const chartLabels = ['Start'];

      chronologicalDays.forEach((dayLabel) => {
        const matchIdsInDay = matchDayMap[dayLabel];
        
        matchIdsInDay.forEach((matchId) => {
          const bet = bets[matchId];
          const result = results[matchId];

          if (bet && result && bet.score !== ':::') {
            const [actualHomeScore, actualAwayScore] = result.split(':').map(Number);
            const [betHomeScore, betAwayScore] = bet.score.split(':').map(Number);
            const actualOutcome = actualHomeScore === actualAwayScore ? 'X' : actualHomeScore > actualAwayScore ? '1' : '2';

            let pointsEarned = 0;
            // 3 for exact score, 1 for outcome match
            if (betHomeScore === actualHomeScore && betAwayScore === actualAwayScore) {
              pointsEarned = 3;
            } else if (bet.bet === actualOutcome) {
              pointsEarned = 1;
            }
            runningTotalPoints += pointsEarned;
          }
        });

        dailyPointsTimeline.push(runningTotalPoints);
        const simplifiedLabel = dayLabel.replace('2026-', '');
        chartLabels.push(simplifiedLabel);
      });

      // Optimized configuration for small smartphone rendering viewports
      userStats.chartData = {
        labels: chartLabels,
        datasets: [
          {
            label: 'Suma punktów',
            data: dailyPointsTimeline,
            fill: true,
            borderColor: '#FFD700',
            backgroundColor: 'rgba(255, 215, 0, 0.04)',
            tension: 0.2,
            pointRadius: (context) => (context.chart.width < 500 ? 1 : 3), // Shrinks point dots on smaller screens
            pointHoverRadius: 6,
            borderWidth: 2,
          },
        ],
      };

      userStats.mostChosenTeams = findMostFrequent(userStats.chosenTeams);
      userStats.mostFailureTeams = findMostFrequent(userStats.failureTeams);
      userStats.mostSuccessTeams = findMostFrequent(userStats.successTeams);

      userStatsData.push(userStats);
    });

    const mostChosenCorrectScore = findMostFrequent(scoreCount);
    const mostMatchedCorrectScore = findMostFrequent(matchedScores);
    const maxDraws = Math.max(...Object.values(drawCount), 0);
    const userWithMostDraws = Object.keys(drawCount).find(user => drawCount[user] === maxDraws) || '------';

    const maxEmpty = Math.max(...Object.values(emptyScoreCount), 0);
    const mostForgetfulUser = Object.keys(emptyScoreCount).find(user => emptyScoreCount[user] === maxEmpty) || '------';

    setGeneralStats({
      mostChosenCorrectScore: mostChosenCorrectScore.length ? mostChosenCorrectScore[0] : '------',
      mostChosenCorrectScoreCount: mostChosenCorrectScore.length ? scoreCount[mostChosenCorrectScore[0]] : 0,
      mostMatchedCorrectScore: mostMatchedCorrectScore.length ? mostMatchedCorrectScore[0] : '------',
      mostMatchedCorrectScoreCount: mostMatchedCorrectScore.length ? matchedScores[mostMatchedCorrectScore[0]] : 0,
      mostDraws: maxDraws,
      userWithMostDraws: userWithMostDraws,
      mostForgetfulUser: mostForgetfulUser,
      mostForgetfulCount: maxEmpty,
    });

    setUserStats(userStatsData);
  }, [submittedData, results]);

  const findMostFrequent = (items) => {
    if (!items || Object.keys(items).length === 0) return [];
    const maxCount = Math.max(...Object.values(items), 0);
    if (maxCount === 0) return [];
    return Object.keys(items).filter(item => items[item] === maxCount);
  };

  return (
    <Container fluid style={{ backgroundColor: '#121212', minHeight: '100vh', padding: '12px', color: '#fff' }}>
      <Row>
        <Col xs={12}> 
          <div style={{ marginTop: '10px', color: '#FFD700', padding: '5px' }}>
            <h2 style={{ fontSize: '1.6rem' }}>🏆 Statystyki Ogólne</h2>
            <hr style={{ borderColor: '#FFD700' }} />
            <p style={{ fontSize: '0.95rem' }}><strong>💡 Najczęściej wybierany wynik: </strong> {generalStats.mostChosenCorrectScore} ({generalStats.mostChosenCorrectScoreCount} razy)</p>
            <p style={{ fontSize: '0.95rem' }}><strong>💥 Najczęściej trafiony wynik: </strong> {generalStats.mostMatchedCorrectScore} ({generalStats.mostMatchedCorrectScoreCount} razy)</p>
            <p style={{ fontSize: '0.95rem' }}><strong>🎯 Najwięcej trafionych remisów: </strong> {generalStats.mostDraws} <span style={{color: '#fff'}}>({generalStats.userWithMostDraws})</span></p>
            <p style={{ fontSize: '0.95rem' }}><strong>😵 Największy zapominalski: </strong> {generalStats.mostForgetfulUser} ({generalStats.mostForgetfulCount} pustych typów)</p>
          </div>
        </Col>
      </Row>

      <Row>
        <Col xs={12}> 
          <div style={{ marginTop: '20px', color: '#FFD700' }}>
            <h2 style={{ fontSize: '1.6rem', paddingLeft: '5px' }}>👤 Statystyki Użytkowników</h2>
            <hr style={{ borderColor: '#FFD700' }} /><br />
            
            {userStats.length > 0 ? userStats.map((stats, idx) => (
              <div key={idx} style={{ marginBottom: '25px', background: '#1e1e1e', padding: '14px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                <h3 style={{ color: '#FFF', fontSize: '1.3rem', marginBottom: '12px' }}>{stats.user}</h3>
                <p style={{ color: '#ccc', fontSize: '0.88rem', margin: '4px 0' }}><strong>⚽ Najczęstsze zespoły: </strong> {stats.mostChosenTeams.join(', ') || '------'}</p>
                <p style={{ color: '#ccc', fontSize: '0.88rem', margin: '4px 0' }}><strong>👎 Rozczarowania: </strong> {stats.mostFailureTeams.join(', ') || '------'}</p>
                <p style={{ color: '#ccc', fontSize: '0.88rem', margin: '4px 0' }}><strong>👍 Trafione wygrane: </strong> {stats.mostSuccessTeams.join(', ') || '------'}</p>

                {/* Mobile Responsive Chart Wrapper Container */}
                <div style={{ width: '100%', height: '240px', marginTop: '15px', padding: '6px', backgroundColor: '#161616', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
                  <Line 
                    data={stats.chartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'index',
                        intersect: false,
                      },
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: '#222',
                          titleColor: '#FFD700',
                          bodyColor: '#fff',
                          borderColor: '#444',
                          borderWidth: 1,
                          padding: 10,
                          callbacks: {
                            title: (context) => `Dzień: ${context[0].label}`,
                            label: (context) => ` Punkty: ${context.raw} pkt`
                          }
                        }
                      },
                      scales: {
                        x: { 
                          grid: { color: '#222', drawTicks: false },
                          ticks: { 
                            color: '#777',
                            maxTicksLimit: 6, // Vital for Mobile: Auto skips labels so 104 matches won't blend into mush
                            maxRotation: 0,
                            minRotation: 0,
                            font: { size: 9 }
                          }
                        },
                        y: {
                          grid: { color: '#222' },
                          ticks: { 
                            color: '#999',
                            font: { size: 10 },
                            beginAtZero: true
                          }
                        },
                      },
                    }} 
                  />
                </div>
              </div>
            )) : <p style={{ paddingLeft: '5px' }}>Brak danych...</p>}
          </div> 
        </Col>
      </Row>
    </Container>
  );
};

export default Stats;
