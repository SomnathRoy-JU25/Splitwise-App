import React, { useEffect, useState } from 'react';
import { fetchUsers, fetchGroups, fetchGroupDetails } from './api';
import GroupDetail from './components/GroupDetail';
import AddExpenseModal from './components/AddExpenseModal';
import SettleUpModal from './components/SettleUpModal';
import ChartsView from './components/ChartsView';
import ActivityFeed from './components/ActivityFeed';
import AccountView from './components/AccountView';
import CreateGroupModal from './components/CreateGroupModal';
import PinLogin from './components/PinLogin';

export default function App() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeTab, setActiveTab] = useState('groups'); // 'groups', 'friends', 'activity', 'account'
  const [usdMode, setUsdMode] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [isChartsOpen, setIsChartsOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  // Responsive state
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debtsList, setDebtsList] = useState([]);

  // Monitor screen resizing
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load initial configurations
  useEffect(() => {
    async function loadInitial() {
      try {
        setLoading(true);
        const usersList = await fetchUsers();
        setUsers(usersList);
        
        // Find Somnath Roy to be "You" by default
        const defaultUser = usersList.find(u => u.name.includes('Somnath')) || usersList[0];
        setCurrentUser(defaultUser);

        const groupsList = await fetchGroups();
        setGroups(groupsList);
        
        // Auto select 'Daily Spend' on load
        const defaultGroup = groupsList.find(g => g.name === 'Daily Spend') || groupsList[0];
        setSelectedGroup(defaultGroup);
        
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  // Sync debts list
  useEffect(() => {
    async function syncDebts() {
      if (!selectedGroup) return;
      try {
        const details = await fetchGroupDetails(selectedGroup._id);
        setDebtsList(details.debts || []);
      } catch (err) {
        console.error(err);
      }
    }
    syncDebts();
  }, [selectedGroup, refreshTrigger]);

  const handleRefresh = async () => {
    setRefreshTrigger(prev => prev + 1);
    // Re-fetch groups to update members list/names
    const groupsList = await fetchGroups();
    setGroups(groupsList);
    if (selectedGroup) {
      const updated = groupsList.find(g => g._id === selectedGroup._id);
      if (updated) setSelectedGroup(updated);
    }
  };

  const handleAddExpenseSuccess = () => {
    setIsAddExpenseOpen(false);
    handleRefresh();
  };

  const handleSettleUpSuccess = () => {
    setIsSettleUpOpen(false);
    handleRefresh();
  };

  const handleCreateGroupSuccess = (newGroup) => {
    setIsCreateGroupOpen(false);
    setSelectedGroup(newGroup);
    setActiveTab('groups');
    handleRefresh();
  };

  const formatAmount = (amountInINR) => {
    if (usdMode) {
      const amountInUSD = amountInINR / 83.0;
      return `$${amountInUSD.toFixed(2)}`;
    }
    return `₹${amountInINR.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#0b0c10', width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#ffffff', fontFamily: 'sans-serif' }}>
        Initializing Splitwise Clone...
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <PinLogin
        onLoginSuccess={() => {
          setIsLoggedIn(true);
        }}
      />
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: '#0b0c10', width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#ff8552', padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2>Initialization Failed</h2>
        <p style={{ marginTop: '10px' }}>{error}</p>
        <p style={{ marginTop: '20px', color: '#9aa0a6', fontSize: '13px' }}>Is the Node.js backend server running?</p>
      </div>
    );
  }

  // --- RENDERING DESKTOP LAYOUT ---
  if (isDesktop) {
    return (
      <div className="desktop-layout-container">
        {/* COLUMN 1: LEFT SIDEBAR (User Profile + Navigation + Groups) */}
        <aside className="desktop-sidebar-left">
          {/* User Persona profile */}
          <div className="sidebar-profile-card">
            <span className="sidebar-profile-avatar">{currentUser.avatar}</span>
            <div className="sidebar-profile-info">
              <div className="sidebar-profile-name">{currentUser.name}</div>
              <div className="sidebar-profile-email">{currentUser.email}</div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="sidebar-nav-section">
            <h4 className="sidebar-header-label">Menu</h4>
            <nav className="sidebar-nav-links">
              <button 
                className={`sidebar-nav-btn ${activeTab === 'groups' ? 'active' : ''}`}
                onClick={() => setActiveTab('groups')}
              >
                📁 Groups
              </button>
              <button 
                className={`sidebar-nav-btn ${activeTab === 'friends' ? 'active' : ''}`}
                onClick={() => setActiveTab('friends')}
              >
                👥 Friends
              </button>
              <button 
                className={`sidebar-nav-btn ${activeTab === 'activity' ? 'active' : ''}`}
                onClick={() => setActiveTab('activity')}
              >
                📈 Activity Log
              </button>
              <button 
                className={`sidebar-nav-btn ${activeTab === 'account' ? 'active' : ''}`}
                onClick={() => setActiveTab('account')}
              >
                ⚙️ Account settings
              </button>
            </nav>
          </div>

          {/* Groups Switcher section */}
          <div className="sidebar-groups-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 className="sidebar-header-label" style={{ margin: 0 }}>My Groups</h4>
              <button className="sidebar-add-group-btn" onClick={() => setIsCreateGroupOpen(true)}>
                + New
              </button>
            </div>

            <div className="sidebar-groups-list">
              {groups.map(g => (
                <button
                  key={g._id}
                  className={`sidebar-group-item ${selectedGroup && selectedGroup._id === g._id && activeTab === 'groups' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedGroup(g);
                    setActiveTab('groups');
                  }}
                >
                  <span style={{ fontSize: '16px' }}>📂</span>
                  <span className="sidebar-group-name-text">{g.name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>({g.members.length})</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* COLUMN 2: CENTER MAIN CONTENT */}
        <main className="desktop-main-content">
          {activeTab === 'groups' && selectedGroup && (
            <GroupDetail
              groupId={selectedGroup._id}
              currentUser={currentUser}
              onSettleUp={() => setIsSettleUpOpen(true)}
              onAddExpense={() => setIsAddExpenseOpen(true)}
              onShowCharts={() => setIsChartsOpen(true)}
              usdMode={usdMode}
              setUsdMode={setUsdMode}
              refreshTrigger={refreshTrigger}
              onRefresh={handleRefresh}
              users={users}
              onUserSwitch={(selectedUser) => {
                setCurrentUser(selectedUser);
                handleRefresh();
              }}
            />
          )}

          {activeTab === 'friends' && selectedGroup && (
            <div className="friends-container" style={{ height: '100%', overflowY: 'auto' }}>
              <h2 className="friends-title">Friends Balance Summary</h2>
              {selectedGroup.members
                .filter(m => m._id !== currentUser._id)
                .map(friend => {
                  const owesMeDebt = debtsList.find(d => d.from === friend._id && d.to === currentUser._id);
                  const iOweDebt = debtsList.find(d => d.from === currentUser._id && d.to === friend._id);

                  let balanceColorClass = 'settled';
                  let balanceText = 'You are settled up';

                  if (owesMeDebt) {
                    balanceColorClass = 'lent';
                    balanceText = `owes you ${formatAmount(owesMeDebt.amount)}`;
                  } else if (iOweDebt) {
                    balanceColorClass = 'borrowed';
                    balanceText = `you owe them ${formatAmount(iOweDebt.amount)}`;
                  }

                  return (
                    <div className="friend-item" key={friend._id}>
                      <span className="friend-avatar">{friend.avatar}</span>
                      <div className="friend-info">
                        <div className="friend-name">{friend.name}</div>
                        <div className={`friend-status-text ${balanceColorClass}`}>
                          {balanceText}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {activeTab === 'activity' && (
            <div style={{ height: '100%', overflowY: 'auto' }}>
              <ActivityFeed refreshTrigger={refreshTrigger} />
            </div>
          )}

          {activeTab === 'account' && (
            <div style={{ height: '100%', overflowY: 'auto' }}>
              <AccountView
                currentUser={currentUser}
                users={users}
                onUserSwitch={(selectedUser) => {
                  setCurrentUser(selectedUser);
                  handleRefresh();
                }}
              />
            </div>
          )}
        </main>

        {/* COLUMN 3: RIGHT PANEL (Live charts & balances for Groups tab) */}
        <aside className="desktop-sidebar-right">
          {activeTab === 'groups' && selectedGroup ? (
            <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
              <ChartsView groupId={selectedGroup._id} inline={true} />
              
              {/* Sidebar member balances */}
              <div className="chart-section" style={{ marginTop: '20px', padding: '14px' }}>
                <h3 className="chart-section-title" style={{ fontSize: '14px', marginBottom: '12px' }}>Group Members</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedGroup.members.map(member => (
                    <div key={member._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{member.avatar}</span>
                        <span>{member.name} {member._id === currentUser._id ? '(You)' : ''}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', padding: '20px', textAlign: 'center', fontSize: '13px' }}>
              Select a group in the menu to see visual analytics.
            </div>
          )}
        </aside>

        {/* Modals Overlays (Modals are still used for popup actions like adding expense or settlements) */}
        {isAddExpenseOpen && selectedGroup && (
          <AddExpenseModal
            group={selectedGroup}
            onClose={() => setIsAddExpenseOpen(false)}
            onSuccess={handleAddExpenseSuccess}
          />
        )}

        {isSettleUpOpen && selectedGroup && (
          <SettleUpModal
            group={selectedGroup}
            debts={debtsList}
            currentUser={currentUser}
            onClose={() => setIsSettleUpOpen(false)}
            onSuccess={handleSettleUpSuccess}
          />
        )}

        {isCreateGroupOpen && (
          <CreateGroupModal
            users={users}
            currentUser={currentUser}
            onClose={() => setIsCreateGroupOpen(false)}
            onSuccess={handleCreateGroupSuccess}
          />
        )}
      </div>
    );
  }

  // --- RENDERING MOBILE LAYOUT ---
  return (
    <div className="app-device-wrapper">
      {/* Scrollable View Area */}
      <main className="app-content">
        {activeTab === 'groups' && (
          // Mobile Groups navigation
          selectedGroup ? (
            <GroupDetail
              groupId={selectedGroup._id}
              currentUser={currentUser}
              onSettleUp={() => setIsSettleUpOpen(true)}
              onAddExpense={() => setIsAddExpenseOpen(true)}
              onShowCharts={() => setIsChartsOpen(true)}
              usdMode={usdMode}
              setUsdMode={setUsdMode}
              refreshTrigger={refreshTrigger}
              // Back arrow resets selectedGroup, returning to the mobile Groups List
              onBack={() => setSelectedGroup(null)}
              onRefresh={handleRefresh}
              users={users}
              onUserSwitch={(selectedUser) => {
                setCurrentUser(selectedUser);
                handleRefresh();
              }}
            />
          ) : (
            // Groups List
            <div className="friends-container" style={{ height: '100%', overflowY: 'auto', paddingBottom: '90px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 className="friends-title" style={{ margin: 0 }}>Groups</h2>
                <button 
                  className="sidebar-add-group-btn" 
                  onClick={() => setIsCreateGroupOpen(true)}
                  style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px', backgroundColor: 'var(--accent-green)', border: 'none', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                >
                  + New Group
                </button>
              </div>

              {groups.map(g => (
                <div 
                  key={g._id} 
                  className="friend-item" 
                  onClick={() => setSelectedGroup(g)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="friend-avatar">📂</span>
                  <div className="friend-info">
                    <div className="friend-name">{g.name}</div>
                    <div className="friend-status-text" style={{ color: 'var(--text-secondary)' }}>
                      {g.members.length} members
                    </div>
                  </div>
                  <span style={{ color: 'var(--text-muted)' }}>➔</span>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'friends' && selectedGroup && (
          <div className="friends-container">
            <h2 className="friends-title">Friends</h2>
            {selectedGroup.members
              .filter(m => m._id !== currentUser._id)
              .map(friend => {
                const owesMeDebt = debtsList.find(d => d.from === friend._id && d.to === currentUser._id);
                const iOweDebt = debtsList.find(d => d.from === currentUser._id && d.to === friend._id);

                let balanceColorClass = 'settled';
                let balanceText = 'You are settled up';

                if (owesMeDebt) {
                  balanceColorClass = 'lent';
                  balanceText = `owes you ${formatAmount(owesMeDebt.amount)}`;
                } else if (iOweDebt) {
                  balanceColorClass = 'borrowed';
                  balanceText = `you owe them ${formatAmount(iOweDebt.amount)}`;
                }

                return (
                  <div className="friend-item" key={friend._id}>
                    <span className="friend-avatar">{friend.avatar}</span>
                    <div className="friend-info">
                      <div className="friend-name">{friend.name}</div>
                      <div className={`friend-status-text ${balanceColorClass}`}>
                        {balanceText}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {activeTab === 'activity' && (
          <ActivityFeed refreshTrigger={refreshTrigger} />
        )}

        {activeTab === 'account' && (
          <AccountView
            currentUser={currentUser}
            users={users}
            onUserSwitch={(selectedUser) => {
              setCurrentUser(selectedUser);
              handleRefresh();
            }}
          />
        )}
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="bottom-nav">
        <button 
          className={`nav-tab ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          <svg className="nav-tab-icon" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          Groups
        </button>

        <button 
          className={`nav-tab ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          <svg className="nav-tab-icon" viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Friends
        </button>

        <button 
          className={`nav-tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <svg className="nav-tab-icon" viewBox="0 0 24 24">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
          Activity
        </button>

        <button 
          className={`nav-tab ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          <span style={{ fontSize: '20px', lineHeight: 1 }}>
            {currentUser ? currentUser.avatar : '👤'}
          </span>
          Account
        </button>
      </nav>

      {/* Modals Overlays */}
      {isAddExpenseOpen && selectedGroup && (
        <AddExpenseModal
          group={selectedGroup}
          onClose={() => setIsAddExpenseOpen(false)}
          onSuccess={handleAddExpenseSuccess}
        />
      )}

      {isSettleUpOpen && selectedGroup && (
        <SettleUpModal
          group={selectedGroup}
          debts={debtsList}
          currentUser={currentUser}
          onClose={() => setIsSettleUpOpen(false)}
          onSuccess={handleSettleUpSuccess}
        />
      )}

      {isChartsOpen && selectedGroup && (
        <ChartsView
          groupId={selectedGroup._id}
          onClose={() => setIsChartsOpen(false)}
        />
      )}

      {isCreateGroupOpen && (
        <CreateGroupModal
          users={users}
          currentUser={currentUser}
          onClose={() => setIsCreateGroupOpen(false)}
          onSuccess={handleCreateGroupSuccess}
        />
      )}
    </div>
  );
}
