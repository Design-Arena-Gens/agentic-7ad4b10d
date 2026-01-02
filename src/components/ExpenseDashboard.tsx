'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type ExpenseCategory =
  | 'Housing'
  | 'Food'
  | 'Transportation'
  | 'Utilities'
  | 'Healthcare'
  | 'Entertainment'
  | 'Savings'
  | 'Education'
  | 'Other';

type PaymentMethod = 'Cash' | 'Debit Card' | 'Credit Card' | 'Bank Transfer' | 'Digital Wallet';

export type Expense = {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  date: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

type Filters = {
  month: string;
  category: ExpenseCategory | 'All';
  paymentMethod: PaymentMethod | 'All';
  query: string;
};

const CATEGORIES: ExpenseCategory[] = [
  'Housing',
  'Food',
  'Transportation',
  'Utilities',
  'Healthcare',
  'Entertainment',
  'Savings',
  'Education',
  'Other',
];

const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Digital Wallet'];

const STORAGE_KEY = 'agentic-expense-tracker-v1';

const SAMPLE_EXPENSES: Expense[] = [
  {
    id: 'seed-1',
    description: 'Groceries - Fresh Market',
    amount: 86.42,
    category: 'Food',
    paymentMethod: 'Debit Card',
    date: new Date().toISOString().slice(0, 10),
    note: 'Weekly essentials and produce',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-2',
    description: 'Metro Card Reload',
    amount: 45.0,
    category: 'Transportation',
    paymentMethod: 'Digital Wallet',
    date: new Date().toISOString().slice(0, 10),
    note: 'Monthly commuter pass',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-3',
    description: 'Streaming Subscriptions',
    amount: 29.97,
    category: 'Entertainment',
    paymentMethod: 'Credit Card',
    date: new Date().toISOString().slice(0, 10),
    note: 'Netflix, Spotify, and Apple TV',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const getStartOfMonth = (isoDate: string) => isoDate.slice(0, 7);

const createExpense = (payload: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Expense => {
  const timestamp = new Date().toISOString();
  return {
    ...payload,
    id: crypto.randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

type ExpenseFormState = {
  description: string;
  amount: string;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  date: string;
  note: string;
};

const makeDefaultForm = (): ExpenseFormState => ({
  description: '',
  amount: '',
  category: 'Food',
  paymentMethod: 'Debit Card',
  date: new Date().toISOString().slice(0, 10),
  note: '',
});

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);

const getMonthLabel = (month: string) => {
  const [year, monthIndex] = month.split('-').map(Number);
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });
  return formatter.format(new Date(year, (monthIndex ?? 1) - 1));
};

const getShortDate = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso));

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const ExpenseDashboard = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [form, setForm] = useState<ExpenseFormState>(makeDefaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    month: new Date().toISOString().slice(0, 7),
    category: 'All',
    paymentMethod: 'All',
    query: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: Expense[] = JSON.parse(saved);
        setExpenses(parsed);
        setIsInitialized(true);
        return;
      } catch (err) {
        console.warn('Unable to read stored expenses', err);
      }
    }

    setExpenses(SAMPLE_EXPENSES);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses, isInitialized]);

  const handleFormChange = useCallback(<Key extends keyof ExpenseFormState>(key: Key, value: ExpenseFormState[Key]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const amount = Number.parseFloat(form.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        alert('Please enter a valid amount greater than 0.');
        return;
      }
      if (!form.description.trim()) {
        alert('Description is required.');
        return;
      }

      if (editingId) {
        setExpenses((prev) =>
          prev.map((expense) =>
            expense.id === editingId
              ? {
                  ...expense,
                  description: form.description.trim(),
                  amount: Number(amount.toFixed(2)),
                  category: form.category,
                  paymentMethod: form.paymentMethod,
                  date: form.date,
                  note: form.note.trim(),
                  updatedAt: new Date().toISOString(),
                }
              : expense,
          ),
        );
        setEditingId(null);
      } else {
        const newExpense = createExpense({
          description: form.description.trim(),
          amount: Number(amount.toFixed(2)),
          category: form.category,
          paymentMethod: form.paymentMethod,
          date: form.date,
          note: form.note.trim(),
        });
        setExpenses((prev) => [newExpense, ...prev]);
      }
      setForm(makeDefaultForm());
    },
    [editingId, form],
  );

  const handleEdit = useCallback((expense: Expense) => {
    setEditingId(expense.id);
    setForm({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      paymentMethod: expense.paymentMethod,
      date: expense.date,
      note: expense.note ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleDelete = useCallback((id: string) => {
    const confirmDeletion = window.confirm('Remove this expense?');
    if (!confirmDeletion) return;
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setForm(makeDefaultForm());
    }
  }, [editingId]);

  const resetFilters = useCallback(() => {
    setFilters({
      month: new Date().toISOString().slice(0, 7),
      category: 'All',
      paymentMethod: 'All',
      query: '',
    });
  }, []);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesMonth = getStartOfMonth(expense.date) === filters.month;
      const matchesCategory = filters.category === 'All' || expense.category === filters.category;
      const matchesPayment = filters.paymentMethod === 'All' || expense.paymentMethod === filters.paymentMethod;
      const matchesQuery = filters.query
        ? expense.description.toLowerCase().includes(filters.query.toLowerCase()) ||
          (expense.note ?? '').toLowerCase().includes(filters.query.toLowerCase())
        : true;
      return matchesMonth && matchesCategory && matchesPayment && matchesQuery;
    });
  }, [expenses, filters]);

  const totals = useMemo(() => {
    const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    const categoryTotals = filteredExpenses.reduce<Record<ExpenseCategory, number>>(
      (acc, exp) => {
        acc[exp.category] += exp.amount;
        return acc;
      },
      {
        Housing: 0,
        Food: 0,
        Transportation: 0,
        Utilities: 0,
        Healthcare: 0,
        Entertainment: 0,
        Savings: 0,
        Education: 0,
        Other: 0,
      },
    );

    const paymentTotals = filteredExpenses.reduce<Record<PaymentMethod, number>>(
      (acc, exp) => {
        acc[exp.paymentMethod] += exp.amount;
        return acc;
      },
      {
        Cash: 0,
        'Debit Card': 0,
        'Credit Card': 0,
        'Bank Transfer': 0,
        'Digital Wallet': 0,
      },
    );

    const averagePerDay = (() => {
      if (!filteredExpenses.length) return 0;
      const uniqueDates = new Set(filteredExpenses.map((expense) => expense.date));
      return total / uniqueDates.size;
    })();

    return {
      total,
      averagePerDay,
      categoryTotals,
      paymentTotals,
    };
  }, [filteredExpenses]);

  const monthlySparkline = useMemo(() => {
    const now = new Date(filters.month);
    const months: { label: string; key: string; value: number }[] = [];
    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
      const key = date.toISOString().slice(0, 7);
      const value = expenses
        .filter((expense) => getStartOfMonth(expense.date) === key)
        .reduce((sum, expense) => sum + expense.amount, 0);
      months.push({ label: getMonthLabel(key), key, value });
    }
    const maxValue = Math.max(...months.map((month) => month.value), 1);
    return months.map((month) => ({
      ...month,
      percentage: Math.round((month.value / maxValue) * 100),
    }));
  }, [expenses, filters.month]);

  const topCategories = useMemo(() => {
    const entries = Object.entries(totals.categoryTotals) as [ExpenseCategory, number][];
    return entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, amount]) => ({ category, amount }));
  }, [totals.categoryTotals]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setForm(makeDefaultForm());
  }, []);

  const currentMonthLabel = useMemo(() => getMonthLabel(filters.month), [filters.month]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800/40 bg-slate-900/60 p-6 shadow-xl shadow-slate-900/40 ring-1 ring-slate-700/60 backdrop-blur-sm">
        <header className="mb-6 flex flex-col gap-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Expense Manager</p>
              <h1 className="text-3xl font-semibold text-white">Track, understand, and improve your spending.</h1>
            </div>
            <div className="min-w-[200px] rounded-full bg-slate-900 px-4 py-2 text-right text-sm text-slate-300 ring-1 ring-slate-700/70">
              {filteredExpenses.length} expense{filteredExpenses.length === 1 ? '' : 's'} this month
            </div>
          </div>
          <p className="max-w-3xl text-sm text-slate-400">
            Add purchases, categorize them, and keep a pulse on your financial habits. Everything syncs locally to your
            device so you control your data.
          </p>
        </header>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-4">
            <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-200">
              Description
            </label>
            <input
              id="description"
              value={form.description}
              onChange={(event) => handleFormChange('description', event.target.value)}
              placeholder="Coffee with team"
              className="w-full rounded-xl border border-slate-700/70 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="amount" className="mb-2 block text-sm font-medium text-slate-200">
              Amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">$</span>
              <input
                id="amount"
                value={form.amount}
                onChange={(event) => handleFormChange('amount', event.target.value)}
                placeholder="18.50"
                inputMode="decimal"
                className="w-full rounded-xl border border-slate-700/70 bg-slate-900/80 px-4 py-3 pl-8 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                required
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="date" className="mb-2 block text-sm font-medium text-slate-200">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={form.date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(event) => handleFormChange('date', event.target.value)}
              className="w-full rounded-xl border border-slate-700/70 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="category" className="mb-2 block text-sm font-medium text-slate-200">
              Category
            </label>
            <select
              id="category"
              value={form.category}
              onChange={(event) => handleFormChange('category', event.target.value as ExpenseCategory)}
              className="w-full rounded-xl border border-slate-700/70 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="paymentMethod" className="mb-2 block text-sm font-medium text-slate-200">
              Payment method
            </label>
            <select
              id="paymentMethod"
              value={form.paymentMethod}
              onChange={(event) => handleFormChange('paymentMethod', event.target.value as PaymentMethod)}
              className="w-full rounded-xl border border-slate-700/70 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-8">
            <label htmlFor="note" className="mb-2 block text-sm font-medium text-slate-200">
              Notes (optional)
            </label>
            <textarea
              id="note"
              value={form.note}
              onChange={(event) => handleFormChange('note', event.target.value)}
              placeholder="Remind yourself why this expense mattered."
              rows={2}
              className="w-full resize-none rounded-xl border border-slate-700/70 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
          <div className="flex items-end gap-4 md:col-span-4">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              {editingId ? 'Update expense' : 'Add expense'}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-xl border border-slate-700/70 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-slate-600/70"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <article className="rounded-3xl border border-slate-800/50 bg-slate-900/60 p-6 ring-1 ring-slate-700/60">
            <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Spending summary — {currentMonthLabel}</h2>
                <p className="text-sm text-slate-400">
                  Totals update as you filter. Hover any bar to see your last six months of activity.
                </p>
              </div>
              <div className="rounded-full bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-300">{formatCurrency(totals.total)}</div>
            </header>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Average per day</p>
                <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(totals.averagePerDay || 0)}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Based on {filteredExpenses.length} expense{filteredExpenses.length === 1 ? '' : 's'} this month.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Top categories</p>
                <div className="mt-3 space-y-2 text-sm">
                  {topCategories.map(({ category, amount }) => (
                    <div key={category} className="flex items-center justify-between text-slate-300">
                      <span>{category}</span>
                      <span className="font-semibold text-white">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                  {!topCategories.length ? <p className="text-sm text-slate-500">Add expenses to see insights.</p> : null}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Payment mix</p>
                <div className="mt-3 space-y-2 text-sm">
                  {PAYMENT_METHODS.map((method) => {
                    const total = totals.paymentTotals[method];
                    const percentage = totals.total ? Math.round((total / totals.total) * 100) : 0;
                    return (
                      <div key={method} className="space-y-1">
                        <div className="flex items-center justify-between text-slate-300">
                          <span>{method}</span>
                          <span className="font-semibold text-white">{formatCurrency(total)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800/80">
                          <div
                            className="h-full rounded-full bg-indigo-500 transition-all"
                            style={{ width: `${clamp(percentage, 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex items-end gap-2 rounded-2xl border border-slate-800/60 bg-slate-950/40 p-5">
                {monthlySparkline.map((month) => (
                  <div key={month.key} className="flex flex-1 flex-col items-center gap-2 text-xs text-slate-400">
                    <div
                      className="flex w-full items-end justify-center rounded-t-lg bg-gradient-to-t from-indigo-600/10 via-indigo-500/40 to-indigo-400/60 transition"
                      style={{ height: `${clamp(month.percentage, 4, 100)}px` }}
                      title={`${month.label}: ${formatCurrency(month.value)}`}
                    >
                      <span className="sr-only">
                        {month.label}: {formatCurrency(month.value)}
                      </span>
                    </div>
                    <span>{month.label.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>
          <article className="rounded-3xl border border-slate-800/50 bg-slate-900/60 p-6 ring-1 ring-slate-700/60">
            <header className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Expenses</h2>
                <p className="text-sm text-slate-400">Manage, edit, or remove entries at any time.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setExpenses([]);
                  localStorage.removeItem(STORAGE_KEY);
                }}
                className="rounded-full border border-red-500/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-400 transition hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500/40"
              >
                Reset data
              </button>
            </header>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <input
                value={filters.query}
                onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
                placeholder="Search description or notes"
                className="w-full max-w-xs rounded-xl border border-slate-800/60 bg-slate-950/60 px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <select
                value={filters.month}
                onChange={(event) => setFilters((prev) => ({ ...prev, month: event.target.value }))}
                className="rounded-xl border border-slate-800/60 bg-slate-950/60 px-4 py-2 text-sm text-slate-200 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                {Array.from({ length: 12 }).map((_, index) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - index);
                  const key = date.toISOString().slice(0, 7);
                  return (
                    <option key={key} value={key}>
                      {getMonthLabel(key)}
                    </option>
                  );
                })}
              </select>
              <select
                value={filters.category}
                onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value as Filters['category'] }))}
                className="rounded-xl border border-slate-800/60 bg-slate-950/60 px-4 py-2 text-sm text-slate-200 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="All">All categories</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                value={filters.paymentMethod}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, paymentMethod: event.target.value as Filters['paymentMethod'] }))
                }
                className="rounded-xl border border-slate-800/60 bg-slate-950/60 px-4 py-2 text-sm text-slate-200 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="All">All payments</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl border border-slate-800/60 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                Clear filters
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-800/60">
              <table className="min-w-full divide-y divide-slate-800/80 text-sm">
                <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left">
                      Description
                    </th>
                    <th scope="col" className="px-4 py-3 text-left">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-3 text-left">
                      Payment
                    </th>
                    <th scope="col" className="px-4 py-3 text-left">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      Amount
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/30 text-slate-200">
                  {filteredExpenses.length ? (
                    filteredExpenses.map((expense) => (
                      <tr key={expense.id} className="transition hover:bg-slate-800/40">
                        <td className="max-w-xs px-4 py-3 align-top">
                          <div className="font-medium text-white">{expense.description}</div>
                          {expense.note ? <p className="text-xs text-slate-400">{expense.note}</p> : null}
                        </td>
                        <td className="px-4 py-3 align-top text-slate-300">{expense.category}</td>
                        <td className="px-4 py-3 align-top text-slate-300">{expense.paymentMethod}</td>
                        <td className="px-4 py-3 align-top text-slate-300">{getShortDate(expense.date)}</td>
                        <td className="px-4 py-3 text-right align-top font-semibold text-white">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="px-4 py-3 text-right align-top">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(expense)}
                              className="rounded-full border border-slate-700/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:bg-slate-800/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(expense.id)}
                              className="rounded-full border border-red-500/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-400 transition hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-sm text-slate-500"
                      >
                        No expenses match your filters. Add a new expense or adjust your filters to see data.
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredExpenses.length ? (
                  <tfoot className="bg-slate-950/70 text-sm text-slate-200">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right font-medium uppercase tracking-[0.15em] text-slate-400">
                        Total
                      </td>
                      <td colSpan={2} className="px-4 py-3 text-right font-semibold text-white">
                        {formatCurrency(totals.total)}
                      </td>
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>
          </article>
        </div>
        <aside className="space-y-6 lg:col-span-4">
          <div className="rounded-3xl border border-slate-800/50 bg-gradient-to-br from-indigo-500/20 via-slate-900/70 to-slate-950/90 p-6 shadow-lg shadow-indigo-900/30">
            <h2 className="text-lg font-semibold text-white">Monthly category breakdown</h2>
            <p className="mt-1 text-sm text-slate-300">
              Understand where your biggest investments are and trim where it matters.
            </p>
            <div className="mt-4 space-y-3">
              {CATEGORIES.map((category) => {
                const amount = totals.categoryTotals[category];
                const percentage = totals.total ? Math.round((amount / totals.total) * 100) : 0;
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm text-slate-200">
                      <span>{category}</span>
                      <span className="font-semibold text-white">{formatCurrency(amount)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800/80">
                      <div
                        className="h-full rounded-full bg-indigo-400"
                        style={{ width: `${clamp(percentage, 0, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-800/50 bg-slate-900/60 p-6 ring-1 ring-slate-700/60">
            <h2 className="text-lg font-semibold text-white">Tips</h2>
            <ul className="mt-3 space-y-3 text-sm text-slate-300">
              <li>
                • Revisit your top three categories weekly and decide if any can be trimmed next month.
              </li>
              <li>
                • Tag savings transfers so you celebrate them—they count as progress, not spending.
              </li>
              <li>
                • Review your payment mix and consolidate recurring charges into one card for easier tracking.
              </li>
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-800/50 bg-slate-900/60 p-6 ring-1 ring-slate-700/60">
            <h2 className="text-lg font-semibold text-white">Data export</h2>
            <p className="mt-1 text-sm text-slate-300">
              Download a JSON copy of your expenses for safekeeping or to import elsewhere.
            </p>
            <button
              type="button"
              onClick={() => {
                const blob = new Blob([JSON.stringify(expenses, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `expenses-${filters.month}.json`;
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="mt-4 w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Export current view
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default ExpenseDashboard;
