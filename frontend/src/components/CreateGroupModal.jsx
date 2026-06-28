import React, { useState } from 'react';

export default function CreateGroupModal({ users, currentUser, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([currentUser._id]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleToggleMember = (userId) => {
    if (userId === currentUser._id) return; // Cannot remove yourself

    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a group name');
      return;
    }
    if (selectedMembers.length < 2) {
      setError('A group must have at least 2 members');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          members: selectedMembers
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create group');
      }

      const newGroup = await res.json();
      onSuccess(newGroup);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create a group</h2>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        {error && (
          <div style={{ color: 'var(--accent-red)', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="groupName">Group Name</label>
            <input
              type="text"
              id="groupName"
              className="form-input"
              placeholder="e.g. Weekend Trip, Flatmates"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Select Group Members (At least 2)</label>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px', backgroundColor: 'var(--bg-primary)' }}>
              {users.map((user) => {
                const isSelected = selectedMembers.includes(user._id);
                const isSelf = user._id === currentUser._id;
                
                return (
                  <div
                    key={user._id}
                    className={`user-select-row ${isSelected ? 'active' : ''}`}
                    onClick={() => handleToggleMember(user._id)}
                    style={{ 
                      padding: '8px 12px', 
                      margin: '4px 0', 
                      opacity: isSelf ? 0.7 : 1,
                      cursor: isSelf ? 'default' : 'pointer'
                    }}
                  >
                    <span style={{ fontSize: '18px', marginRight: '10px' }}>{user.avatar}</span>
                    <div style={{ flex: 1, fontSize: '13px' }}>
                      <strong>{user.name}</strong> {isSelf ? '(You - Required)' : ''}
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      disabled={isSelf}
                      style={{ cursor: 'pointer', accentColor: 'var(--accent-green)', width: '16px', height: '16px' }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading} style={{ marginTop: '10px' }}>
            {loading ? 'Creating...' : 'Create group'}
          </button>
        </form>
      </div>
    </div>
  );
}
