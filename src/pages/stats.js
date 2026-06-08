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

    // 1. Group match IDs by their date string to create a master timeline of days
    // Assumes bet/match object contains a 'date' property (e.g., "2026-06-11" or "11.06")
    // If your DB doesn't have dates, it falls back to grouping matches by blocks of 3-4 matches a day.
    const matchDayMap = {};
    
    Object.entries(submittedData).forEach(([user, userBets]) => {
      Object.entries(userBets || {}).forEach(([matchId, bet]) => {
        // Fallback: If no date exists in your DB, we create artificial "Day X" blocks out of match IDs
        const matchDate = bet.date || `Dzień ${Math.ceil(parseInt(matchId.replace(/\D/g, '')) / 3) || 1}`;
        if (!matchDayMap[matchDate]) {
          matchDayMap[matchDate] = [];
        }
        if (!matchDayMap[matchDate].includes(matchId)) {
          matchDayMap[matchDate].push(matchId);
        }
      });
    });

    // Sort days chronologically
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

      // Extract general stats metrics
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

      // 2. Map cumulative points day by day
      let runningTotalPoints = 0;
      const dailyPointsTimeline = [];
      const chartLabels = [];

      chronologicalDays.forEach((dayLabel) => {
        const matchIdsInDay = matchDayMap[dayLabel];
        
        // Sum up points earned from all matches played on this single day
        matchIdsInDay.forEach((matchId) => {
          const bet = bets[matchId];
          const result = results[matchId];

          if (bet && result && bet.score !== ':::') {
            const [actualHomeScore, actualAwayScore] = result.split(':').map(Number);
            const [betHomeScore, betAwayScore] = bet.score.split(':').map(Number);
            const actualOutcome = actualHomeScore === actualAwayScore ? 'X' : actualHomeScore > actualAwayScore ? '1' : '2';

            let pointsEarned = 0;
            if (betHomeScore === actualHomeScore && betAwayScore === actualAwayScore) {
              pointsEarned = 3;
            } else if (bet.bet === actualOutcome) {
              pointsEarned = 1;
            }
            runningTotalPoints += pointsEarned;
          }
        });

        dailyPointsTimeline.push(runningTotalPoints);
        
        // Clean up format for the labels (e.g., stripping year if it's too long for mobile)
        const simplifiedLabel = dayLabel.replace('2026-', '');
        chartLabels.push(simplifiedLabel);
      });

      // 3. Build optimized Chart dataset
      userStats.chartData = {
        labels: chartLabels.length ? chartLabels : ['Start'],
        datasets: [
          {
            label: 'Suma punktów (Dzień po Dniu)',
            data: dailyPointsTimeline.length ? dailyPointsTimeline : [0],
            fill: true,
            borderColor: '#FFD700',
            backgroundColor: 'rgba(255, 215, 0, 0.06)',
            tension: 0.2, // Clean crisp look
            pointRadius: 3, // Small visible dots since 30-40 items fits cleanly
            pointHoverRadius: 6,
            borderWidth: 2.5,
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
      mostMatchedCorrectScore: mostMatchedCorrectScore.length ? mostMatchedCorrectScore[0] : '------',
      mostChosenCorrectScoreCount: mostChosenCorrectScore.length ? scoreCount[mostChosenCorrectScore[0]] : 0,
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
    <Container fluid style={{ backgroundColor: '#121212', minHeight: '100vh', padding: '20px', color: '#fff' }}>
      <Row>
        <Col md={12}> 
          <div style={{ marginTop: '10px', color: '#FFD700' }}>
            <h2>🏆 Statystyki Ogólne</h2>
            <hr style={{ borderColor: '#FFD700' }} />
            <p><strong>💡 Najczęściej wybierany wynik: </strong> {generalStats.mostChosenCorrectScore} ({generalStats.mostChosenCorrectScoreCount} razy)</p>
            <p><strong>💥 Najczęściej trafiony wynik: </strong> {generalStats.mostMatchedCorrectScore} ({generalStats.mostMatchedCorrectScoreCount} razy)</p>
            <p><strong>🎯 Najwięcej trafionych remisów: </strong> {generalStats.mostDraws} (Użytkownik: {generalStats.userWithMostDraws})</p>
            <p><strong>😵 Największy zapominalski: </strong> {generalStats.mostForgetfulUser} ({generalStats.mostForgetfulCount} pustych typów)</p>
          </div>
        </Col>
      </Row>

      <Row>
        <Col md={12}> 
          <div style={{ marginTop: '30px', color: '#FFD700' }}>
            <h2>👤 Statystyki Użytkowników</h2>
            <hr style={{ borderColor: '#FFD700' }} /><br />
            
            {userStats.length > 0 ? userStats.map((stats, idx) => (
              <div key={idx} style={{ marginBottom: '40px', background: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
                <h3 style={{ color: '#FFF' }}>{stats.user}</h3>
                <hr style={{ borderColor: '#333' }} />
                <p style={{ color: '#ccc' }}><strong>⚽ Najczęściej obstawiane drużyny: </strong> {stats.mostChosenTeams.join(', ') || '------'}</p>
                <p style={{ color: '#ccc' }}><strong>👎🏿 Największe rozczarowania: </strong> {stats.mostFailureTeams.join(', ') || '------'}</p>
                <p style={{ color: '#ccc' }}><strong>👍 Najczęściej trafione zwycięstwa: </strong> {stats.mostSuccessTeams.join(', ') || '------'}</p>

                {/* Highly Responsive Day-by-day Chart View */}
                <div style={{ width: '100%', height: '300px', padding: '10px', backgroundColor: '#181818', borderRadius: '6px', border: '1px solid #333' }}>
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
                          padding: 12,
                          callbacks: {
                            title: (context) => `Dzień: ${context[0].label}`,
                            label: (context) => ` Wynik całkowity: ${context.raw} pkt`
                          }
                        }
                      },
                      scales: {
                        x: { 
                          grid: { color: '#252525' },
                          ticks: { 
                            color: '#888',
                            maxTicksLimit: 12, // Automatically hides middle labels on mobile to prevent overcrowding
                            font: { size: 10 }
                          }
                        },
                        y: {
                          grid: { color: '#252525' },
                          ticks: { color: '#aaa' }
                        },
                      },
                    }} 
                  />
                </div>
              </div>
            )) : <p>Brak danych...</p>}
          </div> 
        </Col>
      </Row>
    </Container>
  );
};

export default Stats;
