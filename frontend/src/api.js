// API helper functions to communicate with the Node.js/Express backend
// Using relative paths which are proxied by Vite dev server in development,
// or a custom API base URL (VITE_API_URL) in production.

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function fetchUsers() {
  const res = await fetch(`${API_BASE}/api/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function fetchGroups() {
  const res = await fetch(`${API_BASE}/api/groups`);
  if (!res.ok) throw new Error('Failed to fetch groups');
  return res.json();
}

export async function fetchGroupDetails(groupId) {
  const res = await fetch(`${API_BASE}/api/groups/${groupId}`);
  if (!res.ok) throw new Error('Failed to fetch group details');
  return res.json();
}

export async function fetchExpenses(groupId) {
  const res = await fetch(`${API_BASE}/api/groups/${groupId}/expenses`);
  if (!res.ok) throw new Error('Failed to fetch expenses');
  return res.json();
}

export async function createExpense(groupId, data) {
  const res = await fetch(`${API_BASE}/api/groups/${groupId}/expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create expense');
  }
  return res.json();
}

export async function createSettlement(groupId, data) {
  const res = await fetch(`${API_BASE}/api/groups/${groupId}/settle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create settlement');
  }
  return res.json();
}

export async function fetchCharts(groupId) {
  const res = await fetch(`${API_BASE}/api/groups/${groupId}/charts`);
  if (!res.ok) throw new Error('Failed to fetch chart data');
  return res.json();
}

export async function fetchActivity() {
  const res = await fetch(`${API_BASE}/api/activity`);
  if (!res.ok) throw new Error('Failed to fetch activity log');
  return res.json();
}

export async function deleteExpense(expenseId) {
  const res = await fetch(`${API_BASE}/api/expenses/${expenseId}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete expense');
  }
  return res.json();
}
