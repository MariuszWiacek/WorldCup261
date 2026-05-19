// TeamLogos.js
import React from 'react';
import styled, { keyframes } from 'styled-components';
import Flag from 'react-world-flags';
import teamLogosData from '../gameData/teams.json'; // Adjust the path to where your teams.json file is located

// Keyframes for the continuous scrolling animation
const scroll = keyframes`
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%); /* Change to -50% to properly cycle duplicated list elements */
  }
`;

// Styled-components
const TeamLogosContainer = styled.div`
  display: flex;
  overflow: hidden;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.18); /* Added missing # hash for proper transparency */
  position: relative;
  height: 60px; /* Adjust height as needed */
  align-items: center;
`;

const TeamLogosWrapper = styled.div`
  display: flex;
  width: max-content; /* Dynamically sizes to content to avoid stutter cuts */
  animation: ${scroll} 60s linear infinite;
`;

// Container to host and style the Flag component inner elements
const FlagWrapper = styled.div`
  margin-right: 25px; /* Spacing between scrolling flags */
  flex-shrink: 0;
  display: flex;
  align-items: center;

  img, svg {
    height: 35px; /* Fixed height for ticker consistency */
    width: 50px;  /* Fixed uniform flag width */
    object-fit: cover;
    border-radius: 4px;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.25);
  }
`;

const TeamLogos = () => {
  // Generate list elements from JSON mapping
  const renderFlags = () => 
    Object.keys(teamLogosData).map((team) => (
      <FlagWrapper key={team} title={team}>
        <Flag code={teamLogosData[team].logo} fallback={<span>🏳️</span>} />
      </FlagWrapper>
    ));

  return (
    <TeamLogosContainer>
      <TeamLogosWrapper>
        {renderFlags()}
        {renderFlags()} {/* Duplicate logos to ensure continuous marquee scrolling */}
      </TeamLogosWrapper>
    </TeamLogosContainer>
  );
};

export default TeamLogos;