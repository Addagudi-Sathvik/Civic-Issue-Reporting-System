/**
 * Utility functions for issue processing
 */

/**
 * Calculate priority based on votes and other factors
 */
function calculatePriority(votes, confirmations = 0, trustScoreOfReporter = 50) {
  let score = votes * 2 + confirmations * 1.5;

  // Adjust for reporter trustScore
  if (trustScoreOfReporter < 30) score *= 0.7; // Reduce priority for low-trust reporters
  if (trustScoreOfReporter > 80) score *= 1.1; // Slightly increase for high-trust reporters

  if (score >= 30) return 'HIGH';
  if (score >= 10) return 'MEDIUM';
  if (score >= 3) return 'LOW';
  return 'LOW';
}

/**
 * Distance calculation using Haversine formula
 */
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Check for duplicate issues nearby
 * Returns nearby issues within specified radius
 */
async function checkNearbyDuplicates(Issue, lat, lng, category, radiusKm = 2) {
  const allIssues = await Issue.find({
    category: category,
    status: { $in: ['VERIFIED', 'ASSIGNED', 'IN_PROGRESS'] },
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
  });

  const nearbyIssues = allIssues.filter(issue => {
    if (!issue.location || !issue.location.lat || !issue.location.lng) return false;
    const distance = getDistanceFromLatLonInKm(lat, lng, issue.location.lat, issue.location.lng);
    return distance <= radiusKm;
  });

  return nearbyIssues;
}

/**
 * Determine if issue should auto-verify based on AI confidence
 * Returns { shouldVerify: boolean, reason: string }
 */
function determinAutoVerification(aiConfidence, nearbyDuplicates) {
  if (aiConfidence >= 75) {
    return { shouldVerify: true, reason: 'High AI confidence' };
  }

  if (aiConfidence >= 60 && nearbyDuplicates.length > 0) {
    return { shouldVerify: true, reason: 'Moderate AI confidence with nearby duplicates' };
  }

  if (aiConfidence < 50) {
    return { shouldVerify: false, reason: 'Low AI confidence - requires human review' };
  }

  return { shouldVerify: false, reason: 'Moderate confidence - awaiting crowd confirmation' };
}

/**
 * Detect fake reports based on reporter behavior
 * Returns fakeness score 0-100
 */
async function detectFakeReport(Issue, reporterId, userTrustScore, category) {
  let fakeScore = 0;

  // Trust score factor: Users with very low trust are more likely to report fake issues
  if (userTrustScore < 20) fakeScore += 35;
  else if (userTrustScore < 40) fakeScore += 20;
  else if (userTrustScore > 80) fakeScore -= 10; // High trust users less likely to fake

  // Check user's report history
  const userReports = await Issue.find({ reporterId: reporterId });
  if (userReports.length > 0) {
    const rejectedCount = userReports.filter(i => i.status === 'REJECTED').length;
    const rejectionRate = rejectedCount / userReports.length;
    fakeScore += rejectionRate * 40; // Up to 40 points based on rejection rate
  }

  // Category factors - some categories more prone to false reports
  const categoryRisk = { ROADS: 0, WATER: 10, GARBAGE: 15, ELECTRICITY: 20, OTHER: 30 };
  fakeScore += categoryRisk[category] || 15;

  // Cap score at 100
  return Math.min(fakeScore, 100);
}

/**
 * Predict category based on description and title (simple heuristic)
 */
function predictCategory(title, description) {
  const text = `${title} ${description}`.toLowerCase();

  const keywords = {
    ROADS: ['pothole', 'road', 'crack', 'pavement', 'highway', 'street', 'asphalt'],
    GARBAGE: ['trash', 'garbage', 'waste', 'dump', 'litter', 'debris', 'mess'],
    ELECTRICITY: ['light', 'electricity', 'streetlight', 'lamp', 'power', 'electric'],
    WATER: ['water', 'flood', 'leak', 'pipe', 'drainage', 'sewage', 'stagnant'],
    OTHER: ['other', 'general', 'civic', 'public']
  };

  let bestMatch = 'OTHER';
  let bestScore = 0;

  for (const [category, words] of Object.entries(keywords)) {
    const score = words.filter(word => text.includes(word)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = category;
    }
  }

  return bestMatch;
}

/**
 * Get category for department assignment
 */
function getCategoryName(category) {
  const names = {
    ROADS: 'Roads & Transport',
    GARBAGE: 'Waste & Garbage',
    ELECTRICITY: 'Electricity & Lighting',
    WATER: 'Water Management',
    OTHER: 'General Issues'
  };
  return names[category] || 'General Issues';
}

module.exports = {
  calculatePriority,
  getDistanceFromLatLonInKm,
  deg2rad,
  checkNearbyDuplicates,
  determinAutoVerification,
  detectFakeReport,
  predictCategory,
  getCategoryName
};
