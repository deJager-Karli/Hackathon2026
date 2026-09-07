
// UniFlow
// Complete Logic for the UniFlow Dashboard Layout

const STORAGE_KEY = 'uniflowData';

let state = {
    assignments: [],
    studySessions: [],
    courses: [],
    settings: {
        weeklyGoal: 20,
        reminderDays: 3
    }
};

// Sample data 
function initializeSampleData() {
    const courses = [
        { id: 1, code: 'PROG', name: 'Programming', color: '#4A90D9', progress: 62 },
        { id: 2, code: 'DB', name: 'Database Development', color: '#E67E22', progress: 45 },
        { id: 3, code: 'CLOUD', name: 'Cloud Development', color: '#27AE60', progress: 30 }
    ];

    const assignments = [
        {
            id: 1,
            courseId: 1,
            name: 'Programming POE',
            dueDate: getDateOffset(1), 
            weight: 35,
            estimatedHours: 12,
            status: 'in-progress',
            priority: 'high',
            description: 'Final programming project',
            createdAt: getDateOffset(-7)
        },
        {
            id: 2,
            courseId: 2,
            name: 'Database Assignment',
            dueDate: getDateOffset(3), 
            weight: 25,
            estimatedHours: 8,
            status: 'pending',
            priority: 'high',
            description: 'Design and implement database',
            createdAt: getDateOffset(-5)
        },
        {
            id: 3,
            courseId: 3,
            name: 'Cloud Development ICE',
            dueDate: getDateOffset(6), 
            weight: 20,
            estimatedHours: 6,
            status: 'pending',
            priority: 'medium',
            description: 'Cloud infrastructure setup',
            createdAt: getDateOffset(-3)
        }
    ];

    const studySessions = [
        { id: 1, assignmentId: 1, hours: 4.5, date: getDateOffset(-2), notes: 'Worked on algorithms' },
        { id: 2, assignmentId: 1, hours: 3, date: getDateOffset(-1), notes: 'Code review and testing' },
        { id: 3, assignmentId: 2, hours: 2, date: getDateOffset(-1), notes: 'Database design' }
    ];

    return { courses, assignments, studySessions };
}

function getDateOffset(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

//Data Management
function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        const data = JSON.parse(stored);
        state.assignments = data.assignments || [];
        state.studySessions = data.studySessions || [];
        state.courses = data.courses || [];
        state.settings = data.settings || state.settings;
    } else {
        const sample = initializeSampleData();
        state.courses = sample.courses;
        state.assignments = sample.assignments;
        state.studySessions = sample.studySessions;
        saveData();
    }
    return state;
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        assignments: state.assignments,
        studySessions: state.studySessions,
        courses: state.courses,
        settings: state.settings
    }));
}

//Modules
function getCourses() {
    return state.courses;
}

function getCourse(id) {
    return state.courses.find(c => c.id === id);
}

function addCourse(code, name, color = '#4A90D9') {
    const course = {
        id: Date.now(),
        code,
        name,
        color,
        progress: 0
    };
    state.courses.push(course);
    saveData();
    return course;
}

function updateCourseProgress(courseId) {
    const courseAssignments = state.assignments.filter(a => a.courseId === courseId);
    if (courseAssignments.length === 0) return 0;

    const totalWeight = courseAssignments.reduce((sum, a) => sum + a.weight, 0);
    const completedWeight = courseAssignments
        .filter(a => a.status === 'completed')
        .reduce((sum, a) => sum + a.weight, 0);

    const progress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

    const course = getCourse(courseId);
    if (course) {
        course.progress = progress;
        saveData();
    }
    return progress;
}

function getCourseProgress(courseId) {
    const course = getCourse(courseId);
    return course ? course.progress : 0;
}

//Assignment Management
function getAssignments(filters = {}) {
    let result = state.assignments;

    if (filters.courseId) {
        result = result.filter(a => a.courseId === filters.courseId);
    }
    if (filters.status) {
        result = result.filter(a => a.status === filters.status);
    }
    if (filters.priority) {
        result = result.filter(a => a.priority === filters.priority);
    }

    return result;
}

function getAssignment(id) {
    return state.assignments.find(a => a.id === id);
}

function addAssignment(name, courseId, dueDate, weight, estimatedHours, description = '', priority = 'medium') {
    const assignment = {
        id: Date.now(),
        courseId,
        name,
        dueDate,
        weight: parseFloat(weight),
        estimatedHours: parseFloat(estimatedHours),
        status: 'pending',
        priority,
        description,
        createdAt: new Date().toISOString().split('T')[0]
    };
    state.assignments.push(assignment);
    updateCourseProgress(courseId);
    saveData();
    return assignment;
}

function updateAssignment(id, updates) {
    const index = state.assignments.findIndex(a => a.id === id);
    if (index !== -1) {
        state.assignments[index] = { ...state.assignments[index], ...updates };
        if (updates.courseId) {
            updateCourseProgress(updates.courseId);
        }
        saveData();
        return state.assignments[index];
    }
    return null;
}

function deleteAssignment(id) {
    const assignment = getAssignment(id);
    if (assignment) {
        state.assignments = state.assignments.filter(a => a.id !== id);
        state.studySessions = state.studySessions.filter(s => s.assignmentId !== id);
        updateCourseProgress(assignment.courseId);
        saveData();
        return true;
    }
    return false;
}

//Priority Engine
function calculatePriorityScore(assignment) {
    if (assignment.status === 'completed') return -1;

    const now = new Date();
    const due = new Date(assignment.dueDate);
    const daysUntilDue = Math.max(0, Math.ceil((due - now) / (1000 * 60 * 60 * 24)));

    // Weight score 
    const weightScore = (assignment.weight / 40) * 100;

    // Urgency score 
    const urgencyScore = daysUntilDue === 0 ? 100 : Math.max(0, 100 / (daysUntilDue + 1));

    // Priority bonus
    const priorityBonus = { low: 0, medium: 10, high: 20 };

    // Status bonus 
    const statusBonus = assignment.status === 'in-progress' ? 15 : 0;

    const rawScore = (weightScore * 0.35) + (urgencyScore * 0.45) +
        (priorityBonus[assignment.priority] || 0) + statusBonus;

    return Math.round(Math.min(100, Math.max(0, rawScore)));
}

function getPrioritizedAssignments(limit = null) {
    const withScores = state.assignments.map(a => {
        const course = getCourse(a.courseId);
        return {
            ...a,
            course,
            priorityScore: calculatePriorityScore(a),
            daysUntilDue: Math.max(0, Math.ceil((new Date(a.dueDate) - new Date()) / (1000 * 60 * 60 * 24))),
            progress: getAssignmentProgress(a.id)
        };
    });

    const sorted = withScores
        .filter(a => a.priorityScore >= 0)
        .sort((a, b) => b.priorityScore - a.priorityScore);

    return limit ? sorted.slice(0, limit) : sorted;
}


function getAssignmentPriorities() {
    const prioritized = getPrioritizedAssignments(5);
    return prioritized.map(a => ({
        id: a.id,
        name: a.name,
        course: a.course?.name || 'Unknown',
        dueDate: a.dueDate,
        daysUntilDue: a.daysUntilDue,
        weight: a.weight,
        priorityScore: a.priorityScore,
        status: a.status,
        progress: a.progress || 0
    }));
}

// Study Progress Tracking

function addStudySession(assignmentId, hours, date = null, notes = '') {
    const assignment = getAssignment(assignmentId);
    if (!assignment) throw new Error('Assignment not found');

    const session = {
        id: Date.now(),
        assignmentId,
        hours: parseFloat(hours),
        date: date || new Date().toISOString().split('T')[0],
        notes
    };
    state.studySessions.push(session);

    // Update assignment progress
    updateAssignmentProgress(assignmentId);
    saveData();
    return session;
}

function getStudySessions(assignmentId = null) {
    let sessions = state.studySessions;
    if (assignmentId) {
        sessions = sessions.filter(s => s.assignmentId === assignmentId);
    }
    return sessions.sort((a, b) => b.date.localeCompare(a.date));
}

function getTotalStudyHours(assignmentId) {
    return state.studySessions
        .filter(s => s.assignmentId === assignmentId)
        .reduce((sum, s) => sum + s.hours, 0);
}

function getAssignmentProgress(assignmentId) {
    const assignment = getAssignment(assignmentId);
    if (!assignment) return 0;

    const totalStudied = getTotalStudyHours(assignmentId);
    const progress = assignment.estimatedHours > 0 ?
        Math.min(100, Math.round((totalStudied / assignment.estimatedHours) * 100)) : 0;

    return progress;
}

function updateAssignmentProgress(assignmentId) {
    const assignment = getAssignment(assignmentId);
    if (!assignment) return;

    const totalStudied = getTotalStudyHours(assignmentId);

    if (totalStudied >= assignment.estimatedHours && assignment.status !== 'completed') {
        updateAssignment(assignmentId, { status: 'completed' });
    } else if (totalStudied > 0 && assignment.status === 'pending') {
        updateAssignment(assignmentId, { status: 'in-progress' });
    }

    // Update course progress
    updateCourseProgress(assignment.courseId);
}

// For the "Study Progress" section in layout
function getStudyProgressData() {
    const courseProgress = state.courses.map(course => {
        const courseAssignments = state.assignments.filter(a => a.courseId === course.id);
        const totalWeight = courseAssignments.reduce((sum, a) => sum + a.weight, 0);
        const completedWeight = courseAssignments
            .filter(a => a.status === 'completed')
            .reduce((sum, a) => sum + a.weight, 0);

        const progress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

        return {
            courseId: course.id,
            courseName: course.name,
            progress,
            color: course.color,
            assignments: courseAssignments.length,
            completed: courseAssignments.filter(a => a.status === 'completed').length
        };
    });

    return courseProgress;
}

// For the "Study Hub" section
function getStudyHubData() {
    const allAssignments = getPrioritizedAssignments();
    const totalAssignments = allAssignments.length;
    const completed = allAssignments.filter(a => a.status === 'completed').length;
    const inProgress = allAssignments.filter(a => a.status === 'in-progress').length;
    const pending = allAssignments.filter(a => a.status === 'pending').length;

    const totalEstimated = allAssignments.reduce((sum, a) => sum + a.estimatedHours, 0);
    const totalStudied = state.studySessions.reduce((sum, s) => sum + s.hours, 0);
    const overallProgress = totalEstimated > 0 ? Math.round((totalStudied / totalEstimated) * 100) : 0;

    return {
        overview: {
            total: totalAssignments,
            completed,
            inProgress,
            pending,
            completionRate: totalAssignments > 0 ? Math.round((completed / totalAssignments) * 100) : 0,
            overallProgress,
            totalHoursStudied: totalStudied,
            totalEstimatedHours: totalEstimated,
            remainingHours: Math.max(0, totalEstimated - totalStudied)
        },
        byCourse: getStudyProgressData()
    };
}

// Top Priority Section
function getFocusNow() {
    const prioritized = getPrioritizedAssignments();

    if (prioritized.length === 0) {
        return {
            hasFocus: false,
            message: 'All caught up! No pending assignments.'
        };
    }

    const topPriority = prioritized[0];
    const progress = getAssignmentProgress(topPriority.id);

    // Generate study recommendation
    let recommendation = '';
    if (topPriority.daysUntilDue === 0) {
        recommendation = 'This task is due today! Focus all your energy on completing it.';
    } else if (topPriority.daysUntilDue <= 2) {
        recommendation = `This task has a close deadline (${topPriority.daysUntilDue} days away) and carries significant academic weighting.`;
    } else if (progress < 30) {
        recommendation = 'You\'ve barely started this high-priority assignment. Begin studying now.';
    } else if (progress < 70) {
        recommendation = `You're making progress (${progress}%). Keep going to complete it on time.`;
    } else {
        recommendation = `Almost there! ${progress}% complete. Finalize this assignment.`;
    }

    return {
        hasFocus: true,
        assignment: {
            id: topPriority.id,
            name: topPriority.name,
            course: topPriority.course?.name || 'Unknown',
            dueDate: topPriority.dueDate,
            daysUntilDue: topPriority.daysUntilDue,
            weight: topPriority.weight,
            priorityScore: topPriority.priorityScore,
            progress: progress,
            estimatedHours: topPriority.estimatedHours,
            totalStudied: getTotalStudyHours(topPriority.id),
            status: topPriority.status
        },
        recommendation,
        // Suggested study time for today
        suggestedStudyHours: Math.min(
            topPriority.estimatedHours - getTotalStudyHours(topPriority.id),
            4
        )
    };
}

//Dashboard
function getDashboardStats() {
    const focus = getFocusNow();
    const hubData = getStudyHubData();
    const priorities = getAssignmentPriorities();

    // Calculate weekly progress 
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weeklyHours = state.studySessions.filter(s => {
        const sessionDate = new Date(s.date);
        return sessionDate >= weekStart;
    }).reduce((sum, s) => sum + s.hours, 0);

    const weeklyGoal = state.settings.weeklyGoal || 20;
    const weeklyProgress = Math.min(100, Math.round((weeklyHours / weeklyGoal) * 100));

    // High priority tasks count
    const highPriorityTasks = state.assignments.filter(a =>
        a.priority === 'high' && a.status !== 'completed'
    ).length;

    return {
        weeklyProgress,
        weeklyHours,
        weeklyGoal,
        totalAssignments: hubData.overview.total,
        completedAssignments: hubData.overview.completed,
        highPriorityTasks,
        inProgress: hubData.overview.inProgress,
        pending: hubData.overview.pending,
        overallProgress: hubData.overview.overallProgress,
        focus: focus,
        priorities: priorities.slice(0, 3)
    };
}

//Add assignment & start studying
function handleAddAssignment(data) {
    const { name, courseId, dueDate, weight, estimatedHours, description, priority } = data;
    return addAssignment(name, courseId, dueDate, weight, estimatedHours, description, priority);
}

function handleStartStudying(assignmentId, hours, notes = '') {
    return addStudySession(assignmentId, hours, null, notes);
}

function handleMarkComplete(assignmentId) {
    const assignment = getAssignment(assignmentId);
    if (assignment) {
        // If not enough hours studied, auto-add to reach estimated hours
        const totalStudied = getTotalStudyHours(assignmentId);
        if (totalStudied < assignment.estimatedHours) {
            const remaining = assignment.estimatedHours - totalStudied;
            addStudySession(assignmentId, remaining, null, 'Auto-completed');
        }
        updateAssignment(assignmentId, { status: 'completed' });
        return true;
    }
    return false;
}


//Get course stats for study progress
function getCourseStats() {
    return state.courses.map(course => {
        const courseAssignments = state.assignments.filter(a => a.courseId === course.id);
        const totalAssignments = courseAssignments.length;
        const completed = courseAssignments.filter(a => a.status === 'completed').length;
        const totalWeight = courseAssignments.reduce((sum, a) => sum + a.weight, 0);
        const completedWeight = courseAssignments
            .filter(a => a.status === 'completed')
            .reduce((sum, a) => sum + a.weight, 0);

        const progress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
        const totalHours = courseAssignments.reduce((sum, a) => sum + a.estimatedHours, 0);
        const studiedHours = state.studySessions
            .filter(s => {
                const ass = getAssignment(s.assignmentId);
                return ass && ass.courseId === course.id;
            })
            .reduce((sum, s) => sum + s.hours, 0);

        return {
            id: course.id,
            code: course.code,
            name: course.name,
            color: course.color,
            progress,
            assignments: {
                total: totalAssignments,
                completed,
                remaining: totalAssignments - completed
            },
            hours: {
                estimated: totalHours,
                studied: studiedHours,
                remaining: Math.max(0, totalHours - studiedHours)
            }
        };
    });
}

//Deadline reminders
function getDeadlineReminders() {
    const now = new Date();
    const upcoming = state.assignments
        .filter(a => {
            const due = new Date(a.dueDate);
            const daysUntil = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
            return daysUntil >= 0 && daysUntil <= 7 && a.status !== 'completed';
        })
        .map(a => {
            const due = new Date(a.dueDate);
            const daysUntil = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
            const course = getCourse(a.courseId);
            return {
                ...a,
                course,
                daysUntil,
                urgency: daysUntil === 0 ? 'today' :
                    daysUntil <= 2 ? 'very soon' : 'soon'
            };
        })
        .sort((a, b) => a.daysUntil - b.daysUntil);

    return upcoming;
}

//Settings
function getSettings() {
    return state.settings;
}

function updateSettings(settings) {
    state.settings = { ...state.settings, ...settings };
    saveData();
    return state.settings;
}


function exportData() {
    return {
        ...state,
        exportedAt: new Date().toISOString(),
        version: '2.0'
    };
}

function importData(data) {
    if (data.assignments && data.courses && data.studySessions) {
        state.assignments = data.assignments;
        state.courses = data.courses;
        state.studySessions = data.studySessions;
        if (data.settings) state.settings = data.settings;
        saveData();
        return true;
    }