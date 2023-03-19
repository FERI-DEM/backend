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
