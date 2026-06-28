const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  category: {
    type: String,
    default: 'general',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  splitWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    share: {
      type: Number,
      required: true,
      min: 0,
    }
  }]
}, {
  timestamps: true,
});

module.exports = mongoose.model('Expense', expenseSchema);
