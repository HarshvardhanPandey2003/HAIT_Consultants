const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { generateSessionDates, checkConflicts } = require('../utils/scheduleGenerator');

const prisma = new PrismaClient();

// GET all scheduled sessions (with optional filters)
router.get('/', async (req, res) => {
    try {
        const { month, year, enquiryId, upcoming } = req.query;

        let whereClause = {};

        // Filter by enquiry
        if (enquiryId) {
            whereClause.enquiryId = enquiryId;
        }

        // Filter by month/year
        if (month && year) {
            const startOfMonth = new Date(year, month - 1, 1);
            const endOfMonth = new Date(year, month, 0, 23, 59, 59);

            whereClause.sessionDate = {
                gte: startOfMonth,
                lte: endOfMonth
            };
        }

        // Filter upcoming only
        if (upcoming === 'true') {
            whereClause.sessionDate = {
                gte: new Date()
            };
        }

        const sessions = await prisma.scheduledSession.findMany({
            where: whereClause,
            include: {
                enquiry: {
                    select: {
                        enquiryId: true,
                        topicName: true,
                        technology: true,
                        customerName: true,
                        location: true,
                        status: true
                    }
                }
            },
            orderBy: [
                { sessionDate: 'asc' },
                { sessionStartTime: 'asc' }
            ]
        });

        res.json(sessions);
    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).json({ error: 'Failed to fetch schedule' });
    }
});

// GET sessions for a specific date
router.get('/date/:date', async (req, res) => {
    try {
        const targetDate = new Date(req.params.date);

        const sessions = await prisma.scheduledSession.findMany({
            where: {
                sessionDate: targetDate
            },
            include: {
                enquiry: true
            },
            orderBy: {
                sessionStartTime: 'asc'
            }
        });

        res.json(sessions);
    } catch (error) {
        console.error('Error fetching sessions for date:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// POST - Generate schedule from enquiry
router.post('/generate/:enquiryId', async (req, res) => {
    try {
        const { enquiryId } = req.params;

        // Get the enquiry
        const enquiry = await prisma.enquiry.findUnique({
            where: { enquiryId }
        });

        if (!enquiry) {
            return res.status(404).json({ error: 'Enquiry not found' });
        }

        // Validate required fields
        if (!enquiry.startDate || !enquiry.endDate) {
            return res.status(400).json({
                error: 'Start date and end date are required to generate schedule'
            });
        }

        if (!enquiry.sessionStartTime || !enquiry.sessionEndTime) {
            return res.status(400).json({
                error: 'Session timings are required to generate schedule'
            });
        }

        if (!enquiry.daysType) {
            return res.status(400).json({
                error: 'Days pattern is required to generate schedule'
            });
        }

        // Generate all session dates
        const sessionDates = generateSessionDates(
            enquiry.startDate,
            enquiry.endDate,
            enquiry.daysType,
            enquiry.customDays
        );

        if (sessionDates.length === 0) {
            return res.status(400).json({
                error: 'No valid session dates found for the given date range and days pattern'
            });
        }

        // Check for conflicts
        const conflicts = [];
        for (const date of sessionDates) {
            const dateConflicts = await checkConflicts(
                prisma,
                date,
                enquiry.sessionStartTime,
                enquiry.sessionEndTime,
                enquiryId
            );
            conflicts.push(...dateConflicts);
        }

        // If conflicts exist and force flag is not set, return conflicts
        if (conflicts.length > 0 && req.body.force !== true) {
            return res.status(409).json({
                error: 'Schedule conflicts detected',
                conflicts,
                message: 'Set force=true in request body to override conflicts'
            });
        }

        // Delete existing sessions for this enquiry (if regenerating)
        await prisma.scheduledSession.deleteMany({
            where: { enquiryId }
        });

        // Create new sessions
        const sessionsToCreate = sessionDates.map(date => ({
            enquiryId: enquiry.enquiryId,
            sessionDate: date,
            sessionStartTime: enquiry.sessionStartTime,
            sessionEndTime: enquiry.sessionEndTime,
            isCompleted: false
        }));

        const createdSessions = await prisma.scheduledSession.createMany({
            data: sessionsToCreate
        });

        res.status(201).json({
            message: 'Schedule generated successfully',
            sessionsCreated: createdSessions.count,
            conflicts: conflicts.length > 0 ? conflicts : undefined
        });

    } catch (error) {
        console.error('Error generating schedule:', error);
        res.status(500).json({ error: 'Failed to generate schedule' });
    }
});

// PUT - Update a specific session
router.put('/:sessionId', async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId);

        const session = await prisma.scheduledSession.update({
            where: { id: sessionId },
            data: {
                sessionDate: req.body.sessionDate ? new Date(req.body.sessionDate) : undefined,
                sessionStartTime: req.body.sessionStartTime,
                sessionEndTime: req.body.sessionEndTime,
                isCompleted: req.body.isCompleted,
                notes: req.body.notes
            },
            include: {
                enquiry: true
            }
        });

        res.json(session);
    } catch (error) {
        console.error('Error updating session:', error);
        res.status(500).json({ error: 'Failed to update session' });
    }
});

// PATCH - Mark session as completed
router.patch('/:sessionId/complete', async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId);

        const session = await prisma.scheduledSession.update({
            where: { id: sessionId },
            data: {
                isCompleted: true,
                notes: req.body.notes || null
            },
            include: {
                enquiry: true
            }
        });

        res.json(session);
    } catch (error) {
        console.error('Error marking session as completed:', error);
        res.status(500).json({ error: 'Failed to mark session as completed' });
    }
});

// DELETE - Delete a specific session
router.delete('/:sessionId', async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId);

        await prisma.scheduledSession.delete({
            where: { id: sessionId }
        });

        res.json({ message: 'Session deleted successfully' });
    } catch (error) {
        console.error('Error deleting session:', error);
        res.status(500).json({ error: 'Failed to delete session' });
    }
});

// DELETE - Delete all sessions for an enquiry
router.delete('/enquiry/:enquiryId', async (req, res) => {
    try {
        const { enquiryId } = req.params;

        const result = await prisma.scheduledSession.deleteMany({
            where: { enquiryId }
        });

        res.json({
            message: 'All sessions deleted successfully',
            deletedCount: result.count
        });
    } catch (error) {
        console.error('Error deleting sessions:', error);
        res.status(500).json({ error: 'Failed to delete sessions' });
    }
});

// GET - Statistics for an enquiry
router.get('/stats/:enquiryId', async (req, res) => {
    try {
        const { enquiryId } = req.params;

        const totalSessions = await prisma.scheduledSession.count({
            where: { enquiryId }
        });

        const completedSessions = await prisma.scheduledSession.count({
            where: {
                enquiryId,
                isCompleted: true
            }
        });

        const upcomingSessions = await prisma.scheduledSession.count({
            where: {
                enquiryId,
                sessionDate: { gte: new Date() },
                isCompleted: false
            }
        });

        res.json({
            total: totalSessions,
            completed: completedSessions,
            upcoming: upcomingSessions,
            remaining: totalSessions - completedSessions
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});
router.post('/backfill', async (req, res) => {
  try {
    console.log('🔄 Starting schedule backfill for existing enquiries...');

    // Find all Confirmed or Delivered enquiries
    const enquiries = await prisma.enquiry.findMany({
      where: {
        status: {
          in: ['Confirmed', 'Delivered']
        }
      },
      include: {
        scheduledSessions: true
      }
    });

    console.log(`📋 Found ${enquiries.length} Confirmed/Delivered enquiries`);

    const results = {
      total: enquiries.length,
      processed: 0,
      skipped: 0,
      failed: 0,
      details: []
    };

    for (const enquiry of enquiries) {
      const hasExistingSessions = enquiry.scheduledSessions.length > 0;
      const forceRegenerate = req.body.force === true;

      // Skip if already has sessions (unless force flag is set)
      if (hasExistingSessions && !forceRegenerate) {
        console.log(`⏭️  Skipping ${enquiry.enquiryId} - already has ${enquiry.scheduledSessions.length} sessions`);
        results.skipped++;
        results.details.push({
          enquiryId: enquiry.enquiryId,
          status: 'skipped',
          reason: 'Already has sessions (use force=true to regenerate)',
          existingSessions: enquiry.scheduledSessions.length
        });
        continue;
      }

      // Validate required fields
      const missingFields = [];
      if (!enquiry.startDate) missingFields.push('startDate');
      if (!enquiry.endDate) missingFields.push('endDate');
      if (!enquiry.sessionStartTime) missingFields.push('sessionStartTime');
      if (!enquiry.sessionEndTime) missingFields.push('sessionEndTime');
      if (!enquiry.daysType) missingFields.push('daysType');

      if (missingFields.length > 0) {
        console.warn(`⚠️  Skipping ${enquiry.enquiryId} - missing fields: ${missingFields.join(', ')}`);
        results.skipped++;
        results.details.push({
          enquiryId: enquiry.enquiryId,
          status: 'skipped',
          reason: 'Missing required fields',
          missingFields
        });
        continue;
      }

      try {
        console.log(`🚀 Generating schedule for ${enquiry.enquiryId} (${enquiry.status})...`);

        // Parse customDays
        let customDaysArray = null;
        if (enquiry.daysType === 'Custom' && enquiry.customDays) {
          customDaysArray = JSON.parse(enquiry.customDays);
        }

        // Generate session dates
        const sessionDates = generateSessionDates(
          enquiry.startDate,
          enquiry.endDate,
          enquiry.daysType,
          customDaysArray
        );

        if (sessionDates.length === 0) {
          console.warn(`⚠️  No valid dates for ${enquiry.enquiryId}`);
          results.skipped++;
          results.details.push({
            enquiryId: enquiry.enquiryId,
            status: 'skipped',
            reason: 'No valid session dates generated'
          });
          continue;
        }

        // Delete existing sessions if force regenerating
        if (hasExistingSessions) {
          const deleteResult = await prisma.scheduledSession.deleteMany({
            where: { enquiryId: enquiry.enquiryId }
          });
          console.log(`🗑️  Deleted ${deleteResult.count} existing sessions for ${enquiry.enquiryId}`);
        }

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

        console.log(`✅ Created ${createResult.count} sessions for ${enquiry.enquiryId}${isDelivered ? ' (all marked completed)' : ''}`);

        results.processed++;
        results.details.push({
          enquiryId: enquiry.enquiryId,
          status: 'success',
          enquiryStatus: enquiry.status,
          sessionsCreated: createResult.count,
          allCompleted: isDelivered
        });

      } catch (error) {
        console.error(`❌ Failed to generate schedule for ${enquiry.enquiryId}:`, error.message);
        results.failed++;
        results.details.push({
          enquiryId: enquiry.enquiryId,
          status: 'failed',
          error: error.message
        });
      }
    }

    console.log('✅ Backfill completed:', {
      total: results.total,
      processed: results.processed,
      skipped: results.skipped,
      failed: results.failed
    });

    res.json({
      message: 'Schedule backfill completed',
      summary: {
        totalEnquiries: results.total,
        processed: results.processed,
        skipped: results.skipped,
        failed: results.failed
      },
      details: results.details
    });

  } catch (error) {
    console.error('❌ Backfill error:', error);
    res.status(500).json({ 
      error: 'Backfill failed', 
      message: error.message 
    });
  }
});

module.exports = router;
