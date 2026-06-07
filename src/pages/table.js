import React, { useState, useEffect, useRef } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { Row, Col, Container } from 'react-bootstrap';
import { calculatePoints } from '../components/calculatePoints';
import Stats from './stats';

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

// --- Styles ---
const linkContainerStyle = {
  textAlign: 'left',
  backgroundColor: '#212529ab',
  padding: '20px',
  borderRadius: '10px',
  marginBottom: '20px',
};

const tableHeaderStyle = {
  padding: '10px',
  border: '1px solid #444',
  backgroundColor: '#212529',
  color: 'white',
  textAlign: 'center',
};

const tableCellStyle = {
  padding: '10px',
  border: '1px solid #444',
  textAlign: 'center',
};

const textToggleStyle = {
  cursor: 'pointer',
  color: '#ffd700',
  textDecoration: 'underline',
  margin: '10px 0',
  fontSize: '1.1em',
  textAlign: 'center',
};

const prizeInfoStyle = {
  color: '#0f0',
  fontSize: '1em',
  textAlign: 'center',
  marginTop: '10px',
};

const earningsStyle = {
  color: '#f39c12',
  fontSize: '1.1em',
  textAlign: 'center',
  marginTop: '30px',
};

const Table = () => {
  const [results, setResults] = useState({});
  const [submittedData, setSubmittedData] = useState({});
  const [mainTableData, setMainTableData] = useState([]);
  const [kolejkaTables, setKolejkaTables] = useState({});
  const [visibleKolejka, setVisibleKolejka] = useState(null);
  const [prizes, setPrizes] = useState({});
  const [userEarnings, setUserEarnings] = useState({});
  const previousTableData = useRef([]);

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
    const kolejkaPoints = {};

    // 1. Compile overall points data alongside itemized structures
    const overallTableData = Object.keys(submittedData).map((user) => {
      const bets = Object.entries(submittedData[user]).map(([id, bet]) => ({
        ...bet,
        id,
      }));

      // Calculate total stats for the main table
      const { points, correctTypes, correctResults } = calculatePoints(bets, results);

      // Distribute specific match points to independent rounds
      bets.forEach((bet) => {
        const gameNumber = parseInt(bet.id, 10);
        let kolejkaID;

        if (gameNumber <= 24) {
          kolejkaID = 'Kolejka 1';
        } else if (gameNumber <= 48) {
          kolejkaID = 'Kolejka 2';
        } else if (gameNumber <= 72) {
          kolejkaID = 'Kolejka 3';
        } else {
          kolejkaID = 'Faza pucharowa';
        }

        if (!kolejkaPoints[kolejkaID]) kolejkaPoints[kolejkaID] = {};
        if (!kolejkaPoints[kolejkaID][user]) {
          kolejkaPoints[kolejkaID][user] = { user, points: 0, correctTypes: 0, correctResults: 0 };
        }

        const singleBetCalc = calculatePoints([bet], results);
        kolejkaPoints[kolejkaID][user].points += singleBetCalc.points;
        kolejkaPoints[kolejkaID][user].correctTypes += singleBetCalc.correctTypes;
        kolejkaPoints[kolejkaID][user].correctResults += singleBetCalc.correctResults;
      });

      return { user, points, correctTypes, correctResults };
    });

    // Sort overall table
    overallTableData.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.correctResults - a.correctResults;
    });

    // Assign placement standings trends
    overallTableData.forEach((entry, index) => {
      entry.place = index + 1;
      const previousEntry = previousTableData.current.find((e) => e.user === entry.user);
      entry.trend = previousEntry
        ? previousEntry.place > entry.place
          ? 'up'
          : previousEntry.place < entry.place
          ? 'down'
          : 'same'
        : 'same';
    });

    previousTableData.current = overallTableData;
    setMainTableData(overallTableData);

    // 2. Process separate tables, handle rollovers and reward bonuses
    const sortedKolejkaTables = {};
    const prizePool = {};
    let earnings = {};
    let runningRollover = 0;

    const tableOrder = ['Kolejka 1', 'Kolejka 2', 'Kolejka 3', 'Faza pucharowa'];

    tableOrder.forEach((kolejkaID) => {
      // Fallback fallback arrays if round entries don't exist yet
      const roundUsersData = kolejkaPoints[kolejkaID] ? Object.values(kolejkaPoints[kolejkaID]) : [];
      
      const sortedKolejka = roundUsersData.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.correctResults - a.correctResults;
      });

      sortedKolejka.forEach((entry, index) => {
        entry.place = index + 1;
      });

      // Find top scores for bonuses
      const maxPoints = sortedKolejka[0]?.points || 0;
      const roundHasPoints = sortedKolejka.some(entry => entry.points > 0);
      
      let winners = [];
      if (roundHasPoints) {
        winners = sortedKolejka.filter((entry) => entry.points === maxPoints).map((entry) => entry.user);
      }

      const currentPrize = 100 + runningRollover;

      if (winners.length === 0) {
        prizePool[kolejkaID] = { winners: [], prize: 0 };
      } else if (winners.length === 1) {
        prizePool[kolejkaID] = { winners, prize: currentPrize };
        
        // Apply single winner bonus
        const individualWinner = winners[0];
        if (!earnings[individualWinner]) earnings[individualWinner] = 0;
        earnings[individualWinner] += currentPrize;
        
        runningRollover = 0; // Reset rollover pool
      } else {
        // Multi-user tie scenario
        prizePool[kolejkaID] = { winners, prize: 0, rollover: true };
        runningRollover += 10;
      }

      sortedKolejkaTables[kolejkaID] = sortedKolejka;
    });

    setPrizes(prizePool);
    setKolejkaTables(sortedKolejkaTables);
    setUserEarnings(earnings);
  }, [submittedData, results]);

  const toggleKolejkaVisibility = (kolejkaID) => {
    setVisibleKolejka((prev) => (prev === kolejkaID ? null : kolejkaID));
  };

  const tableOrder = ['Kolejka 1', 'Kolejka 2', 'Kolejka 3', 'Faza pucharowa'];

  return (
    <Container fluid style={linkContainerStyle}>
      <Row>
        <Col md={12}>
          <h3 style={{ textAlign: 'center' }}>Tabela Główna</h3>
          <div className="fade-in" style={{ overflowX: 'auto', marginTop: '10px' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ backgroundColor: '#212529', color: 'white' }}>
                  <th style={tableHeaderStyle}>Miejsce</th>
                  <th style={tableHeaderStyle}>Użytkownik</th>
                  <th style={tableHeaderStyle}>Pkt</th>
                  <th style={tableHeaderStyle}>☑️ <br />typ</th>
                  <th style={tableHeaderStyle}>✅☑️ <br />typ+wynik</th>
                </tr>
              </thead>
              <tbody>
                {mainTableData.map((entry, index) => (
                  <tr
                    key={index}
                    style={{
                      backgroundColor: index < 3 ? '#ffea007d' : 'rgba(0, 0, 0, 0.336)',
                    }}
                  >
                    <td style={tableCellStyle}>{entry.place}</td>
                    <td style={tableCellStyle}>{entry.user}</td>
                    <td style={tableCellStyle}>{entry.points}</td>
                    <td style={tableCellStyle}>{entry.correctTypes}</td>
                    <td style={tableCellStyle}>{entry.correctResults}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <hr />
          
          {tableOrder.map((kolejkaID) => {
            const kolejkaData = kolejkaTables[kolejkaID] || [];
            const allZeroPoints = kolejkaData.length === 0 || kolejkaData.every((entry) => entry.points === 0);
            const roundPrizeInfo = prizes[kolejkaID];

            return (
              <div key={kolejkaID}>
                <hr style={{ color: 'white' }} />
                <div style={prizeInfoStyle}>
                  <h3><b>{kolejkaID}</b><br /></h3>
                  {allZeroPoints ? (
                    <p>Nikt jeszcze nie zdobył punktów w tej rundzie.</p>
                  ) : (
                    <p>
                      {roundPrizeInfo?.winners.length === 1 ? (
                        <>
                          <b>Zwycięzca:</b> {roundPrizeInfo.winners.join(', ')} (<b>{roundPrizeInfo.prize} 🥮 bonusu</b>)
                        </>
                      ) : (
                        <>
                          <b>Remis między:</b> {roundPrizeInfo?.winners.join(', ')}. <br />
                          Nagroda kumuluje się na następną kolejke!
                        </>
                      )}
                    </p>
                  )}
                </div>
                
                <div
                  style={textToggleStyle}
                  onClick={() => toggleKolejkaVisibility(kolejkaID)}
                >
                  {visibleKolejka === kolejkaID
                    ? `Ukryj: ${kolejkaID}`
                    : `Pokaż: ${kolejkaID}`}
                </div>
                
                {visibleKolejka === kolejkaID && !allZeroPoints && (
                  <div className="fade-in" style={{ overflowX: 'auto', marginTop: '10px' }}>
                    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#212529', color: 'white' }}>
                          <th style={tableHeaderStyle}>Miejsce</th>
                          <th style={tableHeaderStyle}>Użytkownik</th>
                          <th style={tableHeaderStyle}>Pkt</th>
                          <th style={tableHeaderStyle}>☑️ <br />typ</th>
                          <th style={tableHeaderStyle}>✅☑️ <br />typ+wynik</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kolejkaData.map((entry, index) => (
                          <tr
                            key={index}
                            style={{
                              backgroundColor: index < 3 ? '#ffea007d' : 'rgba(0, 0, 0, 0.336)',
                            }}
                          >
                            <td style={tableCellStyle}>{entry.place}</td>
                            <td style={tableCellStyle}>{entry.user}</td>
                            <td style={tableCellStyle}>{entry.points}</td>
                            <td style={tableCellStyle}>{entry.correctTypes}</td>
                            <td style={tableCellStyle}>{entry.correctResults}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          {/* Earnings & Bonuses overview distribution */}
          <div style={earningsStyle}>
            <hr />
            <p style={{ fontSize: '15px' }}>
              22 x 60 = 1320 🥮 <br />
              3 kolejek + 1 faza pucharowa x 100 🥮 = 400 🥮 <br />
              1320 - 400 = 920 🥮 w głównej puli
            </p>
            <hr />
            <div style={{ marginTop: '10px', color: '#FFD700' }}>
              <b>Aktualne Nagrody Główne:</b>
              <hr />
              {mainTableData[0] && <p>🥇 1 miejsce – <b>{mainTableData[0].user} - 520 🥮</b></p>}
              {mainTableData[1] && <p>🥈 2 miejsce – <b>{mainTableData[1].user} – 250 🥮</b></p>}
              {mainTableData[2] && <p>🥉 3 miejsce – <b>{mainTableData[2].user} – 150 🥮</b></p>}
            </div>
            <hr />
            <div style={{ marginTop: '10px', color: '#FFD700' }}>
              <b>Aktywne Bonusy Kolejkowe:</b>
              <hr />
              {Object.entries(userEarnings)
                .filter(([, earningsAmount]) => earningsAmount > 0)
                .sort(([, earningsA], [, earningsB]) => earningsB - earningsA)
                .map(([user, earningsAmount]) => (
                  <p key={user}>
                    {user}: {earningsAmount} 🥮
                  </p>
                ))}
            </div>
          </div>
        </Col>
      </Row>
      <hr style={{ color: 'white' }} />
      <Stats />
    </Container>
  );
};

export default Table;