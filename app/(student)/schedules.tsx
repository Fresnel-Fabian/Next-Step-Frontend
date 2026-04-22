import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { DataService } from '@/services/dataService';
import Toast from 'react-native-toast-message';

interface ClassEvent {
  id: number;
  subject: string;
  professor: string;
  room: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM
  endTime: string;
  color: string;
  type: 'lecture' | 'lab' | 'seminar' | 'tutorial';
}

type ViewMode = 'week' | 'day';

const HOUR_HEIGHT = 72;
const TIME_COL_WIDTH = 56;
const START_HOUR = 7;
const END_HOUR = 20;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const GRID_HEIGHT = HOURS.length * HOUR_HEIGHT;
const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const TYPE_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  lecture: { label: 'Lecture', bg: '#DBEAFE', color: '#2563EB' },
  lab: { label: 'Lab', bg: '#DCFCE7', color: '#16A34A' },
  seminar: { label: 'Seminar', bg: '#FEF3C7', color: '#D97706' },
  tutorial: { label: 'Tutorial', bg: '#F3E8FF', color: '#9333EA' },
};

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

const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

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

function computeOverlapLayout(events: ClassEvent[]): Map<number, { col: number; totalCols: number }> {
  const sorted = [...events].sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));
  const layout = new Map<number, { col: number; totalCols: number }>();
  const groups: ClassEvent[][] = [];

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
    const columns: ClassEvent[][] = [];
    for (const ev of group) {
      let col = false;
      for (let c = 0; c < columns.length; c++) {
        const last = columns[c][columns[c].length - 1];
        if (timeToMin(ev.startTime) >= timeToMin(last.endTime)) {
          columns[c].push(ev); layout.set(ev.id, { col: c, totalCols: 0 }); col = true; break;
        }
      }
      if (!col) { layout.set(ev.id, { col: columns.length, totalCols: 0 }); columns.push([ev]); }
    }
    for (const ev of group) { layout.get(ev.id)!.totalCols = columns.length; }
  }
  return layout;
}

// ─── Main Component ──────────────────────────────────────────
export default function StudentScheduleScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedEvent, setSelectedEvent] = useState<ClassEvent | null>(null);
  const [events, setEvents] = useState<ClassEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      const data = await DataService.getScheduleEvents();
      setEvents(data.map(e => ({
        id: e.id,
        subject: e.subject,
        professor: e.professor,
        room: e.room || '',
        date: e.date,
        startTime: e.startTime,
        endTime: e.endTime,
        color: e.color,
        type: (e.eventType as ClassEvent['type']) || 'lecture',
      })));
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load schedule' });
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const w = containerWidth > 0 ? containerWidth : 600;
  const dayColW = viewMode === 'week' ? Math.max((w - TIME_COL_WIDTH) / 7, 40) : w - TIME_COL_WIDTH;
  const visibleDates = useMemo(() => (viewMode === 'week' ? weekDates : [currentDate]), [viewMode, weekDates, currentDate]);

  const goToday = () => setCurrentDate(new Date());
  const goPrev = () => { const d = new Date(currentDate); d.setDate(d.getDate() - (viewMode === 'week' ? 7 : 1)); setCurrentDate(d); };
  const goNext = () => { const d = new Date(currentDate); d.setDate(d.getDate() + (viewMode === 'week' ? 7 : 1)); setCurrentDate(d); };

  const headerTitle = useMemo(() => {
    if (viewMode === 'day') return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
    const f = weekDates[0], l = weekDates[6];
    if (f.getMonth() === l.getMonth()) return `${MONTH_NAMES[f.getMonth()]} ${f.getFullYear()}`;
    return `${MONTH_NAMES[f.getMonth()].slice(0, 3)} – ${MONTH_NAMES[l.getMonth()].slice(0, 3)} ${l.getFullYear()}`;
  }, [viewMode, weekDates, currentDate]);

  const eventsForDate = useCallback(
    (ds: string) => events.filter(e => e.date === ds).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [events],
  );

  const scrollDone = useRef(false);
  const onGridLayout = useCallback(() => {
    if (!scrollDone.current) {
      scrollDone.current = true;
      setTimeout(() => scrollRef.current?.scrollTo({ y: (9 - START_HOUR) * HOUR_HEIGHT, animated: false }), 200);
    }
  }, []);

  if (containerWidth === 0) {
    return <View style={st.container} onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}><Text style={{ padding: 24, color: '#9CA3AF' }}>Loading schedule...</Text></View>;
  }

  return (
    <View style={st.container} onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}>
      {/* Top Bar */}
      <View style={st.topBar}>
        <View style={st.topLeft}>
          <Pressable style={st.todayBtn} onPress={goToday}><Text style={st.todayBtnT}>Today</Text></Pressable>
          <View style={st.arrows}>
            <Pressable onPress={goPrev} hitSlop={8}><Ionicons name="chevron-back" size={22} color="#5F6368" /></Pressable>
            <Pressable onPress={goNext} hitSlop={8}><Ionicons name="chevron-forward" size={22} color="#5F6368" /></Pressable>
          </View>
          <Text style={st.title} numberOfLines={1}>{headerTitle}</Text>
        </View>
        <View style={st.topRight}>
          <View style={st.toggle}>
            <Pressable style={[st.togBtn, viewMode === 'week' && st.togOn]} onPress={() => setViewMode('week')}>
              <Text style={[st.togT, viewMode === 'week' && st.togTOn]}>Week</Text>
            </Pressable>
            <Pressable style={[st.togBtn, viewMode === 'day' && st.togOn]} onPress={() => setViewMode('day')}>
              <Text style={[st.togT, viewMode === 'day' && st.togTOn]}>Day</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Day Header */}
      <View style={st.dayHdr}>
        <View style={{ width: TIME_COL_WIDTH }} />
        {visibleDates.map(d => {
          const t = isToday(d);
          const count = eventsForDate(fmt(d)).length;
          return (
            <Pressable key={fmt(d)} style={[st.dayCell, { width: dayColW }]} onPress={() => { setCurrentDate(d); setViewMode('day'); }}>
              <Text style={[st.dayNm, t && st.dayNmT]}>
                {viewMode === 'day' ? DAY_NAMES_FULL[d.getDay()].toUpperCase() : DAY_NAMES[d.getDay()]}
              </Text>
              <View style={[st.dayNo, t && st.dayNoT]}>
                <Text style={[st.dayNoTx, t && st.dayNoTxT]}>{d.getDate()}</Text>
              </View>
              {count > 0 && <View style={st.dotRow}>{Array.from({ length: Math.min(count, 3) }).map((_, i) => <View key={i} style={st.dot} />)}</View>}
            </Pressable>
          );
        })}
      </View>

      {/* Scrollable Grid */}
      <ScrollView ref={scrollRef} style={{ flex: 1 }} onLayout={onGridLayout} showsVerticalScrollIndicator>
        <View style={{ height: GRID_HEIGHT, flexDirection: 'row' }}>
          <View style={{ width: TIME_COL_WIDTH, height: GRID_HEIGHT }}>
            {HOURS.map(h => (
              <View key={h} style={{ height: HOUR_HEIGHT, justifyContent: 'flex-start', alignItems: 'flex-end', paddingRight: 8 }}>
                <Text style={{ fontSize: 10, color: '#70757A', marginTop: -7 }}>{formatHour(h)}</Text>
              </View>
            ))}
          </View>

          {visibleDates.map(d => {
            const ds = fmt(d);
            const today = isToday(d);
            const de = eventsForDate(ds);
            const lm = computeOverlapLayout(de);

            return (
              <View key={ds} style={{ width: dayColW, height: GRID_HEIGHT, borderLeftWidth: 0.5, borderLeftColor: '#E5E7EB', backgroundColor: today ? '#EFF6FF' : 'transparent', position: 'relative' as const }}>
                {HOURS.map(h => (
                  <View key={h} style={{ height: HOUR_HEIGHT, borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' }} />
                ))}
                {de.map(ev => {
                  const topMin = timeToMin(ev.startTime) - START_HOUR * 60;
                  const dur = timeToMin(ev.endTime) - timeToMin(ev.startTime);
                  const top = (topMin / 60) * HOUR_HEIGHT;
                  const h = (dur / 60) * HOUR_HEIGHT;
                  const info = lm.get(ev.id) || { col: 0, totalCols: 1 };
                  const cw = (dayColW - 6) / info.totalCols;
                  const left = 3 + info.col * cw;

                  return (
                    <Pressable
                      key={ev.id}
                      onPress={() => setSelectedEvent(ev)}
                      style={{
                        position: 'absolute' as const, top, left, width: cw - 3,
                        height: Math.max(h, 30), backgroundColor: ev.color,
                        borderRadius: 8, borderLeftWidth: 4, borderLeftColor: 'rgba(0,0,0,0.2)',
                        paddingHorizontal: 8, paddingVertical: 6, overflow: 'hidden' as const,
                      }}
                    >
                      <Text style={st.evT} numberOfLines={1}>{ev.subject}</Text>
                      {h > 36 && <Text style={st.evTm} numberOfLines={1}>{formatTimeDisplay(ev.startTime)} – {formatTimeDisplay(ev.endTime)}</Text>}
                      {h > 58 && <Text style={st.evS} numberOfLines={1}>{ev.room}</Text>}
                      {h > 78 && <Text style={st.evS} numberOfLines={1}>{ev.professor}</Text>}
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Event Detail Modal */}
      <Modal visible={selectedEvent !== null} transparent animationType="fade" onRequestClose={() => setSelectedEvent(null)}>
        <Pressable style={st.ov} onPress={() => setSelectedEvent(null)}>
          <Pressable style={st.detailBox} onPress={e => e.stopPropagation()}>
            {selectedEvent && (() => {
              const tp = TYPE_LABELS[selectedEvent.type] || TYPE_LABELS.lecture;
              return (
                <>
                  {/* Color bar */}
                  <View style={[st.detailBar, { backgroundColor: selectedEvent.color }]} />

                  <View style={st.detailBody}>
                    {/* Type badge */}
                    <View style={[st.typeBadge, { backgroundColor: tp.bg }]}>
                      <Text style={[st.typeBadgeT, { color: tp.color }]}>{tp.label}</Text>
                    </View>

                    <Text style={st.detailTitle}>{selectedEvent.subject}</Text>

                    <View style={st.detailRow}>
                      <Ionicons name="time-outline" size={18} color="#6B7280" />
                      <Text style={st.detailText}>
                        {formatTimeDisplay(selectedEvent.startTime)} – {formatTimeDisplay(selectedEvent.endTime)}
                      </Text>
                    </View>

                    <View style={st.detailRow}>
                      <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                      <Text style={st.detailText}>
                        {new Date(selectedEvent.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </Text>
                    </View>

                    <View style={st.detailRow}>
                      <Ionicons name="person-outline" size={18} color="#6B7280" />
                      <Text style={st.detailText}>{selectedEvent.professor}</Text>
                    </View>

                    <View style={st.detailRow}>
                      <Ionicons name="location-outline" size={18} color="#6B7280" />
                      <Text style={st.detailText}>{selectedEvent.room}</Text>
                    </View>

                    <Pressable style={st.closeBtn} onPress={() => setSelectedEvent(null)}>
                      <Text style={st.closeBtnT}>Close</Text>
                    </Pressable>
                  </View>
                </>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 },
  todayBtn: { borderWidth: 1, borderColor: '#DADCE0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 7 },
  todayBtnT: { fontSize: 14, fontWeight: '600', color: '#3C4043' },
  arrows: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '600', color: '#3C4043', marginLeft: 6, flexShrink: 1 },

  toggle: { flexDirection: 'row', borderWidth: 1, borderColor: '#DADCE0', borderRadius: 10, overflow: 'hidden' },
  togBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff' },
  togOn: { backgroundColor: '#4285F4' },
  togT: { fontSize: 13, fontWeight: '600', color: '#5F6368' },
  togTOn: { color: '#fff' },

  dayHdr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 10, paddingTop: 12 },
  dayCell: { alignItems: 'center' },
  dayNm: { fontSize: 11, fontWeight: '600', color: '#70757A', letterSpacing: 0.5 },
  dayNmT: { color: '#4285F4' },
  dayNo: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  dayNoT: { backgroundColor: '#4285F4' },
  dayNoTx: { fontSize: 18, fontWeight: '500', color: '#3C4043' },
  dayNoTxT: { color: '#fff', fontWeight: '600' },
  dotRow: { flexDirection: 'row', gap: 3, marginTop: 3 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#4285F4' },

  evT: { fontSize: 13, fontWeight: '700', color: '#fff' },
  evTm: { fontSize: 11, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  evS: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  // Detail modal
  ov: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  detailBox: { backgroundColor: '#fff', borderRadius: 20, width: '88%', maxWidth: 400, overflow: 'hidden' },
  detailBar: { height: 6 },
  detailBody: { padding: 24 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 14 },
  typeBadgeT: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 18 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6' },
  detailText: { fontSize: 15, color: '#374151' },
  closeBtn: { backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  closeBtnT: { fontSize: 15, fontWeight: '600', color: '#374151' },
});
