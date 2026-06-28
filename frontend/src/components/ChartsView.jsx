import React, { useEffect, useState } from 'react';
import { fetchCharts } from '../api';

export default function ChartsView({ groupId, onClose, inline = false }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadChartData() {
      if (!groupId) return;
      try {
        setLoading(true);
        const data = await fetchCharts(groupId);
        setChartData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadChartData();
  }, [groupId]);

  // Standard category setup
  const catColors = {
    food: '#ff9800',       // Orange
    groceries: '#4caf50',  // Green
    utilities: '#2196f3',  // Blue
    household: '#9c27b0',  // Purple
    general: '#9e9e9e'     // Grey
  };

  const catLabels = {
    food: '🍔 Food',
    groceries: '🛒 Grocery',
    utilities: '💧 Utility',
    household: '📄 Household',
    general: '⚙️ General'
  };

  if (loading) {
    if (inline) {
      return (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)', fontSize: '13px' }}>
          Loading spending charts...
        </div>
      );
    }
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-content-sheet" onClick={(e) => e.stopPropagation()}>
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            Loading spending charts...
          </div>
        </div>
      </div>
    );
  }

  if (error || !chartData) {
    if (inline) {
      return (
        <div style={{ padding: '16px', color: 'var(--accent-red)', fontSize: '13px' }}>
          {error || 'No chart data found'}
        </div>
      );
    }
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-content-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Spending Analysis</h2>
            <button className="modal-close-btn" onClick={onClose}>&times;</button>
          </div>
          <div style={{ padding: '20px', color: 'var(--accent-red)' }}>
            {error || 'No data found'}
          </div>
        </div>
      </div>
    );
  }

  const { categoryBreakdown, memberPaid, memberConsumed } = chartData;
  const totalSpent = Object.values(categoryBreakdown).reduce((sum, v) => sum + v, 0);

  // Generate SVG segments for Category Doughnut Chart
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  const segments = Object.entries(categoryBreakdown).map(([cat, amount]) => {
    const percent = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
    const strokeDash = (percent / 100) * circumference;
    const strokeOffset = circumference - ((accumulatedPercent / 100) * circumference);
    accumulatedPercent += percent;

    return {
      category: cat,
      amount,
      percent,
      strokeDashArray: `${strokeDash} ${circumference - strokeDash}`,
      strokeDashOffset: strokeOffset,
      color: catColors[cat] || catColors.general
    };
  });

  const maxMemberValue = Math.max(
    ...Object.values(memberPaid),
    ...Object.values(memberConsumed),
    1
  );

  const mainChartsContent = (
    <div className="charts-content">
      {totalSpent === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)', fontSize: '13px' }}>
          No expenses recorded yet.
        </div>
      ) : (
        <>
          {/* Category Breakdown (Doughnut Chart) */}
          <div className="chart-section" style={inline ? { padding: '14px', marginTop: '0' } : {}}>
            <h3 className="chart-section-title" style={inline ? { fontSize: '14px', marginBottom: '12px' } : {}}>Category Breakdown</h3>
            <div className="svg-donut-container" style={inline ? { gap: '16px', flexDirection: 'column', minHeight: 'auto' } : {}}>
              <svg className="svg-donut-chart" viewBox="0 0 120 120" style={inline ? { width: '100px', height: '100px' } : {}}>
                <circle className="svg-donut-bg" cx="60" cy="60" r={radius} />
                {segments.map((seg, idx) => (
                  <circle
                    key={idx}
                    className="svg-donut-segment"
                    cx="60"
                    cy="60"
                    r={radius}
                    stroke={seg.color}
                    strokeDasharray={seg.strokeDashArray}
                    strokeDashoffset={seg.strokeDashOffset}
                  />
                ))}
              </svg>
              <div className="donut-center-text" style={inline ? { transform: 'translateY(-14px)' } : {}}>
                <span className="donut-center-val" style={inline ? { fontSize: '15px' } : {}}>₹{Math.round(totalSpent)}</span>
                {!inline && <span className="donut-center-lbl">Total Spent</span>}
              </div>

              <div className="chart-legend" style={{ width: '100%' }}>
                {segments.map((seg, idx) => (
                  <div className="legend-item" key={idx} style={inline ? { fontSize: '12px' } : {}}>
                    <span className="legend-label-group">
                      <span className="legend-color-box" style={{ backgroundColor: seg.color }}></span>
                      <span>{catLabels[seg.category] || seg.category}</span>
                    </span>
                    <span className="legend-value">
                      ₹{seg.amount.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Members Paid vs Consumed Comparison Bar Chart */}
          <div className="chart-section" style={inline ? { padding: '14px', marginTop: '14px' } : {}}>
            <h3 className="chart-section-title" style={inline ? { fontSize: '14px', marginBottom: '12px' } : {}}>Paid vs Consumed</h3>
            <div className="bar-chart-container" style={inline ? { gap: '12px' } : {}}>
              {Object.keys(memberPaid).map((name) => {
                const paid = memberPaid[name] || 0;
                const consumed = memberConsumed[name] || 0;
                const paidWidth = `${(paid / maxMemberValue) * 100}%`;
                const consumedWidth = `${(consumed / maxMemberValue) * 100}%`;

                return (
                  <div className="bar-row" key={name}>
                    <div style={{ fontWeight: '600', fontSize: inline ? '12px' : '14px', marginBottom: '2px' }}>
                      👤 {name}
                    </div>
                    {/* Paid Bar */}
                    <div className="bar-label-group" style={inline ? { fontSize: '11px' } : {}}>
                      <span style={{ color: 'var(--text-secondary)' }}>Paid</span>
                      <span style={{ fontWeight: '600', color: 'var(--accent-green)' }}>₹{paid.toFixed(0)}</span>
                    </div>
                    <div className="bar-bg-container" style={{ height: inline ? '8px' : '12px', marginBottom: '4px' }}>
                      <div className="bar-fill paid" style={{ width: paidWidth }}></div>
                    </div>

                    {/* Consumed Bar */}
                    <div className="bar-label-group" style={inline ? { fontSize: '11px' } : {}}>
                      <span style={{ color: 'var(--text-secondary)' }}>Consumed</span>
                      <span style={{ fontWeight: '600', color: 'var(--accent-blue)' }}>₹{consumed.toFixed(0)}</span>
                    </div>
                    <div className="bar-bg-container" style={{ height: inline ? '8px' : '12px' }}>
                      <div className="bar-fill consumed" style={{ width: consumedWidth }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (inline) {
    return mainChartsContent;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Spending Analysis</h2>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>
        {mainChartsContent}
      </div>
    </div>
  );
}
