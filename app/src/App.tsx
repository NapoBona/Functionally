import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  Bell,
  BookOpen,
  CalendarDays,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  GraduationCap,
  Grid2X2,
  LayoutDashboard,
  MapPin,
  Menu,
  Moon,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  ShieldAlert,
  Sparkles,
  Sun,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import {
  DAYS,
  PERIODS,
  SUBJECTS,
  buildInitialDemoData,
  classSlots,
  studentExcusalOverrides,
  exams,
  formatDateForDay,
  getAideForHomeroom,
  getHomeroom,
  getPeriodSpan,
  getStudent,
  getTeacher,
  getTodayIndex,
  homerooms,
  initialAides,
  locations,
  schoolEvents,
  students,
  subjectColor,
  subjectName,
  teachers,
  type AideStatus,
  type DemoData,
  type Exam,
  type Lesson,
  type SubjectId,
} from "./mockData";
import "./design.css";

type Role = "manager" | "teacher" | "aide";
type View =
  | "overview"
  | "daily"
  | "weekly"
  | "helper"
  | "exams"
  | "coverage"
  | "logs"
  | "aides"
  | "students"
  | "teachers"
  | "groups"
  | "timetable"
  | "locations"
  | "updates"
  | "stats";
type Theme = "dark" | "light";

interface ClassUpdate {
  id: string;
  grade: string;
  subjectId: SubjectId;
  date: string;
  title: string;
  homework: string;
  exercise: string;
  author: string;
}

interface ManagerNotice {
  id: string;
  text: string;
  kind: "info" | "warning";
}

interface StoredData extends DemoData {
  updates: ClassUpdate[];
  excusalOverrides: Record<string, boolean>;
  notices: ManagerNotice[];
}

type EditScope = "all" | "future" | "once";

interface Move {
  lessonId: string;
  day: number;
  period: number;
  teacherId: string;
}

interface HelperOption {
  moves: Move[];
  score: number;
}

type StatsPeriod = "day" | "week" | "month" | "year";

const WEEKS_BY_PERIOD: Record<StatsPeriod, number> = { day: 0, week: 1, month: 4, year: 38 };

function isLessonInWeek(lesson: Lesson, week: number) {
  return (lesson.startWeek === undefined || week >= lesson.startWeek) &&
    (lesson.endWeek === undefined || week <= lesson.endWeek) &&
    !(lesson.skipWeeks ?? []).includes(week);
}

interface LessonDraft {
  scope?: EditScope;
  id?: string;
  day: number;
  period: number;
  subjectId: SubjectId;
  teacherId: string;
  studentIds: string[];
  location: string;
}

const STORAGE_KEY = "functi-on-demo-v1";
const THEME_KEY = "functi-on-theme-v1";

const initialUpdates: ClassUpdate[] = [
  {
    id: "update-1",
    grade: "ט׳",
    subjectId: "math",
    date: "24.11",
    title: "משוואות עם נעלם בשני אגפים",
    homework: "עמודים 84–85, תרגילים 2–8",
    exercise: "https://school.example/exercises/math-9",
    author: "דנה כהן",
  },
  {
    id: "update-2",
    grade: "י׳",
    subjectId: "english",
    date: "24.11",
    title: "Reading comprehension: renewable energy",
    homework: "לקרוא את הקטע ולענות על שאלות 1–5",
    exercise: "https://school.example/exercises/english-10",
    author: "יונתן פרידמן",
  },
  {
    id: "update-3",
    grade: "י״א",
    subjectId: "history",
    date: "23.11",
    title: "היישוב היהודי בתקופת המנדט",
    homework: "לסכם את המקור בעמוד 112",
    exercise: "",
    author: "שירה רז",
  },
  {
    id: "update-4",
    grade: "י״ב",
    subjectId: "science",
    date: "23.11",
    title: "אנרגיה ותהליכי המרה",
    homework: "להשלים דף עבודה לקראת המעבדה",
    exercise: "https://school.example/exercises/science-12",
    author: "מיכל ברק",
  },
];

const pageTitles: Record<View, { title: string; subtitle: string }> = {
  overview: { title: "מבט יומי", subtitle: "תמונת מצב להיום — שיבוצים, צוות וזמינות" },
  daily: { title: "מערכת יומית", subtitle: "כל המורות והשעות בטבלה אחת" },
  weekly: { title: "מטריצה שבועית", subtitle: "שיבוצי תגבור לפי יום ושעה" },
  helper: { title: "עוזר שיבוץ", subtitle: "הצעות לפתרון נקודתי, עם אישור מנהל/ת" },
  exams: { title: "מבחנים ואירועים", subtitle: "מועדים לפי שכבה ומקצוע" },
  coverage: { title: "היעדרויות וכיסוי", subtitle: "עדכוני זמינות והצעות למחליפים" },
  logs: { title: "תיעוד שיעורים", subtitle: "מה התקיים, מי איחר ומה דורש השלמה" },
  aides: { title: "סטטוס סייעות", subtitle: "זמינות וכיתות באחריות כל סייעת" },
  students: { title: "תלמידים", subtitle: "פרופילים לימודיים ושיבוצים לפי מקצוע" },
  teachers: { title: "מורות", subtitle: "מקצועות, ימי עבודה ושעות נוכחות" },
  groups: { title: "קבוצות למידה", subtitle: "קבוצות קבועות ושיבוצי תגבור" },
  timetable: { title: "מערכת שעות", subtitle: "שיעורי הכיתה והיתרי יציאה לתגבור" },
  locations: { title: "מיקומים", subtitle: "חדרים ומידע על התנגשויות מקום" },
  updates: { title: "עדכוני כיתה", subtitle: "חומר שנלמד, שיעורי בית ותרגילים מומלצים" },
  stats: { title: "סטטיסטיקה", subtitle: "מגמות תפעוליות לפי יום, שבוע, חודש ושנה" },
};

const subjectClass = (subjectId: SubjectId) => `subject-${subjectColor(subjectId)}`;

function seedData(): StoredData {
  return { ...buildInitialDemoData(), updates: initialUpdates, excusalOverrides: {}, notices: [] };
}

function readData(): { data: StoredData; warning: string } {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { data: seedData(), warning: "" };

  try {
    const parsed = JSON.parse(raw) as StoredData;
    if (!Array.isArray(parsed.lessons) || !Array.isArray(parsed.aides) || !Array.isArray(parsed.logs)) {
      throw new Error("Demo data is missing required collections.");
    }
    return {
      data: {
        ...parsed,
        updates: Array.isArray(parsed.updates) ? parsed.updates : initialUpdates,
        teacherMinimums: parsed.teacherMinimums ?? {},
        excusalOverrides: parsed.excusalOverrides ?? {},
        notices: Array.isArray(parsed.notices) ? parsed.notices : [],
      },
      warning: "",
    };
  } catch (error) {
    console.error("Could not load saved demo data:", error);
    window.localStorage.removeItem(STORAGE_KEY);
    return {
      data: seedData(),
      warning: "לא ניתן היה לטעון את נתוני ההדגמה השמורים. נטענה מחדש דוגמת הנתונים.",
    };
  }
}

function roomConflictIds(lessons: Lesson[]) {
  const slots = new Map<string, Lesson[]>();
  for (const lesson of lessons) {
    if (lesson.status === "canceled") continue;
    const key = `${lesson.day}:${lesson.period}:${lesson.location}`;
    slots.set(key, [...(slots.get(key) ?? []), lesson]);
  }
  const ids = new Set<string>();
  for (const slotLessons of slots.values()) {
    if (slotLessons.length > 1) slotLessons.forEach((lesson) => ids.add(lesson.id));
  }
  return ids;
}

function timeForPeriod(periodIndex: number) {
  return PERIODS[periodIndex];
}

function getHomeroomNames(ids: string[]) {
  return ids.map((id) => getHomeroom(id)?.name).filter(Boolean).join(" · ");
}

function getStudentClass(lesson: Lesson) {
  const student = getStudent(lesson.studentIds[0] ?? "");
  if (!student) return undefined;
  return classSlots[`${student.homeroomId}:${lesson.day}:${lesson.period}`];
}

function weekDateRange(weekOffset: number) {
  const dates = DAYS.map((day) => formatDateForDay(day.index, weekOffset));
  return `${dates[0]} – ${dates[5]}`;
}

function IconButton({
  label,
  children,
  onClick,
  className = "",
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button className={`icon-button ${className}`} type="button" aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  );
}

function App() {
  const [boot] = useState(readData);
  const [rawData, setData] = useState<StoredData>(boot.data);
  const [storageWarning] = useState(boot.warning);
  const [todayLabel] = useState(() =>
    new Intl.DateTimeFormat("he-IL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date()),
  );
  const [theme, setTheme] = useState<Theme>(
    () => (window.localStorage.getItem(THEME_KEY) as Theme | null) ?? "dark",
  );
  const [role, setRole] = useState<Role>("manager");
  const [view, setView] = useState<View>("overview");
  const [selectedDay, setSelectedDay] = useState(getTodayIndex());
  const [weekOffset, setWeekOffset] = useState(0);
  const data = useMemo(
    () => ({ ...rawData, lessons: rawData.lessons.filter((lesson) => isLessonInWeek(lesson, weekOffset)) }),
    [rawData, weekOffset],
  );
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>("week");
  const [absentTeacherId, setAbsentTeacherId] = useState(teachers[0].id);
  const [absentDay, setAbsentDay] = useState(getTodayIndex());
  const [excusalStudentId, setExcusalStudentId] = useState(students[0].id);
  const [selectedTeacherId, setSelectedTeacherId] = useState(teachers[0].id);
  const [teacherFilter, setTeacherFilter] = useState("הכול");
  const [selectedAideId, setSelectedAideId] = useState(boot.data.aides[0]?.id ?? initialAides[0].id);
  const [teacherSettingsOpen, setTeacherSettingsOpen] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState("הכול");
  const [selectedSubject, setSelectedSubject] = useState("הכול");
  const [search, setSearch] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [modalDraft, setModalDraft] = useState<LessonDraft | null>(null);
  const [modalError, setModalError] = useState("");
  const [toast, setToast] = useState("");
  const [helperLessonId, setHelperLessonId] = useState("");
  const [helperOptions, setHelperOptions] = useState<HelperOption[]>([]);
  const [activeHomeroomId, setActiveHomeroomId] = useState(homerooms[0].id);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [overviewRailCollapsed, setOverviewRailCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.lang = "he";
    document.documentElement.dir = "rtl";
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rawData));
  }, [rawData]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const roomConflicts = useMemo(() => roomConflictIds(data.lessons), [data.lessons]);
  const visibleTeachers = role === "teacher"
    ? teachers.filter((teacher) => teacher.id === selectedTeacherId)
    : role === "manager" && teacherFilter !== "הכול"
      ? teachers.filter((teacher) => teacher.id === teacherFilter)
      : teachers;
  const activeAide = data.aides.find((aide) => aide.id === selectedAideId) ?? data.aides[0];
  const todaySessions = data.lessons.filter(
    (lesson) => lesson.day === selectedDay && lesson.status !== "canceled",
  );
  const todayStudents = new Set(todaySessions.flatMap((lesson) => lesson.studentIds));
  const upcomingExams = exams.filter((exam) => exam.dateOffset >= 0).sort((a, b) => a.dateOffset - b.dateOffset);

  const navGroups = [
    {
      label: "",
      items: [
        { id: "overview" as View, label: "מבט יומי", icon: <LayoutDashboard size={18} /> },
        { id: "daily" as View, label: "מערכת יומית", icon: <CalendarDays size={18} /> },
        { id: "weekly" as View, label: "מטריצה שבועית", icon: <CalendarRange size={18} /> },
        { id: "helper" as View, label: "עוזר שיבוץ", icon: <Sparkles size={18} />, accent: true },
        { id: "exams" as View, label: "מבחנים ואירועים", icon: <Bell size={18} /> },
        { id: "coverage" as View, label: "היעדרויות וכיסוי", icon: <ShieldAlert size={18} /> },
        { id: "logs" as View, label: "תיעוד שיעורים", icon: <ClipboardCheck size={18} /> },
        { id: "aides" as View, label: "סטטוס סייעות", icon: <UsersRound size={18} /> },
      ],
    },
    {
      label: "ניהול",
      items: [
        { id: "students" as View, label: "תלמידים", icon: <GraduationCap size={18} /> },
        { id: "teachers" as View, label: "מורות", icon: <UserRound size={18} /> },
        { id: "groups" as View, label: "קבוצות", icon: <UsersRound size={18} /> },
        { id: "timetable" as View, label: "מערכת שעות", icon: <Grid2X2 size={18} /> },
        { id: "locations" as View, label: "מיקומים", icon: <MapPin size={18} /> },
      ],
    },
    {
      label: "מידע ודוחות",
      items: [
        { id: "updates" as View, label: "עדכוני כיתה", icon: <BookOpen size={18} /> },
        { id: "stats" as View, label: "סטטיסטיקה", icon: <Activity size={18} /> },
      ],
    },
  ];

  const allowedViews: Record<Role, View[]> = {
    manager: [
      "overview", "daily", "weekly", "helper", "exams", "coverage", "logs", "aides",
      "students", "teachers", "groups", "timetable", "locations", "updates", "stats",
    ],
    teacher: ["overview", "daily", "weekly", "helper", "exams", "logs", "updates", "stats"],
    aide: ["overview", "daily", "exams", "aides", "timetable", "updates"],
  };

  function navigate(nextView: View) {
    if (!allowedViews[role].includes(nextView)) return;
    setView(nextView);
    setMobileNavOpen(false);
    setSearch("");
  }

  function resetDemoData() {
    const fresh = seedData();
    setData(fresh);
    setHelperOptions([]);
    setToast("נתוני ההדגמה אופסו");
  }

  function leaveStatus(studentId: string, homeroomId: string, day: number, period: number) {
    const key = `${studentId}:${day}:${period}`;
    const slot = classSlots[`${homeroomId}:${day}:${period}`];
    const classLabel = slot ? subjectName(slot.subjectId) : "שיעור כיתתי";
    if (rawData.excusalOverrides[key] !== undefined) {
      const allowed = rawData.excusalOverrides[key];
      return { allowed, personal: true, reason: allowed ? `חריג אישי: מותר לצאת משיעור ${classLabel}` : `חריג אישי: אסור לצאת משיעור ${classLabel}` };
    }
    if (studentExcusalOverrides[key] !== undefined) {
      const allowed = studentExcusalOverrides[key];
      return { allowed, personal: true, reason: allowed ? `חריג אישי קבוע: מותר לצאת משיעור ${classLabel}` : `חריג אישי קבוע: אסור לצאת משיעור ${classLabel}` };
    }
    const allowed = slot?.excusable ?? true;
    return { allowed, personal: false, reason: allowed ? `שיעור ${classLabel} מאפשר שחרור לכל הכיתה` : `שיעור ${classLabel} מסומן כשיעור שלא משחררים ממנו` };
  }

  function canLeave(studentId: string, homeroomId: string, day: number, period: number) {
    return leaveStatus(studentId, homeroomId, day, period).allowed;
  }

  function setExcusalOverride(studentId: string, day: number, period: number, value: boolean | null) {
    const key = `${studentId}:${day}:${period}`;
    setData((current) => {
      const next = { ...current.excusalOverrides };
      if (value === null) delete next[key]; else next[key] = value;
      return { ...current, excusalOverrides: next };
    });
  }

  function openCreateLesson(day = selectedDay, period = 0, teacherId = teachers[0].id) {
    const teacher = getTeacher(teacherId) ?? teachers[0];
    setModalError("");
    setModalDraft({
      scope: "all",
      day,
      period,
      subjectId: teacher.subjectIds[0],
      teacherId: teacher.id,
      studentIds: [],
      location: locations[0],
    });
  }

  function openEditLesson(lesson: Lesson) {
    setModalError("");
    setModalDraft({
      id: lesson.id,
      scope: "all",
      day: lesson.day,
      period: lesson.period,
      subjectId: lesson.subjectId,
      teacherId: lesson.teacherId,
      studentIds: lesson.studentIds,
      location: lesson.location,
    });
  }

  function saveLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modalDraft) return;
    if (modalDraft.studentIds.length === 0) {
      setModalError("יש לבחור לפחות תלמיד/ה אחד/ת.");
      return;
    }

    const teacher = getTeacher(modalDraft.teacherId);
    if (!teacher) {
      setModalError("לא נמצאה מורה מתאימה.");
      return;
    }
    if (!teacher.subjectIds.includes(modalDraft.subjectId)) {
      setModalError("המורה שנבחרה אינה מלמדת את המקצוע הזה.");
      return;
    }

    const window = teacher.workWindows[modalDraft.day];
    if (!window || modalDraft.period < window.startPeriod || modalDraft.period >= window.endPeriod) {
      setModalError("המורה אינה נוכחת בשעה שנבחרה.");
      return;
    }

    const remaining = data.lessons.filter(
      (lesson) => lesson.id !== modalDraft.id && lesson.status !== "canceled",
    );
    const teacherBusy = remaining.some(
      (lesson) =>
        lesson.teacherId === modalDraft.teacherId &&
        lesson.day === modalDraft.day &&
        lesson.period === modalDraft.period,
    );
    if (teacherBusy) {
      setModalError("למורה כבר יש שיבוץ בשעה הזו.");
      return;
    }

    const studentBusy = modalDraft.studentIds.some((studentId) =>
      remaining.some(
        (lesson) =>
          lesson.studentIds.includes(studentId) &&
          lesson.day === modalDraft.day &&
          lesson.period === modalDraft.period,
      ),
    );
    if (studentBusy) {
      setModalError("לתלמיד/ה שנבחר/ה כבר יש שיעור בשעה הזו.");
      return;
    }

    const blockedStudent = modalDraft.studentIds
      .map((id) => getStudent(id))
      .find((student) =>
        student ? !canLeave(student.id, student.homeroomId, modalDraft.day, modalDraft.period) : false,
      );
    if (blockedStudent) {
      setModalError(`לא ניתן לשחרר את ${blockedStudent.displayName}: ${leaveStatus(blockedStudent.id, blockedStudent.homeroomId, modalDraft.day, modalDraft.period).reason}.`);
      return;
    }

    const original = data.lessons.find((item) => item.id === modalDraft.id);
    const sameGroup = original &&
      original.subjectId === modalDraft.subjectId &&
      original.studentIds.length === modalDraft.studentIds.length &&
      original.studentIds.every((id) => modalDraft.studentIds.includes(id));
    const groupId = modalDraft.studentIds.length > 1
      ? sameGroup && original.groupId
        ? original.groupId
        : `group-custom-${modalDraft.studentIds.slice().sort().join("-")}`
      : undefined;
    const scope: EditScope = modalDraft.scope ?? "all";
    const built: Lesson = {
      id: modalDraft.id ?? `lesson-${Date.now()}`,
      day: modalDraft.day,
      period: modalDraft.period,
      subjectId: modalDraft.subjectId,
      teacherId: modalDraft.teacherId,
      studentIds: modalDraft.studentIds,
      groupId,
      groupName: groupId ? (sameGroup && original.groupName ? original.groupName : `קבוצת ${subjectName(modalDraft.subjectId)}`) : undefined,
      location: modalDraft.location,
      status: original?.status ?? "scheduled",
      absentStudentIds: original?.absentStudentIds.filter((id) => modalDraft.studentIds.includes(id)) ?? [],
      startWeek: original?.startWeek,
      endWeek: original?.endWeek,
      skipWeeks: original?.skipWeeks,
      originalTeacherId: original?.originalTeacherId,
    };
    const dated: Lesson = scope === "all"
      ? built
      : {
          ...built,
          id: `lesson-${Date.now()}`,
          status: "scheduled",
          absentStudentIds: [],
          originalTeacherId: undefined,
          skipWeeks: undefined,
          startWeek: weekOffset,
          endWeek: scope === "once" ? weekOffset : original?.endWeek,
        };

    setData((current) => {
      if (!modalDraft.id) return { ...current, lessons: [...current.lessons, dated] };
      if (scope === "all") {
        return { ...current, lessons: current.lessons.map((item) => item.id === modalDraft.id ? built : item) };
      }
      const lessons = current.lessons.flatMap((item): Lesson[] => {
        if (item.id !== modalDraft.id) return [item];
        if (scope === "once") return [{ ...item, skipWeeks: [...(item.skipWeeks ?? []), weekOffset] }, dated];
        if (item.startWeek !== undefined && item.startWeek >= weekOffset) return [dated];
        return [{ ...item, endWeek: weekOffset - 1 }, dated];
      });
      return { ...current, lessons };
    });

    const collision = remaining.some(
      (item) =>
        item.day === built.day &&
        item.period === built.period &&
        item.location === built.location,
    );
    const scopeNote = scope === "once" ? ` · רק לשבוע ${weekDateRange(weekOffset)}` : scope === "future" ? ` · מהשבוע ${weekDateRange(weekOffset)} ואילך` : "";
    setToast((collision ? "השיבוץ נשמר עם אזהרת התנגשות מקום" : "השיבוץ נשמר") + scopeNote);
    setModalDraft(null);
  }

  function toggleStudentInDraft(studentId: string) {
    if (!modalDraft) return;
    const selected = modalDraft.studentIds.includes(studentId);
    setModalDraft({
      ...modalDraft,
      studentIds: selected
        ? modalDraft.studentIds.filter((id) => id !== studentId)
        : [...modalDraft.studentIds, studentId],
    });
  }

  function updateLessonStatus(lesson: Lesson, status: Lesson["status"]) {
    setData((current) => ({
      ...current,
      lessons: current.lessons.map((item) => item.id === lesson.id ? { ...item, status } : item),
      logs: status === "completed" && !current.logs.some((log) => log.lessonId === lesson.id)
        ? [
            ...current.logs,
            {
              id: `log-${lesson.id}`,
              lessonId: lesson.id,
              studentIds: lesson.studentIds,
              lateStudentIds: [],
              note: "",
            },
          ]
        : current.logs,
    }));
    setToast(status === "completed" ? "השיעור תועד" : "סטטוס השיעור עודכן");
  }

  function markStudentAbsent(lesson: Lesson, studentId: string) {
    setData((current) => ({
      ...current,
      lessons: current.lessons.map((item) => {
        if (item.id !== lesson.id) return item;
        if (item.studentIds.length === 1) return { ...item, status: "canceled" };
        return {
          ...item,
          absentStudentIds: item.absentStudentIds.includes(studentId)
            ? item.absentStudentIds
            : [...item.absentStudentIds, studentId],
        };
      }),
    }));
    setToast(lesson.studentIds.length === 1 ? "השיעור בוטל ונשמר בהיסטוריה" : "ההיעדרות תועדה למשתתף/ת");
  }

  function updateAideStatus(aideId: string, status: AideStatus) {
    setData((current) => ({
      ...current,
      aides: current.aides.map((aide) => aide.id === aideId ? { ...aide, status } : aide),
    }));
    setToast("סטטוס הסייעת עודכן");
  }

  function minimumForTeacherDay(teacherId: string, day: number) {
    const key = `${teacherId}:${day}`;
    return data.teacherMinimums[key] ?? getTeacher(teacherId)?.workWindows[day]?.minimumSpanMinutes ?? 180;
  }

  function updateTeacherMinimum(teacherId: string, day: number, minutes: number) {
    setData((current) => ({
      ...current,
      teacherMinimums: {
        ...current.teacherMinimums,
        [`${teacherId}:${day}`]: Math.max(0, minutes),
      },
    }));
  }

  function directMoves(lesson: Lesson, lessons: Lesson[]): Array<Move & { score: number }> {
    const options: Array<Move & { score: number }> = [];
    const candidates = teachers.filter((teacher) => teacher.subjectIds.includes(lesson.subjectId));
    const others = lessons.filter((item) => item.id !== lesson.id && item.status !== "canceled");

    for (const teacher of candidates) {
      for (const day of DAYS) {
        const window = teacher.workWindows[day.index];
        if (!window) continue;

        for (let period = window.startPeriod; period < window.endPeriod; period += 1) {
          if (day.index === lesson.day && period === lesson.period && teacher.id === lesson.teacherId) continue;
          if (others.some((item) => item.teacherId === teacher.id && item.day === day.index && item.period === period)) continue;
          if (lesson.studentIds.some((studentId) => others.some((item) => item.studentIds.includes(studentId) && item.day === day.index && item.period === period))) continue;
          const studentsCanLeave = lesson.studentIds.every((studentId) => {
            const student = getStudent(studentId);
            return student && canLeave(student.id, student.homeroomId, day.index, period);
          });
          if (!studentsCanLeave) continue;

          const score = (teacher.id === lesson.teacherId ? 0 : 4) + Math.abs(day.index - lesson.day) * 2 + Math.abs(period - lesson.period);
          options.push({ lessonId: lesson.id, day: day.index, period, teacherId: teacher.id, score });
        }
      }
    }

    return options.sort((a, b) => a.score - b.score);
  }

  function findLessonSuggestions(lesson: Lesson, forceChains = false): HelperOption[] {
    const direct: HelperOption[] = directMoves(lesson, data.lessons)
      .slice(0, forceChains ? 3 : 4)
      .map((move) => ({ moves: [{ lessonId: move.lessonId, day: move.day, period: move.period, teacherId: move.teacherId }], score: move.score }));
    const results = [...direct];

    // Chain: move the lesson into a slot taken by another lesson of the same teacher, and relocate that lesson.
    if (forceChains || results.length < 4) {
      const teacher = getTeacher(lesson.teacherId);
      const chains: HelperOption[] = [];
      for (const blocker of data.lessons) {
        if (blocker.id === lesson.id || blocker.status === "canceled" || blocker.teacherId !== lesson.teacherId) continue;
        if (!teacher?.workWindows[blocker.day]) continue;
        if (lesson.studentIds.some((studentId) => data.lessons.some((item) => item.id !== lesson.id && item.id !== blocker.id && item.status !== "canceled" && item.studentIds.includes(studentId) && item.day === blocker.day && item.period === blocker.period))) continue;
        const canLeaveSlot = lesson.studentIds.every((studentId) => {
          const student = getStudent(studentId);
          return student && canLeave(student.id, student.homeroomId, blocker.day, blocker.period);
        });
        if (!canLeaveSlot) continue;

        const first: Move = { lessonId: lesson.id, day: blocker.day, period: blocker.period, teacherId: lesson.teacherId };
        const afterFirst = data.lessons.map((item) => item.id === lesson.id ? { ...item, ...first } : item);
        const secondChoices = directMoves(blocker, afterFirst)
          .filter((move) => !(move.day === first.day && move.period === first.period))
          .slice(0, 1);
        for (const second of secondChoices) {
          const { score: secondScore, ...secondMove } = second;
          const firstScore = Math.abs(first.day - lesson.day) * 2 + Math.abs(first.period - lesson.period);
          chains.push({ moves: [first, secondMove], score: 10 + firstScore + secondScore });
        }
      }
      results.push(...chains.sort((a, b) => a.score - b.score).slice(0, forceChains ? 3 : 4 - results.length));
    }

    return results.sort((a, b) => a.moves.length - b.moves.length || a.score - b.score).slice(0, 6);
  }

  function applySuggestion(option: HelperOption) {
    setData((current) => ({
      ...current,
      lessons: current.lessons.map((item) => {
        const move = option.moves.find((candidate) => candidate.lessonId === item.id);
        return move ? { ...item, day: move.day, period: move.period, teacherId: move.teacherId } : item;
      }),
    }));
    setToast(option.moves.length > 1 ? "השרשרת אושרה ושני השיבוצים עודכנו" : "ההצעה אושרה והשיבוץ עודכן");
    setHelperOptions([]);
  }

  function substituteCandidates(lesson: Lesson, absentId: string) {
    const student = getStudent(lesson.studentIds[0] ?? "");
    return teachers
      .filter((teacher) => teacher.id !== absentId && teacher.subjectIds.includes(lesson.subjectId))
      .filter((teacher) => {
        const window = teacher.workWindows[lesson.day];
        if (!window || lesson.period < window.startPeriod || lesson.period >= window.endPeriod) return false;
        return !data.lessons.some((item) => item.id !== lesson.id && item.status !== "canceled" && item.teacherId === teacher.id && item.day === lesson.day && item.period === lesson.period);
      })
      .map((teacher) => {
        const dayLoad = data.lessons.filter((item) => item.teacherId === teacher.id && item.day === lesson.day).length;
        const usualTeacher = student?.teacherBySubject[lesson.subjectId] === teacher.id ? 0 : 1;
        return { teacher, score: usualTeacher * 10 + dayLoad };
      })
      .sort((a, b) => a.score - b.score)
      .map((item) => item.teacher);
  }

  function assignCover(lessonId: string, teacherId: string, originalId: string) {
    setData((current) => ({
      ...current,
      lessons: current.lessons.map((item) => item.id === lessonId ? { ...item, teacherId, originalTeacherId: item.originalTeacherId ?? originalId } : item),
    }));
  }

  function autoCoverAbsence(absentId: string, day: number) {
    const affected = data.lessons.filter((lesson) => lesson.teacherId === absentId && lesson.day === day && lesson.status === "scheduled");
    const taken = new Set<string>();
    const notices: ManagerNotice[] = [];
    const assignments: Array<{ lessonId: string; teacherId: string }> = [];
    for (const lesson of affected) {
      const candidate = substituteCandidates(lesson, absentId).find((teacher) => !taken.has(`${teacher.id}:${lesson.period}`));
      const label = `${DAYS[day].short} · שעה ${lesson.period + 1} · ${subjectName(lesson.subjectId)}`;
      if (candidate) {
        taken.add(`${candidate.id}:${lesson.period}`);
        assignments.push({ lessonId: lesson.id, teacherId: candidate.id });
        notices.push({ id: `notice-${Date.now()}-${lesson.id}`, kind: "info", text: `כיסוי זמני: ${label} — ${candidate.name} במקום ${getTeacher(absentId)?.name}` });
      } else {
        notices.push({ id: `notice-${Date.now()}-${lesson.id}`, kind: "warning", text: `אין מחליפה זמינה: ${label} (${getTeacher(absentId)?.name})` });
      }
    }
    setData((current) => ({
      ...current,
      lessons: current.lessons.map((item) => {
        const assignment = assignments.find((candidate) => candidate.lessonId === item.id);
        return assignment ? { ...item, teacherId: assignment.teacherId, originalTeacherId: item.originalTeacherId ?? absentId } : item;
      }),
      notices: [...notices, ...current.notices].slice(0, 12),
    }));
    setToast(affected.length === 0 ? "אין שיעורים מתוכננים למורה ביום הזה" : `${assignments.length} שיעורים כוסו, ${affected.length - assignments.length} ללא מחליפה`);
  }

  function revertCover(lesson: Lesson) {
    if (!lesson.originalTeacherId) return;
    setData((current) => ({
      ...current,
      lessons: current.lessons.map((item) => item.id === lesson.id ? { ...item, teacherId: item.originalTeacherId ?? item.teacherId, originalTeacherId: undefined } : item),
    }));
    setToast("הכיסוי בוטל והמורה המקורית הוחזרה");
  }

  function createClassUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newUpdate: ClassUpdate = {
      id: `update-${Date.now()}`,
      grade: String(formData.get("grade") ?? "ט׳"),
      subjectId: String(formData.get("subject") ?? "math") as SubjectId,
      date: new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "numeric" }).format(new Date()),
      title: String(formData.get("title") ?? ""),
      homework: String(formData.get("homework") ?? ""),
      exercise: String(formData.get("exercise") ?? ""),
      author: role === "manager" ? "מנהל/ת המערכת" : role === "teacher" ? "מורה" : "סייעת",
    };
    if (!newUpdate.title.trim()) return;
    setData((current) => ({ ...current, updates: [newUpdate, ...current.updates] }));
    setShowUpdateForm(false);
    setToast("העדכון נוסף ללוח הכיתה");
  }

  const roomWarningCount = roomConflicts.size / 2;
  const currentAideCount = data.aides.filter((aide) => aide.status !== "absent").length;

  const roleTitle = role === "manager" ? "מנהל/ת" : role === "teacher" ? "מורה" : "סייעת";
  const currentTeacher = getTeacher(selectedTeacherId) ?? teachers[0];
  const currentPage = pageTitles[view];

  const roleFilteredLessons = role === "teacher"
    ? data.lessons.filter((lesson) => lesson.teacherId === selectedTeacherId)
    : role === "aide" && activeAide
      ? data.lessons.filter((lesson) =>
          lesson.studentIds.some((studentId) => {
            const student = getStudent(studentId);
            return student && activeAide.homeroomIds.includes(student.homeroomId);
          }),
        )
      : data.lessons;
  const scheduleFilteredLessons = roleFilteredLessons.filter((lesson) => {
    const lessonStudents = lesson.studentIds.map((id) => getStudent(id)).filter(Boolean);
    const gradeMatches = selectedGrade === "הכול" || lessonStudents.some((student) => student?.grade === selectedGrade);
    const subjectMatches = selectedSubject === "הכול" || lesson.subjectId === selectedSubject;
    const teacherMatches = role !== "manager" || teacherFilter === "הכול" || lesson.teacherId === teacherFilter;
    const query = search.trim().toLowerCase();
    const searchMatches =
      !query ||
      lesson.groupName?.toLowerCase().includes(query) ||
      lessonStudents.some((student) => student?.displayName.toLowerCase().includes(query)) ||
      (getTeacher(lesson.teacherId)?.name.toLowerCase().includes(query) ?? false);
    return gradeMatches && subjectMatches && teacherMatches && Boolean(searchMatches);
  });

  const filteredStudents = students.filter((student) => {
    const matchesGrade = selectedGrade === "הכול" || student.grade === selectedGrade;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      student.displayName.toLowerCase().includes(query) ||
      student.grade.toLowerCase().includes(query) ||
      (getHomeroom(student.homeroomId)?.name.toLowerCase().includes(query) ?? false);
    return matchesGrade && matchesSearch;
  });

  function renderLessonCard(lesson: Lesson, compact = false) {
    const lessonStudents = lesson.studentIds.map((id) => getStudent(id)).filter(Boolean);
    const teacher = getTeacher(lesson.teacherId);
    const classInfo = getStudentClass(lesson);
    const firstStudent = lessonStudents[0];
    const hasRoomWarning = roomConflicts.has(lesson.id);

    return (
      <button
        className={`lesson-card ${subjectClass(lesson.subjectId)} ${compact ? "lesson-card-compact" : ""} ${hasRoomWarning ? "has-room-warning" : ""}`}
        key={lesson.id}
        type="button"
        onClick={() => openEditLesson(lesson)}
      >
        <div className="lesson-card-top">
          <span className="lesson-subject"><i />{subjectName(lesson.subjectId)}</span>
          <span className={`lesson-status status-${lesson.status}`}>
            {lesson.status === "completed" ? "התקיים" : lesson.status === "canceled" ? "בוטל" : "מתוכנן"}
          </span>
        </div>
        <strong className="lesson-card-title">
          {lesson.groupName ?? (lessonStudents.length === 1 ? firstStudent?.displayName : `${lessonStudents.length} תלמידים`)}
        </strong>
        <span className="lesson-card-meta">
          {teacher?.name}
          {lessonStudents.length > 1 && ` · ${lessonStudents.slice(0, 2).map((student) => student?.displayName).join(", ")}`}
        </span>
        <span className="lesson-card-location">
          <MapPin size={12} />
          {lesson.location}
        </span>
        {!compact && firstStudent && classInfo && (
          <span className="missed-class-line">
            על חשבון: {subjectName(classInfo.subjectId)} · {classInfo.room}
          </span>
        )}
        {lesson.originalTeacherId && <span className="room-warning-label">כיסוי זמני · במקום {getTeacher(lesson.originalTeacherId)?.name}</span>}
        {hasRoomWarning && <span className="room-warning-label">אזהרת מקום</span>}
      </button>
    );
  }

  function renderDailyMatrix(compact = false) {
    const dayLessons = scheduleFilteredLessons.filter(
      (lesson) => lesson.day === selectedDay && lesson.status !== "canceled",
    );
    const gridTeachers = visibleTeachers;
    const gridTemplate = gridTeachers.length === 1
      ? "76px minmax(0, 1fr)"
      : `76px repeat(${gridTeachers.length}, minmax(115px, 1fr))`;

    return (
      <div className={`table-scroll ${compact ? "matrix-compact" : ""}`}>
        <div className={`daily-matrix ${gridTeachers.length === 1 ? "single-teacher-matrix" : ""}`} style={{ gridTemplateColumns: gridTemplate }}>
          <div className="matrix-corner">שעה</div>
          {gridTeachers.map((teacher) => (
            <div className="teacher-column-head" key={teacher.id}>
              <span className="teacher-avatar">{teacher.initials}</span>
              <div>
                <strong>{teacher.name}</strong>
                <small>
                  {teacher.subjectIds.slice(0, 2).map(subjectName).join(" · ")}
                  {teacher.workWindows[selectedDay] && ` · נוכחות ${getPeriodSpan(teacher.workWindows[selectedDay].startPeriod, teacher.workWindows[selectedDay].endPeriod)} דק׳ · מינ׳ ${minimumForTeacherDay(teacher.id, selectedDay)}`}
                </small>
              </div>
            </div>
          ))}
          {PERIODS.map((period) => (
            <div className="matrix-row-fragment" key={`row-${period.index}`}>
              <div className="period-head">
                <strong>{period.label}</strong>
                <span>{period.start}–{period.end}</span>
              </div>
              {gridTeachers.map((teacher) => {
                const dayWindow = teacher.workWindows[selectedDay];
                const onSite = dayWindow && period.index >= dayWindow.startPeriod && period.index < dayWindow.endPeriod;
                const session = dayLessons.find(
                  (lesson) => lesson.teacherId === teacher.id && lesson.period === period.index,
                );
                return (
                  <div className={`schedule-cell ${!onSite ? "cell-off" : ""}`} key={`${teacher.id}-${period.index}`}>
                    {session
                      ? renderLessonCard(session, compact)
                      : onSite
                        ? <button className="free-slot" type="button" onClick={() => openCreateLesson(selectedDay, period.index, teacher.id)}><Plus size={14} /> פנוי לשיבוץ</button>
                        : <span className="off-slot">{dayWindow ? "מחוץ לשעות" : "יום חופשי"}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderWeeklyMatrix() {
    const daysForView = role === "teacher"
      ? DAYS.filter((day) => data.lessons.some((lesson) => lesson.teacherId === selectedTeacherId && lesson.day === day.index))
      : DAYS;
    const gridTemplate = `76px repeat(${daysForView.length}, minmax(0, 1fr))`;

    return (
      <div className="table-scroll">
        <div className="weekly-matrix" style={{ gridTemplateColumns: gridTemplate }}>
          <div className="matrix-corner">שעה</div>
          {daysForView.map((day) => (
            <button
              className={`day-column-head ${day.index === getTodayIndex() && weekOffset === 0 ? "is-today" : ""}`}
              key={day.index}
              type="button"
              onClick={() => { setSelectedDay(day.index); navigate("daily"); }}
            >
              <strong>{day.label}</strong>
              <span>{formatDateForDay(day.index, weekOffset)}</span>
            </button>
          ))}
          {PERIODS.map((period) => (
            <div className="matrix-row-fragment" key={`weekly-${period.index}`}>
              <div className="period-head">
                <strong>{period.label}</strong>
                <span>{period.start}–{period.end}</span>
              </div>
              {daysForView.map((day) => {
                const sessions = scheduleFilteredLessons.filter(
                  (lesson) =>
                    lesson.day === day.index &&
                    lesson.period === period.index &&
                    lesson.status !== "canceled",
                );
                return (
                  <div className={`weekly-cell ${day.index === 5 ? "friday-cell" : ""}`} key={`${day.index}-${period.index}`}>
                    {sessions.length > 0
                      ? sessions.map((lesson) => renderLessonCard(lesson, true))
                      : <button className="free-slot free-slot-week" type="button" onClick={() => openCreateLesson(day.index, period.index)}><Plus size={13} /> פנוי</button>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderOverview() {
    const todayExam = upcomingExams.find((exam) => exam.day === selectedDay) ?? upcomingExams[0];
    const managerMetrics = [
      { label: "שיבוצים היום", value: todaySessions.length, note: `${todayStudents.size} תלמידים`, icon: <CalendarDays size={18} />, color: "teal" },
      { label: "חסימות", value: 0, note: "ללא שיבוץ כפול", icon: <ShieldAlert size={18} />, color: "mint" },
      { label: "אזהרות מקום", value: roomWarningCount, note: "לא חוסם שיבוץ", icon: <MapPin size={18} />, color: "amber" },
      { label: "סייעות זמינות", value: `${currentAideCount}/${data.aides.length}`, note: "נוכחות וזמינות היום", icon: <UsersRound size={18} />, color: "blue" },
    ];

    return (
      <>
        <div className="metrics-grid">
          {managerMetrics.map((metric) => (
            <div className={`metric-card metric-${metric.color}`} key={metric.label}>
              <div className="metric-label"><span>{metric.icon}</span>{metric.label}</div>
              <strong>{metric.value}</strong>
              <small>{metric.note}</small>
            </div>
          ))}
        </div>
        <div className={`overview-layout ${overviewRailCollapsed ? "overview-layout-rail-collapsed" : ""}`}>
          <section className="panel schedule-panel">
            <div className="panel-heading">
              <div>
                <h2>שיבוצי היום לפי מורה</h2>
                <p>{DAYS[selectedDay].label} · {formatDateForDay(selectedDay, weekOffset)} · לוח מלא לפי שעות</p>
              </div>
              <div className="panel-actions">
                <button className="button button-secondary" type="button" onClick={() => navigate("weekly")}>
                  <CalendarRange size={16} /> מטריצה שבועית
                </button>
                <button className="button button-primary" type="button" onClick={() => openCreateLesson()}>
                  <Plus size={16} /> שיבוץ חדש
                </button>
              </div>
            </div>
            <div className="day-picker">
              <button type="button" aria-label="יום קודם" onClick={() => setSelectedDay((day) => (day + 5) % 6)}><ChevronRight size={17} /></button>
              <span>{DAYS[selectedDay].label}</span>
              <button type="button" aria-label="יום הבא" onClick={() => setSelectedDay((day) => (day + 1) % 6)}><ChevronLeft size={17} /></button>
            </div>
            {renderDailyMatrix(true)}
          </section>
          <aside className={`overview-rail ${overviewRailCollapsed ? "overview-rail-hidden" : ""}`}>
            <div className="overview-rail-toggle">
              {!overviewRailCollapsed && <span>מידע מהיר</span>}
              <button
                type="button"
                aria-label={overviewRailCollapsed ? "הרחבת החלונית השמאלית" : "כיווץ החלונית השמאלית"}
                title={overviewRailCollapsed ? "הרחבת החלונית" : "כיווץ החלונית"}
                onClick={() => setOverviewRailCollapsed((collapsed) => !collapsed)}
              >
                {overviewRailCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
              </button>
            </div>
            {!overviewRailCollapsed && <>
            <section className="panel rail-panel">
              <div className="panel-heading panel-heading-small">
                <div><h2>מבחנים קרובים</h2><p>לפי שכבה ומקצוע</p></div>
                <Bell size={17} />
              </div>
              {todayExam ? (
                <div className="exam-highlight">
                  <span className={`subject-dot ${subjectClass(todayExam.subjectId)}`} />
                  <div><strong>{todayExam.title}</strong><small>{todayExam.grade} · בעוד {todayExam.dateOffset} ימים</small></div>
                  <span className={`subject-pill ${subjectClass(todayExam.subjectId)}`}>{subjectName(todayExam.subjectId)}</span>
                </div>
              ) : <p className="empty-note">אין מבחנים קרובים</p>}
              <button className="text-button" type="button" onClick={() => navigate("exams")}>לכל המבחנים והאירועים <ChevronLeft size={14} /></button>
            </section>
            <section className="panel rail-panel">
              <div className="panel-heading panel-heading-small">
                <div><h2>זמינות סייעות</h2><p>לפי כיתות באחריות</p></div>
                <UsersRound size={17} />
              </div>
              <div className="mini-aide-list">
                {data.aides.slice(0, 4).map((aide) => (
                  <div className="mini-aide" key={aide.id}>
                    <span className={`presence-dot presence-${aide.status}`} />
                    <span>{aide.name}</span>
                    <small>{aide.status === "absent" ? "לא נמצאת" : aide.status === "helping" ? "מסייעת כרגע" : "זמינה"}</small>
                  </div>
                ))}
              </div>
              <button className="text-button" type="button" onClick={() => navigate("aides")}>לכל הסייעות <ChevronLeft size={14} /></button>
            </section>
            <section className="panel rail-panel helper-teaser">
              <div className="panel-heading panel-heading-small">
                <div><h2>עוזר השיבוץ</h2><p>הצעות נקודתיות ומבוקרות</p></div>
                <Sparkles size={17} />
              </div>
              <p>{roomWarningCount > 0 ? `${roomWarningCount} התנגשות מקום שאינה חוסמת שיבוץ.` : "אפשר לחפש זמן חלופי או לתקן שיבוץ בשרשרת קצרה."}</p>
              <button className="button button-secondary button-full" type="button" onClick={() => navigate("helper")}>פתיחת העוזר</button>
            </section>
            </>}
          </aside>
        </div>
      </>
    );
  }

  function renderDailyPage() {
    return (
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>שיבוצי {DAYS[selectedDay].label} — טבלה לפי מורה</h2>
            <p>עמודות לפי מורה, שורות לפי שעה. בחירת תא פנוי פותחת שיבוץ חדש.</p>
          </div>
          <div className="panel-actions">
            <button className="button button-secondary" type="button" onClick={() => setSelectedDay((day) => (day + 5) % 6)}><ChevronRight size={16} /> יום קודם</button>
            <button className="button button-secondary" type="button" onClick={() => setSelectedDay((day) => (day + 1) % 6)}>יום הבא <ChevronLeft size={16} /></button>
          </div>
        </div>
        <div className="filter-toolbar">
          <label className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="חיפוש תלמיד/ה או קבוצה" /></label>
          {role === "manager" && <select value={teacherFilter} onChange={(event) => setTeacherFilter(event.target.value)} aria-label="סינון לפי מורה">
            <option value="הכול">כל המורות</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
          </select>}
          <select value={selectedGrade} onChange={(event) => setSelectedGrade(event.target.value)} aria-label="סינון לפי שכבה">
            <option>הכול</option>{["ט׳", "י׳", "י״א", "י״ב"].map((grade) => <option key={grade}>{grade}</option>)}
          </select>
          <select value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value)} aria-label="סינון לפי מקצוע">
            <option value="הכול">כל המקצועות</option>{SUBJECTS.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
        </div>
        {renderDailyMatrix()}
      </section>
    );
  }

  function renderWeeklyPage() {
    return (
      <section className="panel">
        <div className="panel-heading">
          <div><h2>מערכת שבועית מלאה</h2><p>שורה לכל שעה ועמודה לכל יום · שישי קל יותר</p></div>
          <div className="week-controls">
            <button type="button" aria-label="שבוע קודם" onClick={() => setWeekOffset((offset) => offset - 1)}><ChevronRight size={17} /></button>
            <strong>{weekDateRange(weekOffset)}</strong>
            <button type="button" aria-label="שבוע הבא" onClick={() => setWeekOffset((offset) => offset + 1)}><ChevronLeft size={17} /></button>
          </div>
        </div>
        <div className="filter-toolbar">
          <label className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="חיפוש תלמיד/ה או קבוצה" /></label>
          <select value={teacherFilter} onChange={(event) => setTeacherFilter(event.target.value)} aria-label="סינון לפי מורה">
            <option value="הכול">כל המורות</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
          </select>
          <select value={selectedGrade} onChange={(event) => setSelectedGrade(event.target.value)} aria-label="סינון לפי שכבה">
            <option>הכול</option>{["ט׳", "י׳", "י״א", "י״ב"].map((grade) => <option key={grade}>{grade}</option>)}
          </select>
          <select value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value)} aria-label="סינון לפי מקצוע">
            <option value="הכול">כל המקצועות</option>{SUBJECTS.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
        </div>
        <SubjectLegend />
        {renderWeeklyMatrix()}
      </section>
    );
  }

  function renderHelperPage() {
    const selectedLesson = data.lessons.find((lesson) => lesson.id === helperLessonId) ?? data.lessons.find((lesson) => lesson.status === "scheduled");
    return (
      <div className="helper-layout">
        <section className="panel helper-main">
          <div className="panel-heading">
            <div><h2>פתרון נקודתי לשיבוץ</h2><p>העוזר בודק זמינות מורה, התנגשות תלמיד/ה והיתר יציאה מהכיתה.</p></div>
            <div className="helper-icon"><Sparkles size={20} /></div>
          </div>
          <label className="field-label">בחירת שיעור לבדיקה
            <select value={selectedLesson?.id ?? ""} onChange={(event) => { setHelperLessonId(event.target.value); setHelperOptions([]); }}>
              {data.lessons.filter((lesson) => lesson.status !== "canceled").slice(0, 40).map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {DAYS[lesson.day].short} · שעה {lesson.period + 1} · {subjectName(lesson.subjectId)} · {lesson.groupName ?? getStudent(lesson.studentIds[0] ?? "")?.displayName}
                </option>
              ))}
            </select>
          </label>
          {selectedLesson && (
            <div className="selected-lesson-summary">
              {renderLessonCard(selectedLesson, true)}
              <button className="button button-primary" type="button" onClick={() => setHelperOptions(findLessonSuggestions(selectedLesson))}>
                <Sparkles size={16} /> חיפוש חלופות
              </button>
              <button className="button button-secondary" type="button" onClick={() => setHelperOptions(findLessonSuggestions(selectedLesson, true))}>
                כולל שרשראות
              </button>
            </div>
          )}
          {helperOptions.length > 0 && selectedLesson && (
            <div className="suggestion-list">
              <div className="section-heading"><h3>הצעות לפי מינימום שינוי</h3><span>{helperOptions.length} אפשרויות</span></div>
              {helperOptions.map((option, index) => (
                <div className="suggestion-row suggestion-row-chain" key={option.moves.map((move) => `${move.lessonId}-${move.day}-${move.period}-${move.teacherId}`).join("|")}>
                  <span className="suggestion-rank">{index + 1}</span>
                  <div className="suggestion-info">
                    <strong>{option.moves.length > 1 ? `שרשרת של ${option.moves.length} שינויים` : "העברה ישירה"}</strong>
                    {option.moves.map((move) => {
                      const target = data.lessons.find((item) => item.id === move.lessonId);
                      if (!target) return null;
                      const fromTeacher = getTeacher(target.teacherId);
                      const toTeacher = getTeacher(move.teacherId);
                      return (
                        <span className="move-line" key={move.lessonId}>
                          {target.groupName ?? getStudent(target.studentIds[0])?.displayName}: {DAYS[target.day].short} שעה {target.period + 1} ({fromTeacher?.name}) ← {DAYS[move.day].short} שעה {move.period + 1} {timeForPeriod(move.period).start}–{timeForPeriod(move.period).end} ({toTeacher?.name})
                        </span>
                      );
                    })}
                  </div>
                  {option.moves.some((move) => move.teacherId !== data.lessons.find((item) => item.id === move.lessonId)?.teacherId) && <span className="subject-pill subject-english">מורה חלופית</span>}
                  <button className="button button-secondary" type="button" onClick={() => applySuggestion(option)}>אישור {option.moves.length > 1 ? "שרשרת" : "הצעה"}</button>
                </div>
              ))}
            </div>
          )}
          {helperOptions.length === 0 && (
            <div className="helper-empty">
              <div className="helper-empty-icon"><Sparkles size={22} /></div>
              <strong>הצעות נשארות בשליטת המנהל/ת</strong>
              <span>העוזר מציג העברות ישירות ושרשראות קצרות (עד שני שיעורים) עם תצוגה לפני/אחרי. כל שינוי דורש אישור מפורש.</span>
            </div>
          )}
        </section>
        <aside className="panel helper-rules">
          <h2>מה נבדק?</h2>
          <RuleItem text="המורה זמינה בשעה" />
          <RuleItem text="התלמיד/ה פנוי/ה ואין חפיפה" />
          <RuleItem text="אפשר לצאת מהשיעור בכיתה" />
          <RuleItem text="מינימום שינוי ושרשרת קצרה" />
          <div className="soft-warning"><MapPin size={16} /><span>התנגשות מקום מוצגת כאזהרה ואינה חוסמת שיבוץ.</span></div>
        </aside>
      </div>
    );
  }

  function renderExamsPage() {
    const grouped = ["ט׳", "י׳", "י״א", "י״ב"].map((grade) => ({
      grade,
      items: exams.filter((exam) => exam.grade === grade),
    }));
    return (
      <div className="content-grid two-column-grid">
        <section className="panel">
          <div className="panel-heading">
            <div><h2>לוח מבחנים לפי שכבה</h2><p>מורות שעובדות עם השכבה והסייעת הרלוונטית רואות את המועדים.</p></div>
            <button className="button button-primary" type="button" onClick={() => setToast("טופס הוספת מבחן יתווסף בהמשך")}>
              <Plus size={16} /> מבחן חדש
            </button>
          </div>
          {grouped.map((group) => (
            <div className="grade-exams" key={group.grade}>
              <div className="grade-heading"><span>{group.grade}</span><small>{group.items.length} מועדים</small></div>
              {group.items.map((exam) => <ExamRow exam={exam} key={exam.id} />)}
            </div>
          ))}
        </section>
        <section className="panel">
          <div className="panel-heading panel-heading-small"><div><h2>אירועי בית הספר</h2><p>מידע כללי — אינו משנה שיבוצים אוטומטית</p></div><CalendarDays size={18} /></div>
          {schoolEvents.map((event) => (
            <div className="event-row" key={event.id}>
              <span className={`event-icon event-${event.kind}`}><CalendarDays size={16} /></span>
              <div><strong>{event.title}</strong><small>{DAYS[event.day].label} · {event.description}</small></div>
            </div>
          ))}
        </section>
      </div>
    );
  }

  function renderCoveragePage() {
    const absentAides = data.aides.filter((aide) => aide.status === "absent");
    const affectedLessons = data.lessons.filter((lesson) => lesson.day === absentDay && (lesson.teacherId === absentTeacherId || lesson.originalTeacherId === absentTeacherId) && lesson.status === "scheduled");
    return (
      <div className="content-grid two-column-grid">
        <section className="panel">
          <div className="panel-heading"><div><h2>היעדרויות שדווחו היום</h2><p>היעדרות תלמיד/ה מבטלת השתתפות אחת בלבד בקבוצה.</p></div><span className="badge badge-neutral">{absentAides.length} סייעות לא נוכחות</span></div>
          {data.lessons.filter((lesson) => lesson.absentStudentIds.length > 0 || lesson.status === "canceled").slice(0, 8).map((lesson) => (
            <div className="coverage-row" key={lesson.id}>
              <div><strong>{lesson.groupName ?? getStudent(lesson.studentIds[0])?.displayName}</strong><small>{DAYS[lesson.day].label} · שעה {lesson.period + 1} · {subjectName(lesson.subjectId)}</small></div>
              <span className={`lesson-status status-${lesson.status}`}>{lesson.status === "canceled" ? "בוטל" : "היעדרות משתתף/ת"}</span>
              {lesson.status !== "canceled" && lesson.studentIds.map((studentId) => (
                <button className="text-button" type="button" key={studentId} onClick={() => markStudentAbsent(lesson, studentId)}>סימון היעדרות</button>
              ))}
            </div>
          ))}
          {data.lessons.every((lesson) => lesson.status !== "canceled" && lesson.absentStudentIds.length === 0) && (
            <div className="empty-state"><Check size={24} /><strong>אין היעדרויות פתוחות</strong><span>עדכוני היעדרות נשמרים בהיסטוריית השיבוץ.</span></div>
          )}
        </section>
        <section className="panel">
          <div className="panel-heading"><div><h2>כיסוי חד־פעמי למורה</h2><p>בחירת מורה נעדרת ויום: המערכת מציעה מחליפה לפי התאמת מקצוע וזמינות, ומודיעה למנהל/ת.</p></div><UsersRound size={18} /></div>
          <div className="filter-toolbar">
            <select value={absentTeacherId} onChange={(event) => setAbsentTeacherId(event.target.value)} aria-label="מורה נעדרת">
              {teachers.map((teacher) => <option value={teacher.id} key={teacher.id}>{teacher.name}</option>)}
            </select>
            <select value={absentDay} onChange={(event) => setAbsentDay(Number(event.target.value))} aria-label="יום היעדרות">
              {DAYS.map((day) => <option value={day.index} key={day.index}>{day.label}</option>)}
            </select>
            <button className="button button-primary" type="button" onClick={() => autoCoverAbsence(absentTeacherId, absentDay)}><Sparkles size={16} /> כיסוי אוטומטי</button>
          </div>
          <div className="substitute-note"><ShieldAlert size={18} /><span>הכיסוי זמני ומוצג למנהל/ת. אפשר לשנות מחליפה בכל שורה או לבטל.</span></div>
          {affectedLessons.length === 0 && <div className="empty-state"><Check size={22} /><span>אין שיעורים מתוכננים למורה ביום שנבחר.</span></div>}
          {affectedLessons.map((lesson) => {
            const candidates = substituteCandidates(lesson, absentTeacherId);
            const covered = lesson.originalTeacherId === absentTeacherId;
            return (
              <div className="coverage-row" key={lesson.id}>
                <div>
                  <strong>{lesson.groupName ?? getStudent(lesson.studentIds[0])?.displayName}</strong>
                  <small>שעה {lesson.period + 1} · {subjectName(lesson.subjectId)}{covered ? ` · מוחלפת ע״י ${getTeacher(lesson.teacherId)?.name}` : ""}</small>
                </div>
                {covered
                  ? <button className="text-button" type="button" onClick={() => revertCover(lesson)}>ביטול כיסוי</button>
                  : candidates.length === 0
                    ? <span className="badge badge-warning">אין מחליפה זמינה</span>
                    : (
                      <select value="" onChange={(event) => { if (event.target.value) { assignCover(lesson.id, event.target.value, absentTeacherId); setToast("מחליפה שובצה"); } }} aria-label="בחירת מחליפה">
                        <option value="">מחליפות מדורגות ({candidates.length})</option>
                        {candidates.map((teacher, index) => <option value={teacher.id} key={teacher.id}>{index + 1}. {teacher.name}</option>)}
                      </select>
                    )}
              </div>
            );
          })}
          <div className="section-heading"><h3>הודעות למנהל/ת</h3><span>{data.notices.length}</span></div>
          {data.notices.length === 0 && <small>אין הודעות כרגע.</small>}
          {data.notices.map((notice) => (
            <div className={notice.kind === "warning" ? "soft-warning" : "substitute-note"} key={notice.id}><Bell size={16} /><span>{notice.text}</span></div>
          ))}
        </section>
      </div>
    );
  }

  function renderLogsPage() {
    const recentLessons = data.lessons
      .filter((lesson) => lesson.status !== "scheduled")
      .slice(0, 20);
    const pending = data.lessons.filter((lesson) => lesson.status === "scheduled").slice(0, 14);
    return (
      <div className="content-grid two-column-grid">
        <section className="panel">
          <div className="panel-heading"><div><h2>ממתינים לתיעוד</h2><p>סימון מהיר של שיעור שהתקיים או בוטל</p></div><span className="badge badge-neutral">{pending.length} שיעורים</span></div>
          {pending.map((lesson) => (
            <div className="log-row" key={lesson.id}>
              <div className={`subject-marker ${subjectClass(lesson.subjectId)}`} />
              <div className="log-row-copy">
                <strong>{lesson.groupName ?? getStudent(lesson.studentIds[0])?.displayName}</strong>
                <small>{DAYS[lesson.day].label} · שעה {lesson.period + 1} · {subjectName(lesson.subjectId)} · {getTeacher(lesson.teacherId)?.name}</small>
              </div>
              <button className="button button-secondary" type="button" onClick={() => updateLessonStatus(lesson, "completed")}><Check size={15} /> התקיים</button>
            </div>
          ))}
        </section>
        <section className="panel">
          <div className="panel-heading"><div><h2>היסטוריית שיעורים</h2><p>רישום לפי מפגש ומשתתף/ת</p></div><ClipboardCheck size={18} /></div>
          {recentLessons.length === 0 && <div className="empty-state"><Clock3 size={22} /><span>תיעוד יופיע כאן לאחר שיעור.</span></div>}
          {recentLessons.map((lesson) => (
            <div className="history-row" key={lesson.id}>
              <div><strong>{lesson.groupName ?? getStudent(lesson.studentIds[0])?.displayName}</strong><small>{DAYS[lesson.day].label} · {timeForPeriod(lesson.period).start} · {subjectName(lesson.subjectId)}</small></div>
              <span className={`lesson-status status-${lesson.status}`}>{lesson.status === "completed" ? "התקיים" : "בוטל"}</span>
              {lesson.studentIds.length > 1 && <small>{lesson.absentStudentIds.length} היעדרויות בקבוצה</small>}
            </div>
          ))}
        </section>
      </div>
    );
  }

  function renderAidesPage() {
    return (
      <div className="panel">
        <div className="panel-heading"><div><h2>זמינות וכיתות באחריות</h2><p>הסייעת אינה משאב שמוקצה לכל אורך שיעור התגבור.</p></div><span className="badge badge-success">{currentAideCount} זמינות</span></div>
        <div className="aide-grid">
          {data.aides.map((aide) => (
            <article className="aide-card" key={aide.id}>
              <div className="aide-card-head">
                <span className="teacher-avatar teacher-avatar-large">{aide.initials}</span>
                <div><h3>{aide.name}</h3><span className={`presence-label presence-label-${aide.status}`}><i />{aide.status === "absent" ? "לא נוכחת" : aide.status === "helping" ? "מסייעת כרגע" : "זמינה"}</span></div>
                <button className="icon-button" type="button" aria-label="שינוי סטטוס" onClick={() => updateAideStatus(aide.id, aide.status === "absent" ? "available" : aide.status === "available" ? "helping" : "absent")}><Pencil size={15} /></button>
              </div>
              <div className="aide-card-body">
                <span className="muted-label">כיתות באחריות</span>
                <div className="chip-list">
                  {aide.homeroomIds.map((id) => {
                    const homeroom = getHomeroom(id);
                    return homeroom ? <span className="neutral-chip" key={id}>{homeroom.name}</span> : null;
                  })}
                </div>
                <span className="muted-label">תלמידים משויכים</span>
                <p>{students.filter((student) => aide.homeroomIds.includes(student.homeroomId)).length} תלמידים · מידע לימודי ומערכת שעות</p>
              </div>
              <button className="button button-secondary button-full" type="button" onClick={() => { setSelectedAideId(aide.id); setRole("aide"); navigate("overview"); }}>צפייה בתצוגת סייעת</button>
            </article>
          ))}
        </div>
        {activeAide && (
          <div className="aide-students">
            <div className="section-heading"><h3>תלמידים ושיבוצים · {activeAide.name}</h3><span>{getHomeroomNames(activeAide.homeroomIds)}</span></div>
            {students.filter((student) => activeAide.homeroomIds.includes(student.homeroomId)).map((student) => {
              const studentLessons = data.lessons
                .filter((lesson) => lesson.studentIds.includes(student.id) && lesson.status !== "canceled")
                .sort((a, b) => a.day - b.day || a.period - b.period);
              return (
                <div className="coverage-row" key={student.id}>
                  <div><strong>{student.displayName}</strong><small>{getHomeroom(student.homeroomId)?.name} · {studentLessons.length} שיעורי תגבור</small></div>
                  <div className="chip-list">
                    {studentLessons.map((lesson) => {
                      const missed = classSlots[`${student.homeroomId}:${lesson.day}:${lesson.period}`];
                      return <span className="neutral-chip" key={lesson.id}>{DAYS[lesson.day].short} · {timeForPeriod(lesson.period).start} · {subjectName(lesson.subjectId)} · {lesson.location}{missed ? ` · מחסיר/ה: ${subjectName(missed.subjectId)}` : ""}</span>;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  function renderStudentsPage() {
    return (
      <section className="panel">
        <div className="panel-heading">
          <div><h2>רשימת תלמידים</h2><p>{students.length} תלמידים · שמות מוצגים בשם פרטי ובאות ראשונה של השם השני</p></div>
          <button className="button button-primary" type="button" onClick={() => setToast("הוספת תלמיד/ה תתחבר למקור נתונים בשלב הבא")}><Plus size={16} /> תלמיד/ה חדש/ה</button>
        </div>
        <div className="filter-toolbar">
          <label className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="חיפוש לפי שם או כיתה" /></label>
          <select value={selectedGrade} onChange={(event) => setSelectedGrade(event.target.value)} aria-label="סינון לפי שכבה">
            <option>הכול</option>{["ט׳", "י׳", "י״א", "י״ב"].map((grade) => <option key={grade}>{grade}</option>)}
          </select>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>תלמיד/ה</th><th>כיתה</th><th>מקצועות תגבור</th><th>מורות משויכות</th><th>שיעורים בשבוע</th><th>סייעת</th></tr></thead>
            <tbody>
              {filteredStudents.map((student) => {
                const assigned = student.subjectIds
                  .map((subject) => student.teacherBySubject[subject])
                  .filter((id): id is string => Boolean(id));
                const uniqueTeachers = [...new Set(assigned)];
                const aide = getAideForHomeroom(student.homeroomId);
                const sessionsPerWeek = data.lessons.filter((lesson) => lesson.studentIds.includes(student.id)).length;
                return (
                  <tr key={student.id}>
                    <td><div className="table-person"><span className="student-avatar">{student.firstName[0]}</span><strong>{student.displayName}</strong></div></td>
                    <td><span className="neutral-chip">{getHomeroom(student.homeroomId)?.name}</span></td>
                    <td><div className="chip-list">{student.subjectIds.slice(0, 3).map((subject) => <span className={`subject-pill ${subjectClass(subject)}`} key={subject}>{subjectName(subject)}</span>)}</div></td>
                    <td>{uniqueTeachers.slice(0, 2).map((id) => getTeacher(id)?.name).filter(Boolean).join(" · ")}</td>
                    <td><strong>{sessionsPerWeek}</strong></td>
                    <td>{aide?.name ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  function renderTeachersPage() {
    return (
      <div className="panel">
        <div className="panel-heading"><div><h2>מורות ומקצועות</h2><p>מינימום נוכחות ניתן לשינוי לכל מורה ולכל יום.</p></div><button className="button button-primary" type="button" onClick={() => setToast("הוספת מורה תתחבר לניהול משתמשים בהמשך")}><Plus size={16} /> מורה חדשה</button></div>
        <div className="teacher-list">
          {teachers.map((teacher) => {
            const weeklyLessons = data.lessons.filter((lesson) => lesson.teacherId === teacher.id).length;
            return (
              <div className="teacher-settings-card" key={teacher.id}>
                <div className="teacher-list-row">
                  <span className="teacher-avatar teacher-avatar-large">{teacher.initials}</span>
                  <div className="teacher-list-name"><strong>{teacher.name}</strong><small>{Object.keys(teacher.workWindows).length} ימי עבודה · {weeklyLessons} שיבוצים השבוע</small></div>
                  <div className="chip-list">{teacher.subjectIds.map((subject) => <span className={`subject-pill ${subjectClass(subject)}`} key={subject}>{subjectName(subject)}</span>)}</div>
                  <div className="teacher-hours">
                    <span>מינימום ביום עבודה</span>
                    <strong>{Math.min(...Object.keys(teacher.workWindows).map((day) => minimumForTeacherDay(teacher.id, Number(day))))} דק׳</strong>
                  </div>
                  <button className="button button-secondary" type="button" onClick={() => setTeacherSettingsOpen((open) => open === teacher.id ? null : teacher.id)}>
                    <Settings2 size={15} /> שעות
                  </button>
                  <button className="button button-secondary" type="button" onClick={() => { setSelectedTeacherId(teacher.id); setRole("teacher"); navigate("daily"); }}>תצוגת מורה</button>
                </div>
                {teacherSettingsOpen === teacher.id && (
                  <div className="teacher-work-settings">
                    {Object.entries(teacher.workWindows).map(([dayValue, window]) => {
                      const day = Number(dayValue);
                      const presenceSpan = getPeriodSpan(window.startPeriod, window.endPeriod);
                      const minimum = minimumForTeacherDay(teacher.id, day);
                      return (
                        <label className="teacher-day-setting" key={day}>
                          <span>{DAYS[day].label}</span>
                          <small>{PERIODS[window.startPeriod].start}–{PERIODS[window.endPeriod - 1].end} · נוכחות בפועל {presenceSpan} דק׳</small>
                          <input
                            aria-label={`מינימום נוכחות ${teacher.name} ${DAYS[day].label}`}
                            type="number"
                            min="0"
                            max="360"
                            step="15"
                            value={minimum}
                            onChange={(event) => updateTeacherMinimum(teacher.id, day, Number(event.target.value))}
                          />
                          <em className={presenceSpan >= minimum ? "excusable" : "not-excusable"}>
                            מינימום {minimum} דק׳
                          </em>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderGroupsPage() {
    const groups = data.lessons.filter((lesson) => lesson.groupId);
    return (
      <section className="panel">
        <div className="panel-heading"><div><h2>קבוצות למידה</h2><p>קבוצות מוגדרות על ידי המנהל/ת ומשובצות כמפגש אחד.</p></div><button className="button button-primary" type="button" onClick={() => setToast("יצירת קבוצה תיפתח כחלק מטופס השיבוץ")}><Plus size={16} /> קבוצה חדשה</button></div>
        <div className="group-grid">
          {groups.slice(0, 28).map((lesson) => (
            <article className="group-card" key={lesson.id}>
              <div className="group-card-top"><span className={`subject-pill ${subjectClass(lesson.subjectId)}`}>{subjectName(lesson.subjectId)}</span><span className="neutral-chip">{getHomeroom(getStudent(lesson.studentIds[0] ?? "")?.homeroomId ?? "")?.name}</span></div>
              <h3>{lesson.groupName}</h3>
              <div className="group-members">{lesson.studentIds.map((id) => getStudent(id)?.displayName).filter(Boolean).join(" · ")}</div>
              <div className="group-card-footer"><span>{getTeacher(lesson.teacherId)?.name}</span><span>{DAYS[lesson.day].short} · שעה {lesson.period + 1}</span></div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderTimetablePage() {
    const activeHomeroom = getHomeroom(activeHomeroomId) ?? homerooms[0];
    const excusalStudent = getStudent(excusalStudentId) ?? students[0];
    const excusalHomeroomId = excusalStudent.homeroomId;
    return (
      <>
      <section className="panel">
        <div className="panel-heading"><div><h2>מערכת שעות כיתתית</h2><p>תבנית לפי כיתת אם. חריגים אישיים נערכים בלוח שמתחת.</p></div><select value={activeHomeroomId} onChange={(event) => setActiveHomeroomId(event.target.value)}>{homerooms.map((homeroom) => <option value={homeroom.id} key={homeroom.id}>{homeroom.name}</option>)}</select></div>
        <div className="table-scroll">
          <div className="weekly-matrix timetable-matrix" style={{ gridTemplateColumns: `76px repeat(${DAYS.length},minmax(0,1fr))` }}>
            <div className="matrix-corner">שעה</div>
            {DAYS.map((day) => <div className="day-column-head" key={day.index}><strong>{day.label}</strong></div>)}
            {PERIODS.map((period) => (
              <div className="matrix-row-fragment" key={period.index}>
                <div className="period-head"><strong>{period.label}</strong><span>{period.start}–{period.end}</span></div>
                {DAYS.map((day) => {
                  const slot = classSlots[`${activeHomeroom.id}:${day.index}:${period.index}`];
                  if (!slot) return <div className="weekly-cell" key={day.index}>—</div>;
                  return (
                    <div className="timetable-cell" key={day.index}>
                      <strong>{subjectName(slot.subjectId)}</strong>
                      <span>{slot.room}</span>
                      <em className={slot.excusable ? "excusable" : "not-excusable"}>{slot.excusable ? "ניתן לשחרר" : "לא לשחרור"}</em>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>
      {role !== "aide" && (
        <section className="panel">
          <div className="panel-heading">
            <div><h2>חריגי שחרור אישיים</h2><p>לחיצה על שעה מחליפה בין: לפי הכיתה ← מותר ← אסור. מוצגת הסיבה לכל החלטה.</p></div>
            <select value={excusalStudent.id} onChange={(event) => setExcusalStudentId(event.target.value)} aria-label="בחירת תלמיד/ה">
              {students.map((student) => <option value={student.id} key={student.id}>{student.displayName} · {getHomeroom(student.homeroomId)?.name}</option>)}
            </select>
          </div>
          <div className="table-scroll">
            <div className="weekly-matrix timetable-matrix" style={{ gridTemplateColumns: `76px repeat(${DAYS.length},minmax(0,1fr))` }}>
              <div className="matrix-corner">שעה</div>
              {DAYS.map((day) => <div className="day-column-head" key={day.index}><strong>{day.label}</strong></div>)}
              {PERIODS.map((period) => (
                <div className="matrix-row-fragment" key={period.index}>
                  <div className="period-head"><strong>{period.label}</strong><span>{period.start}–{period.end}</span></div>
                  {DAYS.map((day) => {
                    const status = leaveStatus(excusalStudent.id, excusalHomeroomId, day.index, period.index);
                    const key = `${excusalStudent.id}:${day.index}:${period.index}`;
                    const current = rawData.excusalOverrides[key];
                    return (
                      <button
                        type="button"
                        className="timetable-cell"
                        key={day.index}
                        title={status.reason}
                        onClick={() => setExcusalOverride(excusalStudent.id, day.index, period.index, current === undefined ? true : current ? false : null)}
                      >
                        <strong>{subjectName(classSlots[`${excusalHomeroomId}:${day.index}:${period.index}`]?.subjectId ?? "math")}</strong>
                        <em className={status.allowed ? "excusable" : "not-excusable"}>{status.allowed ? "מותר" : "אסור"}{status.personal ? " · חריג" : ""}</em>
                        <span>{status.reason}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      </>
    );
  }

  function renderLocationsPage() {
    const roomStats = locations.map((location) => {
      const locationLessons = data.lessons.filter((lesson) => lesson.location === location && lesson.status !== "canceled");
      return { location, count: locationLessons.length, warnings: roomConflicts.has(locationLessons[0]?.id ?? "") ? 1 : 0 };
    });
    return (
      <section className="panel">
        <div className="panel-heading"><div><h2>מיקומים וחדרים</h2><p>התנגשות מקום היא אזהרה בלבד ואינה חוסמת שיבוץ.</p></div><button className="button button-primary" type="button" onClick={() => setToast("ניהול חדרים מלא יתווסף עם חיבור למסד נתונים")}><Plus size={16} /> מיקום חדש</button></div>
        <div className="location-grid">
          {roomStats.map((item) => (
            <article className="location-card" key={item.location}>
              <span className="location-icon"><MapPin size={18} /></span>
              <div><strong>{item.location}</strong><small>{item.count} שיבוצים השבוע</small></div>
              <span className={`badge ${item.warnings ? "badge-warning" : "badge-success"}`}>{item.warnings ? "אזהרה" : "תקין"}</span>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderUpdatesPage() {
    return (
      <div className="content-grid updates-layout">
        <section className="panel">
          <div className="panel-heading"><div><h2>לוח עדכוני כיתה</h2><p>כל הצוות יכול לשתף חומר, שיעורי בית ותרגילים מומלצים.</p></div><button className="button button-primary" type="button" onClick={() => setShowUpdateForm((show) => !show)}><Plus size={16} /> עדכון חדש</button></div>
          {showUpdateForm && (
            <form className="update-form" onSubmit={createClassUpdate}>
              <div className="form-grid">
                <label className="field-label">שכבה<select name="grade">{["ט׳", "י׳", "י״א", "י״ב"].map((grade) => <option key={grade}>{grade}</option>)}</select></label>
                <label className="field-label">מקצוע<select name="subject">{SUBJECTS.map((subject) => <option value={subject.id} key={subject.id}>{subject.name}</option>)}</select></label>
                <label className="field-label field-wide">מה נלמד?<input name="title" required placeholder="נושא השיעור" /></label>
                <label className="field-label field-wide">שיעורי בית<textarea name="homework" rows={2} placeholder="עמודים, תרגילים ותאריך הגשה" /></label>
                <label className="field-label field-wide">תרגיל מומלץ — קישור<input name="exercise" type="url" placeholder="https://..." /></label>
              </div>
              <div className="form-actions"><button className="button button-secondary" type="button" onClick={() => setShowUpdateForm(false)}>ביטול</button><button className="button button-primary" type="submit">פרסום עדכון</button></div>
            </form>
          )}
          <div className="updates-list">
            {data.updates.map((update) => (
              <article className="update-card" key={update.id}>
                <div className="update-card-top"><span className="neutral-chip">{update.grade}</span><span className={`subject-pill ${subjectClass(update.subjectId)}`}>{subjectName(update.subjectId)}</span><span className="update-date">{update.date}</span></div>
                <h3>{update.title}</h3>
                {update.homework && <p><strong>שיעורי בית:</strong> {update.homework}</p>}
                {update.exercise && <a className="text-button" href={update.exercise} target="_blank" rel="noreferrer">פתיחת תרגיל מומלץ <ChevronLeft size={14} /></a>}
                <small>נוסף על ידי {update.author}</small>
              </article>
            ))}
          </div>
        </section>
        <aside className="panel update-filter-panel"><h2>חיפוש לפי מקצוע</h2><div className="subject-filter-list">{SUBJECTS.map((subject) => <button type="button" className={`subject-filter ${subjectClass(subject.id)}`} key={subject.id}><i />{subject.name}<span>{data.updates.filter((update) => update.subjectId === subject.id).length}</span></button>)}</div></aside>
      </div>
    );
  }

  function renderStatsPage() {
    const multiplier = statsPeriod === "day" ? 1 : WEEKS_BY_PERIOD[statsPeriod];
    const scoped = statsPeriod === "day" ? rawData.lessons.filter((lesson) => lesson.day === selectedDay && isLessonInWeek(lesson, weekOffset)) : data.lessons;
    const completed = scoped.filter((lesson) => lesson.status === "completed").length;
    const canceled = scoped.filter((lesson) => lesson.status === "canceled").length;
    const total = scoped.length * multiplier;
    const periodLabel = { day: DAYS[selectedDay].label, week: "שבוע נוכחי", month: "חודש (4 שבועות)", year: "שנה (38 שבועות)" }[statsPeriod];
    const subjectsLoad = SUBJECTS.map((subject) => ({
      ...subject,
      count: scoped.filter((lesson) => lesson.subjectId === subject.id).length * multiplier,
    }));
    const maxLoad = Math.max(...subjectsLoad.map((subject) => subject.count), 1);
    const teacherLoads = teachers.map((teacher) => ({ teacher, count: scoped.filter((lesson) => lesson.teacherId === teacher.id).length * multiplier }));
    const maxTeacherLoad = Math.max(...teacherLoads.map((item) => item.count), 1);
    return (
      <div className="stats-layout">
        <section className="panel">
          <div className="panel-heading"><div><h2>מגמות תפעוליות</h2><p>{statsPeriod === "month" || statsPeriod === "year" ? "מתוכנן = הערכה לפי המערכת השבועית הקבועה; התקיימו/בוטלו = תיעוד בפועל השבוע" : "נתוני הדגמה לפי המערכת השבועית"}</p></div>
            <select value={statsPeriod} onChange={(event) => setStatsPeriod(event.target.value as StatsPeriod)} aria-label="תקופה"><option value="day">יום</option><option value="week">שבוע</option><option value="month">חודש</option><option value="year">שנה</option></select></div>
          <div className="stats-kpis">
            <MetricCard label="שיעורים מתוכננים" value={total} note={periodLabel} color="teal" icon={<CalendarDays size={18} />} />
            <MetricCard label="התקיימו" value={completed} note="תועדו במערכת" color="mint" icon={<Check size={18} />} />
            <MetricCard label="בוטלו" value={canceled} note="נשמרו בהיסטוריה" color="amber" icon={<ShieldAlert size={18} />} />
            <MetricCard label="איחורים" value={data.logs.reduce((sum, log) => sum + log.lateStudentIds.length, 0)} note="לפי תיעוד שיעורים" color="blue" icon={<Clock3 size={18} />} />
          </div>
          <div className="chart-panel">
            <div className="section-heading"><h3>שיבוצים לפי מקצוע</h3><span>{periodLabel}</span></div>
            {subjectsLoad.map((subject) => (
              <div className="bar-row" key={subject.id}>
                <span>{subject.name}</span><div className="bar-track"><i className={subjectClass(subject.id)} style={{ width: `${Math.max(4, subject.count / maxLoad * 100)}%` }} /></div><strong>{subject.count}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading"><div><h2>עומס מורות</h2><p>מפגשים משובצים לפי מורה · {periodLabel}</p></div><Activity size={18} /></div>
          {teacherLoads.map(({ teacher, count }) => (
            <div className="workload-row" key={teacher.id}><span>{teacher.name}</span><div className="bar-track"><i style={{ width: `${Math.max(4, count / maxTeacherLoad * 100)}%` }} /></div><strong>{count}</strong></div>
          ))}
        </section>
      </div>
    );
  }

  function renderMainView() {
    switch (view) {
      case "overview": return renderOverview();
      case "daily": return renderDailyPage();
      case "weekly": return renderWeeklyPage();
      case "helper": return renderHelperPage();
      case "exams": return renderExamsPage();
      case "coverage": return renderCoveragePage();
      case "logs": return renderLogsPage();
      case "aides": return renderAidesPage();
      case "students": return renderStudentsPage();
      case "teachers": return renderTeachersPage();
      case "groups": return renderGroupsPage();
      case "timetable": return renderTimetablePage();
      case "locations": return renderLocationsPage();
      case "updates": return renderUpdatesPage();
      case "stats": return renderStatsPage();
      default: return renderOverview();
    }
  }

  const currentUserName = role === "manager"
    ? "מנהל/ת מערכת"
    : role === "teacher"
      ? currentTeacher.name
      : activeAide?.name ?? "סייעת";

  return (
    <div className={`app-shell theme-${theme}`} dir="rtl">
      <header className="topbar">
        <button
          className="mobile-menu-button"
          type="button"
          aria-label={mobileNavOpen || navCollapsed ? "פתיחת תפריט" : "כיווץ או פתיחת תפריט"}
          aria-expanded={mobileNavOpen || !navCollapsed}
          onClick={() => {
            if (window.matchMedia("(max-width: 880px)").matches) {
              setMobileNavOpen((open) => !open);
            } else {
              setNavCollapsed((collapsed) => !collapsed);
            }
          }}
        >
          <Menu size={20} />
        </button>
        <div className="brand-lockup">
          <span className="brand-mark">ית</span>
          <div><strong>מערכת תיאום שעות תגבור</strong><small>בית ספר אורנים · נתוני הדגמה בלבד</small></div>
        </div>
        <div className="topbar-actions">
          <button className="topbar-button reset-button" type="button" onClick={resetDemoData}><RotateCcw size={15} /><span>איפוס נתוני הדגמה</span></button>
          <button className="topbar-button theme-button" type="button" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === "dark" ? "בהיר" : "כהה"}</span>
          </button>
          <div className="role-switcher" role="group" aria-label="בחירת תפקיד">
            {(["manager", "teacher", "aide"] as Role[]).map((item) => (
            <button className={role === item ? "active" : ""} type="button" key={item} onClick={() => { setRole(item); setView("overview"); setTeacherFilter("הכול"); }}>
                {item === "manager" ? "מנהל/ת" : item === "teacher" ? "מורה" : "סייעת"}
              </button>
            ))}
          </div>
          {role === "teacher" && (
            <select className="topbar-select" value={selectedTeacherId} onChange={(event) => setSelectedTeacherId(event.target.value)} aria-label="בחירת מורה">
              {teachers.map((teacher) => <option value={teacher.id} key={teacher.id}>{teacher.name}</option>)}
            </select>
          )}
          {role === "aide" && (
            <select className="topbar-select" value={selectedAideId} onChange={(event) => setSelectedAideId(event.target.value)} aria-label="בחירת סייעת">
              {data.aides.map((aide) => <option value={aide.id} key={aide.id}>{aide.name}</option>)}
            </select>
          )}
        </div>
      </header>

      <div className={`app-body ${navCollapsed ? "sidebar-collapsed" : ""}`}>
        {mobileNavOpen && <button className="nav-backdrop" type="button" aria-label="סגירת תפריט" onClick={() => setMobileNavOpen(false)} />}
        <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
          <div className="sidebar-user">
            <span className="sidebar-user-mark">{currentUserName[0]}</span>
            <div><strong>{currentUserName}</strong><small>{roleTitle} · סביבת הדגמה</small></div>
          </div>
          <nav aria-label="ניווט ראשי">
            {navGroups.map((group, groupIndex) => {
              const items = group.items.filter((item) => allowedViews[role].includes(item.id));
              if (!items.length) return null;
              return (
                <div className="nav-group" key={group.label || groupIndex}>
                  {group.label && <div className="nav-group-label">{group.label}</div>}
                  {items.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      title={item.label}
                      className={`nav-item ${view === item.id ? "nav-active" : ""} ${"accent" in item && item.accent ? "nav-accent" : ""}`}
                      onClick={() => navigate(item.id)}
                    >
                      {item.icon}<span>{item.label}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </nav>
          <div className="sidebar-footer"><span className="demo-dot" /> נתוני דוגמה בלבד</div>
        </aside>

        <main className="main-content">
          <div className="page-heading">
            <div>
              <h1>{currentPage.title}</h1>
              <p>{view === "overview" ? todayLabel : currentPage.subtitle}</p>
            </div>
            <div className="page-heading-actions">
              {view !== "weekly" && <button className="button button-secondary" type="button" onClick={() => navigate("weekly")}><CalendarRange size={16} /> מטריצה שבועית</button>}
            </div>
          </div>
          {storageWarning && <div className="storage-warning"><ShieldAlert size={16} />{storageWarning}</div>}
          {renderMainView()}
        </main>
      </div>

      {modalDraft && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalDraft(null); }}>
          <form className="modal-card" onSubmit={saveLesson}>
            <div className="modal-header">
              <div><span className="modal-kicker">ניהול מערכת</span><h2>{modalDraft.id ? "עריכת שיבוץ" : "יצירת שיבוץ חדש"}</h2></div>
              <IconButton label="סגירה" onClick={() => setModalDraft(null)}><X size={19} /></IconButton>
            </div>
            <div className="form-grid">
              <label className="field-label">יום<select value={modalDraft.day} onChange={(event) => setModalDraft({ ...modalDraft, day: Number(event.target.value) })}>{DAYS.map((day) => <option value={day.index} key={day.index}>{day.label}</option>)}</select></label>
              <label className="field-label">שעה<select value={modalDraft.period} onChange={(event) => setModalDraft({ ...modalDraft, period: Number(event.target.value) })}>{PERIODS.map((period) => <option value={period.index} key={period.index}>{period.label} · {period.start}–{period.end}</option>)}</select></label>
              <label className="field-label">מקצוע<select value={modalDraft.subjectId} onChange={(event) => {
                const subjectId = event.target.value as SubjectId;
                const teacher = teachers.find((item) => item.id === modalDraft.teacherId && item.subjectIds.includes(subjectId))
                  ?? teachers.find((item) => item.subjectIds.includes(subjectId));
                setModalDraft({ ...modalDraft, subjectId, teacherId: teacher?.id ?? "" });
              }}>{SUBJECTS.map((subject) => <option value={subject.id} key={subject.id}>{subject.name}</option>)}</select></label>
              <label className="field-label">מורה<select value={modalDraft.teacherId} onChange={(event) => setModalDraft({ ...modalDraft, teacherId: event.target.value })}>{teachers.filter((teacher) => teacher.subjectIds.includes(modalDraft.subjectId)).map((teacher) => <option value={teacher.id} key={teacher.id}>{teacher.name}</option>)}</select></label>
              <label className="field-label field-wide">מיקום<select value={modalDraft.location} onChange={(event) => setModalDraft({ ...modalDraft, location: event.target.value })}>{locations.map((location) => <option key={location}>{location}</option>)}</select></label>
              <label className="field-label field-wide">תחולת השינוי
                <select value={modalDraft.scope ?? "all"} onChange={(event) => setModalDraft({ ...modalDraft, scope: event.target.value as EditScope })}>
                  <option value="all">כל השבועות (קבוע)</option>
                  <option value="future">מהשבוע {weekDateRange(weekOffset)} ואילך</option>
                  <option value="once">רק השבוע {weekDateRange(weekOffset)}</option>
                </select>
              </label>
              <div className="field-wide student-picker">
                <div className="student-picker-heading"><span>תלמידים/ות וקבוצות</span><small>{modalDraft.studentIds.length} נבחרו</small></div>
                <div className="student-picker-list">
                  {students.map((student) => (
                    <label className="student-check" key={student.id}>
                      <input type="checkbox" checked={modalDraft.studentIds.includes(student.id)} onChange={() => toggleStudentInDraft(student.id)} />
                      <span>{student.displayName}</span><small>{getHomeroom(student.homeroomId)?.name}</small>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {modalError && <div className="form-error"><ShieldAlert size={16} />{modalError}</div>}
            <div className="modal-footer">
              <span className="form-footnote">התנגשות מקום תוצג כאזהרה בלבד.</span>
              <div><button className="button button-secondary" type="button" onClick={() => setModalDraft(null)}>ביטול</button><button className="button button-primary" type="submit"><Check size={16} /> שמירת שיבוץ</button></div>
            </div>
          </form>
        </div>
      )}
      {toast && <div className="toast-message" role="status"><Check size={16} />{toast}</div>}
    </div>
  );
}

function SubjectLegend() {
  return (
    <div className="subject-legend">
      {SUBJECTS.map((subject) => <span key={subject.id}><i className={subjectClass(subject.id)} />{subject.name}</span>)}
      <span className="legend-warning"><i />אזהרת מקום</span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  note,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  note: string;
  color: string;
  icon: ReactNode;
}) {
  return (
    <div className={`metric-card metric-${color}`}>
      <div className="metric-label"><span>{icon}</span>{label}</div>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function RuleItem({ text }: { text: string }) {
  return <div className="rule-item"><span><Check size={13} /></span>{text}</div>;
}

function ExamRow({ exam }: { exam: Exam }) {
  return (
    <div className="exam-row">
      <span className={`subject-dot ${subjectClass(exam.subjectId)}`} />
      <div className="exam-row-info"><strong>{exam.title}</strong><small>{DAYS[exam.day].label} · {exam.grade} · שעה {exam.period + 1}</small></div>
      <span className={`subject-pill ${subjectClass(exam.subjectId)}`}>{subjectName(exam.subjectId)}</span>
      <span className="exam-countdown">בעוד {exam.dateOffset} ימים</span>
    </div>
  );
}

export default App;
