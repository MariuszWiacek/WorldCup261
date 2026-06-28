import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange, label, note }) => {
  const handlePrev = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      
 
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
    }}
  >
    {/* LEFT */}
    <button
      onClick={handlePrev}
      disabled={currentPage === 0}
      style={{
        padding: '10px',
        fontSize: '10px',
        fontWeight: 'bold',
        backgroundColor: '#ffffff00',
        color: 'gold',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
      }}
    >
      &lt;&lt;
    </button>

    {/* CENTER (label + note) */}
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontSize: '16px',
          fontWeight: 'bold',
        }}
      >
        {label}
      </div>

      {note && (
        <div
          style={{
            color: '#dc2626',
            fontSize: '12px',
            fontWeight: 'bold',
            marginTop: '3px',
          }}
        >
          {note}
        </div>
      )}
    </div>

    {/* RIGHT */}
    <button
      onClick={handleNext}
      disabled={currentPage === totalPages - 1}
      style={{
        padding: '10px',
        fontSize: '10px',
        fontWeight: 'bold',
        backgroundColor: '#ffffff00',
        color: 'gold',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
      }}
    >
      &gt;&gt;
    </button>
  </div>

      
    </div>
  );
};

export default Pagination;
