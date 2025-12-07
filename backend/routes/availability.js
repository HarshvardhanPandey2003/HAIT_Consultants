const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { generateSessionDates, timesOverlap } = require('../utils/scheduleGenerator');
const moment = require('moment-timezone');

const prisma = new PrismaClient();

/**
 * Convert time from source timezone to IST
 * @param {string} time - Time in HH:MM format
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} sourceTimezone - IANA timezone name (e.g., 'Asia/Dubai')
 * @returns {string} - Time in IST (HH:MM format)
 */
function convertToIST(time, date, sourceTimezone) {
  // Create a moment object with the date and time in the source timezone
  const dateTimeString = `${date} ${time}`;
  const sourceMoment = moment.tz(dateTimeString, 'YYYY-MM-DD HH:mm', sourceTimezone);
  
  // Convert to IST
  const istMoment = sourceMoment.clone().tz('Asia/Kolkata');
  
  // Return time in HH:mm format
  return istMoment.format('HH:mm');
}

/**
 * Check if date changes when converting timezone
 * Returns 0 if same day, 1 if next day, -1 if previous day
 */
function getDateOffset(time, date, sourceTimezone) {
  const dateTimeString = `${date} ${time}`;
  const sourceMoment = moment.tz(dateTimeString, 'YYYY-MM-DD HH:mm', sourceTimezone);
  const istMoment = sourceMoment.clone().tz('Asia/Kolkata');
  
  const sourceDay = sourceMoment.date();
  const istDay = istMoment.date();
  
  if (istDay > sourceDay) return 1;
  if (istDay < sourceDay) return -1;
  return 0;
}

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
      timezone = 'Asia/Kolkata' // Default to IST if not provided
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
        conflicts: []
      });
    }

    // Check each date for conflicts
    const conflicts = [];
    const availableDates = [];
    const busyDates = [];

    for (const date of datesToCheck) {
      const dateString = date.toISOString().split('T')[0];
      
      // Convert input times to IST
      const istStartTime = convertToIST(sessionStartTime, dateString, timezone);
      const istEndTime = convertToIST(sessionEndTime, dateString, timezone);
      
      // Check if time conversion caused date change
      const startDateOffset = getDateOffset(sessionStartTime, dateString, timezone);
      const endDateOffset = getDateOffset(sessionEndTime, dateString, timezone);
      
      // Adjust date if timezone conversion crosses day boundary
      let checkDate = new Date(date);
      if (startDateOffset !== 0) {
        checkDate.setDate(checkDate.getDate() + startDateOffset);
      }
      
      console.log(`🕐 Converting ${sessionStartTime}-${sessionEndTime} (${timezone}) to ${istStartTime}-${istEndTime} (IST) for ${dateString}`);

      // Find all sessions on this date (and adjacent dates if time crossed midnight)
      const datesToQuery = [checkDate];
      if (startDateOffset !== endDateOffset) {
        const nextDate = new Date(checkDate);
        nextDate.setDate(nextDate.getDate() + 1);
        datesToQuery.push(nextDate);
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
        // Session times are already in IST (as stored in database)
        if (timesOverlap(istStartTime, istEndTime, session.sessionStartTime, session.sessionEndTime)) {
          hasConflict = true;
          dateConflicts.push({
            date: dateString,
            sessionId: session.id,
            enquiryId: session.enquiryId,
            topicName: session.enquiry.topicName,
            technology: session.enquiry.technology,
            customerName: session.enquiry.customerName,
            status: session.enquiry.status,
            existingTime: `${session.sessionStartTime} - ${session.sessionEndTime}`,
            requestedTime: `${istStartTime} - ${istEndTime} (IST)`,
            originalRequestedTime: `${sessionStartTime} - ${sessionEndTime} (${timezone})`,
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
      timezoneInfo: {
        inputTimezone: timezone,
        storageTimezone: 'Asia/Kolkata (IST)',
        note: 'All times converted to IST for comparison'
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
