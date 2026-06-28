const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');

// Helpers: Greedy algorithm to simplify debts
function simplifyDebts(balances, usersMap) {
  const debtors = [];
  const creditors = [];

  for (const userId in balances) {
    const bal = balances[userId];
    if (bal < -0.01) {
      debtors.push({ userId, amount: -bal });
    } else if (bal > 0.01) {
      creditors.push({ userId, amount: bal });
    }
  }

  // Sort descending
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const debts = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const minAmount = Math.min(debtor.amount, creditor.amount);
    
    debts.push({
      from: debtor.userId,
      fromName: usersMap[debtor.userId]?.name || 'Unknown',
      to: creditor.userId,
      toName: usersMap[creditor.userId]?.name || 'Unknown',
      amount: Math.round(minAmount * 100) / 100
    });

    debtor.amount -= minAmount;
    creditor.amount -= minAmount;

    if (debtor.amount <= 0.01) i++;
    if (creditor.amount <= 0.01) j++;
  }

  return debts;
}

// 1. GET /api/users - Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. POST /api/users - Create a user
router.post('/users', async (req, res) => {
  const { name, email, avatar } = req.body;
  try {
    const user = new User({ name, email, avatar });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. GET /api/groups - Get all groups
router.get('/groups', async (req, res) => {
  try {
    const groups = await Group.find().populate('members');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. POST /api/groups - Create a group
router.post('/groups', async (req, res) => {
  const { name, members } = req.body;
  try {
    const group = new Group({ name, members });
    await group.save();
    const populated = await group.populate('members');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 5. GET /api/groups/:id - Get group details, balances and simplified debts
router.get('/groups/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('members');
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const expenses = await Expense.find({ group: group._id });
    const settlements = await Settlement.find({ group: group._id });

    // Initialize balance sheet
    const balances = {};
    const usersMap = {};
    group.members.forEach(member => {
      balances[member._id] = 0;
      usersMap[member._id] = member;
    });

    // Process expenses
    expenses.forEach(exp => {
      const payerId = exp.paidBy.toString();
      if (balances[payerId] !== undefined) {
        balances[payerId] += exp.amount;
      }
      exp.splitWith.forEach(split => {
        const splitUserId = split.user.toString();
        if (balances[splitUserId] !== undefined) {
          balances[splitUserId] -= split.share;
        }
      });
    });

    // Process settlements
    settlements.forEach(settle => {
      const fromId = settle.from.toString();
      const toId = settle.to.toString();
      if (balances[fromId] !== undefined) {
        balances[fromId] += settle.amount;
      }
      if (balances[toId] !== undefined) {
        balances[toId] -= settle.amount;
      }
    });

    // Round balances
    for (const key in balances) {
      balances[key] = Math.round(balances[key] * 100) / 100;
    }

    const simplifiedDebts = simplifyDebts(balances, usersMap);

    res.json({
      group,
      balances,
      debts: simplifiedDebts,
      totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. GET /api/groups/:id/expenses - Get all expenses for a group
router.get('/groups/:id/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find({ group: req.params.id })
      .populate('paidBy', 'name avatar')
      .populate('splitWith.user', 'name avatar')
      .sort({ date: -1, createdAt: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. POST /api/groups/:id/expenses - Add an expense
router.post('/groups/:id/expenses', async (req, res) => {
  const { description, amount, paidBy, category, date, splitWith } = req.body;
  const groupId = req.params.id;

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    // If splitWith is not provided, split equally among all members
    let finalSplitWith = splitWith;
    if (!finalSplitWith || finalSplitWith.length === 0) {
      const share = amount / group.members.length;
      finalSplitWith = group.members.map(mId => ({
        user: mId,
        share: Math.round(share * 100) / 100
      }));
    }

    const expense = new Expense({
      description,
      amount,
      paidBy,
      group: groupId,
      category: category || 'general',
      date: date || new Date(),
      splitWith: finalSplitWith
    });
    

    await expense.save();
    const populated = await expense.populate([
      { path: 'paidBy', select: 'name avatar' },
      { path: 'splitWith.user', select: 'name avatar' }
    ]);
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 8. POST /api/groups/:id/settle - Add a settlement
router.post('/groups/:id/settle', async (req, res) => {
  const { from, to, amount, date } = req.body;
  const groupId = req.params.id;

  try {
    const settlement = new Settlement({
      from,
      to,
      amount,
      group: groupId,
      date: date || new Date()
    });

    await settlement.save();
    const populated = await settlement.populate([
      { path: 'from', select: 'name avatar' },
      { path: 'to', select: 'name avatar' }
    ]);
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 9. GET /api/groups/:id/charts - Aggregated chart data
router.get('/groups/:id/charts', async (req, res) => {
  try {
    const groupId = req.params.id;
    const expenses = await Expense.find({ group: groupId }).populate('paidBy', 'name');

    // 1. Category aggregation
    const categoryBreakdown = {};
    // 2. Member spending aggregate (total paid by each user)
    const memberPaid = {};
    // 3. Member consumption aggregate (total split share consumed by each user)
    const memberConsumed = {};

    expenses.forEach(exp => {
      // Category
      const cat = exp.category || 'general';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + exp.amount;

      // Paid By
      const payerId = exp.paidBy._id.toString();
      const payerName = exp.paidBy.name;
      memberPaid[payerName] = (memberPaid[payerName] || 0) + exp.amount;

      // Consumed (Splits)
      exp.splitWith.forEach(split => {
        // Find member name or populate it manually. Since splits are object ids, 
        // we can fetch group members and resolve, or aggregate from populated values.
        // For simplicity, we can do it via user database mapping, let's load users.
      });
    });

    // Let's resolve member consumption correctly by mapping users
    const group = await Group.findById(groupId).populate('members');
    const usersMap = {};
    group.members.forEach(m => {
      usersMap[m._id.toString()] = m.name;
      memberConsumed[m.name] = 0;
      if (!memberPaid[m.name]) memberPaid[m.name] = 0;
    });

    expenses.forEach(exp => {
      exp.splitWith.forEach(split => {
        const uId = split.user.toString();
        const uName = usersMap[uId] || 'Deleted User';
        memberConsumed[uName] = (memberConsumed[uName] || 0) + split.share;
      });
    });

    res.json({
      categoryBreakdown,
      memberPaid,
      memberConsumed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. GET /api/activity - Get recent activities across groups
router.get('/activity', async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate('paidBy', 'name avatar')
      .populate('group', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    const settlements = await Settlement.find()
      .populate('from', 'name avatar')
      .populate('to', 'name avatar')
      .populate('group', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // Merge and sort
    const activities = [
      ...expenses.map(e => ({
        type: 'expense',
        id: e._id,
        user: e.paidBy,
        description: `added "${e.description}" of ₹${e.amount.toFixed(2)}`,
        groupName: e.group ? e.group.name : 'Unknown Group',
        date: e.createdAt
      })),
      ...settlements.map(s => ({
        type: 'settlement',
        id: s._id,
        user: s.from,
        description: `paid ${s.to ? s.to.name : 'someone'} ₹${s.amount.toFixed(2)}`,
        groupName: s.group ? s.group.name : 'Unknown Group',
        date: s.createdAt
      }))
    ];

    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(activities.slice(0, 15));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. DELETE /api/expenses/:id - Delete an expense
router.delete('/expenses/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
