

const STORAGE_KEY = "uniflowData";


let state = {

    assignments: [],

    studySessions: [],

    courses: [],

    settings: {

        weeklyGoal: 20,

        reminderDays: 3

    }

};




function initializeSampleData() {

    const courses = [

        {
            id: 1,
            code: "PROG",
            name: "Programming",
            progress: 0
        },

        {
            id: 2,
            code: "DB",
            name: "Database Development",
            progress: 0
        },

        {
            id: 3,
            code: "CLOUD",
            name: "Cloud Development",
            progress: 0
        }

    ];


    const assignments = [

        {
            id: 1,
            courseId: 1,

            name: "Programming POE",

            dueDate: getDateOffset(1),

            weight: 35,

            estimatedHours: 12,

            status: "in-progress",

            priority: "high",

            description: "Final programming project",

            createdAt: getDateOffset(-7)
        },

        {
            id: 2,
            courseId: 2,

            name: "Database Assignment",

            dueDate: getDateOffset(3),

            weight: 25,

            estimatedHours: 8,

            status: "pending",

            priority: "high",

            description: "Design and implement database",

            createdAt: getDateOffset(-5)
        },

        {
            id: 3,
            courseId: 3,

            name: "Cloud Development ICE",

            dueDate: getDateOffset(6),

            weight: 20,

            estimatedHours: 6,

            status: "pending",

            priority: "medium",

            description: "Cloud infrastructure setup",

            createdAt: getDateOffset(-3)
        }

    ];


    const studySessions = [

        {
            id: 1,
            assignmentId: 1,

            hours: 4.5,

            date: getDateOffset(-2),

            notes: "Worked on algorithms"
        },

        {
            id: 2,
            assignmentId: 1,

            hours: 3,

            date: getDateOffset(-1),

            notes: "Code review and testing"
        },

        {
            id: 3,
            assignmentId: 2,

            hours: 2,

            date: getDateOffset(-1),

            notes: "Database design"
        }

    ];


    return {

        courses,

        assignments,

        studySessions

    };

}




function getDateOffset(days) {

    const date = new Date();

    date.setDate(
        date.getDate() + days
    );


    return date
        .toISOString()
        .split("T")[0];

}



function loadData() {

    const stored =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (stored) {

        try {

            const data =
                JSON.parse(stored);


            state.assignments =
                data.assignments || [];


            state.studySessions =
                data.studySessions || [];


            state.courses =
                data.courses || [];


            state.settings =
                data.settings ||
                state.settings;

        }
        catch (error) {

            console.error(
                "Could not load UniFlow data.",
                error
            );


            resetToSampleData();

        }

    }
    else {

        resetToSampleData();

    }


    updateAllCourseProgress();


    return state;

}



function saveData() {

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify({

            assignments:
                state.assignments,

            studySessions:
                state.studySessions,

            courses:
                state.courses,

            settings:
                state.settings

        })

    );

}




function resetToSampleData() {

    const sample =
        initializeSampleData();


    state.courses =
        sample.courses;


    state.assignments =
        sample.assignments;


    state.studySessions =
        sample.studySessions;


    state.settings = {

        weeklyGoal: 20,

        reminderDays: 3

    };


    saveData();

}




function getCourses() {

    return [...state.courses];

}


// Get one module

function getCourse(id) {

    return state.courses.find(

        course =>
            course.id === Number(id)

    );

}


// Add module

function addCourse(
    code,
    name
) {

    const trimmedCode =
        code.trim();


    const trimmedName =
        name.trim();


    if (
        trimmedCode === "" ||
        trimmedName === ""
    ) {

        throw new Error(
            "Module code and name are required."
        );

    }


    const duplicate =
        state.courses.some(

            course =>
                course.code
                    .toLowerCase() ===
                trimmedCode
                    .toLowerCase()

        );


    if (duplicate) {

        throw new Error(
            "A module with this code already exists."
        );

    }


    const course = {

        id: Date.now(),

        code: trimmedCode,

        name: trimmedName,

        progress: 0

    };


    state.courses.push(
        course
    );


    saveData();


    return course;

}


// Update module

function updateCourse(
    id,
    updates
) {

    const course =
        getCourse(id);


    if (!course) {

        return null;

    }


    if (
        updates.code !== undefined
    ) {

        const newCode =
            updates.code.trim();


        if (newCode === "") {

            throw new Error(
                "Module code cannot be empty."
            );

        }


        const duplicate =
            state.courses.some(

                otherCourse =>
                    otherCourse.id !== Number(id) &&
                    otherCourse.code
                        .toLowerCase() ===
                    newCode
                        .toLowerCase()

            );


        if (duplicate) {

            throw new Error(
                "A module with this code already exists."
            );

        }


        course.code =
            newCode;

    }


    if (
        updates.name !== undefined
    ) {

        const newName =
            updates.name.trim();


        if (newName === "") {

            throw new Error(
                "Module name cannot be empty."
            );

        }


        course.name =
            newName;

    }


    saveData();


    return course;

}


// Delete module

function deleteCourse(id) {

    const courseId =
        Number(id);


    const course =
        getCourse(courseId);


    if (!course) {

        return false;

    }


  

    const assignmentIds =
        state.assignments

            .filter(

                assignment =>
                    assignment.courseId ===
                    courseId

            )

            .map(

                assignment =>
                    assignment.id

            );


    

    state.studySessions =
        state.studySessions.filter(

            session =>
                !assignmentIds.includes(
                    session.assignmentId
                )

        );


    

    state.assignments =
        state.assignments.filter(

            assignment =>
                assignment.courseId !==
                courseId

        );


    

    state.courses =
        state.courses.filter(

            courseItem =>
                courseItem.id !==
                courseId

        );


    saveData();


    return true;

}




function updateCourseProgress(
    courseId
) {

    const course =
        getCourse(courseId);


    if (!course) {

        return 0;

    }


    const courseAssignments =
        state.assignments.filter(

            assignment =>
                assignment.courseId ===
                Number(courseId)

        );


    if (
        courseAssignments.length === 0
    ) {

        course.progress = 0;

        saveData();

        return 0;

    }


    const totalWeight =
        courseAssignments.reduce(

            (sum, assignment) =>
                sum +
                Number(
                    assignment.weight
                ),

            0

        );


    const completedWeight =
        courseAssignments

            .filter(

                assignment =>
                    assignment.status ===
                    "completed"

            )

            .reduce(

                (sum, assignment) =>
                    sum +
                    Number(
                        assignment.weight
                    ),

                0

            );


    const progress =

        totalWeight > 0

            ?

            Math.round(

                (
                    completedWeight /
                    totalWeight
                )

                *

                100

            )

            :

            0;


    course.progress =
        progress;


    saveData();


    return progress;

}


function updateAllCourseProgress() {

    state.courses.forEach(

        course => {

            updateCourseProgress(
                course.id
            );

        }

    );

}


function getCourseProgress(
    courseId
) {

    const course =
        getCourse(courseId);


    return course
        ? course.progress
        : 0;

}




// Get assignments

function getAssignments(
    filters = {}
) {

    let result =
        [...state.assignments];


    if (
        filters.courseId !== undefined
    ) {

        result =
            result.filter(

                assignment =>
                    assignment.courseId ===
                    Number(
                        filters.courseId
                    )

            );

    }


    if (filters.status) {

        result =
            result.filter(

                assignment =>
                    assignment.status ===
                    filters.status

            );

    }


    if (filters.priority) {

        result =
            result.filter(

                assignment =>
                    assignment.priority ===
                    filters.priority

            );

    }


    return result;

}


// Get individual assignment

function getAssignment(id) {

    return state.assignments.find(

        assignment =>
            assignment.id === Number(id)

    );

}


// Add assignment

function addAssignment(
    name,
    courseId,
    dueDate,
    weight,
    estimatedHours,
    description = "",
    priority = "medium"
) {

    const selectedCourse =
        getCourse(courseId);


    if (!selectedCourse) {

        throw new Error(
            "Please select a valid module."
        );

    }


    if (
        !name ||
        name.trim() === ""
    ) {

        throw new Error(
            "Assignment name is required."
        );

    }


    if (!dueDate) {

        throw new Error(
            "Due date is required."
        );

    }


    const numericWeight =
        Number(weight);


    const numericHours =
        Number(estimatedHours);


    if (
        numericWeight < 0 ||
        numericWeight > 100
    ) {

        throw new Error(
            "Weight must be between 0 and 100."
        );

    }


    if (
        numericHours <= 0
    ) {

        throw new Error(
            "Estimated hours must be greater than zero."
        );

    }


    const assignment = {

        id:
            Date.now(),

        courseId:
            Number(courseId),

        name:
            name.trim(),

        dueDate:
            dueDate,

        weight:
            numericWeight,

        estimatedHours:
            numericHours,

       

        status:
            "pending",

        priority:
            priority,

        description:
            description.trim(),

        createdAt:
            new Date()
                .toISOString()
                .split("T")[0]

    };


    state.assignments.push(
        assignment
    );


    updateCourseProgress(
        assignment.courseId
    );


    saveData();


    return assignment;

}


// Update assignment

function updateAssignment(
    id,
    updates
) {

    const assignment =
        getAssignment(id);


    if (!assignment) {

        return null;

    }


    const oldCourseId =
        assignment.courseId;


    if (
        updates.name !== undefined
    ) {

        const newName =
            updates.name.trim();


        if (newName === "") {

            throw new Error(
                "Assignment name cannot be empty."
            );

        }


        assignment.name =
            newName;

    }


    if (
        updates.courseId !== undefined
    ) {

        const newCourse =
            getCourse(
                updates.courseId
            );


        if (!newCourse) {

            throw new Error(
                "Please select a valid module."
            );

        }


        assignment.courseId =
            Number(
                updates.courseId
            );

    }


    if (
        updates.dueDate !== undefined
    ) {

        if (
            updates.dueDate === ""
        ) {

            throw new Error(
                "Due date cannot be empty."
            );

        }


        assignment.dueDate =
            updates.dueDate;

    }


    if (
        updates.weight !== undefined
    ) {

        const weight =
            Number(
                updates.weight
            );


        if (
            weight < 0 ||
            weight > 100
        ) {

            throw new Error(
                "Weight must be between 0 and 100."
            );

        }


        assignment.weight =
            weight;

    }


    if (
        updates.estimatedHours !==
        undefined
    ) {

        const hours =
            Number(
                updates.estimatedHours
            );


        if (hours <= 0) {

            throw new Error(
                "Estimated hours must be greater than zero."
            );

        }


        assignment.estimatedHours =
            hours;

    }


    if (
        updates.description !==
        undefined
    ) {

        assignment.description =
            updates.description.trim();

    }


    if (
        updates.priority !== undefined
    ) {

        assignment.priority =
            updates.priority;

    }


    if (
        updates.status !== undefined
    ) {

        assignment.status =
            updates.status;

    }


  

    updateCourseProgress(
        oldCourseId
    );


    updateCourseProgress(
        assignment.courseId
    );


    saveData();


    return assignment;

}


// Delete assignment

function deleteAssignment(id) {

    const assignment =
        getAssignment(id);


    if (!assignment) {

        return false;

    }


    const courseId =
        assignment.courseId;


    state.assignments =
        state.assignments.filter(

            item =>
                item.id !== Number(id)

        );


   

    state.studySessions =
        state.studySessions.filter(

            session =>
                session.assignmentId !==
                Number(id)

        );


    updateCourseProgress(
        courseId
    );


    saveData();


    return true;

}



function markAssignmentComplete(
    assignmentId
) {

    const assignment =
        getAssignment(
            assignmentId
        );


    if (!assignment) {

        return false;

    }


    assignment.status =
        "completed";


    updateCourseProgress(
        assignment.courseId
    );


    saveData();


    return true;

}




function markAssignmentIncomplete(
    assignmentId
) {

    const assignment =
        getAssignment(
            assignmentId
        );


    if (!assignment) {

        return false;

    }


    const studied =
        getTotalStudyHours(
            assignmentId
        );


   

    assignment.status =

        studied > 0

            ?

            "in-progress"

            :

            "pending";


    updateCourseProgress(
        assignment.courseId
    );


    saveData();


    return true;

}


// Generic status helper

function setAssignmentStatus(
    assignmentId,
    status
) {

    const allowed = [

        "pending",

        "in-progress",

        "completed"

    ];


    if (
        !allowed.includes(status)
    ) {

        return false;

    }


    if (
        status === "completed"
    ) {

        return markAssignmentComplete(
            assignmentId
        );

    }


    const assignment =
        getAssignment(
            assignmentId
        );


    if (!assignment) {

        return false;

    }


    assignment.status =
        status;


    updateCourseProgress(
        assignment.courseId
    );


    saveData();


    return true;

}




function calculatePriorityScore(
    assignment
) {

   

    if (
        assignment.status ===
        "completed"
    ) {

        return -1;

    }


    const now =
        new Date();


    now.setHours(
        0,
        0,
        0,
        0
    );


    const due =
        new Date(
            assignment.dueDate +
            "T00:00:00"
        );


    const daysUntilDue =
        Math.max(

            0,

            Math.ceil(

                (
                    due -
                    now
                )

                /

                (
                    1000 *
                    60 *
                    60 *
                    24
                )

            )

        );


   

    const weightScore =
        Math.min(

            100,

            (
                Number(
                    assignment.weight
                )

                /

                40

            )

            *

            100

        );



    const urgencyScore =

        daysUntilDue === 0

            ?

            100

            :

            Math.max(

                0,

                100 /
                (
                    daysUntilDue + 1
                )

            );


 

    const priorityBonus = {

        low: 0,

        medium: 10,

        high: 20

    };


  
    const statusBonus =

        assignment.status ===
            "in-progress"

            ?

            10

            :

            0;




    const progress =
        getAssignmentProgress(
            assignment.id
        );


    const remainingRatio =
        1 -
        (
            progress /
            100
        );


    const workloadScore =
        Math.min(

            100,

            Number(
                assignment.estimatedHours
            )

            *

            remainingRatio

            *

            10

        );


    const rawScore =

        (
            weightScore *
            0.30
        )

        +

        (
            urgencyScore *
            0.40
        )

        +

        (
            workloadScore *
            0.15
        )

        +

        (
            priorityBonus[
            assignment.priority
            ] || 0
        )

        +

        statusBonus;


    return Math.round(

        Math.min(

            100,

            Math.max(
                0,
                rawScore
            )

        )

    );

}



function getPrioritizedAssignments(
    limit = null
) {

    const withScores =
        state.assignments.map(

            assignment => {


                const course =
                    getCourse(
                        assignment.courseId
                    );


                return {

                    ...assignment,

                    course,

                    priorityScore:
                        calculatePriorityScore(
                            assignment
                        ),

                    daysUntilDue:
                        getDaysUntilDue(
                            assignment.dueDate
                        ),

                    progress:
                        getAssignmentProgress(
                            assignment.id
                        )

                };

            }

        );


    const sorted =
        withScores

            .filter(

                assignment =>
                    assignment.priorityScore >=
                    0

            )

            .sort(

                (a, b) =>
                    b.priorityScore -
                    a.priorityScore

            );


    return limit

        ?

        sorted.slice(
            0,
            limit
        )

        :

        sorted;

}



function getDaysUntilDue(
    dueDate
) {

    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const due =
        new Date(
            dueDate +
            "T00:00:00"
        );


    return Math.ceil(

        (
            due -
            today
        )

        /

        (
            1000 *
            60 *
            60 *
            24
        )

    );

}



function getAssignmentPriorities() {

    const prioritized =
        getPrioritizedAssignments(
            5
        );


    return prioritized.map(

        assignment => ({

            id:
                assignment.id,

            name:
                assignment.name,

            course:
                assignment.course
                    ?.name ||
                "Unknown",

            dueDate:
                assignment.dueDate,

            daysUntilDue:
                assignment.daysUntilDue,

            weight:
                assignment.weight,

            priorityScore:
                assignment.priorityScore,

            status:
                assignment.status,

            progress:
                assignment.progress || 0

        })

    );

}




function addStudySession(
    assignmentId,
    hours,
    date = null,
    notes = ""
) {

    const assignment =
        getAssignment(
            assignmentId
        );


    if (!assignment) {

        throw new Error(
            "Assignment not found."
        );

    }


    const numericHours =
        Number(hours);


    if (
        numericHours <= 0
    ) {

        throw new Error(
            "Study hours must be greater than zero."
        );

    }


    const session = {

        id:
            Date.now(),

        assignmentId:
            Number(
                assignmentId
            ),

        hours:
            numericHours,

        date:
            date ||
            new Date()
                .toISOString()
                .split("T")[0],

        notes:
            notes.trim()

    };


    state.studySessions.push(
        session
    );


  

    if (
        assignment.status ===
        "pending"
    ) {

        assignment.status =
            "in-progress";

    }


    saveData();


    return session;

}




function deleteStudySession(
    sessionId
) {

    const session =
        state.studySessions.find(

            item =>
                item.id ===
                Number(sessionId)

        );


    if (!session) {

        return false;

    }


    const assignmentId =
        session.assignmentId;


    state.studySessions =
        state.studySessions.filter(

            item =>
                item.id !==
                Number(sessionId)

        );


    const assignment =
        getAssignment(
            assignmentId
        );




    if (
        assignment &&
        assignment.status !==
        "completed"
    ) {

        const remainingSessions =
            state.studySessions.filter(

                item =>
                    item.assignmentId ===
                    assignmentId

            );


        if (
            remainingSessions.length ===
            0
        ) {

            assignment.status =
                "pending";

        }

    }


    saveData();


    return true;

}




function getStudySessions(
    assignmentId = null
) {

    let sessions =
        [...state.studySessions];


    if (assignmentId !== null) {

        sessions =
            sessions.filter(

                session =>
                    session.assignmentId ===
                    Number(
                        assignmentId
                    )

            );

    }


    return sessions.sort(

        (a, b) =>
            b.date.localeCompare(
                a.date
            )

    );

}



function getTotalStudyHours(
    assignmentId
) {

    return state.studySessions

        .filter(

            session =>
                session.assignmentId ===
                Number(
                    assignmentId
                )

        )

        .reduce(

            (sum, session) =>
                sum +
                Number(
                    session.hours
                ),

            0

        );

}




function getAssignmentProgress(
    assignmentId
) {

    const assignment =
        getAssignment(
            assignmentId
        );


    if (!assignment) {

        return 0;

    }


    const totalStudied =
        getTotalStudyHours(
            assignmentId
        );


    if (
        Number(
            assignment.estimatedHours
        ) <= 0
    ) {

        return 0;

    }



    return Math.min(

        100,

        Math.round(

            (
                totalStudied /
                Number(
                    assignment.estimatedHours
                )
            )

            *

            100

        )

    );

}




function getStudyProgressData() {

    return state.courses.map(

        course => {


            const courseAssignments =
                state.assignments.filter(

                    assignment =>
                        assignment.courseId ===
                        course.id

                );


            const totalWeight =
                courseAssignments.reduce(

                    (sum, assignment) =>
                        sum +
                        Number(
                            assignment.weight
                        ),

                    0

                );


            const completedWeight =
                courseAssignments

                    .filter(

                        assignment =>
                            assignment.status ===
                            "completed"

                    )

                    .reduce(

                        (
                            sum,
                            assignment
                        ) =>
                            sum +
                            Number(
                                assignment.weight
                            ),

                        0

                    );


            const progress =

                totalWeight > 0

                    ?

                    Math.round(

                        (
                            completedWeight /
                            totalWeight
                        )

                        *

                        100

                    )

                    :

                    0;


            return {

                courseId:
                    course.id,

                courseName:
                    course.name,

                progress,

                assignments:
                    courseAssignments.length,

                completed:
                    courseAssignments.filter(

                        assignment =>
                            assignment.status ===
                            "completed"

                    ).length

            };

        }

    );

}



function getStudyHubData() {

   totals.
   

    const allAssignments =
        [...state.assignments];


    const totalAssignments =
        allAssignments.length;


    const completed =
        allAssignments.filter(

            assignment =>
                assignment.status ===
                "completed"

        ).length;


    const inProgress =
        allAssignments.filter(

            assignment =>
                assignment.status ===
                "in-progress"

        ).length;


    const pending =
        allAssignments.filter(

            assignment =>
                assignment.status ===
                "pending"

        ).length;


    const totalEstimated =
        allAssignments.reduce(

            (sum, assignment) =>
                sum +
                Number(
                    assignment.estimatedHours
                ),

            0

        );


    const totalStudied =
        state.studySessions.reduce(

            (sum, session) =>
                sum +
                Number(
                    session.hours
                ),

            0

        );


    const overallProgress =

        totalEstimated > 0

            ?

            Math.min(

                100,

                Math.round(

                    (
                        totalStudied /
                        totalEstimated
                    )

                    *

                    100

                )

            )

            :

            0;


    return {

        overview: {

            total:
                totalAssignments,

            completed,

            inProgress,

            pending,

            completionRate:

                totalAssignments > 0

                    ?

                    Math.round(

                        (
                            completed /
                            totalAssignments
                        )

                        *

                        100

                    )

                    :

                    0,

            overallProgress,

            totalHoursStudied:
                totalStudied,

            totalEstimatedHours:
                totalEstimated,

            remainingHours:
                Math.max(

                    0,

                    totalEstimated -
                    totalStudied

                )

        },

        byCourse:
            getStudyProgressData()

    };

}



function getFocusNow() {

    const prioritized =
        getPrioritizedAssignments();


    if (
        prioritized.length === 0
    ) {

        return {

            hasFocus:
                false,

            message:
                "All caught up! No pending assignments."

        };

    }


    const topPriority =
        prioritized[0];


    const progress =
        getAssignmentProgress(
            topPriority.id
        );


    let recommendation =
        "";


    if (
        topPriority.daysUntilDue < 0
    ) {

        recommendation =
            "This assignment is overdue. It should receive immediate attention.";

    }
    else if (
        topPriority.daysUntilDue === 0
    ) {

        recommendation =
            "This assignment is due today. Focus on it first.";

    }
    else if (
        topPriority.daysUntilDue <= 2
    ) {

        recommendation =
            `This task is due in ${topPriority.daysUntilDue} day(s) and carries significant academic weighting.`;

    }
    else if (
        progress < 30
    ) {

        recommendation =
            "You have made limited progress on this high-priority assignment. Starting it now would reduce deadline pressure.";

    }
    else if (
        progress < 70
    ) {

        recommendation =
            `You are ${progress}% through your estimated work. Continue with this assignment next.`;

    }
    else {

        recommendation =
            `You have completed around ${progress}% of the estimated work. Finish the remaining work and mark it complete when submitted.`;

    }


    const hoursRemaining =
        Math.max(

            0,

            Number(
                topPriority.estimatedHours
            )

            -

            getTotalStudyHours(
                topPriority.id
            )

        );


    return {

        hasFocus:
            true,

        assignment: {

            id:
                topPriority.id,

            name:
                topPriority.name,

            course:
                topPriority.course
                    ?.name ||
                "Unknown",

            dueDate:
                topPriority.dueDate,

            daysUntilDue:
                topPriority.daysUntilDue,

            weight:
                topPriority.weight,

            priorityScore:
                topPriority.priorityScore,

            progress,

            estimatedHours:
                topPriority.estimatedHours,

            totalStudied:
                getTotalStudyHours(
                    topPriority.id
                ),

            status:
                topPriority.status

        },

        recommendation,

        suggestedStudyHours:
            Math.min(
                hoursRemaining,
                4
            )

    };

}




function getDashboardStats() {

    const focus =
        getFocusNow();


    const hubData =
        getStudyHubData();


    const priorities =
        getAssignmentPriorities();


    const now =
        new Date();


    const weekStart =
        new Date(now);


    weekStart.setDate(

        now.getDate() -
        now.getDay()

    );


    weekStart.setHours(
        0,
        0,
        0,
        0
    );


    const weeklyHours =
        state.studySessions

            .filter(

                session => {

                    const sessionDate =
                        new Date(
                            session.date +
                            "T00:00:00"
                        );


                    return (
                        sessionDate >=
                        weekStart
                    );

                }

            )

            .reduce(

                (sum, session) =>
                    sum +
                    Number(
                        session.hours
                    ),

                0

            );


    const weeklyGoal =
        Number(
            state.settings.weeklyGoal
        ) || 20;


    const weeklyProgress =
        weeklyGoal > 0

            ?

            Math.min(

                100,

                Math.round(

                    (
                        weeklyHours /
                        weeklyGoal
                    )

                    *

                    100

                )

            )

            :

            0;


    

    const highPriorityTasks =
        getPrioritizedAssignments()

            .filter(

                assignment =>
                    assignment.priorityScore >=
                    50

            )

            .length;


    return {

        weeklyProgress,

        weeklyHours,

        weeklyGoal,

        totalAssignments:
            hubData.overview.total,

        completedAssignments:
            hubData.overview.completed,

        highPriorityTasks,

        inProgress:
            hubData.overview.inProgress,

        pending:
            hubData.overview.pending,

        overallProgress:
            hubData.overview.overallProgress,

        focus,

        priorities:
            priorities.slice(
                0,
                3
            )

    };

}



function handleAddAssignment(
    data
) {

    return addAssignment(

        data.name,

        data.courseId,

        data.dueDate,

        data.weight,

        data.estimatedHours,

        data.description || "",

        data.priority || "medium"

    );

}


function handleUpdateAssignment(
    assignmentId,
    data
) {

    return updateAssignment(

        assignmentId,

        data

    );

}


function handleDeleteAssignment(
    assignmentId
) {

    return deleteAssignment(
        assignmentId
    );

}


function handleMarkComplete(
    assignmentId
) {

    return markAssignmentComplete(
        assignmentId
    );

}


function handleMarkIncomplete(
    assignmentId
) {

    return markAssignmentIncomplete(
        assignmentId
    );

}


function handleStartStudying(
    assignmentId,
    hours,
    notes = ""
) {

    return addStudySession(

        assignmentId,

        hours,

        null,

        notes

    );

}


function handleAddCourse(
    code,
    name
) {

    return addCourse(
        code,
        name
    );

}


function handleUpdateCourse(
    courseId,
    data
) {

    return updateCourse(
        courseId,
        data
    );

}


function handleDeleteCourse(
    courseId
) {

    return deleteCourse(
        courseId
    );

}


function getCourseStats() {

    return state.courses.map(

        course => {


            const courseAssignments =
                state.assignments.filter(

                    assignment =>
                        assignment.courseId ===
                        course.id

                );


            const totalAssignments =
                courseAssignments.length;


            const completed =
                courseAssignments.filter(

                    assignment =>
                        assignment.status ===
                        "completed"

                ).length;


            const totalWeight =
                courseAssignments.reduce(

                    (sum, assignment) =>
                        sum +
                        Number(
                            assignment.weight
                        ),

                    0

                );


            const completedWeight =
                courseAssignments

                    .filter(

                        assignment =>
                            assignment.status ===
                            "completed"

                    )

                    .reduce(

                        (
                            sum,
                            assignment
                        ) =>
                            sum +
                            Number(
                                assignment.weight
                            ),

                        0

                    );


            const progress =

                totalWeight > 0

                    ?

                    Math.round(

                        (
                            completedWeight /
                            totalWeight
                        )

                        *

                        100

                    )

                    :

                    0;


            const totalHours =
                courseAssignments.reduce(

                    (sum, assignment) =>
                        sum +
                        Number(
                            assignment.estimatedHours
                        ),

                    0

                );


            const studiedHours =
                state.studySessions

                    .filter(

                        session => {

                            const assignment =
                                getAssignment(
                                    session.assignmentId
                                );


                            return (

                                assignment &&

                                assignment.courseId ===
                                course.id

                            );

                        }

                    )

                    .reduce(

                        (sum, session) =>
                            sum +
                            Number(
                                session.hours
                            ),

                        0

                    );


            return {

                id:
                    course.id,

                code:
                    course.code,

                name:
                    course.name,

                progress,

                assignments: {

                    total:
                        totalAssignments,

                    completed,

                    remaining:
                        totalAssignments -
                        completed

                },

                hours: {

                    estimated:
                        totalHours,

                    studied:
                        studiedHours,

                    remaining:
                        Math.max(

                            0,

                            totalHours -
                            studiedHours

                        )

                }

            };

        }

    );

}




function getDeadlineReminders() {

    return state.assignments

        .filter(

            assignment => {

                if (
                    assignment.status ===
                    "completed"
                ) {

                    return false;

                }


                const daysUntil =
                    getDaysUntilDue(
                        assignment.dueDate
                    );


                return (

                    daysUntil >= 0 &&

                    daysUntil <= 7

                );

            }

        )

        .map(

            assignment => {


                const daysUntil =
                    getDaysUntilDue(
                        assignment.dueDate
                    );


                const course =
                    getCourse(
                        assignment.courseId
                    );


                return {

                    ...assignment,

                    course,

                    daysUntil,

                    urgency:

                        daysUntil === 0

                            ?

                            "today"

                            :

                            daysUntil <= 2

                                ?

                                "very soon"

                                :

                                "soon"

                };

            }

        )

        .sort(

            (a, b) =>
                a.daysUntil -
                b.daysUntil

        );

}



function exportData() {

    return {

        assignments:
            state.assignments,

        courses:
            state.courses,

        studySessions:
            state.studySessions,

        settings:
            state.settings,

        exportedAt:
            new Date()
                .toISOString(),

        version:
            "3.0"

    };

}


function importData(data) {

    if (
        !data ||
        !Array.isArray(
            data.assignments
        ) ||
        !Array.isArray(
            data.courses
        ) ||
        !Array.isArray(
            data.studySessions
        )
    ) {

        return false;

    }


    state.assignments =
        data.assignments;


    state.courses =
        data.courses;


    state.studySessions =
        data.studySessions;


    if (data.settings) {

        state.settings =
            data.settings;

    }


    updateAllCourseProgress();


    saveData();


    return true;

}