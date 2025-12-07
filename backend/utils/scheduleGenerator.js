/**
 * Generate all session dates based on date range and days pattern
 */
function generateSessionDates(startDate, endDate, daysType, customDays) {
  const sessionDates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Parse custom days if provided
  let allowedDays = [];
  if (daysType === 'Weekdays') {
    allowedDays = [1, 2, 3, 4, 5]; // Mon-Fri
  } else if (daysType === 'Weekends') {
    allowedDays = [0, 6]; // Sun, Sat
  } else if (daysType === 'Custom' && customDays) {
    // Convert day names to numbers (0=Sunday, 6=Saturday)
    const dayMap = {
      'Sunday': 0,
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6
    };
    
    const parsedDays = typeof customDays === 'string' 
      ? JSON.parse(customDays) 
      : customDays;
    
    allowedDays = parsedDays.map(day => dayMap[day]);
  }
  
  // Loop through each day in the range
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    
    // Check if this day matches the pattern
    if (allowedDays.length === 0 || allowedDays.includes(dayOfWeek)) {
      sessionDates.push(new Date(currentDate));
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return sessionDates;
}

/**
 * Check for schedule conflicts
 */
async function checkConflicts(prisma, sessionDate, startTime, endTime, excludeEnquiryId = null) {
  const conflicts = [];
  
  // Get all sessions on this date
  const existingSessions = await prisma.scheduledSession.findMany({
    where: {
      sessionDate: sessionDate,
      ...(excludeEnquiryId && { enquiryId: { not: excludeEnquiryId } })
    },
    include: {
      enquiry: true
    }
  });
  
  // Check time overlap
  for (const session of existingSessions) {
    if (timesOverlap(startTime, endTime, session.sessionStartTime, session.sessionEndTime)) {
      conflicts.push({
        date: sessionDate,
        time: `${session.sessionStartTime}-${session.sessionEndTime}`,
        enquiryId: session.enquiryId,
        topicName: session.enquiry.topicName
      });
    }
  }
  
  return conflicts;
}

/**
 * Check if two time ranges overlap
 */
function timesOverlap(start1, end1, start2, end2) {
  const [h1Start, m1Start] = start1.split(':').map(Number);
  const [h1End, m1End] = end1.split(':').map(Number);
  const [h2Start, m2Start] = start2.split(':').map(Number);
  const [h2End, m2End] = end2.split(':').map(Number);
  
  const time1Start = h1Start * 60 + m1Start;
  const time1End = h1End * 60 + m1End;
  const time2Start = h2Start * 60 + m2Start;
  const time2End = h2End * 60 + m2End;
  
  return (time1Start < time2End && time1End > time2Start);
}

module.exports = {
  generateSessionDates,
  checkConflicts,
  timesOverlap
};
