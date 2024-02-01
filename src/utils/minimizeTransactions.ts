// ChatGPT with the clutch

import type { expense_splits, expenses, group_users } from '@prisma/client';

export interface IExpense extends expenses {
  initial_payer: group_users;
  expense_splits: expense_splits[];
}

interface IMinimizeExpense {
  payer: string;
  amount: number;
  participants: {
    name: string;
    share: number;
  }[];
}

type Participant = {
  name: string;
  share: number;
};

type Expense = {
  payer: string;
  amount: number;
  participants: Participant[];
};

type Transaction = {
  from: string;
  to: string;
  amount: number;
};

export const calculateTransactions = (data: IExpense[]) => {
  let expenses: IMinimizeExpense[] = [];

  for (const item of data) {
    expenses.push({
      payer: item.initial_payer.id,
      amount: item.expense_total,
      participants: item.expense_splits.map((split) => ({
        name: split.group_usersId,
        share: split.percentage,
      })),
    });
  }

  return minimizeTransactions(expenses);
};

// Function to minimize the number of transactions required to settle debts in a group
const minimizeTransactions = (expenses: Expense[]): Transaction[] => {
  // Calculate the net balance for each person
  let balances: { [key: string]: number } = expenses.reduce(
    (acc: any, { payer, amount, participants }) => {
      let totalShares = participants.reduce((sum, p) => sum + p.share, 0);

      // Calculate and update the balance for each participant
      participants.forEach(({ name, share }) => {
        const owedAmount = amount * (share / totalShares);
        acc[name] = (acc[name] || 0) - owedAmount;
      });

      // Update the balance for the payer
      acc[payer] = (acc[payer] || 0) + amount;
      return acc;
    },
    {},
  );

  // Recursive function to settle debts
  const settleDebts = (
    debts: { person: string; amount: number }[],
    transactions: Transaction[] = [],
  ): Transaction[] => {
    debts = Object.entries(balances)
      .map(([person, amount]) => ({ person, amount }))
      .filter((debt) => Math.abs(debt.amount) > 0.01);
    if (debts.length === 0) return transactions;

    // Sort debts from smallest to largest
    debts.sort((a, b) => a.amount - b.amount);

    // Find the person with the largest debt and the person with the largest credit
    let minDebt = debts[0],
      maxCredit = debts[debts.length - 1];
    let amount = Math.min(-minDebt.amount, maxCredit.amount);
    balances[minDebt.person] += amount;
    balances[maxCredit.person] -= amount;

    // Record this transaction and proceed to the next
    transactions.push({ from: minDebt.person, to: maxCredit.person, amount });
    return settleDebts(debts, transactions);
  };

  return settleDebts(
    Object.keys(balances).map((person) => ({
      person,
      amount: balances[person],
    })),
    [],
  );
};

// Example Usage
// let expenses: Expense[] = [
//   {
//     payer: 'A',
//     amount: 300,
//     participants: [
//       { name: 'B', share: 1 },
//       { name: 'C', share: 1 },
//     ],
//   },
//   {
//     payer: 'B',
//     amount: 100,
//     participants: [{ name: 'C', share: 1 }],
//   },
// ];
