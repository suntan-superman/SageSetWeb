import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function loadMemberDashboard(uid) {
  if (!uid) {
    return emptyDashboard();
  }

  const [plan, foodLogs, weighIns] = await Promise.all([
    loadActivePlan(uid),
    loadFoodLogs(uid),
    loadWeighIns(uid),
  ]);

  const days = plan ? await loadPlanDays(uid, plan.id) : [];
  const daysWithWorkouts = plan ? await hydrateDaysWithWorkouts(uid, plan.id, days) : [];
  const summary = buildSummary({ plan, days: daysWithWorkouts, foodLogs, weighIns });
  const calendarEvents = buildCalendarEvents(daysWithWorkouts);

  return {
    plan,
    days: daysWithWorkouts,
    foodLogs,
    weighIns,
    summary,
    calendarEvents,
  };
}

function emptyDashboard() {
  return {
    plan: null,
    days: [],
    foodLogs: [],
    weighIns: [],
    calendarEvents: [],
    summary: {
      currentDayNumber: 1,
      totalPlanDays: 0,
      daysRemaining: 0,
      currentStreak: 0,
      workoutsCompleted: 0,
      plannedWorkoutsElapsed: 0,
      compliancePct: 0,
      mealsLogged: 0,
      currentWeight: null,
      weeklyCompletedWorkoutDays: 0,
      weeklyWorkoutDays: 0,
    },
  };
}

async function loadActivePlan(uid) {
  const plansRef = collection(db, 'users', uid, 'plans');
  const activeSnapshot = await getDocs(query(plansRef, where('active', '==', true), limit(1)));
  if (!activeSnapshot.empty) {
    const docSnap = activeSnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  }

  const fallbackSnapshot = await getDocs(query(plansRef, orderBy('createdAt', 'desc'), limit(1)));
  if (fallbackSnapshot.empty) {
    return null;
  }

  const docSnap = fallbackSnapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

async function loadPlanDays(uid, planId) {
  const daysRef = collection(db, 'users', uid, 'plans', planId, 'days');
  const snapshot = await getDocs(query(daysRef, orderBy('order', 'asc')));
  return snapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0) || String(a.date || '').localeCompare(String(b.date || '')));
}

async function hydrateDaysWithWorkouts(uid, planId, days) {
  return Promise.all(
    days.map(async (day) => {
      if (day.isRestDay) {
        return { ...day, workouts: [] };
      }

      const workoutsRef = collection(db, 'users', uid, 'plans', planId, 'days', day.id, 'workouts');
      const workoutsSnapshot = await getDocs(workoutsRef);
      const workouts = await Promise.all(
        workoutsSnapshot.docs.map(async (workoutDoc) => {
          const exercisesRef = collection(workoutDoc.ref, 'exercises');
          const exercisesSnapshot = await getDocs(exercisesRef);
          const exercises = exercisesSnapshot.docs
            .map((exerciseDoc) => ({ id: exerciseDoc.id, ...exerciseDoc.data() }))
            .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0) || String(a.name || '').localeCompare(String(b.name || '')));

          return {
            id: workoutDoc.id,
            ...workoutDoc.data(),
            exercises,
          };
        })
      );

      return {
        ...day,
        workouts: workouts.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0) || String(a.name || '').localeCompare(String(b.name || ''))),
      };
    })
  );
}

async function loadFoodLogs(uid) {
  const snapshot = await getDocs(query(collection(db, 'users', uid, 'foodLogs'), orderBy('createdAt', 'desc'), limit(250)));
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

async function loadWeighIns(uid) {
  const snapshot = await getDocs(query(collection(db, 'users', uid, 'weighIns'), orderBy('date', 'desc'), limit(100)));
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

function buildSummary({ plan, days, foodLogs, weighIns }) {
  const today = toLocalDateString(new Date());
  const normalizedDays = days
    .map((day) => ({ ...day, localDate: toLocalDateString(day.date || day.localDate || day.createdAt) }))
    .filter((day) => day.localDate)
    .sort((a, b) => a.localDate.localeCompare(b.localDate));
  const elapsedDays = normalizedDays.filter((day) => day.localDate <= today);
  const workoutDays = elapsedDays.filter((day) => !day.isRestDay);
  const completedWorkoutDays = workoutDays.filter(isDayComplete);
  const currentDay = normalizedDays.find((day) => day.localDate === today) || elapsedDays[elapsedDays.length - 1] || normalizedDays[0] || null;
  const currentDayNumber = currentDay?.order ? Number(currentDay.order) : Math.max(1, elapsedDays.length || 1);
  const totalPlanDays = normalizedDays.length || Number(plan?.durationDays || 0) || 0;
  const daysRemaining = totalPlanDays ? Math.max(0, totalPlanDays - currentDayNumber) : 0;
  const weekStart = getWeekStart(today);
  const weeklyWorkoutDays = workoutDays.filter((day) => day.localDate >= weekStart && day.localDate <= today);
  const weeklyCompletedWorkoutDays = weeklyWorkoutDays.filter(isDayComplete);
  const latestWeighIn = [...weighIns].sort((a, b) => String(b.date || b.id || '').localeCompare(String(a.date || a.id || '')))[0];

  return {
    currentDayNumber,
    totalPlanDays,
    daysRemaining,
    currentStreak: calculateDayStreak(normalizedDays, today),
    workoutsCompleted: completedWorkoutDays.length,
    plannedWorkoutsElapsed: workoutDays.length,
    compliancePct: workoutDays.length ? Math.round((completedWorkoutDays.length / workoutDays.length) * 100) : 0,
    mealsLogged: foodLogs.length,
    nutritionDays: new Set(foodLogs.map((log) => log.localDate || toLocalDateString(log.createdAt?.toDate?.() || log.createdAtMs || log.createdAt))).size,
    currentWeight: latestWeighIn?.weight ?? null,
    weeklyCompletedWorkoutDays: weeklyCompletedWorkoutDays.length,
    weeklyWorkoutDays: weeklyWorkoutDays.length,
  };
}

function buildCalendarEvents(days) {
  return days
    .map((day) => {
      const start = parseLocalDate(day.date || day.localDate);
      if (!start) return null;
      start.setHours(8, 0, 0, 0);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const workoutNames = (day.workouts || []).map((workout) => workout.name).filter(Boolean);
      const isComplete = isDayComplete(day);
      const subject = day.isRestDay ? 'Rest Day' : workoutNames.slice(0, 2).join(' + ') || day.title || 'Workout';

      return {
        Id: day.id,
        Subject: subject,
        StartTime: start,
        EndTime: end,
        IsAllDay: true,
        CategoryColor: day.isRestDay ? '#64748b' : isComplete ? '#16a34a' : day.date < toLocalDateString(new Date()) ? '#b45309' : '#3d4a3e',
        StatusLabel: day.isRestDay ? 'Rest' : isComplete ? 'Completed' : 'Planned',
        DayId: day.id,
        DayOrder: day.order,
      };
    })
    .filter(Boolean);
}

function isDayComplete(day) {
  if (day.isRestDay || day.completed || Number(day.completionPct || 0) >= 1) {
    return true;
  }

  const workouts = Array.isArray(day.workouts) ? day.workouts : [];
  if (workouts.length === 0) {
    return false;
  }

  return workouts.every((workout) => workout.completed || Number(workout.completedExercises || 0) >= Number(workout.totalExercises || 1));
}

function calculateDayStreak(days, today) {
  const elapsed = days.filter((day) => day.localDate <= today);
  let streak = 0;

  for (let index = elapsed.length - 1; index >= 0; index -= 1) {
    const day = elapsed[index];
    if (!day.isRestDay && !isDayComplete(day)) {
      break;
    }
    streak += 1;
  }

  return streak;
}

function getWeekStart(dateString) {
  const date = parseLocalDate(dateString) || new Date();
  date.setDate(date.getDate() - date.getDay());
  return toLocalDateString(date);
}

function parseLocalDate(value) {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const [year, month, day] = value.split('-').map(Number);
    if (year && month && day) {
      return new Date(year, month - 1, day);
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (value instanceof Date) return value;
  return null;
}

function toLocalDateString(value) {
  const date = parseLocalDate(value);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatWorkoutShareText(day) {
  if (!day) return 'SageSet workout';
  const title = day.isRestDay ? `Day ${day.order}: Rest Day` : `Day ${day.order}: ${(day.workouts || []).map((workout) => workout.name).join(', ') || 'Workout'}`;
  const lines = [title, day.date].filter(Boolean);

  (day.workouts || []).forEach((workout) => {
    lines.push('', workout.name || 'Workout');
    (workout.exercises || []).forEach((exercise) => {
      const target = [exercise.sets ? `${exercise.sets} sets` : null, exercise.reps ? `${exercise.reps} reps` : null].filter(Boolean).join(' x ');
      lines.push(`- ${exercise.name || 'Exercise'}${target ? ` (${target})` : ''}`);
    });
  });

  return lines.join('\n');
}
