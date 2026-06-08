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
  Filler // Added Filler for beautiful background area gradients
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

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

// Register Chart.js components
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

    const userStatsData = [];
    const scoreCount = {};
    const matchedScores = {};
    const drawCount = {};
    const emptyScoreCount = {};

    Object.keys(submittedData).forEach((user) => {
      const bets = Object.entries(submittedData[user] || {});
      const userStats = {
        user,
        chosenTeams: {},
        failureTeams: {},
        successTeams: {},
        kolejki: {}, // Changed to object hash to gracefully handle dynamic dynamic kolejka IDs
      };

      bets.forEach(([id, bet]) => {
        if (bet.score === ':::') {
          emptyScoreCount[user] = (emptyScoreCount[user] || 0) + 1;
          return;
        }

        const result = results[id];
        if (!result || !bet.home || !bet.away || !bet.bet || !bet.score) return;

        const { home: homeTeam, away: awayTeam, bet: betOutcome, score: betScore } = bet;
        const [actualHomeScore, actualAwayScore] = result.split(':').map(Number);
        const [betHomeScore, betAwayScore] = betScore.split(':').map(Number);
        const actualOutcome = actualHomeScore === actualAwayScore ? 'X' : actualHomeScore > actualAwayScore ? '1' : '2';

        let points = 0;
        if (betHomeScore === actualHomeScore && betAwayScore === actualAwayScore) {
          points = 3;
        } else if (betOutcome === actualOutcome) {
          points = 1;
        }

        const kolejkaId = bet.kolejkaId || 1;
        if (!userStats.kolejki[kolejkaId]) {
          userStats.kolejki[kolejkaId] = 0;
        }
        userStats.kolejki[kolejkaId] += points;

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

      // Dynamically extract and sort all available Kolejki present in the dataset
      const uniqueKolejki = Object.keys(userStats.kolejki).map(Number).sort((a, b) => a - b);
      
      // Generate standard readable labels
      const kolejkaLabels = uniqueKolejki.map(k => `Kolejka ${k}`);

      // Calculate Cumulative Sum (Better approach for a massive 104 game chart)
      let runningSum = 0;
      const cumulativePointsData = uniqueKolejki.map((k) => {
        runningSum += userStats.kolejki[k] || 0;
        return runningSum;
      });

      // Premium UI Chart Dataset Configuration
      userStats.chartData = {
        labels: kolejkaLabels.length ? kolejkaLabels : ['Start'],
        datasets: [
          {
            label: 'Suma Punktów (Suma skumulowana)',
            data: cumulativePointsData.length ? cumulativePointsData : [0],
            fill: true,
            borderColor: '#FFD700', // Premium Gold Line
            backgroundColor: 'rgba(255, 215, 0, 0.1)', // Subtle Gold glow area underneath
            tension: 0.35, // Smooth curves instead of rigid zig-zags
            pointBackgroundColor: '#FFF',
            pointBorderColor: '#FFD700',
            pointHoverRadius: 7,
            pointRadius: 4,
            borderWidth: 3
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

                {/* Upgraded Dark Theme Chart Container */}
                <div style={{ width: '100%', height: '320px', padding: '10px', backgroundColor: '#181818', borderRadius: '6px', border: '1px solid #333' }}>
                  <Line 
                    data={stats.chartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          labels: { color: '#FFF' }
                        },
                        tooltip: {
                          mode: 'index',
                          intersect: false,
                        }
                      },
                      scales: {
                        x: { 
                          grid: { color: '#2d2d2d' },
                          ticks: { color: '#aaa' }
                        },
                        y: {
                          grid: { color: '#2d2d2d' },
                          ticks: { color: '#aaa', stepSize: 5 } // Step size 5 works flawlessly with large point margins
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
