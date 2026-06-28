const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Group = require('./models/Group');
const Expense = require('./models/Expense');
const Settlement = require('./models/Settlement');

dotenv.config();

async function runVerification() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for Verification...');

    const group = await Group.findOne({ name: 'Daily Spend' }).populate('members');
    if (!group) {
      console.error('Group "Daily Spend" not found. Please run "npm run seed" first.');
      process.exit(1);
    }

    const expenses = await Expense.find({ group: group._id });
    const settlements = await Settlement.find({ group: group._id });

    const balances = {};
    group.members.forEach(member => {
      balances[member._id.toString()] = 0;
    });

    expenses.forEach(exp => {
      const payerId = exp.paidBy.toString();
      balances[payerId] += exp.amount;
      exp.splitWith.forEach(split => {
        balances[split.user.toString()] -= split.share;
      });
    });

    settlements.forEach(settle => {
      balances[settle.from.toString()] += settle.amount;
      balances[settle.to.toString()] -= settle.amount;
    });

    console.log('\n--- VERIFICATION RESULTS ---');
    let somnathBal = 0;
    let souvikBal = 0;
    
    group.members.forEach(m => {
      const bal = Math.round(balances[m._id.toString()] * 100) / 100;
      console.log(`${m.name}: Balance = ₹${bal.toFixed(2)}`);
      if (m.name.includes('Somnath')) {
        somnathBal = bal;
      } else if (m.name.includes('Souvik')) {
        souvikBal = bal;
      }
    });

    console.log('----------------------------');
    if (somnathBal === -36.00 && souvikBal === 36.00) {
      console.log('✅ SUCCESS: Somnath owes Souvik exactly ₹36.00, matching the screenshot!');
    } else {
      console.error('❌ FAIL: Balance does not match. Somnath:', somnathBal, 'Souvik:', souvikBal);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error during verification:', err.message);
    process.exit(1);
  }
}

runVerification();
