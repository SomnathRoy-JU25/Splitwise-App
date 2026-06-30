import React, { useState, useEffect } from 'react';
import { createExpense } from '../api';

export default function AddExpenseModal({ group, onClose, onSuccess }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(group.members[0]?._id || '');
  const [category, setCategory] = useState('food');
  
  // Split type: 'equal', 'exact', 'percent'
  const [splitType, setSplitType] = useState('equal');
  
  // Member involvement state (toggles if member is in the split)
  const [involvedMembers, setInvolvedMembers] = useState(
    group.members.reduce((acc, member) => {
      acc[member._id] = true;
      return acc;
    }, {})
  );

  // Manual inputs for exact amounts or percentages
  const [manualInputs, setManualInputs] = useState(
    group.members.reduce((acc, member) => {
      acc[member._id] = '';
      return acc;
    }, {})
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const categories = [
    { id: 'food', label: 'Food', icon: '🍔' },
    { id: 'groceries', label: 'Grocery', icon: '🛒' },
    { id: 'utilities', label: 'Utility', icon: '💧' },
    { id: 'household', label: 'Household', icon: '📄' }
  ];

  const totalAmountNum = parseFloat(amount) || 0;
  const involvedMembersCount = Object.values(involvedMembers).filter(Boolean).length;

  // Calculate sum of exact amounts
  const totalManualAmount = Object.entries(manualInputs).reduce((sum, [memberId, val]) => {
    if (!involvedMembers[memberId]) return sum;
    if (splitType !== 'exact') return sum;
    return sum + (parseFloat(val) || 0);
  }, 0);

  // Calculate sum of percentages
  const totalPercentage = Object.entries(manualInputs).reduce((sum, [memberId, val]) => {
    if (!involvedMembers[memberId]) return sum;
    if (splitType !== 'percent') return sum;
    return sum + (parseFloat(val) || 0);
  }, 0);

  // Validation checks
  const isAmountValid = totalAmountNum > 0;
  const isMembersValid = involvedMembersCount > 0;
  let isSplitValid = true;

  if (splitType === 'exact') {
    isSplitValid = Math.abs(totalManualAmount - totalAmountNum) <= 0.01;
  } else if (splitType === 'percent') {
    isSplitValid = Math.abs(totalPercentage - 100) <= 0.01;
  }

  const isFormValid = isAmountValid && isMembersValid && isSplitValid && description.trim() !== '';

  const handleToggleMember = (memberId) => {
    setInvolvedMembers(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  const handleManualInputChange = (memberId, value) => {
    setManualInputs(prev => ({
      ...prev,
      [memberId]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setLoading(true);
      setError(null);

      let splitWith = [];

      if (splitType === 'equal') {
        const share = Math.round((totalAmountNum / involvedMembersCount) * 100) / 100;
        let sumPrior = 0;
        let processedCount = 0;

        group.members.forEach((m) => {
          if (involvedMembers[m._id]) {
            processedCount++;
            if (processedCount === involvedMembersCount) {
              // Adjust final item for rounding errors
              splitWith.push({ user: m._id, share: Math.round((totalAmountNum - sumPrior) * 100) / 100 });
            } else {
              splitWith.push({ user: m._id, share });
              sumPrior += share;
            }
          } else {
            splitWith.push({ user: m._id, share: 0 });
          }
        });
      } else if (splitType === 'exact') {
        group.members.forEach((m) => {
          if (involvedMembers[m._id]) {
            const share = parseFloat(manualInputs[m._id]) || 0;
            splitWith.push({ user: m._id, share: Math.round(share * 100) / 100 });
          } else {
            splitWith.push({ user: m._id, share: 0 });
          }
        });
      } else if (splitType === 'percent') {
        let sumPrior = 0;
        let processedCount = 0;

        group.members.forEach((m) => {
          if (involvedMembers[m._id]) {
            processedCount++;
            const pct = parseFloat(manualInputs[m._id]) || 0;
            const share = Math.round((totalAmountNum * (pct / 100)) * 100) / 100;

            if (processedCount === involvedMembersCount) {
              splitWith.push({ user: m._id, share: Math.round((totalAmountNum - sumPrior) * 100) / 100 });
            } else {
              splitWith.push({ user: m._id, share });
              sumPrior += share;
            }
          } else {
            splitWith.push({ user: m._id, share: 0 });
          }
        });
      }

      const expenseData = {
        description: description.trim(),
        amount: totalAmountNum,
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

          {/* Split Type Selector */}
          <div className="form-group">
            <label className="form-label">Split Type</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`btn-action ${splitType === 'equal' ? 'settle' : 'secondary'}`}
                onClick={() => setSplitType('equal')}
                style={{ flex: 1, padding: '8px 4px', fontSize: '12px' }}
              >
                Equally
              </button>
              <button
                type="button"
                className={`btn-action ${splitType === 'exact' ? 'settle' : 'secondary'}`}
                onClick={() => setSplitType('exact')}
                style={{ flex: 1, padding: '8px 4px', fontSize: '12px' }}
              >
                Exact Shares
              </button>
              <button
                type="button"
                className={`btn-action ${splitType === 'percent' ? 'settle' : 'secondary'}`}
                onClick={() => setSplitType('percent')}
                style={{ flex: 1, padding: '8px 4px', fontSize: '12px' }}
              >
                Percentages
              </button>
            </div>
          </div>

          {/* Dynamic Splits Card */}
          <div className="splits-card">
            <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Splits Distribution:
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {group.members.map((member) => {
                const isSelected = involvedMembers[member._id];
                let valToShow = '';

                if (splitType === 'equal') {
                  const shareVal = isSelected ? (totalAmountNum / involvedMembersCount) : 0;
                  valToShow = `₹${(isNaN(shareVal) ? 0 : shareVal).toFixed(2)}`;
                }

                return (
                  <div className="split-item" key={member._id} style={{ display: 'flex', alignItems: 'center', opacity: isSelected ? 1 : 0.5 }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleMember(member._id)}
                      disabled={loading}
                      style={{ marginRight: '10px', cursor: 'pointer', accentColor: 'var(--accent-green)', width: '16px', height: '16px' }}
                    />
                    
                    <span className="split-member-info" style={{ flex: 1 }}>
                      <span style={{ fontSize: '16px', marginRight: '6px' }}>{member.avatar}</span>
                      <span>{member.name}</span>
                    </span>

                    {/* Conditional Input field based on Split Type */}
                    {splitType === 'equal' ? (
                      <span style={{ fontWeight: '600', fontSize: '14px' }}>
                        {valToShow}
                      </span>
                    ) : splitType === 'exact' ? (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '4px', fontSize: '13px', color: 'var(--text-secondary)' }}>₹</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={isSelected ? (manualInputs[member._id] || '') : ''}
                          onChange={(e) => handleManualInputChange(member._id, e.target.value)}
                          disabled={!isSelected || loading}
                          style={{
                            width: '80px',
                            backgroundColor: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-color)',
                            color: 'white',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            textAlign: 'right',
                            outline: 'none'
                          }}
                        />
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="0"
                            value={isSelected ? (manualInputs[member._id] || '') : ''}
                            onChange={(e) => handleManualInputChange(member._id, e.target.value)}
                            disabled={!isSelected || loading}
                            style={{
                              width: '60px',
                              backgroundColor: 'var(--bg-tertiary)',
                              border: '1px solid var(--border-color)',
                              color: 'white',
                              padding: '6px 8px',
                              borderRadius: '4px',
                              textAlign: 'right',
                              outline: 'none'
                            }}
                          />
                          <span style={{ marginLeft: '4px', fontSize: '13px', color: 'var(--text-secondary)' }}>%</span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', width: '60px', textAlign: 'right' }}>
                          ₹{((totalAmountNum * (parseFloat(manualInputs[member._id]) || 0)) / 100).toFixed(0)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Validation warnings inside splits card */}
            {splitType === 'exact' && amount && Math.abs(totalManualAmount - totalAmountNum) > 0.01 && (
              <div style={{ color: 'var(--accent-red)', fontSize: '11px', marginTop: '12px', fontWeight: '500', borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
                ⚠️ Sum of shares (₹{totalManualAmount.toFixed(2)}) does not equal total amount (₹{totalAmountNum.toFixed(2)}).
                <br />
                Difference: <strong style={{ color: 'white' }}>₹{(totalAmountNum - totalManualAmount).toFixed(2)}</strong> remaining
              </div>
            )}

            {splitType === 'percent' && amount && Math.abs(totalPercentage - 100) > 0.01 && (
              <div style={{ color: 'var(--accent-red)', fontSize: '11px', marginTop: '12px', fontWeight: '500', borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
                ⚠️ Sum of percentages ({totalPercentage.toFixed(1)}%) must equal 100%.
                <br />
                Difference: <strong style={{ color: 'white' }}>{(100 - totalPercentage).toFixed(1)}%</strong> remaining
              </div>
            )}
            
            {isAmountValid && !isMembersValid && (
              <div style={{ color: 'var(--accent-red)', fontSize: '11px', marginTop: '12px', fontWeight: '500' }}>
                ⚠️ Please select at least one member to split with.
              </div>
            )}
          </div>

          <button type="submit" className="btn-submit" disabled={!isFormValid || loading}>
            {loading ? 'Adding...' : 'Save expense'}
          </button>
        </form>
      </div>
    </div>
  );
}
