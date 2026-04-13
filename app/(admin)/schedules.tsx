import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataService, ScheduleEvent as ScheduleEventDTO } from '@/services/dataService';
import Toast from 'react-native-toast-message';

interface ScheduleEvent {
  id: number;
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

function computeOverlapLayout(events: ScheduleEvent[]): Map<number, LayoutInfo> {
  const sorted = [...events].sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));
  const layout = new Map<number, LayoutInfo>();
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
      let col = false;
      for (let c = 0; c < columns.length; c++) {
        const last = columns[c][columns[c].length - 1];
        if (timeToMin(ev.startTime) >= timeToMin(last.endTime)) {
          columns[c].push(ev);
          layout.set(ev.id, { col: c, totalCols: 0 });
          col = true; break;
        }
      }
      if (!col) {
        layout.set(ev.id, { col: columns.length, totalCols: 0 });
        columns.push([ev]);
      }
    }
    for (const ev of group) { layout.get(ev.id)!.totalCols = columns.length; }
  }
  return layout;
}

function ProfessorField({ label, value, onChangeText, options, icon }: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  options: string[];
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const [open, setOpen] = useState(false);
  const filtered = useMemo(
    () => options.filter(o => !value.trim() || o.toLowerCase().includes(value.trim().toLowerCase())),
    [options, value],
  );
  return (
    <View style={dd.box}>
      <View style={dd.row}>
        <Ionicons name={icon} size={18} color="#5F6368" />
        <Text style={dd.lbl}>{label}</Text>
      </View>
      <View style={dd.comboRow}>
        <TextInput
          style={dd.textIn}
          value={value}
          onChangeText={t => { onChangeText(t); }}
          placeholder="Type name or pick from list"
          placeholderTextColor="#9CA3AF"
          autoCorrect={false}
        />
        <Pressable style={dd.chevronBtn} onPress={() => setOpen(!open)} hitSlop={8}>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#5F6368" />
        </Pressable>
      </View>
      {open && (
        <View style={dd.list}>
          <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {filtered.length === 0 ? (
              <View style={dd.emptyHint}><Text style={dd.emptyHintT}>No matches</Text></View>
            ) : (
              filtered.map(o => (
                <Pressable
                  key={o}
                  style={[dd.item, o === value && dd.itemOn]}
                  onPress={() => {
                    onChangeText(o);
                    setOpen(false);
                  }}
                >
                  <Text style={[dd.itemT, o === value && dd.itemTOn]}>{o}</Text>
                  {o === value ? <Ionicons name="checkmark" size={16} color="#4285F4" /> : null}
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

function StudentsField({ label, values, options, onToggle, icon }: {
  label: string;
  values: string[];
  options: string[];
  onToggle: (v: string) => void;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = useMemo(
    () => options.filter(o => !search.trim() || o.toLowerCase().includes(search.trim().toLowerCase())),
    [options, search],
  );
  return (
    <View style={dd.box}>
      <View style={dd.row}>
        <Ionicons name={icon} size={18} color="#5F6368" />
        <Text style={dd.lbl}>{label}</Text>
      </View>
      <View style={dd.comboRow}>
        <TextInput
          style={dd.textIn}
          value={search}
          onChangeText={t => {
            setSearch(t);
            if (t.trim()) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={values.length ? `Search (${values.length} selected)` : 'Search and select students'}
          placeholderTextColor="#9CA3AF"
          autoCorrect={false}
        />
        <Pressable style={dd.chevronBtn} onPress={() => setOpen(!open)} hitSlop={8}>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#5F6368" />
        </Pressable>
      </View>
      {values.length > 0 && (
        <View style={md.chips}>
          {values.map(v => (
            <Pressable key={v} style={md.chip} onPress={() => onToggle(v)}>
              <Text style={md.chipT}>{v}</Text>
              <Ionicons name="close-circle" size={14} color="#4285F4" />
            </Pressable>
          ))}
        </View>
      )}
      {open && (
        <View style={dd.list}>
          <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {filtered.length === 0 ? (
              <View style={dd.emptyHint}><Text style={dd.emptyHintT}>No matches</Text></View>
            ) : (
              filtered.map(o => {
                const sel = values.includes(o);
                return (
                  <Pressable key={o} style={[dd.item, sel && dd.itemOn]} onPress={() => onToggle(o)}>
                    <Text style={[dd.itemT, sel && dd.itemTOn]}>{o}</Text>
                    <View style={[md.cb, sel && md.cbOn]}>{sel ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}</View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export default function SchedulesScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState(fmt(new Date()));
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [professor, setProfessor] = useState('');
  const [students, setStudents] = useState<string[]>([]);

  const fetchEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      const data = await DataService.getScheduleEvents();
      setEvents(data.map(e => ({
        id: e.id,
        subject: e.subject,
        description: e.description || '',
        date: e.date,
        startTime: e.startTime,
        endTime: e.endTime,
        professor: e.professor,
        students: e.students,
        color: e.color,
      })));
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load schedule events' });
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

  const toggleStudent = (v: string) => setStudents(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);

  const openCreate = (ds: string, hour?: number) => {
    setEditingEvent(null); setSelectedDate(ds); setSubject(''); setDescription('');
    setStartTime(hour != null ? `${String(hour).padStart(2, '0')}:00` : '09:00');
    setEndTime(hour != null ? `${String(hour + 1).padStart(2, '0')}:00` : '10:00');
    setProfessor(''); setStudents([]); setFormError(''); setModalVisible(true);
  };

  const openEdit = (ev: ScheduleEvent) => {
    setEditingEvent(ev); setSelectedDate(ev.date); setSubject(ev.subject);
    setDescription(ev.description); setStartTime(ev.startTime); setEndTime(ev.endTime);
    setProfessor(ev.professor); setStudents(ev.students); setFormError(''); setModalVisible(true);
  };

  const handleSave = async () => {
    if (!subject.trim()) { setFormError('Please enter a subject'); return; }
    if (!isValidTime(startTime)) { setFormError('Invalid start time (use HH:MM)'); return; }
    if (!isValidTime(endTime)) { setFormError('Invalid end time (use HH:MM)'); return; }
    if (startTime >= endTime) { setFormError('End time must be after start time'); return; }
    setFormError('');
    setSaving(true);
    try {
      if (editingEvent) {
        await DataService.updateScheduleEvent(editingEvent.id, {
          subject: subject.trim(), description: description.trim(),
          startTime, endTime, professor, students,
        });
        Toast.show({ type: 'success', text1: 'Event updated' });
      } else {
        await DataService.createScheduleEvent({
          subject: subject.trim(), description: description.trim(),
          date: selectedDate, startTime, endTime, professor, students,
          color: EVENT_COLORS[events.length % EVENT_COLORS.length],
        });
        Toast.show({ type: 'success', text1: 'Event created' });
      }
      setModalVisible(false);
      fetchEvents();
    } catch {
      Toast.show({ type: 'error', text1: editingEvent ? 'Failed to update event' : 'Failed to create event' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await DataService.deleteScheduleEvent(id);
      Toast.show({ type: 'success', text1: 'Event deleted' });
      fetchEvents();
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to delete event' });
    }
  };

  const scrollDone = useRef(false);
  const onGridLayout = useCallback(() => {
    if (!scrollDone.current) {
      scrollDone.current = true;
      setTimeout(() => scrollRef.current?.scrollTo({ y: (9 - START_HOUR) * HOUR_HEIGHT, animated: false }), 200);
    }
  }, []);

  if (containerWidth === 0) {
    return <View style={s.container} onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}><Text style={{ padding: 20, color: '#9CA3AF' }}>Loading...</Text></View>;
  }

  return (
    <View style={s.container} onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <View style={s.topLeft}>
          <Pressable style={s.todayBtn} onPress={goToday}><Text style={s.todayBtnT}>Today</Text></Pressable>
          <View style={s.arrows}>
            <Pressable onPress={goPrev} hitSlop={8}><Ionicons name="chevron-back" size={22} color="#5F6368" /></Pressable>
            <Pressable onPress={goNext} hitSlop={8}><Ionicons name="chevron-forward" size={22} color="#5F6368" /></Pressable>
          </View>
          <Text style={s.title} numberOfLines={1}>{headerTitle}</Text>
        </View>
        <View style={s.topRight}>
          <View style={s.toggle}>
            <Pressable style={[s.togBtn, viewMode === 'week' && s.togOn]} onPress={() => setViewMode('week')}>
              <Text style={[s.togT, viewMode === 'week' && s.togTOn]}>Week</Text>
            </Pressable>
            <Pressable style={[s.togBtn, viewMode === 'day' && s.togOn]} onPress={() => setViewMode('day')}>
              <Text style={[s.togT, viewMode === 'day' && s.togTOn]}>Day</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Day Header */}
      <View style={s.dayHdr}>
        <View style={{ width: TIME_COL_WIDTH }} />
        {visibleDates.map(d => {
          const t = isToday(d);
          return (
            <Pressable key={fmt(d)} style={[s.dayCell, { width: dayColW }]} onPress={() => { setCurrentDate(d); setViewMode('day'); }}>
              <Text style={[s.dayNm, t && s.dayNmT]}>{viewMode === 'day' ? DAY_NAMES_FULL[d.getDay()].toUpperCase() : DAY_NAMES[d.getDay()]}</Text>
              <View style={[s.dayNo, t && s.dayNoT]}><Text style={[s.dayNoTx, t && s.dayNoTxT]}>{d.getDate()}</Text></View>
            </Pressable>
          );
        })}
      </View>

      {/* Scrollable Grid */}
      <ScrollView ref={scrollRef} style={{ flex: 1 }} onLayout={onGridLayout} showsVerticalScrollIndicator>
        <View style={{ height: GRID_HEIGHT, flexDirection: 'row' }}>
          {/* Time labels */}
          <View style={{ width: TIME_COL_WIDTH, height: GRID_HEIGHT }}>
            {HOURS.map(h => (
              <View key={h} style={{ height: HOUR_HEIGHT, justifyContent: 'flex-start', alignItems: 'flex-end', paddingRight: 8 }}>
                <Text style={{ fontSize: 10, color: '#70757A', marginTop: -7 }}>{formatHour(h)}</Text>
              </View>
            ))}
          </View>

          {/* Day columns */}
          {visibleDates.map(d => {
            const ds = fmt(d);
            const today = isToday(d);
            const de = eventsForDate(ds);
            const lm = computeOverlapLayout(de);

            return (
              <View key={ds} style={{ width: dayColW, height: GRID_HEIGHT, borderLeftWidth: 0.5, borderLeftColor: '#E5E7EB', backgroundColor: today ? '#EFF6FF' : 'transparent', position: 'relative' as const }}>
                {HOURS.map(h => (
                  <Pressable key={h} style={{ height: HOUR_HEIGHT, borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' }} onPress={() => openCreate(ds, h)} />
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
                      onPress={() => openEdit(ev)}
                      onLongPress={() => setDeleteConfirm(ev.id)}
                      style={{
                        position: 'absolute' as const, top, left, width: cw - 3,
                        height: Math.max(h, 30), backgroundColor: ev.color,
                        borderRadius: 6, borderLeftWidth: 4, borderLeftColor: 'rgba(0,0,0,0.2)',
                        paddingHorizontal: 8, paddingVertical: 6, overflow: 'hidden' as const,
                      }}
                    >
                      <Text style={s.evT} numberOfLines={1}>{ev.subject}</Text>
                      {h > 36 && <Text style={s.evTm} numberOfLines={1}>{formatTimeDisplay(ev.startTime)} – {formatTimeDisplay(ev.endTime)}</Text>}
                      {h > 58 && ev.professor ? <Text style={s.evS} numberOfLines={1}>{ev.professor}</Text> : null}
                      {h > 78 && ev.students.length > 0 ? <Text style={s.evS} numberOfLines={1}>{ev.students.length} student{ev.students.length > 1 ? 's' : ''}</Text> : null}
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add event"
        style={[s.fab, { right: 16 + insets.right, bottom: 16 + insets.bottom }]}
        onPress={() => openCreate(fmt(currentDate))}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      {/* Delete Confirm */}
      <Modal visible={deleteConfirm !== null} transparent animationType="fade" onRequestClose={() => setDeleteConfirm(null)}>
        <Pressable style={s.ov} onPress={() => setDeleteConfirm(null)}>
          <View style={s.cBox}>
            <Text style={s.cTitle}>Delete Event</Text>
            <Text style={s.cText}>Are you sure you want to delete this event?</Text>
            <View style={s.cActions}>
              <Pressable style={s.cCancel} onPress={() => setDeleteConfirm(null)}><Text style={s.cCancelT}>Cancel</Text></Pressable>
              <Pressable style={s.cDel} onPress={() => { if (deleteConfirm) handleDelete(deleteConfirm); setDeleteConfirm(null); }}><Text style={s.cDelT}>Delete</Text></Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Create / Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={s.ov} onPress={() => setModalVisible(false)}>
          <Pressable style={s.mBox} onPress={e => e.stopPropagation()}>
            <View style={s.mHdr}>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}><Ionicons name="close" size={22} color="#5F6368" /></Pressable>
              <Text style={s.mTitle}>{editingEvent ? 'Edit Event' : 'New Event'}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {editingEvent && (
                  <Pressable style={s.delBtnHdr} onPress={() => { setModalVisible(false); setDeleteConfirm(editingEvent.id); }}>
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  </Pressable>
                )}
                <Pressable style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.saveBtnT}>Save</Text>}
                </Pressable>
              </View>
            </View>
            {formError ? <View style={s.err}><Ionicons name="alert-circle" size={16} color="#DC2626" /><Text style={s.errT}>{formError}</Text></View> : null}
            <ScrollView style={s.mBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={s.fRow}><Ionicons name="book-outline" size={18} color="#5F6368" /><TextInput style={s.subIn} placeholder="Add subject" placeholderTextColor="#9CA3AF" value={subject} onChangeText={t => { setSubject(t); setFormError(''); }} autoFocus /></View>
              <View style={s.fRow}><Ionicons name="calendar-outline" size={18} color="#5F6368" /><Text style={s.fText}>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text></View>
              <View style={s.fRow}>
                <Ionicons name="time-outline" size={18} color="#5F6368" style={s.fRowIcon} />
                <View style={s.tmRow}>
                  <TextInput
                    style={s.tmIn}
                    value={startTime}
                    onChangeText={t => { setStartTime(t); setFormError(''); }}
                    placeholder="09:00"
                    placeholderTextColor="#9CA3AF"
                    keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                  />
                  <Text style={s.tmDash}>–</Text>
                  <TextInput
                    style={s.tmIn}
                    value={endTime}
                    onChangeText={t => { setEndTime(t); setFormError(''); }}
                    placeholder="10:00"
                    placeholderTextColor="#9CA3AF"
                    keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                  />
                </View>
              </View>
              <ProfessorField
                label="Professor"
                value={professor}
                onChangeText={setProfessor}
                options={PROFESSORS}
                icon="person-outline"
              />
              <StudentsField
                label="Students"
                values={students}
                options={STUDENTS}
                onToggle={toggleStudent}
                icon="school-outline"
              />
              <View style={[s.fRow, { alignItems: 'flex-start' }]}><Ionicons name="document-text-outline" size={18} color="#5F6368" style={{ marginTop: 2 }} /><TextInput style={s.descIn} placeholder="Description (optional)" placeholderTextColor="#9CA3AF" value={description} onChangeText={setDescription} multiline /></View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const dd = StyleSheet.create({
  box: { paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  lbl: { fontSize: 12, fontWeight: '600', color: '#5F6368', textTransform: 'uppercase', letterSpacing: 0.5 },
  comboRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 28,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingLeft: 12,
    paddingRight: 4,
    minHeight: 44,
  },
  textIn: { flex: 1, fontSize: 14, color: '#3C4043', paddingVertical: 10 },
  chevronBtn: { padding: 8, justifyContent: 'center', alignItems: 'center' },
  list: { marginLeft: 28, marginTop: 4, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6' },
  itemOn: { backgroundColor: '#EFF6FF' },
  itemT: { fontSize: 14, color: '#3C4043', flex: 1, marginRight: 8 },
  itemTOn: { color: '#4285F4', fontWeight: '600' },
  emptyHint: { paddingVertical: 14, paddingHorizontal: 12 },
  emptyHintT: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
});

const md = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginLeft: 28, marginTop: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  chipT: { fontSize: 12, color: '#4285F4', fontWeight: '500' },
  cb: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  cbOn: { backgroundColor: '#4285F4', borderColor: '#4285F4' },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 },
  todayBtn: { borderWidth: 1, borderColor: '#DADCE0', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 5 },
  todayBtnT: { fontSize: 13, fontWeight: '600', color: '#3C4043' },
  arrows: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '600', color: '#3C4043', marginLeft: 4, flexShrink: 1 },
  toggle: { flexDirection: 'row', borderWidth: 1, borderColor: '#DADCE0', borderRadius: 8, overflow: 'hidden' },
  togBtn: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#fff' },
  togOn: { backgroundColor: '#4285F4' },
  togT: { fontSize: 13, fontWeight: '600', color: '#5F6368' },
  togTOn: { color: '#fff' },
  dayHdr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 6, paddingTop: 8 },
  dayCell: { alignItems: 'center' },
  dayNm: { fontSize: 11, fontWeight: '600', color: '#70757A', letterSpacing: 0.5 },
  dayNmT: { color: '#4285F4' },
  dayNo: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  dayNoT: { backgroundColor: '#4285F4' },
  dayNoTx: { fontSize: 18, fontWeight: '500', color: '#3C4043' },
  dayNoTxT: { color: '#fff', fontWeight: '600' },

  evT: { fontSize: 13, fontWeight: '700', color: '#fff' },
  evTm: { fontSize: 11, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  evS: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  ov: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  mBox: { backgroundColor: '#fff', borderRadius: 16, width: '90%', maxWidth: 520, maxHeight: '75%', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10, overflow: 'hidden' },
  mHdr: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  mTitle: { fontSize: 16, fontWeight: '600', color: '#3C4043' },
  saveBtn: { backgroundColor: '#4285F4', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6, minWidth: 56, alignItems: 'center' as const, justifyContent: 'center' as const },
  saveBtnT: { color: '#fff', fontWeight: '600', fontSize: 13 },
  delBtnHdr: { borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 6, padding: 5 },
  mBody: { padding: 16 },
  err: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', paddingHorizontal: 16, paddingVertical: 8 },
  errT: { fontSize: 13, color: '#DC2626', fontWeight: '500' },
  fRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
    minWidth: 0,
  },
  fRowIcon: { flexShrink: 0 },
  subIn: { flex: 1, minWidth: 0, fontSize: 16, fontWeight: '500', color: '#3C4043' },
  fText: { flex: 1, minWidth: 0, fontSize: 14, color: '#3C4043' },
  tmRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  tmIn: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: '#3C4043',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 6,
    textAlign: 'center',
  },
  tmDash: { fontSize: 14, color: '#70757A', flexShrink: 0 },
  descIn: { flex: 1, fontSize: 14, color: '#3C4043', minHeight: 50, textAlignVertical: 'top' },
  cBox: { backgroundColor: '#fff', borderRadius: 14, padding: 24, width: '80%', maxWidth: 340 },
  cTitle: { fontSize: 17, fontWeight: '600', color: '#111827', marginBottom: 8 },
  cText: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  cActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cCancel: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  cCancelT: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  cDel: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, backgroundColor: '#DC2626' },
  cDelT: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
