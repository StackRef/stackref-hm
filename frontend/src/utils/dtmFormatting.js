import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import tz from 'dayjs/plugin/timezone';
import calendar from 'dayjs/plugin/calendar';

export function convertUtcDateToLocalDate(date) {
  dayjs.extend(utc);
  dayjs.extend(tz);
  const timeZone = dayjs.tz.guess();
  return dayjs.utc(date).tz(timeZone).toDate();
}

export function dtmFormattedUtc(dt) {
  return dayjs(dt).utc().format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
}

export function dtmFormatted(dt, formatting = 'YYYY-MM-DD h:mm A') {
  const dateTime = convertUtcDateToLocalDate(dt);
  return dayjs(dateTime).format(formatting);
}

export function dtmUtcToLocal(dt) {
  return convertUtcDateToLocalDate(dt);
}

export function dateTimeRelative(dt) {
  let dateTime = convertUtcDateToLocalDate(dt);
  dayjs.extend(calendar);

  return dayjs(dateTime).calendar(null, {
    sameDay: '[Today at] h:mm A', // The same day ( Today at 2:30 AM )
    nextDay: '[Tomorrow at] h:mm A', // The next day ( Tomorrow at 2:30 AM )
    nextWeek: 'dddd [at] h:mm A', // The next week ( Sunday at 2:30 AM )
    lastDay: '[Yesterday at] h:mm A', // The day before ( Yesterday at 2:30 AM )
    lastWeek: '[Last] dddd [at] h:mm A', // Last week ( Last Monday at 2:30 AM )
    sameElse: 'MM/DD/YYYY', // Everything else ( 10/17/2011 )
  });
}
