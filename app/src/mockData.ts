export const DAYS = [
  { index: 0, label: "יום א׳", short: "א׳" },
  { index: 1, label: "יום ב׳", short: "ב׳" },
  { index: 2, label: "יום ג׳", short: "ג׳" },
  { index: 3, label: "יום ד׳", short: "ד׳" },
  { index: 4, label: "יום ה׳", short: "ה׳" },
  { index: 5, label: "יום ו׳", short: "ו׳" },
];

export const PERIODS = [
  { index: 0, label: "שעה 1", start: "08:15", end: "09:00" },
  { index: 1, label: "שעה 2", start: "09:00", end: "09:45" },
  { index: 2, label: "שעה 3", start: "10:00", end: "10:45" },
  { index: 3, label: "שעה 4", start: "10:50", end: "11:35" },
  { index: 4, label: "שעה 5", start: "11:45", end: "12:30" },
  { index: 5, label: "שעה 6", start: "12:50", end: "13:35" },
  { index: 6, label: "שעה 7", start: "13:40", end: "14:30" },
];

export const SUBJECTS = [
  { id: "math", name: "מתמטיקה", color: "math" },
  { id: "english", name: "אנגלית", color: "english" },
  { id: "hebrew", name: "לשון", color: "hebrew" },
  { id: "science", name: "מדעים", color: "science" },
  { id: "history", name: "היסטוריה", color: "history" },
  { id: "computers", name: "מחשבים", color: "computers" },
  { id: "civics", name: "אזרחות", color: "civics" },
] as const;

export type SubjectId = (typeof SUBJECTS)[number]["id"];
export type LessonStatus = "scheduled" | "completed" | "canceled";
export type AideStatus = "available" | "helping" | "absent";

export interface Homeroom {
  id: string;
  grade: string;
  name: string;
  room: string;
  studentIds: string[];
}

export interface Student {
  id: string;
  firstName: string;
  secondInitial: string;
  displayName: string;
  grade: string;
  homeroomId: string;
  subjectIds: SubjectId[];
  teacherBySubject: Partial<Record<SubjectId, string>>;
}

export interface TeacherWindow {
  startPeriod: number;
  endPeriod: number;
  minimumSpanMinutes: number;
}

export interface Tutor {
  id: string;
  name: string;
  initials: string;
  subjectIds: SubjectId[];
  workWindows: Record<number, TeacherWindow>;
}

export interface Aide {
  id: string;
  name: string;
  initials: string;
  homeroomIds: string[];
  status: AideStatus;
}

export interface Lesson {
  id: string;
  day: number;
  period: number;
  subjectId: SubjectId;
  teacherId: string;
  studentIds: string[];
  groupId?: string;
  groupName?: string;
  location: string;
  status: LessonStatus;
  absentStudentIds: string[];
  startWeek?: number;
  endWeek?: number;
  skipWeeks?: number[];
  originalTeacherId?: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  homeroomId: string;
  subjectId: SubjectId;
  teacherId: string;
  studentIds: string[];
}

export interface ClassSlot {
  subjectId: SubjectId;
  room: string;
  excusable: boolean;
}

export interface Exam {
  id: string;
  title: string;
  grade: string;
  subjectId: SubjectId;
  day: number;
  period: number;
  dateOffset: number;
}

export interface SchoolEvent {
  id: string;
  title: string;
  kind: "trip" | "assembly" | "holiday";
  day: number;
  description: string;
}

export interface LessonLog {
  id: string;
  lessonId: string;
  studentIds: string[];
  lateStudentIds: string[];
  note: string;
}

export interface DemoData {
  lessons: Lesson[];
  aides: Aide[];
  logs: LessonLog[];
  teacherMinimums: Record<string, number>;
}

const grades = ["ט׳", "י׳", "י״א", "י״ב"];
const initials = ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח"];
const firstNames = [
  "נועה", "איתן", "מיה", "עומר", "שירה", "יונתן", "תמר", "אורי",
  "יעל", "רועי", "מאיה", "איתי", "דנה", "ליה", "נועם", "איילה",
  "אלון", "רותם", "עדי", "יובל", "אמה", "גיא", "רוני", "אופיר",
  "אביגיל", "תום", "ניב", "מיכל", "ליאור", "הילה", "דניאל", "שחר",
];

const teacherDefinitions: Array<{
  name: string;
  subjects: SubjectId[];
  workDays: number[];
}> = [
  { name: "דנה כהן", subjects: ["math", "science"], workDays: [0, 1, 2, 4] },
  { name: "יונתן פרידמן", subjects: ["english", "math"], workDays: [0, 2, 3, 4] },
  { name: "שירה רז", subjects: ["hebrew", "history"], workDays: [0, 1, 3, 4] },
  { name: "מיכל ברק", subjects: ["english", "science"], workDays: [1, 2, 3, 4] },
  { name: "אורי לוי", subjects: ["math", "computers", "history"], workDays: [0, 1, 2, 3] },
  { name: "רונית אזולאי", subjects: ["hebrew", "civics"], workDays: [0, 2, 3, 4] },
  { name: "איתי שמואלי", subjects: ["history", "science", "civics"], workDays: [1, 2, 3, 5] },
  { name: "תמר הדר", subjects: ["english", "computers", "civics"], workDays: [0, 1, 2, 4, 5] },
];

export const teachers: Tutor[] = teacherDefinitions.map((definition, teacherIndex) => {
  const workWindows: Record<number, TeacherWindow> = {};

  for (const day of definition.workDays) {
    const startPeriod = (teacherIndex + day) % 3 === 0 ? 1 : 0;
    const periodCount = day === 5 ? 4 : teacherIndex % 3 === 0 ? 5 : 4;
    workWindows[day] = {
      startPeriod,
      endPeriod: Math.min(startPeriod + periodCount, PERIODS.length),
      minimumSpanMinutes: 180,
    };
  }

  return {
    id: `teacher-${teacherIndex + 1}`,
    name: definition.name,
    initials: definition.name.split(" ").map((part) => part[0]).join(""),
    subjectIds: definition.subjects,
    workWindows,
  };
});

export const subjectName = (subjectId: SubjectId) =>
  SUBJECTS.find((subject) => subject.id === subjectId)?.name ?? "מקצוע";

export const subjectColor = (subjectId: SubjectId) =>
  SUBJECTS.find((subject) => subject.id === subjectId)?.color ?? "math";

const homeroomStudentCounts = [3, 4, 5, 2];

export const homerooms: Homeroom[] = [];
export const students: Student[] = [];

for (let gradeIndex = 0; gradeIndex < grades.length; gradeIndex += 1) {
  for (let classIndex = 0; classIndex < 4; classIndex += 1) {
    const id = `class-${gradeIndex + 1}-${classIndex + 1}`;
    homerooms.push({
      id,
      grade: grades[gradeIndex],
      name: `${grades[gradeIndex]}${classIndex + 1}`,
      room: `חדר ${201 + gradeIndex * 4 + classIndex}`,
      studentIds: [],
    });

    const count = homeroomStudentCounts[classIndex];
    for (let localIndex = 0; localIndex < count; localIndex += 1) {
      const studentIndex = students.length;
      const firstName = firstNames[(studentIndex * 7 + gradeIndex * 3) % firstNames.length];
      const secondInitial = initials[(studentIndex * 3 + classIndex) % initials.length];
      const lessonCount = 1 + ((studentIndex + gradeIndex + classIndex) % 4);
      const subjectOffset = (gradeIndex + classIndex + localIndex) % SUBJECTS.length;
      const subjectIds = Array.from({ length: lessonCount }, (_, subjectIndex) =>
        SUBJECTS[(subjectOffset + subjectIndex * 2) % SUBJECTS.length].id,
      );
      const student: Student = {
        id: `student-${studentIndex + 1}`,
        firstName,
        secondInitial,
        displayName: `${firstName} ${secondInitial}׳`,
        grade: grades[gradeIndex],
        homeroomId: id,
        subjectIds,
        teacherBySubject: {},
      };

      for (const subjectId of subjectIds) {
        const candidates = teachers.filter((teacher) => teacher.subjectIds.includes(subjectId));
        const candidate = candidates[(studentIndex + subjectIds.indexOf(subjectId)) % candidates.length];
        student.teacherBySubject[subjectId] = candidate.id;
      }

      students.push(student);
      homerooms[homerooms.length - 1].studentIds.push(student.id);
    }
  }
}

export const classSlots: Record<string, ClassSlot> = {};
export const studentExcusalOverrides: Record<string, boolean> = {};

const timetableSubjects: SubjectId[] = [
  "math", "english", "hebrew", "science", "history", "computers", "civics",
];

for (let classIndex = 0; classIndex < homerooms.length; classIndex += 1) {
  const homeroom = homerooms[classIndex];
  for (const day of DAYS) {
    for (const period of PERIODS) {
      const subjectIndex = (classIndex * 2 + day.index * 3 + period.index) % timetableSubjects.length;
      const isImportantSlot = (classIndex + day.index * 5 + period.index * 7) % 23 === 0;
      classSlots[`${homeroom.id}:${day.index}:${period.index}`] = {
        subjectId: timetableSubjects[subjectIndex],
        room: homeroom.room,
        excusable: !isImportantSlot,
      };
    }
  }
}

students.forEach((student, studentIndex) => {
  const day = studentIndex % 5;
  const period = (studentIndex * 3) % PERIODS.length;
  if (studentIndex % 9 === 0) {
    studentExcusalOverrides[`${student.id}:${day}:${period}`] = true;
  }
});

export function canStudentLeave(studentId: string, homeroomId: string, day: number, period: number) {
  const override = studentExcusalOverrides[`${studentId}:${day}:${period}`];
  if (override !== undefined) return override;
  return classSlots[`${homeroomId}:${day}:${period}`]?.excusable ?? true;
}

const aideNames = [
  "מירב פרץ", "סיגל אברהם", "רונית לוי", "אורית ברק", "דפנה כהן", "לילך הדר",
];

export const initialAides: Aide[] = aideNames.map((name, aideIndex) => ({
  id: `aide-${aideIndex + 1}`,
  name,
  initials: name.split(" ").map((part) => part[0]).join(""),
  homeroomIds: homerooms
    .filter((_, classIndex) => classIndex % aideNames.length === aideIndex)
    .map((homeroom) => homeroom.id),
  status: aideIndex === 4 ? "absent" : aideIndex % 3 === 0 ? "helping" : "available",
}));

export const locations = [
  "מרכז למידה",
  "חדר 203",
  "חדר 204",
  "ספרייה",
  "מעבדת מחשבים",
  "חדר 7",
];

interface LessonTask {
  id: string;
  subjectId: SubjectId;
  homeroomId: string;
  studentIds: string[];
  groupId?: string;
  groupName?: string;
}

function buildLessonTasks(): LessonTask[] {
  const tasks: LessonTask[] = [];

  for (const homeroom of homerooms) {
    const classStudents = students.filter((student) => student.homeroomId === homeroom.id);
    for (const subject of SUBJECTS) {
      const participants = classStudents.filter((student) => student.subjectIds.includes(subject.id));
      let chunkIndex = 0;

      for (let index = 0; index < participants.length; ) {
        const remaining = participants.length - index;
        const chunkSize = remaining >= 4 ? 2 : remaining >= 3 ? 3 : remaining;
        const memberIds = participants.slice(index, index + chunkSize).map((student) => student.id);
        const groupId = memberIds.length > 1
          ? `group-${homeroom.id}-${subject.id}-${chunkIndex + 1}`
          : undefined;

        tasks.push({
          id: `task-${homeroom.id}-${subject.id}-${chunkIndex + 1}`,
          subjectId: subject.id,
          homeroomId: homeroom.id,
          studentIds: memberIds,
          groupId,
          groupName: groupId ? `קבוצת ${subject.name} · ${homeroom.name}` : undefined,
        });

        chunkIndex += 1;
        index += chunkSize;
      }
    }
  }

  return tasks;
}

const minuteValue = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const taskCandidateTeachers = (task: LessonTask) => {
  const participants = task.studentIds
    .map((id) => students.find((student) => student.id === id))
    .filter((student): student is Student => Boolean(student));
  const preferredIds = participants
    .map((student) => student.teacherBySubject[task.subjectId])
    .filter((id): id is string => Boolean(id));
  const qualified = teachers.filter((teacher) => teacher.subjectIds.includes(task.subjectId));
  return qualified.sort((a, b) => {
    const preferenceDifference =
      preferredIds.filter((id) => id === b.id).length -
      preferredIds.filter((id) => id === a.id).length;
    return preferenceDifference || a.id.localeCompare(b.id);
  });
};

function buildLessons(): Lesson[] {
  const tasks = buildLessonTasks().sort((a, b) => b.studentIds.length - a.studentIds.length);
  const lessons: Lesson[] = [];
  const usedTeachers = new Set<string>();
  const usedStudents = new Set<string>();
  const teacherDayLoads: Record<string, number> = {};
  const teacherLoads: Record<string, number> = {};
  const sessionByDayPeriod = new Map<string, number>();
  const locationsByDayPeriod = new Map<string, Set<string>>();

  for (let taskIndex = 0; taskIndex < tasks.length; taskIndex += 1) {
    const task = tasks[taskIndex];
    const candidates = taskCandidateTeachers(task);
    const candidateSlots: Array<{
      teacher: Tutor;
      day: number;
      period: number;
      score: number;
    }> = [];

    for (const teacher of candidates) {
      for (let dayOffset = 0; dayOffset < DAYS.length; dayOffset += 1) {
        const day = (dayOffset + taskIndex) % DAYS.length;
        const window = teacher.workWindows[day];
        if (!window) continue;

        for (let period = window.startPeriod; period < window.endPeriod; period += 1) {
          const teacherSlotKey = `${teacher.id}:${day}:${period}`;
          if (usedTeachers.has(teacherSlotKey)) continue;

          const hasStudentConflict = task.studentIds.some((studentId) =>
            usedStudents.has(`${studentId}:${day}:${period}`),
          );
          if (hasStudentConflict) continue;

          const participants = task.studentIds
            .map((id) => students.find((student) => student.id === id))
            .filter((student): student is Student => Boolean(student));
          if (!participants.every((student) => canStudentLeave(student.id, task.homeroomId, day, period))) {
            continue;
          }

          const dayLoad = teacherDayLoads[`${teacher.id}:${day}`] ?? 0;
          const teacherLoad = teacherLoads[teacher.id] ?? 0;
          const periodLoad = sessionByDayPeriod.get(`${day}:${period}`) ?? 0;
          const score = dayLoad * 100 + teacherLoad * 3 + periodLoad * 8 + period;
          candidateSlots.push({ teacher, day, period, score });
        }
      }
    }

    candidateSlots.sort((a, b) => a.score - b.score);
    const placement = candidateSlots[0];
    if (!placement) continue;

    const locationKey = `${placement.day}:${placement.period}`;
    const occupiedLocations = locationsByDayPeriod.get(locationKey) ?? new Set<string>();
    const locationChoices = locations.map((_, offset) => locations[(taskIndex + placement.day + offset) % locations.length]);
    const location = locationChoices.find((candidate) => !occupiedLocations.has(candidate)) ?? locationChoices[0];
    occupiedLocations.add(location);
    locationsByDayPeriod.set(locationKey, occupiedLocations);
    const currentDay = new Date().getDay();
    const status: LessonStatus = placement.day < currentDay && placement.day < 5
      ? "completed"
      : "scheduled";

    const lesson: Lesson = {
      id: `lesson-${lessons.length + 1}`,
      day: placement.day,
      period: placement.period,
      subjectId: task.subjectId,
      teacherId: placement.teacher.id,
      studentIds: task.studentIds,
      groupId: task.groupId,
      groupName: task.groupName,
      location,
      status,
      absentStudentIds: [],
    };
    lessons.push(lesson);

    usedTeachers.add(`${placement.teacher.id}:${placement.day}:${placement.period}`);
    for (const studentId of task.studentIds) {
      usedStudents.add(`${studentId}:${placement.day}:${placement.period}`);
    }
    const dayLoadKey = `${placement.teacher.id}:${placement.day}`;
    teacherDayLoads[dayLoadKey] = (teacherDayLoads[dayLoadKey] ?? 0) + 1;
    teacherLoads[placement.teacher.id] = (teacherLoads[placement.teacher.id] ?? 0) + 1;
    const periodKey = `${placement.day}:${placement.period}`;
    sessionByDayPeriod.set(periodKey, (sessionByDayPeriod.get(periodKey) ?? 0) + 1);
  }

  // Deliberate soft warning sample: two different teachers share a room at the same time.
  const collisionPair = lessons.find((lesson, index) =>
    lessons.slice(index + 1).some((other) =>
      other.day === lesson.day &&
      other.period === lesson.period &&
      other.teacherId !== lesson.teacherId &&
      other.studentIds.every((studentId) => !lesson.studentIds.includes(studentId)),
    ),
  );
  if (collisionPair) {
    const other = lessons.find((lesson) =>
      lesson.id !== collisionPair.id &&
      lesson.day === collisionPair.day &&
      lesson.period === collisionPair.period &&
      lesson.teacherId !== collisionPair.teacherId &&
      lesson.studentIds.every((studentId) => !collisionPair.studentIds.includes(studentId)),
    );
    if (other) other.location = collisionPair.location;
  }

  return lessons;
}

export const exams: Exam[] = grades.flatMap((grade, gradeIndex) => {
  const firstSubject = SUBJECTS[(gradeIndex + 1) % SUBJECTS.length];
  const secondSubject = SUBJECTS[(gradeIndex + 4) % SUBJECTS.length];
  return [
    {
      id: `exam-${gradeIndex + 1}-1`,
      title: `מבחן מסכם ${firstSubject.name}`,
      grade,
      subjectId: firstSubject.id,
      day: (gradeIndex + 3) % 6,
      period: 2,
      dateOffset: 3 + gradeIndex,
    },
    {
      id: `exam-${gradeIndex + 1}-2`,
      title: `בחן ${secondSubject.name}`,
      grade,
      subjectId: secondSubject.id,
      day: (gradeIndex + 1) % 6,
      period: 4,
      dateOffset: 8 + gradeIndex,
    },
  ];
});

export const schoolEvents: SchoolEvent[] = [
  { id: "event-trip", title: "סיור שכבה י׳", kind: "trip", day: 4, description: "פעילות שכבתית מחוץ לבית הספר" },
  { id: "event-assembly", title: "אספת שכבה", kind: "assembly", day: 2, description: "אספה באולם המרכזי" },
  { id: "event-holiday", title: "יום היערכות", kind: "holiday", day: 5, description: "אין לימודים סדירים" },
];

export function buildInitialDemoData(): DemoData {
  const lessons = buildLessons();
  const completedLessons = lessons.filter((lesson) => lesson.status === "completed");
  const logs: LessonLog[] = completedLessons.slice(0, 12).map((lesson, index) => ({
    id: `log-${lesson.id}`,
    lessonId: lesson.id,
    studentIds: lesson.studentIds,
    lateStudentIds: index % 5 === 0 ? [lesson.studentIds[0]] : [],
    note: index % 3 === 0 ? "התקדמות טובה ותרגול משותף" : "",
  }));

  return {
    lessons,
    aides: initialAides.map((aide) => ({ ...aide })),
    logs,
    teacherMinimums: {},
  };
}

export function getHomeroom(id: string) {
  return homerooms.find((homeroom) => homeroom.id === id);
}

export function getStudent(id: string) {
  return students.find((student) => student.id === id);
}

export function getTeacher(id: string) {
  return teachers.find((teacher) => teacher.id === id);
}

export function getAideForHomeroom(homeroomId: string) {
  return initialAides.find((aide) => aide.homeroomIds.includes(homeroomId));
}

export function getPeriodSpan(startPeriod: number, endPeriodExclusive: number) {
  const start = PERIODS[startPeriod];
  const end = PERIODS[Math.max(startPeriod, endPeriodExclusive - 1)];
  if (!start || !end) return 0;
  return minuteValue(end.end) - minuteValue(start.start);
}

export function formatDateForDay(dayIndex: number, weekOffset = 0) {
  const now = new Date();
  const todayIndex = now.getDay();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - todayIndex + weekOffset * 7 + dayIndex);
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short" }).format(sunday);
}

export function getTodayIndex() {
  const index = new Date().getDay();
  return index === 6 ? 2 : Math.min(index, 5);
}
