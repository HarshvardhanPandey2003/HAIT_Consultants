const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { generateSessionDates, timesOverlap } = require('../utils/scheduleGenerator');

const prisma = new PrismaClient();

// POST - Check availability for given date range and time
router.post('/check', async (req, res) => {
  try {
    const { startDate, endDate, daysType, customDays, sessionStartTime, sessionEndTime } = req.body;

    console.log('🔍 Checking availability:', {
      startDate,
      endDate,
      daysType,
      customDays,
      sessionStartTime,
      sessionEndTime
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
        totalDates: 0,
        conflicts: []
      });
    }

    // Check each date for conflicts
    const conflicts = [];
    const availableDates = [];
    const busyDates = [];

    for (const date of datesToCheck) {
      // Find all sessions on this date
      const sessionsOnDate = await prisma.scheduledSession.findMany({
        where: {
          sessionDate: date
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
        if (timesOverlap(sessionStartTime, sessionEndTime, session.sessionStartTime, session.sessionEndTime)) {
          hasConflict = true;
          dateConflicts.push({
            date: date.toISOString().split('T')[0],
            sessionId: session.id,
            enquiryId: session.enquiryId,
            topicName: session.enquiry.topicName,
            technology: session.enquiry.technology,
            customerName: session.enquiry.customerName,
            status: session.enquiry.status,
            existingTime: `${session.sessionStartTime} - ${session.sessionEndTime}`,
            requestedTime: `${sessionStartTime} - ${sessionEndTime}`,
            isCompleted: session.isCompleted
          });
        }
      }

      if (hasConflict) {
        busyDates.push({
          date: date.toISOString().split('T')[0],
          dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
          conflicts: dateConflicts
        });
        conflicts.push(...dateConflicts);
      } else {
        availableDates.push({
          date: date.toISOString().split('T')[0],
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
        : `⚠️ You have conflicts on ${busyDates.length} out of ${datesToCheck.length} dates`
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
