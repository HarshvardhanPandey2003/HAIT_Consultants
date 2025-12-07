const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { generateSessionDates } = require('../utils/scheduleGenerator');

const prisma = new PrismaClient();

// GET all enquiries with optional filters
router.get('/', async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    // Build filter conditions
    const whereConditions = {};

    // Status filter
    if (status && status !== 'all') {
      whereConditions.status = status;
    }

    // Date range filter - filtering by enquiryDate (when enquiry was created)
    if (startDate || endDate) {
      whereConditions.enquiryDate = {};
      if (startDate) {
        whereConditions.enquiryDate.gte = new Date(startDate);
      }
      if (endDate) {
        // Add 1 day to endDate to include the entire end day
        const endDateTime = new Date(endDate);
        endDateTime.setDate(endDateTime.getDate() + 1);
        whereConditions.enquiryDate.lt = endDateTime;
      }
    }

    const enquiries = await prisma.enquiry.findMany({
      where: Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(enquiries);
  } catch (error) {
    console.error('Error fetching enquiries:', error);
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
});

// GET single enquiry by ID
router.get('/:id', async (req, res) => {
  try {
    const enquiry = await prisma.enquiry.findUnique({
      where: {
        enquiryId: req.params.id,
      },
      include: {
        scheduledSessions: {
          orderBy: {
            sessionDate: 'asc'
          }
        }
      }
    });

    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    res.json(enquiry);
  } catch (error) {
    console.error('Error fetching enquiry:', error);
    res.status(500).json({ error: 'Failed to fetch enquiry' });
  }
});
// POST new enquiry
router.post('/', async (req, res) => {
  try {
    // Validate mandatory fields
    if (!req.body.topicName || !req.body.spoc) {
      return res.status(400).json({
        error: 'Topic Name and SPOC are required fields'
      });
    }

    // Get the last enquiry to generate new ID
    const lastEnquiry = await prisma.enquiry.findFirst({
      orderBy: {
        enquiryId: 'desc',
      },
    });

    let newId = 'HAIT_0001';
    if (lastEnquiry) {
      const lastNumber = parseInt(lastEnquiry.enquiryId.split('_')[1]);
      newId = `HAIT_${String(lastNumber + 1).padStart(4, '0')}`;
    }

    const enquiry = await prisma.enquiry.create({
      data: {
        enquiryId: newId,
        topicName: req.body.topicName,
        spoc: req.body.spoc,
        technology: req.body.technology || null,
        partnerName: req.body.partnerName || null,
        vendorName: req.body.vendorName || null,
        customerName: req.body.customerName || null,
        solutionType: req.body.solutionType || null,
        perHourRate: req.body.perHourRate ? parseInt(req.body.perHourRate) : null,
        hoursDelivery: req.body.hoursDelivery ? parseInt(req.body.hoursDelivery) : null,
        enquiryDate: req.body.enquiryDate ? new Date(req.body.enquiryDate) : null,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        location: req.body.location || null,
        status: req.body.status || null,
        remarks: req.body.remarks || null,
        learning: req.body.learning || null,
        sessionStartTime: req.body.sessionStartTime || null,
        sessionEndTime: req.body.sessionEndTime || null,
        daysType: req.body.daysType || null,
        customDays: req.body.customDays ? JSON.stringify(req.body.customDays) : null,
      },
    });

    console.log('✅ New enquiry created:', enquiry.enquiryId);

    // AUTO-GENERATE SCHEDULE if status is Confirmed or Delivered
    let scheduleResult = null;
    if (enquiry.status === 'Confirmed' || enquiry.status === 'Delivered') {
      console.log(`🔍 New enquiry has status "${enquiry.status}" - checking for auto-schedule generation`);

      // Validate required fields
      const missingFields = [];
      if (!enquiry.startDate) missingFields.push('startDate');
      if (!enquiry.endDate) missingFields.push('endDate');
      if (!enquiry.sessionStartTime) missingFields.push('sessionStartTime');
      if (!enquiry.sessionEndTime) missingFields.push('sessionEndTime');
      if (!enquiry.daysType) missingFields.push('daysType');

      if (missingFields.length > 0) {
        console.warn(`⚠️  Cannot generate schedule - missing fields: ${missingFields.join(', ')}`);
      } else {
        try {
          console.log('🚀 Starting schedule generation for new enquiry...');

          // Parse customDays
          let customDaysArray = null;
          if (enquiry.daysType === 'Custom' && enquiry.customDays) {
            customDaysArray = JSON.parse(enquiry.customDays);
            console.log('📋 Custom days parsed:', customDaysArray);
          }

          // Generate session dates
          const sessionDates = generateSessionDates(
            enquiry.startDate,
            enquiry.endDate,
            enquiry.daysType,
            customDaysArray
          );

          console.log(`📆 Generated ${sessionDates.length} session dates`);

          if (sessionDates.length > 0) {
            // Create sessions
            const sessionsToCreate = sessionDates.map(date => ({
              enquiryId: enquiry.enquiryId,
              sessionDate: new Date(date),
              sessionStartTime: enquiry.sessionStartTime,
              sessionEndTime: enquiry.sessionEndTime,
              isCompleted: enquiry.status === 'Delivered' // Mark as completed if Delivered
            }));

            const createResult = await prisma.scheduledSession.createMany({
              data: sessionsToCreate,
              skipDuplicates: true
            });

            console.log(`✅ Successfully created ${createResult.count} sessions`);

            if (enquiry.status === 'Delivered') {
              console.log('📦 Status is Delivered - all sessions marked as completed');
            }

            scheduleResult = {
              sessionsCreated: createResult.count,
              allCompleted: enquiry.status === 'Delivered',
              message: enquiry.status === 'Delivered' 
                ? `Generated ${createResult.count} completed sessions (historical)` 
                : `Generated ${createResult.count} scheduled sessions`
            };
          } else {
            console.warn('⚠️  No valid session dates generated');
          }
        } catch (scheduleError) {
          console.error('❌ Schedule generation error:', scheduleError.message);
          // Don't fail the enquiry creation, just log the error
        }
      }
    } else {
      console.log(`ℹ️  Status is "${enquiry.status}" - no auto-schedule generation`);
    }

    res.status(201).json({
      ...enquiry,
      scheduleGenerated: scheduleResult
    });
  } catch (error) {
    console.error('❌ Error creating enquiry:', error);
    res.status(500).json({ error: 'Failed to create enquiry' });
  }
});

// PUT (update) enquiry
router.put('/:id', async (req, res) => {
  try {
    // Validate mandatory fields
    if (!req.body.topicName || !req.body.spoc) {
      return res.status(400).json({
        error: 'Topic Name and SPOC are required fields'
      });
    }

    // Get the old enquiry to detect changes
    const oldEnquiry = await prisma.enquiry.findUnique({
      where: { enquiryId: req.params.id }
    });

    if (!oldEnquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    // Helper function to safely compare dates
    const datesAreDifferent = (date1, date2) => {
      if (!date1 && !date2) return false;
      if (!date1 || !date2) return true;
      return new Date(date1).getTime() !== new Date(date2).getTime();
    };

    // Detect scheduling field changes
    const schedulingFieldsChanged = 
      datesAreDifferent(req.body.startDate, oldEnquiry.startDate) ||
      datesAreDifferent(req.body.endDate, oldEnquiry.endDate) ||
      (req.body.sessionStartTime && req.body.sessionStartTime !== oldEnquiry.sessionStartTime) ||
      (req.body.sessionEndTime && req.body.sessionEndTime !== oldEnquiry.sessionEndTime) ||
      (req.body.daysType && req.body.daysType !== oldEnquiry.daysType) ||
      (req.body.customDays && JSON.stringify(req.body.customDays) !== oldEnquiry.customDays);

    const newStatus = req.body.status || oldEnquiry.status;
    const statusChanged = oldEnquiry.status !== newStatus;

    console.log('🔍 Update Detection:', {
      enquiryId: req.params.id,
      oldStatus: oldEnquiry.status,
      newStatus: newStatus,
      statusChanged,
      schedulingFieldsChanged
    });

    // Update the enquiry
    const enquiry = await prisma.enquiry.update({
      where: {
        enquiryId: req.params.id,
      },
      data: {
        topicName: req.body.topicName,
        spoc: req.body.spoc,
        technology: req.body.technology || null,
        partnerName: req.body.partnerName || null,
        vendorName: req.body.vendorName || null,
        customerName: req.body.customerName || null,
        solutionType: req.body.solutionType || null,
        perHourRate: req.body.perHourRate ? parseInt(req.body.perHourRate) : null,
        hoursDelivery: req.body.hoursDelivery ? parseInt(req.body.hoursDelivery) : null,
        enquiryDate: req.body.enquiryDate ? new Date(req.body.enquiryDate) : null,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        location: req.body.location || null,
        status: req.body.status || null,
        remarks: req.body.remarks || null,
        learning: req.body.learning || null,
        sessionStartTime: req.body.sessionStartTime || null,
        sessionEndTime: req.body.sessionEndTime || null,
        daysType: req.body.daysType || null,
        customDays: req.body.customDays ? JSON.stringify(req.body.customDays) : null,
      },
    });

    console.log('✅ Enquiry updated:', enquiry.enquiryId);

    let scheduleResult = null;

    // SCENARIO 1: Status changed FROM Confirmed/Delivered TO something else - DELETE all sessions
    const wasConfirmedOrDelivered = oldEnquiry.status === 'Confirmed' || oldEnquiry.status === 'Delivered';
    const isNowConfirmedOrDelivered = enquiry.status === 'Confirmed' || enquiry.status === 'Delivered';

    if (wasConfirmedOrDelivered && !isNowConfirmedOrDelivered && statusChanged) {
      console.log(`🗑️  Status changed from "${oldEnquiry.status}" to "${enquiry.status}" - deleting all sessions`);
      
      try {
        const deleteResult = await prisma.scheduledSession.deleteMany({
          where: { enquiryId: enquiry.enquiryId }
        });
        console.log(`✅ Deleted ${deleteResult.count} sessions`);
        
        scheduleResult = {
          sessionsDeleted: deleteResult.count,
          message: `All sessions deleted due to status change to ${enquiry.status}`
        };
      } catch (deleteError) {
        console.error('❌ Error deleting sessions:', deleteError.message);
      }
    }
    // SCENARIO 2: Status is Confirmed or Delivered - Generate/Update schedule
    else if (isNowConfirmedOrDelivered) {
      const statusChangedToConfirmedOrDelivered = 
        !wasConfirmedOrDelivered && isNowConfirmedOrDelivered;
      const shouldRegenerateSchedule = 
        statusChangedToConfirmedOrDelivered || 
        (isNowConfirmedOrDelivered && schedulingFieldsChanged);

      console.log('📅 Schedule Generation Check:', {
        shouldGenerate: shouldRegenerateSchedule,
        reason: statusChangedToConfirmedOrDelivered 
          ? `Status changed to ${enquiry.status}` 
          : schedulingFieldsChanged 
            ? 'Scheduling fields changed' 
            : 'No generation needed'
      });

      if (shouldRegenerateSchedule) {
        // Validate required fields
        const missingFields = [];
        if (!enquiry.startDate) missingFields.push('startDate');
        if (!enquiry.endDate) missingFields.push('endDate');
        if (!enquiry.sessionStartTime) missingFields.push('sessionStartTime');
        if (!enquiry.sessionEndTime) missingFields.push('sessionEndTime');
        if (!enquiry.daysType) missingFields.push('daysType');

        if (missingFields.length > 0) {
          console.warn(`⚠️  Cannot generate schedule - missing fields: ${missingFields.join(', ')}`);
          return res.status(400).json({
            error: 'Cannot generate schedule',
            message: `Missing required scheduling fields: ${missingFields.join(', ')}`,
            enquiry
          });
        }

        try {
          console.log('🚀 Starting schedule generation...');

          // Parse customDays
          let customDaysArray = null;
          if (enquiry.daysType === 'Custom' && enquiry.customDays) {
            customDaysArray = JSON.parse(enquiry.customDays);
            console.log('📋 Custom days parsed:', customDaysArray);
          }

          // Generate session dates
          const sessionDates = generateSessionDates(
            enquiry.startDate,
            enquiry.endDate,
            enquiry.daysType,
            customDaysArray
          );

          console.log(`📆 Generated ${sessionDates.length} session dates`);

          if (sessionDates.length === 0) {
            console.warn('⚠️  No valid session dates generated');
            return res.status(400).json({
              error: 'No valid session dates',
              message: 'The date range and days pattern resulted in zero sessions',
              enquiry
            });
          }

          // Delete existing sessions
          const deleteResult = await prisma.scheduledSession.deleteMany({
            where: { enquiryId: enquiry.enquiryId }
          });
          console.log(`🗑️  Deleted ${deleteResult.count} existing sessions`);

          // Create new sessions
          const isDelivered = enquiry.status === 'Delivered';
          const sessionsToCreate = sessionDates.map(date => ({
            enquiryId: enquiry.enquiryId,
            sessionDate: new Date(date),
            sessionStartTime: enquiry.sessionStartTime,
            sessionEndTime: enquiry.sessionEndTime,
            isCompleted: isDelivered // Mark completed if Delivered
          }));

          const createResult = await prisma.scheduledSession.createMany({
            data: sessionsToCreate,
            skipDuplicates: true
          });

          console.log(`✅ Successfully created ${createResult.count} sessions`);

          if (isDelivered) {
            console.log('📦 Status is Delivered - all sessions marked as completed');
          }

          scheduleResult = {
            sessionsCreated: createResult.count,
            allCompleted: isDelivered,
            message: isDelivered 
              ? `Generated ${createResult.count} completed sessions (historical)` 
              : `Generated ${createResult.count} scheduled sessions`
          };

        } catch (scheduleError) {
          console.error('❌ Schedule generation error:', scheduleError);
          return res.status(500).json({
            error: 'Schedule generation failed',
            message: scheduleError.message,
            stack: process.env.NODE_ENV === 'development' ? scheduleError.stack : undefined,
            enquiry
          });
        }
      }
    }

    // Return success with schedule info
    res.json({
      ...enquiry,
      scheduleGenerated: scheduleResult
    });

  } catch (error) {
    console.error('❌ Error updating enquiry:', error);
    res.status(500).json({ 
      error: 'Failed to update enquiry',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});


// DELETE enquiry
router.delete('/:id', async (req, res) => {
  try {
    await prisma.enquiry.delete({
      where: {
        enquiryId: req.params.id,
      },
    });

    res.json({ message: 'Enquiry deleted successfully' });
  } catch (error) {
    console.error('Error deleting enquiry:', error);
    res.status(500).json({ error: 'Failed to delete enquiry' });
  }
});

module.exports = router;
