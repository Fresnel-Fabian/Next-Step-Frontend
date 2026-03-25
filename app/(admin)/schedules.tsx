import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
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
const EVENT_COLORS = ['#4285F4', '#EA4335', '#34A853', '#FBBC04', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
const PROFESSORS = ['Dr. Smith', 'Dr. Johnson', 'Prof. Williams', 'Dr. Brown', 'Prof. Davis'];
const STUDENTS = ['Alice Martin', 'Bob Wilson', 'Carol Taylor', 'David Anderson', 'Emma Thomas', 'Frank Miller', 'Grace Lee'];

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
const isValidTime = (t: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(t);

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

// ─── Dropdown ────────────────────────────────────────────────
function Dropdown({ label, value, options, onSelect, icon }: {
  label: string; value: string; options: string[];
  onSelect: (v: string) => void; icon: keyof typeof Ionicons.glyphMap;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={dds.container}>
      <View style={dds.labelRow}>
        <Ionicons name={icon} size={18} color="#5F6368" />
        <Text style={dds.label}>{label}</Text>
      </View>
      <Pressable style={dds.trigger} onPress={() => setOpen(!open)}>
        <Text style={[dds.value, !value && { color: '#9CA3AF' }]}>{value || `Select ${label.toLowerCase()}`}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#5F6368" />
      </Pressable>
      {open && (
        <View style={dds.list}>
          <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
            {options.map(opt => (
              <Pressable key={opt} style={[dds.item, opt === value && dds.itemActive]} onPress={() => { onSelect(opt); setOpen(false); }}>
                <Text style={[dds.itemText, opt === value && dds.itemTextActive]}>{opt}</Text>
                {opt === value && <Ionicons name="checkmark" size={16} color="#4285F4" />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ─── Multi Dropdown ──────────────────────────────────────────
function MultiDropdown({ label, values, options, onToggle, icon }: {
  label: string; values: string[]; options: string[];
  onToggle: (v: string) => void; icon: keyof typeof Ionicons.glyphMap;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={dds.container}>
      <View style={dds.labelRow}>
        <Ionicons name={icon} size={18} color="#5F6368" />
        <Text style={dds.label}>{label}</Text>
      </View>
      <Pressable style={dds.trigger} onPress={() => setOpen(!open)}>
        <Text style={[dds.value, values.length === 0 && { color: '#9CA3AF' }]} numberOfLines={1}>
          {values.length === 0 ? 'Select students' : `${values.length} selected`}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#5F6368" />
      </Pressable>
      {values.length > 0 && (
        <View style={mdds.chipRow}>
          {values.map(v => (
            <Pressable key={v} style={mdds.chip} onPress={() => onToggle(v)}>
              <Text style={mdds.chipText}>{v}</Text>
              <Ionicons name="close-circle" size={14} color="#4285F4" />
            </Pressable>
          ))}
        </View>
      )}
      {open && (
        <View style={dds.list}>
          <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
            {options.map(opt => {
              const sel = values.includes(opt);
              return (
                <Pressable key={opt} style={[dds.item, sel && dds.itemActive]} onPress={() => onToggle(opt)}>
                  <Text style={[dds.itemText, sel && dds.itemTextActive]}>{opt}</Text>
                  <View style={[mdds.cb, sel && mdds.cbOn]}>{sel && <Ionicons name="checkmark" size={12} color="#fff" />}</View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function SchedulesScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState(fmt(new Date()));
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [professor, setProfessor] = useState('');
  const [students, setStudents] = useState<string[]>([]);

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
    if (viewMode === 'day') return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
    const first = weekDates[0], last = weekDates[6];
    if (first.getMonth() === last.getMonth()) return `${MONTH_NAMES[first.getMonth()]} ${first.getFullYear()}`;
    return `${MONTH_NAMES[first.getMonth()].slice(0, 3)} – ${MONTH_NAMES[last.getMonth()].slice(0, 3)} ${last.getFullYear()}`;
  }, [viewMode, weekDates, currentDate]);

  const eventsForDate = useCallback(
    (dateStr: string) => events.filter(e => e.date === dateStr).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [events],
  );

  const toggleStudent = (val: string) => setStudents(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);

  const openCreate = (dateStr: string, hour?: number) => {
    setEditingEvent(null); setSelectedDate(dateStr); setSubject(''); setDescription('');
    setStartTime(hour != null ? `${String(hour).padStart(2, '0')}:00` : '09:00');
    setEndTime(hour != null ? `${String(hour + 1).padStart(2, '0')}:00` : '10:00');
    setProfessor(''); setStudents([]); setFormError(''); setModalVisible(true);
  };

  const openEdit = (ev: ScheduleEvent) => {
    setEditingEvent(ev); setSelectedDate(ev.date); setSubject(ev.subject);
    setDescription(ev.description); setStartTime(ev.startTime); setEndTime(ev.endTime);
    setProfessor(ev.professor); setStudents(ev.students); setFormError(''); setModalVisible(true);
  };

  const handleSave = () => {
    if (!subject.trim()) { setFormError('Please enter a subject'); return; }
    if (!isValidTime(startTime)) { setFormError('Invalid start time (use HH:MM)'); return; }
    if (!isValidTime(endTime)) { setFormError('Invalid end time (use HH:MM)'); return; }
    if (startTime >= endTime) { setFormError('End time must be after start time'); return; }
    setFormError('');

    if (editingEvent) {
      setEvents(prev => prev.map(e =>
        e.id === editingEvent.id
          ? { ...e, subject: subject.trim(), description: description.trim(), startTime, endTime, professor, students }
          : e,
      ));
    } else {
      setEvents(prev => [...prev, {
        id: Date.now().toString(), subject: subject.trim(), description: description.trim(),
        date: selectedDate, startTime, endTime, professor, students,
        color: EVENT_COLORS[prev.length % EVENT_COLORS.length],
      }]);
    }
    setModalVisible(false);
  };

  const handleDelete = (id: string) => setEvents(p => p.filter(e => e.id !== id));

  const handleLayout = useCallback((e: any) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== containerWidth) setContainerWidth(w);
  }, [containerWidth]);

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
      {/* Top Bar */}
      <View style={st.topBar}>
        <View style={st.topLeft}>
          <Pressable style={st.todayBtn} onPress={goToday}><Text style={st.todayBtnText}>Today</Text></Pressable>
          <View style={st.navArrows}>
            <Pressable onPress={goPrev} hitSlop={8}><Ionicons name="chevron-back" size={22} color="#5F6368" /></Pressable>
            <Pressable onPress={goNext} hitSlop={8}><Ionicons name="chevron-forward" size={22} color="#5F6368" /></Pressable>
          </View>
          <Text style={st.headerTitle} numberOfLines={1}>{headerTitle}</Text>
        </View>
        <View style={st.topRight}>
          <View style={st.viewToggle}>
            <Pressable style={[st.toggleBtn, viewMode === 'week' && st.toggleBtnOn]} onPress={() => setViewMode('week')}>
              <Text style={[st.toggleText, viewMode === 'week' && st.toggleTextOn]}>Week</Text>
            </Pressable>
            <Pressable style={[st.toggleBtn, viewMode === 'day' && st.toggleBtnOn]} onPress={() => setViewMode('day')}>
              <Text style={[st.toggleText, viewMode === 'day' && st.toggleTextOn]}>Day</Text>
            </Pressable>
          </View>
          <Pressable style={st.addBtn} onPress={() => openCreate(fmt(currentDate))}>
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* Day Header */}
      <View style={st.dayHeaderRow}>
        <View style={{ width: TIME_COL_WIDTH }} />
        {visibleDates.map(d => {
          const today = isToday(d);
          return (
            <Pressable key={fmt(d)} style={[st.dayHeaderCell, { width: dayColW }]} onPress={() => { setCurrentDate(d); setViewMode('day'); }}>
              <Text style={[st.dayName, today && st.dayNameToday]}>
                {viewMode === 'day' ? DAY_NAMES_FULL[d.getDay()].toUpperCase() : DAY_NAMES[d.getDay()]}
              </Text>
              <View style={[st.dayNum, today && st.dayNumToday]}>
                <Text style={[st.dayNumText, today && st.dayNumTextToday]}>{d.getDate()}</Text>
              </View>
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
          {/* Fixed-height wrapper — this is what makes scroll work */}
          <View style={{ height: GRID_HEIGHT, flexDirection: 'row' }}>

            {/* Time labels column */}
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
                  {/* Hour cells (tap targets + grid lines) */}
                  {HOURS.map(h => (
                    <Pressable
                      key={h}
                      style={{ height: HOUR_HEIGHT, borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' }}
                      onPress={() => openCreate(dateStr, h)}
                    />
                  ))}

                  {/* Event blocks */}
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
                        onPress={() => openEdit(ev)}
                        onLongPress={() => setDeleteConfirm(ev.id)}
                      >
                        <Text style={st.evTitle} numberOfLines={1}>{ev.subject}</Text>
                        {h > 34 && <Text style={st.evTime} numberOfLines={1}>{formatTimeDisplay(ev.startTime)} – {formatTimeDisplay(ev.endTime)}</Text>}
                        {h > 56 && ev.professor ? <Text style={st.evSub} numberOfLines={1}>{ev.professor}</Text> : null}
                        {h > 76 && ev.students.length > 0 ? <Text style={st.evSub} numberOfLines={1}>{ev.students.length} student{ev.students.length > 1 ? 's' : ''}</Text> : null}
                      </Pressable>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* FAB */}
      <Pressable style={st.fab} onPress={() => openCreate(fmt(currentDate))}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      {/* Delete Confirm */}
      <Modal visible={deleteConfirm !== null} transparent animationType="fade" onRequestClose={() => setDeleteConfirm(null)}>
        <Pressable style={st.overlay} onPress={() => setDeleteConfirm(null)}>
          <View style={st.confirmBox}>
            <Text style={st.confirmTitle}>Delete Event</Text>
            <Text style={st.confirmText}>Are you sure you want to delete this event?</Text>
            <View style={st.confirmActions}>
              <Pressable style={st.confirmCancel} onPress={() => setDeleteConfirm(null)}>
                <Text style={st.confirmCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={st.confirmDelete} onPress={() => { if (deleteConfirm) handleDelete(deleteConfirm); setDeleteConfirm(null); }}>
                <Text style={st.confirmDeleteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Create / Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={st.overlay} onPress={() => setModalVisible(false)}>
          <Pressable style={st.modalBox} onPress={e => e.stopPropagation()}>
            <View style={st.modalHeader}>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#5F6368" />
              </Pressable>
              <Text style={st.modalTitle}>{editingEvent ? 'Edit Event' : 'New Event'}</Text>
              <Pressable style={st.saveBtn} onPress={handleSave}>
                <Text style={st.saveBtnText}>Save</Text>
              </Pressable>
            </View>

            {formError ? (
              <View style={st.errorBar}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={st.errorText}>{formError}</Text>
              </View>
            ) : null}

            <ScrollView style={st.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={st.fieldRow}>
                <Ionicons name="book-outline" size={18} color="#5F6368" />
                <TextInput style={st.subjectInput} placeholder="Add subject" placeholderTextColor="#9CA3AF" value={subject} onChangeText={t => { setSubject(t); setFormError(''); }} autoFocus />
              </View>
              <View style={st.fieldRow}>
                <Ionicons name="calendar-outline" size={18} color="#5F6368" />
                <Text style={st.fieldText}>
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <View style={st.fieldRow}>
                <Ionicons name="time-outline" size={18} color="#5F6368" />
                <View style={st.timeInputRow}>
                  <TextInput style={st.timeField} value={startTime} onChangeText={t => { setStartTime(t); setFormError(''); }} placeholder="09:00" placeholderTextColor="#9CA3AF" keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'} />
                  <Text style={st.timeDash}>–</Text>
                  <TextInput style={st.timeField} value={endTime} onChangeText={t => { setEndTime(t); setFormError(''); }} placeholder="10:00" placeholderTextColor="#9CA3AF" keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'} />
                </View>
              </View>
              <Dropdown label="Professor" value={professor} options={PROFESSORS} onSelect={setProfessor} icon="person-outline" />
              <MultiDropdown label="Students" values={students} options={STUDENTS} onToggle={toggleStudent} icon="school-outline" />
              <View style={[st.fieldRow, { alignItems: 'flex-start' }]}>
                <Ionicons name="document-text-outline" size={18} color="#5F6368" style={{ marginTop: 2 }} />
                <TextInput style={st.descInput} placeholder="Description (optional)" placeholderTextColor="#9CA3AF" value={description} onChangeText={setDescription} multiline />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Dropdown styles ─────────────────────────────────────────
const dds = StyleSheet.create({
  container: { paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  label: { fontSize: 12, fontWeight: '600', color: '#5F6368', textTransform: 'uppercase', letterSpacing: 0.5 },
  trigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, marginLeft: 28 },
  value: { fontSize: 14, color: '#3C4043' },
  list: { marginLeft: 28, marginTop: 4, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6' },
  itemActive: { backgroundColor: '#EFF6FF' },
  itemText: { fontSize: 14, color: '#3C4043' },
  itemTextActive: { color: '#4285F4', fontWeight: '600' },
});

const mdds = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginLeft: 28, marginTop: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  chipText: { fontSize: 12, color: '#4285F4', fontWeight: '500' },
  cb: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  cbOn: { backgroundColor: '#4285F4', borderColor: '#4285F4' },
});

// ─── Main styles ─────────────────────────────────────────────
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
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
  addBtn: { backgroundColor: '#4285F4', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  dayHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 6, paddingTop: 8 },
  dayHeaderCell: { alignItems: 'center' },
  dayName: { fontSize: 11, fontWeight: '600', color: '#70757A', letterSpacing: 0.5 },
  dayNameToday: { color: '#4285F4' },
  dayNum: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  dayNumToday: { backgroundColor: '#4285F4' },
  dayNumText: { fontSize: 18, fontWeight: '500', color: '#3C4043' },
  dayNumTextToday: { color: '#fff', fontWeight: '600' },

  timeLabel: { fontSize: 10, color: '#70757A', marginTop: -7 },

  evTitle: { fontSize: 12, fontWeight: '700', color: '#fff' },
  evTime: { fontSize: 10, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  evSub: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#4285F4', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, width: '90%', maxWidth: 520, maxHeight: '75%', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#3C4043' },
  saveBtn: { backgroundColor: '#4285F4', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6 },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  modalBody: { padding: 16 },
  errorBar: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', paddingHorizontal: 16, paddingVertical: 8 },
  errorText: { fontSize: 13, color: '#DC2626', fontWeight: '500' },

  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' },
  subjectInput: { flex: 1, fontSize: 16, fontWeight: '500', color: '#3C4043' },
  fieldText: { fontSize: 14, color: '#3C4043' },
  timeInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeField: { fontSize: 14, color: '#3C4043', backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, minWidth: 70, textAlign: 'center' },
  timeDash: { fontSize: 14, color: '#70757A' },
  descInput: { flex: 1, fontSize: 14, color: '#3C4043', minHeight: 50, textAlignVertical: 'top' },

  confirmBox: { backgroundColor: '#fff', borderRadius: 14, padding: 24, width: '80%', maxWidth: 340, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  confirmTitle: { fontSize: 17, fontWeight: '600', color: '#111827', marginBottom: 8 },
  confirmText: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  confirmCancel: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  confirmCancelText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  confirmDelete: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, backgroundColor: '#DC2626' },
  confirmDeleteText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});