import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Format currency (CFA)
export const formatCurrency = (amount: number, currency: string = 'CFA'): string => {
    return new Intl.NumberFormat('fr-FR', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount) + ' ' + currency;
};

// Format date
export const formatDate = (date: string | Date, formatStr: string = 'dd/MM/yyyy'): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, formatStr, { locale: fr });
};

// Format time
export const formatTime = (date: string | Date): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'HH:mm', { locale: fr });
};

// Format date and time
export const formatDateTime = (date: string | Date): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'dd/MM/yyyy HH:mm', { locale: fr });
};

// Format relative time
export const formatRelativeTime = (date: string | Date): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true, locale: fr });
};

// Generate unique ID
export const generateId = (prefix: string = 'id'): string => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Truncate text
export const truncate = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

// Debounce function
export const debounce = <T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

// Calculate percentage change
export const percentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};

// Format percentage
export const formatPercentage = (value: number): string => {
    const formatted = value.toFixed(1);
    const sign = value > 0 ? '+' : '';
    return `${sign}${formatted}%`;
};
