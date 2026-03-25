import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import { useState, useCallback, useMemo, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';

// ─── Types ───────────────────────────────────────────────────
interface ScheduleEvent {
  id: string;
  subject: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  professor: string;
  students: string[];
  color: string;
}

interface LayoutInfo { col: number; totalCols: number; }
type ViewMode = 'week' | 'day';

// ─── Constants ───────────────────────────────────────────────
const HOUR_HEIGHT = 72;
const TIME_COL_WIDTH = 56;
const START_HOUR = 6;
const END_HOUR = 22;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const GRID_HEIGHT = HOURS.length * HOUR_HEIGHT;
const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const STUDENTS = [
  'Alice Martin', 'Bob Wilson', 'Carol Taylor',
  'David Anderson', 'Emma Thomas', 'Frank Miller', 'Grace Lee',
];

// ─── Sample Data (would come from API in production) ─────────
const SAMPLE_EVENTS: ScheduleEvent[] = [
  { id: '1', subject: 'Calculus II', description: 'Chapter 8: Integration techniques', date: getFutureDate(1), startTime: '09:00', endTime: '10:30', professor: 'Dr. Smith', students: ['Alice Martin', 'Bob Wilson', 'Carol Taylor'], color: '#4285F4' },
  { id: '2', subject: 'Physics Lab', description: 'Electromagnetic induction experiment', date: getFutureDate(1), startTime: '11:00', endTime: '12:30', professor: 'Prof. Williams', students: ['Alice Martin', 'David Anderson', 'Emma Thomas'], color: '#34A853' },
  { id: '3', subject: 'English Literature', description: 'Shakespeare: Hamlet Act III discussion', date: getFutureDate(2), startTime: '10:00', endTime: '11:00', professor: 'Dr. Johnson', students: ['Bob Wilson', 'Carol Taylor', 'Frank Miller', 'Grace Lee'], color: '#EA4335' },
  { id: '4', subject: 'Data Structures', description: 'Binary trees and traversal algorithms', date: getFutureDate(2), startTime: '14:00', endTime: '15:30', professor: 'Prof. Davis', students: ['Alice Martin', 'Bob Wilson', 'David Anderson', 'Emma Thomas'], color: '#8B5CF6' },
  { id: '5', subject: 'Chemistry', description: 'Organic chemistry: Alkenes', date: getFutureDate(3), startTime: '09:00', endTime: '10:00', professor: 'Dr. Brown', students: ['Carol Taylor', 'Emma Thomas', 'Frank Miller'], color: '#FBBC04' },
  { id: '6', subject: 'Art History', description: 'Renaissance period overview', date: getFutureDate(3), startTime: '13:00', endTime: '14:30', professor: 'Dr. Johnson', students: ['Alice Martin', 'Grace Lee', 'Frank Miller'], color: '#EC4899' },
  { id: '7', subject: 'Statistics', description: 'Hypothesis testing and p-values', date: getFutureDate(4), startTime: '10:00', endTime: '11:30', professor: 'Dr. Smith', students: ['Bob Wilson', 'David Anderson', 'Grace Lee'], color: '#06B6D4' },
  { id: '8', subject: 'Calculus II', description: 'Chapter 9: Series and sequences', date: getFutureDate(5), startTime: '09:00', endTime: '10:30', professor: 'Dr. Smith', students: ['Alice Martin', 'Bob Wilson', 'Carol Taylor'], color: '#4285F4' },
  { id: '9', subject: 'Physics Lab', description: 'Optics and wave phenomena', date: getFutureDate(5), startTime: '11:00', endTime: '12:30', professor: 'Prof. Williams', students: ['Alice Martin', 'David Anderson', 'Emma Thomas'], color: '#34A853' },
  { id: '10', subject: 'Data Structures', description: 'Graph algorithms: BFS and DFS', date: getFutureDate(0), startTime: '14:00', endTime: '15:30', professor: 'Prof. Davis', students: ['Alice Martin', 'Bob Wilson', 'David Anderson', 'Emma Thomas'], color: '#8B5CF6' },
];

function getFutureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return fmt(d);
}

// ─── Helpers ─────────────────────────────────────────────────
const getWeekDates = (date: Date): Date[] => {
  const d = new Date(date);
  const sun = new Date(d);
  sun.setDate(d.getDate() - d.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(sun);
    dd.setDate(sun.getDate() + i);
    return dd;
  });
};

function fmt(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const isToday = (d: Date) => fmt(d) === fmt(new Date());
const timeToMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

const formatHour = (h: number) => {
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  return `${h > 12 ? h - 12 : h} ${h >= 12 ? 'PM' : 'AM'}`;
};

const formatTimeDisplay = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, '0')}${suffix}`;
};

// ─── Overlap layout ──────────────────────────────────────────
function computeOverlapLayout(events: ScheduleEvent[]): Map<string, LayoutInfo> {
  const sorted = [...events].sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));
  const layout = new Map<string, LayoutInfo>();
  const groups: ScheduleEvent[][] = [];

  for (const ev of sorted) {
    let placed = false;
    for (const group of groups) {
      if (group.some(g => timeToMin(ev.startTime) < timeToMin(g.endTime) && timeToMin(ev.endTime) > timeToMin(g.startTime))) {
        group.push(ev); placed = true; break;
      }
    }
    if (!placed) groups.push([ev]);
  }

  for (const group of groups) {
    const columns: ScheduleEvent[][] = [];
    for (const ev of group) {
      let placedInCol = false;
      for (let c = 0; c < columns.length; c++) {
        const last = columns[c][columns[c].length - 1];
        if (timeToMin(ev.startTime) >= timeToMin(last.endTime)) {
          columns[c].push(ev);
          layout.set(ev.id, { col: c, totalCols: 0 });
          placedInCol = true; break;
        }
      }
      if (!placedInCol) {
        layout.set(ev.id, { col: columns.length, totalCols: 0 });
        columns.push([ev]);
      }
    }
    for (const ev of group) { layout.get(ev.id)!.totalCols = columns.length; }
  }
  return layout;
}

// ─── Student Picker Dropdown ─────────────────────────────────
function StudentPicker({ value, onSelect }: { value: string; onSelect: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={sp.wrapper}>
      <Pressable style={sp.trigger} onPress={() => setOpen(!open)}>
        <Ionicons name="person-circle-outline" size={22} color="#4285F4" />
        <Text style={sp.name} numberOfLines={1}>{value}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#5F6368" />
      </Pressable>
      {open && (
        <View style={sp.list}>
          <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
            {STUDENTS.map(s => (
              <Pressable
                key={s}
                style={[sp.item, s === value && sp.itemActive]}
                onPress={() => { onSelect(s); setOpen(false); }}
              >
                <Ionicons
                  name={s === value ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={s === value ? '#4285F4' : '#9CA3AF'}
                />
                <Text style={[sp.itemText, s === value && sp.itemTextActive]}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ─── Event Detail Modal ──────────────────────────────────────
function EventDetailModal({
  event,
  visible,
  onClose,
}: {
  event: ScheduleEvent | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!event) return null;

  const dateObj = new Date(event.date + 'T00:00:00');
  const dateStr = dateObj.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={st.overlay} onPress={onClose}>
        <Pressable style={dm.box} onPress={e => e.stopPropagation()}>
          {/* Color banner */}
          <View style={[dm.banner, { backgroundColor: event.color }]}>
            <Pressable style={dm.closeBtn} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
            <Text style={dm.subject}>{event.subject}</Text>
            <Text style={dm.timeRange}>
              {formatTimeDisplay(event.startTime)} – {formatTimeDisplay(event.endTime)}
            </Text>
          </View>

          <ScrollView style={dm.body} showsVerticalScrollIndicator={false}>
            {/* Date */}
            <View style={dm.row}>
              <Ionicons name="calendar-outline" size={18} color="#5F6368" />
              <Text style={dm.rowText}>{dateStr}</Text>
            </View>

            {/* Professor */}
            {event.professor ? (
              <View style={dm.row}>
                <Ionicons name="person-outline" size={18} color="#5F6368" />
                <View>
                  <Text style={dm.rowLabel}>Professor</Text>
                  <Text style={dm.rowText}>{event.professor}</Text>
                </View>
              </View>
            ) : null}

            {/* Classmates */}
            {event.students.length > 0 && (
              <View style={dm.row}>
                <Ionicons name="people-outline" size={18} color="#5F6368" />
                <View style={{ flex: 1 }}>
                  <Text style={dm.rowLabel}>Classmates</Text>
                  <View style={dm.chipRow}>
                    {event.students.map(s => (
                      <View key={s} style={dm.chip}>
                        <Text style={dm.chipText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Description */}
            {event.description ? (
              <View style={dm.row}>
                <Ionicons name="document-text-outline" size={18} color="#5F6368" />
                <View>
                  <Text style={dm.rowLabel}>Description</Text>
                  <Text style={dm.rowText}>{event.description}</Text>
                </View>
              </View>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function StudentScheduleScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentStudent, setCurrentStudent] = useState(STUDENTS[0]);
  const [detailEvent, setDetailEvent] = useState<ScheduleEvent | null>(null);

  // Filter events for current student
  const studentEvents = useMemo(
    () => SAMPLE_EVENTS.filter(e => e.students.includes(currentStudent)),
    [currentStudent],
  );

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const availableWidth = containerWidth > 0 ? containerWidth : 600;
  const dayColW = viewMode === 'week'
    ? Math.max((availableWidth - TIME_COL_WIDTH) / 7, 40)
    : availableWidth - TIME_COL_WIDTH;

  const visibleDates = useMemo(
    () => (viewMode === 'week' ? weekDates : [currentDate]),
    [viewMode, weekDates, currentDate],
  );

  const goToday = () => setCurrentDate(new Date());
  const goPrev = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - (viewMode === 'week' ? 7 : 1));
    setCurrentDate(d);
  };
  const goNext = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (viewMode === 'week' ? 7 : 1));
    setCurrentDate(d);
  };

  const headerTitle = useMemo(() => {
    if (viewMode === 'day')
      return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
    const first = weekDates[0], last = weekDates[6];
    if (first.getMonth() === last.getMonth())
      return `${MONTH_NAMES[first.getMonth()]} ${first.getFullYear()}`;
    return `${MONTH_NAMES[first.getMonth()].slice(0, 3)} – ${MONTH_NAMES[last.getMonth()].slice(0, 3)} ${last.getFullYear()}`;
  }, [viewMode, weekDates, currentDate]);

  const eventsForDate = useCallback(
    (dateStr: string) =>
      studentEvents
        .filter(e => e.date === dateStr)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [studentEvents],
  );

  // Count events this week for the badge
  const weekEventCount = useMemo(() => {
    const weekKeys = new Set(weekDates.map(fmt));
    return studentEvents.filter(e => weekKeys.has(e.date)).length;
  }, [studentEvents, weekDates]);

  const handleLayout = useCallback(
    (e: any) => {
      const w = e.nativeEvent.layout.width;
      if (w > 0 && w !== containerWidth) setContainerWidth(w);
    },
    [containerWidth],
  );

  const initialScrollDone = useRef(false);
  const handleScrollLayout = useCallback(() => {
    if (!initialScrollDone.current) {
      initialScrollDone.current = true;
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: (9 - START_HOUR) * HOUR_HEIGHT, animated: false });
      }, 200);
    }
  }, []);

  return (
    <View style={st.container} onLayout={handleLayout}>
      {/* Student Picker */}
      <StudentPicker value={currentStudent} onSelect={setCurrentStudent} />

      {/* Week summary strip */}
      <View style={st.summaryStrip}>
        <Ionicons name="school-outline" size={16} color="#4285F4" />
        <Text style={st.summaryText}>
          {weekEventCount} class{weekEventCount !== 1 ? 'es' : ''} this week
        </Text>
      </View>

      {/* Top Bar */}
      <View style={st.topBar}>
        <View style={st.topLeft}>
          <Pressable style={st.todayBtn} onPress={goToday}>
            <Text style={st.todayBtnText}>Today</Text>
          </Pressable>
          <View style={st.navArrows}>
            <Pressable onPress={goPrev} hitSlop={8}>
              <Ionicons name="chevron-back" size={22} color="#5F6368" />
            </Pressable>
            <Pressable onPress={goNext} hitSlop={8}>
              <Ionicons name="chevron-forward" size={22} color="#5F6368" />
            </Pressable>
          </View>
          <Text style={st.headerTitle} numberOfLines={1}>{headerTitle}</Text>
        </View>
        <View style={st.topRight}>
          <View style={st.viewToggle}>
            <Pressable
              style={[st.toggleBtn, viewMode === 'week' && st.toggleBtnOn]}
              onPress={() => setViewMode('week')}
            >
              <Text style={[st.toggleText, viewMode === 'week' && st.toggleTextOn]}>Week</Text>
            </Pressable>
            <Pressable
              style={[st.toggleBtn, viewMode === 'day' && st.toggleBtnOn]}
              onPress={() => setViewMode('day')}
            >
              <Text style={[st.toggleText, viewMode === 'day' && st.toggleTextOn]}>Day</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Day Header */}
      <View style={st.dayHeaderRow}>
        <View style={{ width: TIME_COL_WIDTH }} />
        {visibleDates.map(d => {
          const today = isToday(d);
          const dateStr = fmt(d);
          const hasEvents = studentEvents.some(e => e.date === dateStr);
          return (
            <Pressable
              key={dateStr}
              style={[st.dayHeaderCell, { width: dayColW }]}
              onPress={() => { setCurrentDate(d); setViewMode('day'); }}
            >
              <Text style={[st.dayName, today && st.dayNameToday]}>
                {viewMode === 'day' ? DAY_NAMES_FULL[d.getDay()].toUpperCase() : DAY_NAMES[d.getDay()]}
              </Text>
              <View style={[st.dayNum, today && st.dayNumToday]}>
                <Text style={[st.dayNumText, today && st.dayNumTextToday]}>{d.getDate()}</Text>
              </View>
              {hasEvents && !today && <View style={st.dayDot} />}
            </Pressable>
          );
        })}
      </View>

      {/* Scrollable Time Grid */}
      {containerWidth > 0 && (
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          onLayout={handleScrollLayout}
          showsVerticalScrollIndicator
          scrollEventThrottle={16}
        >
          <View style={{ height: GRID_HEIGHT, flexDirection: 'row' }}>
            {/* Time labels */}
            <View style={{ width: TIME_COL_WIDTH }}>
              {HOURS.map(h => (
                <View key={h} style={{ height: HOUR_HEIGHT, justifyContent: 'flex-start', alignItems: 'flex-end', paddingRight: 8 }}>
                  <Text style={st.timeLabel}>{formatHour(h)}</Text>
                </View>
              ))}
            </View>

            {/* Day columns */}
            {visibleDates.map(d => {
              const dateStr = fmt(d);
              const today = isToday(d);
              const dayEvents = eventsForDate(dateStr);
              const layoutMap = computeOverlapLayout(dayEvents);

              return (
                <View
                  key={dateStr}
                  style={{
                    width: dayColW,
                    height: GRID_HEIGHT,
                    borderLeftWidth: 0.5,
                    borderLeftColor: '#E5E7EB',
                    backgroundColor: today ? '#EFF6FF' : 'transparent',
                    position: 'relative',
                  }}
                >
                  {/* Hour grid lines */}
                  {HOURS.map(h => (
                    <View
                      key={h}
                      style={{ height: HOUR_HEIGHT, borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' }}
                    />
                  ))}

                  {/* Event blocks (read-only, tap to view detail) */}
                  {dayEvents.map(ev => {
                    const topMin = timeToMin(ev.startTime) - START_HOUR * 60;
                    const dur = timeToMin(ev.endTime) - timeToMin(ev.startTime);
                    const top = (topMin / 60) * HOUR_HEIGHT;
                    const h = (dur / 60) * HOUR_HEIGHT;
                    const info = layoutMap.get(ev.id) || { col: 0, totalCols: 1 };
                    const colW = (dayColW - 6) / info.totalCols;
                    const left = 3 + info.col * colW;

                    return (
                      <Pressable
                        key={ev.id}
                        style={{
                          position: 'absolute',
                          top,
                          left,
                          width: colW - 3,
                          height: Math.max(h, 28),
                          backgroundColor: ev.color,
                          borderRadius: 6,
                          borderLeftWidth: 4,
                          borderLeftColor: 'rgba(0,0,0,0.2)',
                          paddingHorizontal: 8,
                          paddingVertical: 5,
                          overflow: 'hidden',
                        }}
                        onPress={() => setDetailEvent(ev)}
                      >
                        <Text style={st.evTitle} numberOfLines={1}>{ev.subject}</Text>
                        {h > 34 && (
                          <Text style={st.evTime} numberOfLines={1}>
                            {formatTimeDisplay(ev.startTime)} – {formatTimeDisplay(ev.endTime)}
                          </Text>
                        )}
                        {h > 56 && ev.professor ? (
                          <Text style={st.evSub} numberOfLines={1}>{ev.professor}</Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Event Detail Modal */}
      <EventDetailModal
        event={detailEvent}
        visible={detailEvent !== null}
        onClose={() => setDetailEvent(null)}
      />
    </View>
  );
}

// ─── Student Picker Styles ───────────────────────────────────
const sp = StyleSheet.create({
  wrapper: { zIndex: 100, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  trigger: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  name: { flex: 1, fontSize: 15, fontWeight: '600', color: '#3C4043' },
  list: {
    position: 'absolute', top: '100%', left: 12, right: 12,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 10, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 6,
  },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6',
  },
  itemActive: { backgroundColor: '#EFF6FF' },
  itemText: { fontSize: 14, color: '#3C4043' },
  itemTextActive: { color: '#4285F4', fontWeight: '600' },
});

// ─── Detail Modal Styles ─────────────────────────────────────
const dm = StyleSheet.create({
  box: {
    backgroundColor: '#fff', borderRadius: 16, width: '90%', maxWidth: 480,
    maxHeight: '70%', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 10,
  },
  banner: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 18,
  },
  closeBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  subject: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 4 },
  timeRange: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  body: { padding: 20 },
  row: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6',
  },
  rowLabel: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  rowText: { fontSize: 14, color: '#3C4043', lineHeight: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: {
    backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  chipText: { fontSize: 12, color: '#5F6368', fontWeight: '500' },
});

// ─── Main Styles ─────────────────────────────────────────────
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  summaryStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: '#EFF6FF',
  },
  summaryText: { fontSize: 13, color: '#4285F4', fontWeight: '500' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 },
  todayBtn: { borderWidth: 1, borderColor: '#DADCE0', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 5 },
  todayBtnText: { fontSize: 13, fontWeight: '600', color: '#3C4043' },
  navArrows: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#3C4043', marginLeft: 4, flexShrink: 1 },

  viewToggle: { flexDirection: 'row', borderWidth: 1, borderColor: '#DADCE0', borderRadius: 8, overflow: 'hidden' },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#fff' },
  toggleBtnOn: { backgroundColor: '#4285F4' },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#5F6368' },
  toggleTextOn: { color: '#fff' },

  dayHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 6, paddingTop: 8 },
  dayHeaderCell: { alignItems: 'center' },
  dayName: { fontSize: 11, fontWeight: '600', color: '#70757A', letterSpacing: 0.5 },
  dayNameToday: { color: '#4285F4' },
  dayNum: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  dayNumToday: { backgroundColor: '#4285F4' },
  dayNumText: { fontSize: 18, fontWeight: '500', color: '#3C4043' },
  dayNumTextToday: { color: '#fff', fontWeight: '600' },
  dayDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#4285F4', marginTop: 3 },

  timeLabel: { fontSize: 10, color: '#70757A', marginTop: -7 },

  evTitle: { fontSize: 12, fontWeight: '700', color: '#fff' },
  evTime: { fontSize: 10, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  evSub: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
});