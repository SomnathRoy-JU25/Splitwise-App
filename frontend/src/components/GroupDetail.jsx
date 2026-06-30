import React, { useEffect, useState } from 'react';
import { fetchGroupDetails, fetchExpenses, deleteExpense } from '../api';

export default function GroupDetail({ 
  groupId, 
  currentUser, 
  onSettleUp, 
  onAddExpense, 
  onShowCharts,
  usdMode,
  setUsdMode,
  refreshTrigger,
  onBack,
  onRefresh,
  users = [],
  onUserSwitch
}) {
  const [data, setData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localTrigger, setLocalTrigger] = useState(0);

  // Conversion rate: 1 USD = 83 INR
  const CONVERSION_RATE = 83.0;

  useEffect(() => {
    async function loadData() {
      if (!groupId) return;
      try {
        setLoading(true);
        const groupDetails = await fetchGroupDetails(groupId);
        const expenseList = await fetchExpenses(groupId);
        setData(groupDetails);
        setExpenses(expenseList);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [groupId, refreshTrigger, localTrigger]);

  const handleDelete = async (expenseId, description) => {
    if (window.confirm(`Are you sure you want to delete "${description}"?`)) {
      try {
        await deleteExpense(expenseId);
        if (onRefresh) {
          onRefresh();
        } else {
          setLocalTrigger(prev => prev + 1);
        }
      } catch (err) {
        alert(`Error deleting expense: ${err.message}`);
      }
    }
  };

  const formatAmount = (amountInINR) => {
    if (usdMode) {
      const amountInUSD = amountInINR / CONVERSION_RATE;
      return `$${amountInUSD.toFixed(2)}`;
    }
    return `₹${amountInINR.toFixed(2)}`;
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'food':
        return (
          <span className="category-option-icon">🍔</span>
        );
      case 'groceries':
        return (
          <svg className="expense-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        );
      case 'utilities':
        return (
          <svg className="expense-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
          </svg>
        );
      case 'household':
      default:
        return (
          <svg className="expense-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        );
    }
  };

  // Group expenses by date
  const groupExpensesByDate = (expList) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const groups = {};
    
    const sorted = [...expList].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(exp => {
      const d = new Date(exp.date);
      const dateKey = `${months[d.getMonth()]} ${d.getDate()}`;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(exp);
    });

    return groups;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%', color: 'var(--text-secondary)' }}>
        Loading spend details...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'var(--accent-red)' }}>
        Error: {error}
      </div>
    );
  }

  if (!data) return null;

  const { group, debts, balances } = data;
  const currentUserId = currentUser?._id;

  const userOwesList = debts.filter(d => d.from === currentUserId);
  const userOwedList = debts.filter(d => d.to === currentUserId);

  let balanceTextElement = <span className="balance-text-settled">You are all settled up</span>;
  if (userOwesList.length > 0) {
    const firstDebt = userOwesList[0];
    balanceTextElement = (
      <span>
        You owe <span style={{ fontWeight: 600 }}>{firstDebt.toName}</span> <span className="balance-text-owe">{formatAmount(firstDebt.amount)}</span>
      </span>
    );
  } else if (userOwedList.length > 0) {
    const firstDebt = userOwedList[0];
    balanceTextElement = (
      <span>
        <span style={{ fontWeight: 600 }}>{firstDebt.fromName}</span> owes you <span className="balance-text-lent">{formatAmount(firstDebt.amount)}</span>
      </span>
    );
  }

  const groupedExpenses = groupExpensesByDate(expenses);

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {/* 1. Header */}
      <header className="group-header">
        <div className="header-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="header-icon-btn" onClick={onBack} title="Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          
          {/* Header Persona Switcher Selector */}
          {users.length > 0 && onUserSwitch && (
            <div className="header-switcher-container" style={{ display: 'flex', alignItems: 'center' }}>
              <select
                value={currentUser?._id || ''}
                onChange={(e) => {
                  const selectedUser = users.find(u => u._id === e.target.value);
                  if (selectedUser) onUserSwitch(selectedUser);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  padding: '6px 14px 6px 10px',
                  borderRadius: '16px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  fontWeight: '600',
                  outline: 'none',
                  cursor: 'pointer',
                  maxWidth: '180px',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  textAlignLast: 'center',
                  backgroundPosition: 'right 8px center',
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='white' d='M0 0l5 5 5-5z'/></svg>")`,
                  backgroundRepeat: 'no-repeat',
                  paddingRight: '22px'
                }}
              >
                {users.map(u => (
                  <option key={u._id} value={u._id} style={{ backgroundColor: 'var(--bg-secondary)', color: 'white' }}>
                    {u.name} {u._id === currentUser?._id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button className="header-icon-btn" title="Settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
        <h1 className="group-title">{group.name}</h1>
        <div className="members-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.8 }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          {group.members.length} people
        </div>
      </header>

      {/* 2. Balance Summary Bar */}
      <section className="balance-summary-bar">
        {balanceTextElement}
      </section>

      {/* 3. Action Buttons */}
      <section className="action-buttons-group">
        <button className="btn-action settle" onClick={onSettleUp}>
          Settle up
        </button>
        <button className="btn-action secondary" onClick={() => setUsdMode(!usdMode)}>
          <svg className="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="#9c27b0" strokeWidth="2.5" style={{ marginRight: '2px' }}>
            <path d="M6 12L12 6L18 12L12 18Z" fill="#a855f7"></path>
          </svg>
          {usdMode ? 'Convert to INR' : 'Convert to USD'}
        </button>
        <button className="btn-action secondary" onClick={onShowCharts}>
          <svg className="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="#9c27b0" strokeWidth="2.5" style={{ marginRight: '2px' }}>
            <path d="M6 12L12 6L18 12L12 18Z" fill="#a855f7"></path>
          </svg>
          Charts
        </button>
      </section>

      {/* 4. Expense List */}
      <section className="expense-list-container">
        {Object.keys(groupedExpenses).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No expenses recorded yet.
          </div>
        ) : (
          Object.keys(groupedExpenses).map(dateKey => (
            <div key={dateKey}>
              <div className="date-header">{dateKey}</div>
              {groupedExpenses[dateKey].map(exp => {
                const paidByMe = exp.paidBy._id === currentUserId;
                
                const mySplit = exp.splitWith.find(s => s.user?._id === currentUserId || s.user === currentUserId);
                const myShare = mySplit ? mySplit.share : 0;
                
                let balanceStatus = 'settled';
                let amountText = formatAmount(0);

                if (paidByMe) {
                  const lentAmount = exp.amount - myShare;
                  if (lentAmount > 0) {
                    balanceStatus = 'lent';
                    amountText = formatAmount(lentAmount);
                  }
                } else {
                  if (myShare > 0) {
                    balanceStatus = 'borrowed';
                    amountText = formatAmount(myShare);
                  }
                }

                const catClass = ['food', 'groceries', 'utilities', 'household'].includes(exp.category) 
                  ? exp.category 
                  : 'household';

                return (
                  <div className="expense-item" key={exp._id}>
                    <div className={`expense-icon-wrapper ${catClass}`}>
                      {getCategoryIcon(exp.category)}
                    </div>
                    <div className="expense-details">
                      <div className="expense-desc">{exp.description}</div>
                      <div className="expense-meta">
                        {exp.paidBy.name} paid {formatAmount(exp.amount)}
                      </div>
                    </div>
                    <div className="expense-balance-info">
                      {balanceStatus === 'lent' && (
                        <>
                          <div className="expense-user-action">you lent</div>
                          <div className="expense-amount-status lent">{amountText}</div>
                        </>
                      )}
                      {balanceStatus === 'borrowed' && (
                        <>
                          <div className="expense-user-action">you borrowed</div>
                          <div className="expense-amount-status borrowed">{amountText}</div>
                        </>
                      )}
                      {balanceStatus === 'settled' && (
                        <>
                          <div className="expense-user-action" style={{ opacity: 0.5 }}>not involved</div>
                          <div className="expense-amount-status settled">{amountText}</div>
                        </>
                      )}
                    </div>
                    <div className="expense-delete-wrapper" style={{ marginLeft: '14px', display: 'flex', alignItems: 'center' }}>
                      <button 
                        className="expense-delete-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(exp._id, exp.description);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ff8552',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px'
                        }}
                        title="Delete expense"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </section>

      {/* 5. Floating Action Button */}
      <button className="floating-add-btn" onClick={onAddExpense}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add expense
      </button>
    </div>
  );
}
