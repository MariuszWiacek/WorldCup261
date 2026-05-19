import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// This is the correct import for your local file
import logo2026 from '../images/logo.png'; 

function Loading({ onLoaded }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 3-second timer for the entire loading sequence
    const duration = 3000; 
    const intervalTime = 50; 
    const increment = 100 / (duration / intervalTime);

    // Update progress bar
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);

    // Call onLoaded callback after the duration finishes
    const finishTimeout = setTimeout(() => {
      onLoaded();
    }, duration + 500); // 500ms slight delay for smooth exit transition

    return () => {
      clearInterval(timer);
      clearTimeout(finishTimeout);
    };
  }, [onLoaded]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }} // Controls fade-out duration
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#FFFFFF', // Clean White Background
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999, // Ensures it stays on top of everything
      }}
    >
      {/* Container for Logo and Bar to maintain centering and layout */}
      <div style={{ textAlign: 'center', width: '80%', maxWidth: '400px' }}>
        
        {/* The Corrected Logo Integration and Animation */}
        <motion.img
          src={logo2026} // FIX: Now using your local import variable
          alt="FIFA World Cup 2026"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            duration: 0.8, // Duration of the initial logo animation
            delay: 0.2, // Small delay before logo appears
            type: "spring", // Use a spring physics animation for a bounce
            stiffness: 120, // Bounce spring tension
          }}
          style={{ width: '100%', marginBottom: '40px' }}
        />

        {/* The Animated Loading Bar */}
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#f0f0f0', // Bar background color
          borderRadius: '10px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }} // Dynamic width updates
            transition={{ ease: "linear" }} // Ensures smooth, consistent progress bar motion
            style={{
              height: '100%',
              // The gradient bar colors
              background: 'linear-gradient(90deg, #0052B4 0%, #EF3340 50%, #006847 100%)',
              borderRadius: '10px'
            }}
          />
        </div>

        {/* Loading Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            marginTop: '20px',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            color: '#333', // Dark text for contrast
            letterSpacing: '2px' // Spaced out for a modern look
          }}
        >
          LOADING... {Math.round(progress)}%
        </motion.p>
      </div>
    </motion.div>
  );
}

export default Loading;