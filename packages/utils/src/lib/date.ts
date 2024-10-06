import moment from 'moment';

export const formatAppointmentDate = (dateString: string): string => {
    // Extract the timezone offset using regex
    const timezoneMatch = dateString.match(/([+-]\d{2}):?(\d{2})$/);
    if (!timezoneMatch) {
        throw new Error('Invalid date string: Timezone information not found.');
    }
    const sign = timezoneMatch[1].charAt(0) === '+' ? 1 : -1;
    const hoursOffset = parseInt(timezoneMatch[1].slice(1), 10);
    const minutesOffset = parseInt(timezoneMatch[2], 10);
    const totalOffsetMinutes = sign * (hoursOffset * 60 + minutesOffset);

    // Parse the date as UTC and manually apply the timezone offset
    const date = moment
        .utc(dateString, 'YYYY-MM-DD HH:mm:ss Z')
        .add(totalOffsetMinutes, 'minutes');

    // Format the date
    return date.format('ddd, MMM DD, YYYY, hh:mm A');
};
