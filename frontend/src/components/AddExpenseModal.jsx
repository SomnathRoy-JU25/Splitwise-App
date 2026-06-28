import React, { useState } from 'react';
import { createExpense } from '../api';

export default function AddExpenseModal({ group, onClose, onSuccess }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(group.members[0]?._id || '');
  const [category, setCategory] = useState('food');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const categories = [
    { id: 'food', label: 'Food', icon: '🍔' },
    { id: 'groceries', label: 'Grocery', icon: '🛒' },
    { id: 'utilities', label: 'Utility', icon: '💧' },
    { id: 'household', label: 'Household', icon: '📄' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid description and amount');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Split equally by default
      const membersCount = group.members.length;
      const totalAmount = parseFloat(amount);
      const share = Math.round((totalAmount / membersCount) * 100) / 100;
      
      const splitWith = group.members.map((m, idx) => {
        // Adjust final item for rounding errors
        if (idx === membersCount - 1) {
          const sumPrior = share * (membersCount - 1);
          return { user: m._id, share: Math.round((totalAmount - sumPrior) * 100) / 100 };
        }
        return { user: m._id, share };
      });

      const expenseData = {
        description,
        amount: totalAmount,
        paidBy,
        category,
        splitWith,
        date: new Date()
      };

      await createExpense(group._id, expenseData);
      onSuccess();
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
          <h2 className="modal-title">Add an expense</h2>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        {error && (
          <div style={{ color: 'var(--accent-red)', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="description">With you and: <strong>{group.name}</strong></label>
            <input
              type="text"
              id="description"
              className="form-input"
              placeholder="Enter a description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group" style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label" htmlFor="amount">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                id="amount"
                className="form-input"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label" htmlFor="paidBy">Paid by</label>
              <select
                id="paidBy"
                className="form-select"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
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
            <label className="form-label">Category</label>
            <div className="category-grid">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  className={`category-option-btn ${category === cat.id ? 'active' : ''}`}
                  onClick={() => setCategory(cat.id)}
                  disabled={loading}
                >
                  <span className="category-option-icon">{cat.icon}</span>
                  <span className="category-option-label">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="splits-card">
            <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Split details: Split equally
            </div>
            {amount && parseFloat(amount) > 0 ? (
              group.members.map((member) => {
                const membersCount = group.members.length;
                const shareVal = parseFloat(amount) / membersCount;
                return (
                  <div className="split-item" key={member._id}>
                    <span className="split-member-info">
                      <span>{member.avatar}</span>
                      <span>{member.name}</span>
                    </span>
                    <span style={{ fontWeight: '600' }}>
                      ₹{shareVal.toFixed(2)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Enter an amount to see splits
              </div>
            )}
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Adding...' : 'Save expense'}
          </button>
        </form>
      </div>
    </div>
  );
}
