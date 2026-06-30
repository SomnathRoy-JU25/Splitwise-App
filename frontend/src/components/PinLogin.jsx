import React, { useState, useEffect } from 'react';

export default function PinLogin({ onLoginSuccess }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shake, setShake] = useState(false);

  const MASTER_PIN = '0741';

  // Handle number input
  const handleNumberClick = (num) => {
    if (pin.length < 4 && !loading) {
      setPin(prev => prev + num);
      setError(null);
    }
  };

  // Handle delete
  const handleDeleteClick = () => {
    if (pin.length > 0 && !loading) {
      setPin(prev => prev.slice(0, -1));
    }
  };

  // Handle clear
  const handleClearClick = () => {
    if (!loading) {
      setPin('');
      setError(null);
    }
  };

  // Trigger login validation when 4 digits are completed
  useEffect(() => {
    if (pin.length === 4) {
      handleLoginVerify();
    }
  }, [pin]);

  const handleLoginVerify = () => {
    setLoading(true);
    setError(null);
    
    // Simulate minor network delay for premium visual feedback
    setTimeout(() => {
      if (pin === MASTER_PIN) {
        onLoginSuccess();
      } else {
        setShake(true);
        setError('Wrong passcode');
        setPin('');
        setTimeout(() => setShake(false), 500); // Reset shake animation
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#0f172a',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'var(--font-body)',
      color: 'white',
      overflow: 'hidden'
    }}>
      {/* Dynamic inline styles for animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .shake-effect {
          animation: shake 0.4s ease-in-out;
        }
        .keypad-btn:active {
          transform: scale(0.9);
          background-color: rgba(255, 255, 255, 0.15) !important;
        }
      `}</style>

      {/* 1. App Logo / Branding */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-1px', margin: '0 0 8px 0', color: 'white' }}>
          Splitwise
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
          Enter Passcode to unlock the website
        </p>
      </div>

      {/* 2. Passcode Indicator Dots */}
      <div 
        className={shake ? 'shake-effect' : ''} 
        style={{
          display: 'flex',
          gap: '20px',
          marginBottom: '20px',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {[0, 1, 2, 3].map(index => {
          const isFilled = pin.length > index;
          return (
            <div
              key={index}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: error ? 'var(--accent-red)' : (isFilled ? 'var(--accent-green)' : 'rgba(255, 255, 255, 0.1)'),
                border: `1.5px solid ${error ? 'var(--accent-red)' : (isFilled ? 'var(--accent-green)' : 'rgba(255, 255, 255, 0.2)')}`,
                boxShadow: isFilled && !error ? '0 0 10px var(--accent-green)' : 'none',
                transition: 'all 0.15s ease'
              }}
            />
          );
        })}
      </div>

      {/* 3. Live Message Banner */}
      <div style={{ height: '24px', marginBottom: '32px', textAlign: 'center' }}>
        {error ? (
          <span style={{ color: 'var(--accent-red)', fontSize: '13px', fontWeight: '600' }}>
            {error}
          </span>
        ) : loading ? (
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Unlocking...
          </span>
        ) : null}
      </div>

      {/* 4. Keypad Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 80px)',
        gap: '16px 24px',
        justifyContent: 'center'
      }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            type="button"
            onClick={() => handleNumberClick(num)}
            className="keypad-btn"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              color: 'white',
              fontSize: '26px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              transition: 'all 0.1s ease',
              outline: 'none'
            }}
          >
            {num}
          </button>
        ))}

        {/* Clear Button */}
        <button
          type="button"
          onClick={handleClearClick}
          className="keypad-btn"
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            outline: 'none'
          }}
        >
          Clear
        </button>

        {/* 0 Button */}
        <button
          type="button"
          onClick={() => handleNumberClick(0)}
          className="keypad-btn"
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            color: 'white',
            fontSize: '26px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            outline: 'none'
          }}
        >
          0
        </button>

        {/* Delete Button */}
        <button
          type="button"
          onClick={handleDeleteClick}
          className="keypad-btn"
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '22px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            outline: 'none'
          }}
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
