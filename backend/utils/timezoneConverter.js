const moment = require('moment-timezone');

/**
 * Supported timezones for the application
 */
const SUPPORTED_TIMEZONES = [
    { label: 'IST - India (UTC+5:30)', value: 'Asia/Kolkata', offset: '+05:30' },
    { label: 'GST - UAE/Oman (UTC+4:00)', value: 'Asia/Dubai', offset: '+04:00' },
    { label: 'SGT - Singapore (UTC+8:00)', value: 'Asia/Singapore', offset: '+08:00' },
    { label: 'PST - Pacific (UTC-8:00)', value: 'America/Los_Angeles', offset: '-08:00' },
    { label: 'EST - Eastern (UTC-5:00)', value: 'America/New_York', offset: '-05:00' },
    { label: 'GMT - London (UTC+0:00)', value: 'Europe/London', offset: '+00:00' },
    { label: 'CET - Central Europe (UTC+1:00)', value: 'Europe/Paris', offset: '+01:00' },
    { label: 'JST - Japan (UTC+9:00)', value: 'Asia/Tokyo', offset: '+09:00' },
    { label: 'AEST - Australia East (UTC+10:00)', value: 'Australia/Sydney', offset: '+10:00' },
];

const DEFAULT_TIMEZONE = 'Asia/Kolkata'; // IST

/**
 * Convert time from IST to target timezone
 * @param {string} time - Time in HH:MM format (IST)
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} targetTimezone - IANA timezone name (e.g., 'Asia/Dubai')
 * @returns {object} - { time: string, date: string, dateChanged: boolean }
 */
function convertFromIST(time, date, targetTimezone = DEFAULT_TIMEZONE) {
    // If target is IST, return as-is
    if (targetTimezone === DEFAULT_TIMEZONE) {
        return {
            time,
            date,
            dateChanged: false
        };
    }

    try {
        // Create moment in IST
        const dateTimeString = `${date} ${time}`;
        const istMoment = moment.tz(dateTimeString, 'YYYY-MM-DD HH:mm', DEFAULT_TIMEZONE);
        
        // Convert to target timezone
        const targetMoment = istMoment.clone().tz(targetTimezone);
        
        // Check if date changed
        const dateChanged = istMoment.format('YYYY-MM-DD') !== targetMoment.format('YYYY-MM-DD');
        
        return {
            time: targetMoment.format('HH:mm'),
            date: targetMoment.format('YYYY-MM-DD'),
            dateChanged,
            originalDate: date,
            originalTime: time
        };
    } catch (error) {
        console.error('Error converting from IST:', error);
        return { time, date, dateChanged: false, error: error.message };
    }
}

/**
 * Convert time from source timezone to IST
 * @param {string} time - Time in HH:MM format
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} sourceTimezone - IANA timezone name
 * @returns {object} - { time: string, date: string, dateChanged: boolean }
 */
function convertToIST(time, date, sourceTimezone = DEFAULT_TIMEZONE) {
    // If source is IST, return as-is
    if (sourceTimezone === DEFAULT_TIMEZONE) {
        return {
            time,
            date,
            dateChanged: false
        };
    }

    try {
        // Create moment in source timezone
        const dateTimeString = `${date} ${time}`;
        const sourceMoment = moment.tz(dateTimeString, 'YYYY-MM-DD HH:mm', sourceTimezone);
        
        // Convert to IST
        const istMoment = sourceMoment.clone().tz(DEFAULT_TIMEZONE);
        
        // Check if date changed
        const dateChanged = sourceMoment.format('YYYY-MM-DD') !== istMoment.format('YYYY-MM-DD');
        
        return {
            time: istMoment.format('HH:mm'),
            date: istMoment.format('YYYY-MM-DD'),
            dateChanged,
            originalDate: date,
            originalTime: time
        };
    } catch (error) {
        console.error('Error converting to IST:', error);
        return { time, date, dateChanged: false, error: error.message };
    }
}

/**
 * Convert a session object to target timezone
 * @param {object} session - Session object with sessionDate, sessionStartTime, sessionEndTime
 * @param {string} targetTimezone - Target timezone
 * @returns {object} - Converted session with timezone info
 */
function convertSessionTimezone(session, targetTimezone = DEFAULT_TIMEZONE) {
    const dateString = session.sessionDate instanceof Date 
        ? session.sessionDate.toISOString().split('T')[0]
        : new Date(session.sessionDate).toISOString().split('T')[0];

    const startConverted = convertFromIST(session.sessionStartTime, dateString, targetTimezone);
    const endConverted = convertFromIST(session.sessionEndTime, dateString, targetTimezone);

    return {
        ...session,
        sessionDate: startConverted.date, // Use converted date
        sessionStartTime: startConverted.time,
        sessionEndTime: endConverted.time,
        originalSessionDate: dateString,
        originalSessionStartTime: session.sessionStartTime,
        originalSessionEndTime: session.sessionEndTime,
        timezone: targetTimezone,
        displayTimezone: getTimezoneLabel(targetTimezone),
        dateChanged: startConverted.dateChanged || endConverted.dateChanged
    };
}

/**
 * Convert multiple sessions to target timezone
 * @param {array} sessions - Array of session objects
 * @param {string} targetTimezone - Target timezone
 * @returns {array} - Array of converted sessions
 */
function convertSessionsTimezone(sessions, targetTimezone = DEFAULT_TIMEZONE) {
    if (targetTimezone === DEFAULT_TIMEZONE) {
        // Add timezone info but don't convert
        return sessions.map(session => ({
            ...session,
            timezone: DEFAULT_TIMEZONE,
            displayTimezone: 'IST - India (UTC+5:30)'
        }));
    }

    return sessions.map(session => convertSessionTimezone(session, targetTimezone));
}

/**
 * Get timezone label from timezone value
 * @param {string} timezoneValue - IANA timezone name
 * @returns {string} - Human-readable timezone label
 */
function getTimezoneLabel(timezoneValue) {
    const tz = SUPPORTED_TIMEZONES.find(t => t.value === timezoneValue);
    return tz ? tz.label : timezoneValue;
}

/**
 * Get current time in specified timezone
 * @param {string} timezone - IANA timezone name
 * @returns {object} - { date: string, time: string, datetime: string }
 */
function getCurrentTimeInTimezone(timezone = DEFAULT_TIMEZONE) {
    const now = moment.tz(timezone);
    return {
        date: now.format('YYYY-MM-DD'),
        time: now.format('HH:mm'),
        datetime: now.format('YYYY-MM-DD HH:mm:ss'),
        timezone,
        label: getTimezoneLabel(timezone)
    };
}

/**
 * Validate if timezone is supported
 * @param {string} timezone - IANA timezone name
 * @returns {boolean}
 */
function isValidTimezone(timezone) {
    if (!timezone) return false;
    return SUPPORTED_TIMEZONES.some(tz => tz.value === timezone);
}

module.exports = {
    SUPPORTED_TIMEZONES,
    DEFAULT_TIMEZONE,
    convertFromIST,
    convertToIST,
    convertSessionTimezone,
    convertSessionsTimezone,
    getTimezoneLabel,
    getCurrentTimeInTimezone,
    isValidTimezone
};
