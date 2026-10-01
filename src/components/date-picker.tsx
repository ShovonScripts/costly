import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/expense';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function sameDay(first: Date, second: Date) {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

export function DatePicker({ value, onChange }: { value: Date; onChange: (date: Date) => void }) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [month, setMonth] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));
  const today = useMemo(() => new Date(), []);

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const offset = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(month);

  const moveMonth = (difference: number) => {
    setMonth(new Date(year, monthIndex + difference, 1));
  };

  const pickDay = (day: number) => {
    const next = new Date(year, monthIndex, day, 12, 0, 0, 0);
    onChange(next);
    setVisible(false);
  };

  return (
    <>
      <Pressable
        onPress={() => {
          setMonth(new Date(value.getFullYear(), value.getMonth(), 1));
          setVisible(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`Expense date, ${formatDate(value.toISOString())}. Tap to change.`}
        style={({ pressed }) => [styles.dateButton, { borderColor: theme.border, backgroundColor: theme.cardMuted }, pressed && styles.pressed]}>
        <View style={styles.calendarIcon}>
          <View style={[styles.calendarTop, { backgroundColor: theme.accent }]} />
          <View style={[styles.calendarBody, { borderColor: theme.border }]}>
            <View style={[styles.calendarDot, { backgroundColor: theme.accent }]} />
            <View style={[styles.calendarDot, { backgroundColor: theme.accent }]} />
            <View style={[styles.calendarDot, { backgroundColor: theme.accent }]} />
            <View style={[styles.calendarDot, { backgroundColor: theme.accent }]} />
          </View>
        </View>
        <View style={styles.dateCopy}>
          <ThemedText type="defaultBold">{formatDate(value.toISOString())}</ThemedText>
        </View>
        <ThemedText type="smallBold" style={{ color: theme.accent }}>Change</ThemedText>
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.scrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setVisible(false)} accessibilityLabel="Close date picker" />
          <View style={[styles.dialog, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.dialogHeader}>
              <View style={styles.monthCopy}>
                <ThemedText type="caption" themeColor="textSecondary">SELECT A DATE</ThemedText>
                <ThemedText type="defaultBold" style={styles.monthTitle}>{monthLabel}</ThemedText>
              </View>
              <View style={styles.monthActions}>
                <MonthButton label="Previous month" symbol="‹" onPress={() => moveMonth(-1)} />
                <MonthButton label="Next month" symbol="›" onPress={() => moveMonth(1)} />
              </View>
            </View>

            <View style={styles.calendarGrid}>
              {WEEKDAYS.map((weekday, index) => (
                <View key={`${weekday}-${index}`} style={styles.dayCell}>
                  <ThemedText type="caption" themeColor="textSecondary">{weekday}</ThemedText>
                </View>
              ))}
              {cells.map((day, index) => {
                if (day === null) return <View key={`empty-${index}`} style={styles.dayCell} />;
                const date = new Date(year, monthIndex, day, 12);
                const selected = sameDay(date, value);
                const todayDate = sameDay(date, today);
                return (
                  <Pressable
                    key={day}
                    onPress={() => pickDay(day)}
                    accessibilityRole="button"
                    accessibilityLabel={new Intl.DateTimeFormat('en', { dateStyle: 'full' }).format(date)}
                    accessibilityState={{ selected }}
                    style={[
                      styles.dayCell,
                      selected && { backgroundColor: theme.accent },
                      todayDate && !selected && { borderColor: theme.accent, borderWidth: 1 },
                    ]}>
                    <ThemedText type={selected ? 'smallBold' : 'small'} style={selected ? styles.selectedDay : undefined}>
                      {day}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={() => {
                const todayValue = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
                onChange(todayValue);
                setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                setVisible(false);
              }}
              accessibilityRole="button"
              style={[styles.todayButton, { backgroundColor: theme.accentMuted }]}>
              <ThemedText type="smallBold" style={{ color: theme.accent }}>Go to today</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

function MonthButton({ label, symbol, onPress }: { label: string; symbol: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={[styles.monthButton, { backgroundColor: theme.cardMuted }]}>
      <ThemedText type="subtitle" style={styles.monthButtonText}>{symbol}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dateButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.large, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one },
  calendarIcon: { width: 24, height: 24, position: 'relative' },
  calendarTop: { height: 6, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  calendarBody: { flex: 1, borderWidth: 1, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', gap: 1 },
  calendarDot: { width: 3, height: 3, borderRadius: Radius.pill },
  dateCopy: { flex: 1, gap: 0 },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
  dialog: { width: '100%', maxWidth: 360, borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.xlarge, padding: Spacing.three, gap: Spacing.three, elevation: 12 },
  dialogHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthCopy: { gap: Spacing.one },
  monthTitle: { fontSize: 22, lineHeight: 28 },
  monthActions: { flexDirection: 'row', gap: Spacing.two },
  monthButton: { width: 42, height: 42, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  monthButtonText: { fontSize: 28, lineHeight: 34 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, height: 42, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  selectedDay: { color: '#FFFFFF' },
  todayButton: { minHeight: 44, alignSelf: 'center', paddingHorizontal: Spacing.three, borderRadius: Radius.pill, justifyContent: 'center' },
  pressed: { opacity: 0.72 },
});
