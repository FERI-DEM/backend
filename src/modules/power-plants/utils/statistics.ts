import { Statistics } from '../types';

export const getRangeForNow = (statistics: Statistics): number => {
  switch (statistics) {
    case 'today':
      return new Date().setHours(0, 0, 0, 0);
    case 'tomorrow':
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.setHours(0, 0, 0, 0);
    case 'week':
      const week = new Date();
      week.setDate(week.getDate() - 7);
      return week.setHours(0, 0, 0, 0);
    case 'month':
      return new Date().setMonth(new Date().getMonth() - 1);
    case 'year':
      return new Date().setFullYear(new Date().getFullYear() - 1);
    default:
      return new Date().setHours(0, 0, 0, 0);
  }
};

export const getRangeForBefore = (statistics: Statistics): number => {
  switch (statistics) {
    case 'today':
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.setHours(0, 0, 0, 0);
    case 'tomorrow':
      return new Date().setHours(0, 0, 0, 0);
    case 'week':
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 14);
      return lastWeek.setHours(0, 0, 0, 0);
    case 'month':
      return new Date().setMonth(new Date().getMonth() - 2);
    case 'year':
      return new Date().setFullYear(new Date().getFullYear() - 2);
    default:
      return new Date().setHours(0, 0, 0, 0);
  }
};
