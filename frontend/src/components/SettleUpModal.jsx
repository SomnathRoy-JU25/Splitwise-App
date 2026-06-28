import React, { useState } from 'react';
import { createSettlement } from '../api';

export default function SettleUpModal({ group, debts, currentUser, onClose, onSuccess }) {
  // Try to find if there is an active debt involving current user
  const activeDebt = debts.find(d => d.from === currentUser?._id || d.to === currentUser?._id) || debts[0];

  const [from, setFrom] = useState(activeDebt ? activeDebt.from : group.members[0]?._id);
  const [to, setTo] = useState(activeDebt ? activeDebt.to : group.members[1]?._id);
  const [amount, setAmount] = useState(activeDebt ? activeDebt.amount.toString() : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (from === to) {
      setError('Payer and recipient must be different');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const settlementData = {
        from,
        to,
        amount: parseFloat(amount),
        date: new Date()
      };

      await createSettlement(group._id, settlementData);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMemberAvatar = (memberId) => {
    const mem = group.members.find(m => m._id === memberId);
    return mem ? mem.avatar : '👤';
  };

  const getMemberName = (memberId) => {
    const mem = group.members.find(m => m._id === memberId);
    return mem ? mem.name : 'Unknown';
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Settle up</h2>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        {error && (
          <div style={{ color: 'var(--accent-red)', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Visual flow: Payer -> Recipient */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', margin: '20px 0', padding: '16px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '32px' }}>{getMemberAvatar(from)}</span>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>{getMemberName(from)}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>paid</span>
            </div>
            
            <div style={{ fontSize: '24px', color: 'var(--accent-green)' }}>➔</div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '32px' }}>{getMemberAvatar(to)}</span>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>{getMemberName(to)}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>received</span>
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label" htmlFor="fromSelect">Who paid</label>
              <select
                id="fromSelect"
                className="form-select"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                disabled={loading}
              >
                {group.members.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label" htmlFor="toSelect">Who received</label>
              <select
                id="toSelect"
                className="form-select"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                disabled={loading}
              >
                {group.members.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="settleAmount">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              id="settleAmount"
              className="form-input"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading} style={{ backgroundColor: 'var(--accent-orange)' }}>
            {loading ? 'Recording...' : 'Save settlement'}
          </button>
        </form>
      </div>
    </div>
  );
}
