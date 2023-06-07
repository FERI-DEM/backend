import { addMinutes } from 'date-fns';
export const roundUpDate = (date: string): string => {
  const dateObj = new Date(date);
  const minutes = dateObj.getMinutes();

  let roundedMinutes;
  if (minutes < 15) {
    roundedMinutes = 0;
  }
  if (minutes >= 15 && minutes < 30) {
    roundedMinutes = 30;
  }
  if (minutes >= 30 && minutes < 45) {
    roundedMinutes = 30;
  }

  if (minutes >= 45) {
    roundedMinutes = 0;
    dateObj.setHours(dateObj.getHours() + 1);
  }
  dateObj.setMinutes(roundedMinutes);
  dateObj.setSeconds(0);
  dateObj.setMilliseconds(0);
  return dateObj.toISOString();
};

export const formatDateToNearestHour = (date: Date): string => {
  const minutes = date.getMinutes();

  let roundedMinutes;
  if (minutes < 30) {
    roundedMinutes = 0;
  }

  if (minutes >= 30) {
    roundedMinutes = 0;
    date.setHours(date.getHours() + 1);
  }
  date.setMinutes(roundedMinutes);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date.toISOString();
};

export const formatDateTo15minInterval = (date: Date): string => {
  const minutes = date.getMinutes();

  let roundedMinutes: number;
  if (minutes < 15) {
    roundedMinutes = 0;
  } else if (minutes < 30) {
    roundedMinutes = 15;
  } else if (minutes < 45) {
    roundedMinutes = 30;
  } else if (minutes < 59) {
    roundedMinutes = 45;
  } else if (minutes >= 59) {
    roundedMinutes = 0;
    date.setHours(date.getHours() + 1);
  }

  date.setMinutes(roundedMinutes);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date.toISOString().slice(0, -8);
};

export const roundTimeUp = (date: Date, roundTo: number): Date => {
  let remainder;
  const minutes = date.getMinutes();
  if (minutes % roundTo === 0) {
    remainder = roundTo;
  } else {
    remainder = roundTo - (minutes % roundTo);
  }
  console.log(remainder);
  date = addMinutes(date, remainder);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
};
