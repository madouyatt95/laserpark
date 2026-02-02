import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Expense, PaymentMethod, ExpenseFormData } from '../types';
import { isToday, parseISO, startOfDay, endOfDay } from 'date-fns';

interface ExpenseState {
    expenses: Expense[];
    isLoading: boolean;

    // Getters
    getExpensesByPark: (parkId: string) => Expense[];
    getExpensesByDate: (parkId: string, date: Date) => Expense[];
    getTodayExpenses: (parkId: string) => Expense[];
    getTodayExpensesTotal: (parkId: string) => number;

    // Actions
    addExpense: (parkId: string, userId: string, data: ExpenseFormData) => void;
    deleteExpense: (expenseId: string) => void;
    updateExpense: (expenseId: string, updates: Partial<Expense>) => void;
}

export const useExpenseStore = create<ExpenseState>()(
    persist(
        (set, get) => ({
            expenses: [],
            isLoading: false,

            getExpensesByPark: (parkId: string) => {
                return get().expenses
                    .filter(e => e.park_id === parkId)
                    .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
            },

            getExpensesByDate: (parkId: string, date: Date) => {
                const start = startOfDay(date);
                const end = endOfDay(date);

                return get().expenses.filter(e => {
                    const expenseDate = parseISO(e.expense_date);
                    return e.park_id === parkId && expenseDate >= start && expenseDate <= end;
                }).sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
            },

            getTodayExpenses: (parkId: string) => {
                return get().expenses.filter(e => {
                    return e.park_id === parkId && isToday(parseISO(e.expense_date));
                }).sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
            },

            getTodayExpensesTotal: (parkId: string) => {
                return get().getTodayExpenses(parkId).reduce((sum, e) => sum + e.amount, 0);
            },

            addExpense: (parkId: string, userId: string, data: ExpenseFormData) => {
                const now = new Date();
                const newExpense: Expense = {
                    id: `exp_${Date.now()}`,
                    park_id: parkId,
                    category_id: data.category_id,
                    amount: data.amount,
                    payment_method: data.payment_method,
                    comment: data.comment,
                    created_by: userId,
                    expense_date: now.toISOString(),
                    created_at: now.toISOString(),
                };

                set(state => ({ expenses: [newExpense, ...state.expenses] }));
            },

            deleteExpense: (expenseId: string) => {
                set(state => ({
                    expenses: state.expenses.filter(e => e.id !== expenseId),
                }));
            },

            updateExpense: (expenseId, updates) => {
                set(state => ({
                    expenses: state.expenses.map(expense =>
                        expense.id === expenseId
                            ? { ...expense, ...updates }
                            : expense
                    ),
                }));
            },
        }),
        {
            name: 'laserpark-expenses',
        }
    )
);
