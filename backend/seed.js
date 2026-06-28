const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Group = require('./models/Group');
const Expense = require('./models/Expense');
const Settlement = require('./models/Settlement');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for Seeding...');

    // Clear existing data
    await User.deleteMany();
    await Group.deleteMany();
    await Expense.deleteMany();
    await Settlement.deleteMany();
    console.log('Cleared database...');

    // 1. Create Users
    const somnath = await User.create({
      name: 'Somnath Roy',
      email: 'somnathroy0340@gmail.com',
      avatar: '👨‍💻'
    });

    const souvik = await User.create({
      name: 'Souvik S.',
      email: 'souvik.s@example.com',
      avatar: '🧑'
    });

    const ruhina = await User.create({
      name: 'Ruhina K.',
      email: 'ruhina.k@example.com',
      avatar: '👩'
    });

    const amit = await User.create({
      name: 'Amit B.',
      email: 'amit@example.com',
      avatar: '🧔'
    });

    const pooja = await User.create({
      name: 'Pooja M.',
      email: 'pooja@example.com',
      avatar: '👩‍🦰'
    });

    console.log('Seeded Users (Somnath, Souvik, Ruhina, Amit, Pooja)...');

    // 2. Create Group
    const group = await Group.create({
      name: 'Daily Spend',
      members: [somnath._id, souvik._id]
    });

    console.log('Seeded Group "Daily Spend"...');

    // 3. Create Expenses
    // We want the balance to be exactly "You owe Souvik S. ₹36.00" (Somnath's balance: -36.00)
    const expenses = [
      {
        description: 'Room Setup Deposit',
        amount: 375.00,
        paidBy: souvik._id,
        category: 'household',
        date: new Date('2026-06-24T12:00:00Z'),
        splitWith: [
          { user: somnath._id, share: 187.50 },
          { user: souvik._id, share: 187.50 }
        ]
      },
      {
        description: 'Water',
        amount: 40.00,
        paidBy: somnath._id,
        category: 'utilities',
        date: new Date('2026-06-25T10:00:00Z'),
        splitWith: [
          { user: somnath._id, share: 20.00 },
          { user: souvik._id, share: 20.00 }
        ]
      },
      {
        description: 'Pressure Cooker',
        amount: 738.00,
        paidBy: somnath._id,
        category: 'household',
        date: new Date('2026-06-25T16:00:00Z'),
        splitWith: [
          { user: somnath._id, share: 369.00 },
          { user: souvik._id, share: 369.00 }
        ]
      },
      {
        description: 'Chal',
        amount: 347.00,
        paidBy: souvik._id,
        category: 'groceries',
        date: new Date('2026-06-27T09:00:00Z'),
        splitWith: [
          { user: somnath._id, share: 173.50 },
          { user: souvik._id, share: 173.50 }
        ]
      },
      {
        description: 'Alu peyaj bazar ruhina...',
        amount: 100.00,
        paidBy: souvik._id,
        category: 'groceries',
        date: new Date('2026-06-27T10:00:00Z'),
        splitWith: [
          { user: somnath._id, share: 50.00 },
          { user: souvik._id, share: 50.00 }
        ]
      },
      {
        description: 'Doi',
        amount: 20.00,
        paidBy: souvik._id,
        category: 'food',
        date: new Date('2026-06-27T11:00:00Z'),
        splitWith: [
          { user: somnath._id, share: 10.00 },
          { user: souvik._id, share: 10.00 }
        ]
      },
      {
        description: 'Murgir jibon',
        amount: 108.00,
        paidBy: souvik._id,
        category: 'food',
        date: new Date('2026-06-27T13:00:00Z'),
        splitWith: [
          { user: somnath._id, share: 54.00 },
          { user: souvik._id, share: 54.00 }
        ]
      },
      {
        description: 'Dokhin Bangla er Bara Samb...',
        amount: 60.00,
        paidBy: somnath._id,
        category: 'food',
        date: new Date('2026-06-27T18:00:00Z'),
        splitWith: [
          { user: somnath._id, share: 30.00 },
          { user: souvik._id, share: 30.00 }
        ]
      },
      {
        description: 'Soyabean',
        amount: 40.00,
        paidBy: somnath._id,
        category: 'food',
        date: new Date('2026-06-27T20:00:00Z'),
        splitWith: [
          { user: somnath._id, share: 20.00 },
          { user: souvik._id, share: 20.00 }
        ]
      }
    ];

    for (const exp of expenses) {
      exp.group = group._id;
      await Expense.create(exp);
    }

    console.log('Seeded Expenses successfully.');
    console.log('Seeding complete. Exiting.');
    process.exit(0);
  } catch (error) {
    console.error(`Error during seeding: ${error.message}`);
    process.exit(1);
  }
};

seedData();
