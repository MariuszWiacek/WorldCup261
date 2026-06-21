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
  const [mainPrizesDistribution, setMainPrizesDistribution] = useState([]);
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
      if (b.correctResults !== a.correctResults) return b.correctResults - a.correctResults;
      return b.correctTypes - a.correctTypes;
    });

    // Assign placement standings trends supporting shared ranking ranks (Ties)
    let currentMainPlace = 1;
    overallTableData.forEach((entry, index) => {
      if (index > 0) {
        const prevEntry = overallTableData[index - 1];
        if (
          entry.points !== prevEntry.points || 
          entry.correctResults !== prevEntry.correctResults || 
          entry.correctTypes !== prevEntry.correctTypes
        ) {
          currentMainPlace = index + 1;
        }
      }
      entry.place = currentMainPlace;

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

    // --- Dynamic Main Prize Split Logic ---
    const baseMainPrizes = { 1: 530, 2: 300, 3: 150 };
    const calculatedMainPrizes = [];
    
    // Group users by their exact final rank position to split pools
    let i = 0;
    while (i < overallTableData.length && i < 3) {
      const currentRank = overallTableData[i].place;
      // Find all users sharing this exact position tier
      const tiedUsers = overallTableData.filter(e => e.place === currentRank);
      const count = tiedUsers.length;

      // Sum all prizes allocated for the absolute physical slots they span
      let combinedPrizePool = 0;
      for (let slot = i + 1; slot <= i + count; slot++) {
        combinedPrizePool += baseMainPrizes[slot] || 0;
      }

      const fairSplitPrize = Math.round(combinedPrizePool / count);

      tiedUsers.forEach((entry) => {
        if (i < 3) { // Ensure we only output for podium rows
          let label = "🥉 3 miejsce";
          if (currentRank === 1) label = "🥇 1 miejsce";
          else if (currentRank === 2) label = "🥈 2 miejsce";

          calculatedMainPrizes.push({
            label,
            user: entry.user,
            prize: fairSplitPrize,
            isSplit: count > 1
          });
        }
      });

      i += count; // Advance loop beyond all matched tied items
    }
    setMainPrizesDistribution(calculatedMainPrizes);


    // 2. Process separate tables, handle split rules instead of rollovers
    const sortedKolejkaTables = {};
    const prizePool = {};
    let earnings = {};

    const tableOrder = ['Kolejka 1', 'Kolejka 2', 'Kolejka 3', 'Faza pucharowa'];

    tableOrder.forEach((kolejkaID) => {
      const roundUsersData = kolejkaPoints[kolejkaID] ? Object.values(kolejkaPoints[kolejkaID]) : [];
      
      const sortedKolejka = roundUsersData.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.correctResults - a.correctResults;
      });

      let currentPlace = 1;
      sortedKolejka.forEach((entry, index) => {
        if (index > 0) {
          const prevEntry = sortedKolejka[index - 1];
          if (entry.points !== prevEntry.points || entry.correctResults !== prevEntry.correctResults) {
            currentPlace = index + 1;
          }
        }
        entry.place = currentPlace;
      });

      const roundHasPoints = sortedKolejka.some(entry => entry.points > 0);
      
      if (!roundHasPoints || sortedKolejka.length === 0) {
        prizePool[kolejkaID] = { winners: [], prize: 0, isSplit: false };
      } else {
        const topPlace = sortedKolejka[0].place;
        const topTierWinners = sortedKolejka.filter(entry => entry.place === topPlace);
        const winnersCount = topTierWinners.length;
        const winnerNames = topTierWinners.map(entry => entry.user);

        const getPrizeForPlace = (placeIndex) => {
          if (placeIndex === 1) return 100;
          return 0;
        };

        let totalAllocatedPool = 0;
        for (let i = 1; i <= winnersCount; i++) {
          totalAllocatedPool += getPrizeForPlace(i);
        }

        const splitPrize = Math.round(totalAllocatedPool / winnersCount);

        prizePool[kolejkaID] = { 
          winners: winnerNames, 
          prize: splitPrize, 
          isSplit: winnersCount > 1 
        };
        
        winnerNames.forEach((winner) => {
          if (!earnings[winner]) earnings[winner] = 0;
          earnings[winner] += splitPrize;
        });
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
                      backgroundColor: entry.place === 1 ? '#ffea007d' : entry.place === 2 ? '#c0c0c07d' : entry.place === 3 ? '#cd7f327d' : 'rgba(0, 0, 0, 0.336)',
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
                      {!roundPrizeInfo?.isSplit ? (
                        <>
                          <b>Zwycięzca:</b> {roundPrizeInfo?.winners.join(', ')} (<b>{roundPrizeInfo?.prize} 🥮 bonusu</b>)
                        </>
                      ) : (
                        <>
                          <b>Remis między:</b> {roundPrizeInfo?.winners.join(', ')}. <br />
                          Nagroda została podzielona! Każdy otrzymuje: <b>{roundPrizeInfo?.prize} 🥮 bonusu</b>
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
                              backgroundColor: entry.place === 1 ? '#ffea007d' : 'rgba(0, 0, 0, 0.336)',
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
              {mainPrizesDistribution.length === 0 ? (
                <p>Brak danych o nagrodach.</p>
              ) : (
                mainPrizesDistribution.map((prizeNode, idx) => (
                  <p key={idx}>
                    {prizeNode.label} – <b>{prizeNode.user} - {prizeNode.prize} 🥮</b> {prizeNode.isSplit && <span style={{fontSize: '12px', color: '#0f0'}}>(Podzielona pula)</span>}
                  </p>
                ))
              )}
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