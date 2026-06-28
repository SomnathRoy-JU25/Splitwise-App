import React from 'react';

export default function AccountView({ currentUser, users, onUserSwitch }) {
  if (!currentUser) return null;

  return (
    <div className="account-container">
      <h2 className="account-title">Account</h2>

      {/* Current User Card */}
      <div className="profile-card">
        <div className="profile-avatar-large">
          {currentUser.avatar}
        </div>
        <h3 className="profile-name">{currentUser.name}</h3>
        <p className="profile-email">{currentUser.email}</p>
      </div>

      {/* Switch Persona Section */}
      <div className="user-switch-section">
        <h4 className="section-label">Switch Active Member</h4>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Select a member to view the app and balances from their perspective:
        </p>

        {users.map((user) => (
          <div
            key={user._id}
            className={`user-select-row ${user._id === currentUser._id ? 'active' : ''}`}
            onClick={() => onUserSwitch(user)}
          >
            <span style={{ fontSize: '20px', marginRight: '12px' }}>{user.avatar}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {user.name} {user._id === currentUser._id ? '(You)' : ''}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {user.email}
              </div>
            </div>
            {user._id === currentUser._id && (
              <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>✓</span>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
        <strong>Tech Stack Summary:</strong>
        <ul style={{ marginLeft: '16px', marginTop: '6px' }}>
          <li>Frontend: React (Vite) styled with Custom CSS</li>
          <li>Backend: Node.js + Express</li>
          <li>Database: MongoDB (Mongoose schemas)</li>
          <li>Dynamic calculations: Full pairwise debt simplification</li>
        </ul>
      </div>
    </div>
  );
}
