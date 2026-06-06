/**
 * Pure helper functions for StressRadar application
 */

/**
 * Parses userId, collection name, and document id from a db path string.
 * E.g. "users/uid/tasks" -> { userId: "uid", collection: "tasks", id: null }
 * E.g. "users/uid/tasks/doc123" -> { userId: "uid", collection: "tasks", id: "doc123" }
 * @param {string} path 
 * @returns {{userId: string|null, collection: string, id: string|null}}
 */
export const parsePath = (path) => {
  if (!path) return { userId: null, collection: '', id: null };
  const parts = path.split('/');
  if (parts.length >= 3) {
    return {
      userId: parts[1],
      collection: parts[2],
      id: parts[3] || null
    };
  }
  return { userId: null, collection: path, id: null };
};

/**
 * Maps target exams to their corresponding subjects.
 * @param {string[]} exams 
 * @returns {string[]}
 */
export const getSubjectsForExam = (exams) => {
  if (!exams || exams.length === 0) return ['Physics', 'Chemistry', 'Mathematics'];
  const primaryExam = exams[0].toLowerCase();
  if (primaryExam.includes('jee') || primaryExam.includes('gate') || primaryExam.includes('board exam class 12')) {
    return ['Physics', 'Chemistry', 'Mathematics'];
  }
  if (primaryExam.includes('neet')) {
    return ['Physics', 'Chemistry', 'Biology'];
  }
  if (primaryExam.includes('upsc')) {
    return ['General Studies', 'CSAT', 'Optional Subject'];
  }
  if (primaryExam.includes('cat')) {
    return ['Quantitative Ability', 'DILR', 'Verbal Ability'];
  }
  if (primaryExam.includes('boards_10') || primaryExam.includes('class 10')) {
    return ['Science', 'Mathematics', 'Social Science'];
  }
  if (primaryExam.includes('cuet')) {
    return ['Language Test', 'Domain Subjects', 'General Test'];
  }
  return ['Subject A', 'Subject B', 'Subject C'];
};

/**
 * Simulates subject-wise scores and stress levels based on mock test records and current burnout.
 * @param {object[]} tests 
 * @param {number} currentBurnout 
 * @param {string[]} targetExams 
 * @returns {object[]}
 */
export const generateSubjectData = (tests, currentBurnout, targetExams) => {
  const subjects = getSubjectsForExam(targetExams);
  const completedTests = (tests || []).filter(t => t.status === 'completed');
  let avgScorePercent = 65;
  if (completedTests.length > 0) {
    const sum = completedTests.reduce((acc, t) => acc + (t.percentage || 50), 0);
    avgScorePercent = Math.round(sum / completedTests.length);
  }

  return subjects.map((subject, idx) => {
    let scoreVar;
    let stressVar;
    if (idx === 0) { scoreVar = 5; stressVar = -5; }
    else if (idx === 1) { scoreVar = -12; stressVar = 15; }
    else { scoreVar = 8; stressVar = -8; }

    const finalScore = Math.max(30, Math.min(100, avgScorePercent + scoreVar));
    const finalStress = Math.max(10, Math.min(100, (currentBurnout || 40) + stressVar));

    return {
      subject,
      Score: finalScore,
      Stress: finalStress
    };
  });
};
