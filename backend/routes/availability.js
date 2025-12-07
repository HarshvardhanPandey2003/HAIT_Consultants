const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { generateSessionDates, timesOverlap } = require('../utils/scheduleGenerator');
const {
    convertToIST,
    convertFromIST,
    isValidTimezone,
    DEFAULT_TIMEZONE,
    SUPPORTED_TIMEZONES
} = require('../utils/timezoneConverter');

const prisma = new PrismaClient();

// GET - List of supported timezones
router.get('/timezones', (req, res) => {
    res.json({
        default: DEFAULT_TIMEZONE,
        supported: SUPPORTED_TIMEZONES
    });
});

// POST - Check availability for given date range and time
router.post('/check', async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            daysType,
            customDays,
            sessionStartTime,
            sessionEndTime,
            timezone = DEFAULT_TIMEZONE
        } = req.body;

        console.log('🔍 Checking availability:', {
            startDate,
            endDate,
            daysType,
            customDays,
            sessionStartTime,
            sessionEndTime,
            timezone
        });

        // Validate timezone
        if (timezone && !isValidTimezone(timezone)) {
            return res.status(400).json({
                error: 'Invalid timezone',
                supportedTimezones: SUPPORTED_TIMEZONES
            });
        }

        // Validate required fields
        if (!startDate || !endDate || !sessionStartTime || !sessionEndTime || !daysType) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['startDate', 'endDate', 'sessionStartTime', 'sessionEndTime', 'daysType']
            });
        }

        // Generate all dates based on the pattern
        const datesToCheck = generateSessionDates(
            new Date(startDate),
            new Date(endDate),
            daysType,
            customDays
        );

        console.log(`📆 Generated ${datesToCheck.length} dates to check`);

        if (datesToCheck.length === 0) {
            return res.json({
                available: true,
                message: 'No dates match the selected pattern',
                summary: {
                    totalDates: 0,
                    availableDates: 0,
                    busyDates: 0,
                    availabilityPercentage: 0
                },
                availableDates: [],
                busyDates: [],
                conflicts: [],
                timezone,
                timezoneInfo: {
                    inputTimezone: timezone,
                    storageTimezone: 'Asia/Kolkata (IST)',
                    note: 'All times converted between selected timezone and IST'
                }
            });
        }

        // Check each date for conflicts
        const conflicts = [];
        const availableDates = [];
        const busyDates = [];

        for (const date of datesToCheck) {
            const dateString = date.toISOString().split('T')[0];

            // Convert input times from selected timezone to IST for comparison
            const startConverted = convertToIST(sessionStartTime, dateString, timezone);
            const endConverted = convertToIST(sessionEndTime, dateString, timezone);

            const istStartTime = startConverted.time;
            const istEndTime = endConverted.time;
            const istDateToCheck = startConverted.date;

            console.log(`🕐 Converting ${sessionStartTime}-${sessionEndTime} (${timezone}) to ${istStartTime}-${istEndTime} (IST) on ${istDateToCheck}`);

            // Find all sessions on the IST date (and adjacent dates if conversion crossed midnight)
            const datesToQuery = [new Date(istDateToCheck)];
            
            // If start and end times converted to different dates, query both
            if (startConverted.date !== endConverted.date) {
                datesToQuery.push(new Date(endConverted.date));
            }

            const sessionsOnDate = await prisma.scheduledSession.findMany({
                where: {
                    sessionDate: {
                        in: datesToQuery
                    }
                },
                include: {
                    enquiry: {
                        select: {
                            enquiryId: true,
                            topicName: true,
                            technology: true,
                            customerName: true,
                            status: true
                        }
                    }
                }
            });

            // Check for time overlaps
            let hasConflict = false;
            const dateConflicts = [];

            for (const session of sessionsOnDate) {
                const sessionDateString = session.sessionDate.toISOString().split('T')[0];
                
                // Session times are in IST in the database
                if (timesOverlap(istStartTime, istEndTime, session.sessionStartTime, session.sessionEndTime)) {
                    hasConflict = true;

                    // Convert existing session times to user's selected timezone for display
                    const existingStartConverted = convertFromIST(
                        session.sessionStartTime,
                        sessionDateString,
                        timezone
                    );
                    const existingEndConverted = convertFromIST(
                        session.sessionEndTime,
                        sessionDateString,
                        timezone
                    );

                    dateConflicts.push({
                        date: dateString,
                        displayDate: existingStartConverted.date, // Show in user's timezone date
                        sessionId: session.id,
                        enquiryId: session.enquiryId,
                        topicName: session.enquiry.topicName,
                        technology: session.enquiry.technology,
                        customerName: session.enquiry.customerName,
                        status: session.enquiry.status,
                        existingTime: `${existingStartConverted.time} - ${existingEndConverted.time}`,
                        requestedTime: `${sessionStartTime} - ${sessionEndTime}`,
                        existingTimeIST: `${session.sessionStartTime} - ${session.sessionEndTime}`,
                        requestedTimeIST: `${istStartTime} - ${istEndTime}`,
                        displayTimezone: timezone,
                        dateChanged: existingStartConverted.dateChanged || existingEndConverted.dateChanged,
                        isCompleted: session.isCompleted
                    });
                }
            }

            if (hasConflict) {
                busyDates.push({
                    date: dateString,
                    dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
                    conflicts: dateConflicts
                });
                conflicts.push(...dateConflicts);
            } else {
                availableDates.push({
                    date: dateString,
                    dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' })
                });
            }
        }

        const isFullyAvailable = conflicts.length === 0;
        const availabilityPercentage = ((availableDates.length / datesToCheck.length) * 100).toFixed(1);

        console.log(`✅ Availability check complete: ${availableDates.length}/${datesToCheck.length} dates available`);

        res.json({
            available: isFullyAvailable,
            summary: {
                totalDates: datesToCheck.length,
                availableDates: availableDates.length,
                busyDates: busyDates.length,
                availabilityPercentage: parseFloat(availabilityPercentage)
            },
            availableDates,
            busyDates,
            conflicts: conflicts.length > 0 ? conflicts : undefined,
            message: isFullyAvailable
                ? `✅ You are completely free for all ${datesToCheck.length} dates!`
                : `⚠️ You have conflicts on ${busyDates.length} out of ${datesToCheck.length} dates`,
            timezone,
            timezoneInfo: {
                displayTimezone: timezone,
                storageTimezone: 'Asia/Kolkata (IST)',
                note: 'All times displayed in your selected timezone, stored as IST'
            }
        });

    } catch (error) {
        console.error('❌ Error checking availability:', error);
        res.status(500).json({
            error: 'Failed to check availability',
            message: error.message
        });
    }
});

module.exports = router;
