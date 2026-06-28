import React, { useEffect, useState } from 'react';
import { fetchActivity } from '../api';

export default function ActivityFeed({ refreshTrigger }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadActivity() {
      try {
        setLoading(true);
        const log = await fetchActivity();
        setActivities(log);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadActivity();
  }, [refreshTrigger]);

  const formatDate = (dateStr) => {
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <div className="activity-feed-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
        Loading activity...
      </div>
    );
  }

  if (error) {
    return (
      <div className="activity-feed-container" style={{ color: 'var(--accent-red)' }}>
        Error loading activity: {error}
      </div>
    );
  }

  return (
    <div className="activity-feed-container">
      <h2 className="activity-title">Recent Activity</h2>
      
      {activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          No recent activity to show.
        </div>
      ) : (
        activities.map((act) => (
          <div className="activity-card" key={act.id}>
            <div className="activity-avatar">
              {act.type === 'expense' ? '💸' : '🤝'}
            </div>
            <div className="activity-info">
              <div className="activity-text">
                <span className="activity-user-name">{act.user?.name || 'Someone'}</span>{' '}
                {act.description}{' '}
                <span className="activity-group-badge">{act.groupName}</span>
              </div>
              <div className="activity-time">{formatDate(act.date)}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
