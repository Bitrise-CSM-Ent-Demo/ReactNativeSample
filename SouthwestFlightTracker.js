'use strict';
import React, {
  Component,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableHighlight,
} from 'react-native';

// Southwest SAN → TUS route
// Price model: base fare + day-of-week premium + month seasonality + days-out factor
const BASE_FARE = 89;

const DOW_MULTIPLIER = [1.18, 0.92, 0.88, 0.90, 1.08, 1.22, 1.15]; // Sun–Sat
const MONTH_MULTIPLIER = [0.94, 0.88, 0.96, 1.00, 1.05, 1.20, 1.25, 1.22, 0.98, 0.95, 0.93, 1.18];

const DEPART_TIMES = [
  { label: '5:45 AM', slot: 'Early', factor: 0.90 },
  { label: '8:15 AM', slot: 'Morning', factor: 1.00 },
  { label: '11:30 AM', slot: 'Midday', factor: 1.05 },
  { label: '2:00 PM', slot: 'Afternoon', factor: 1.08 },
  { label: '5:20 PM', slot: 'Evening', factor: 1.12 },
  { label: '8:45 PM', slot: 'Night', factor: 0.95 },
];

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function computeFare(month, dow, timeFactor, daysOut) {
  const advance = daysOut >= 42 ? 0.88 : daysOut >= 21 ? 0.94 : daysOut >= 14 ? 1.02 : 1.18;
  const raw = BASE_FARE * DOW_MULTIPLIER[dow] * MONTH_MULTIPLIER[month] * timeFactor * advance;
  return Math.round(raw / 5) * 5; // round to nearest $5
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDow(year, month) {
  return new Date(year, month, 1).getDay();
}

function priceCategory(fare) {
  if (fare <= 89) return 'low';
  if (fare <= 109) return 'medium';
  return 'high';
}

class SouthwestFlightTracker extends Component {
  constructor(props) {
    super(props);
    const now = new Date();
    this.state = {
      month: now.getMonth(),
      year: now.getFullYear(),
      selectedDay: null,
    };
  }

  stepMonth(delta) {
    let { month, year } = this.state;
    month += delta;
    if (month > 11) { month = 0; year++; }
    if (month < 0)  { month = 11; year--; }
    this.setState({ month, year, selectedDay: null });
  }

  renderHeader() {
    return (
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerHeart}>♥</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>Southwest Flight Tracker</Text>
          <Text style={styles.headerRoute}>SAN  →  TUS  ·  San Diego to Tucson</Text>
        </View>
      </View>
    );
  }

  renderMonthNav() {
    const { month, year } = this.state;
    return (
      <View style={styles.monthNav}>
        <TouchableHighlight
          style={styles.navBtn}
          underlayColor="#1a3a8f"
          onPress={() => this.stepMonth(-1)}
        >
          <Text style={styles.navBtnText}>‹</Text>
        </TouchableHighlight>
        <Text style={styles.monthLabel}>{MONTH_NAMES[month]} {year}</Text>
        <TouchableHighlight
          style={styles.navBtn}
          underlayColor="#1a3a8f"
          onPress={() => this.stepMonth(1)}
        >
          <Text style={styles.navBtnText}>›</Text>
        </TouchableHighlight>
      </View>
    );
  }

  renderCalendar() {
    const { month, year, selectedDay } = this.state;
    const today = new Date();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDow = getFirstDow(year, month);
    const now = new Date();

    const cells = [];
    // Day-of-week headers
    DOW_LABELS.forEach((d) => {
      cells.push(
        <View key={'h' + d} style={styles.calCell}>
          <Text style={styles.calDowHeader}>{d}</Text>
        </View>
      );
    });
    // Empty leading cells
    for (let i = 0; i < firstDow; i++) {
      cells.push(<View key={'empty' + i} style={styles.calCell} />);
    }
    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dow = (firstDow + day - 1) % 7;
      const date = new Date(year, month, day);
      const daysOut = Math.round((date - now) / (1000 * 60 * 60 * 24));
      const isPast = daysOut < 0;
      const fare = isPast ? null : computeFare(month, dow, 1.0, daysOut);
      const cat = fare ? priceCategory(fare) : null;
      const isSelected = selectedDay === day;
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      const cellStyle = [
        styles.calCell,
        isSelected && styles.calCellSelected,
      ];
      const priceStyle = cat === 'low'
        ? styles.priceTagLow
        : cat === 'medium'
        ? styles.priceTagMed
        : cat === 'high'
        ? styles.priceTagHigh
        : null;

      cells.push(
        <TouchableHighlight
          key={day}
          style={cellStyle}
          underlayColor="#eef2ff"
          onPress={() => !isPast && this.setState({ selectedDay: day })}
        >
          <View style={styles.calCellInner}>
            <Text style={[styles.calDayNum, isToday && styles.calDayToday, isPast && styles.calDayPast]}>
              {day}
            </Text>
            {fare && (
              <View style={priceStyle}>
                <Text style={styles.priceTagText}>${fare}</Text>
              </View>
            )}
          </View>
        </TouchableHighlight>
      );
    }

    return (
      <View style={styles.calGrid}>
        {cells}
      </View>
    );
  }

  renderSelectedDayFlights() {
    const { month, year, selectedDay } = this.state;
    if (!selectedDay) return null;
    const now = new Date();
    const date = new Date(year, month, selectedDay);
    const daysOut = Math.round((date - now) / (1000 * 60 * 60 * 24));
    const dow = date.getDay();

    const flights = DEPART_TIMES.map((t) => ({
      ...t,
      fare: computeFare(month, dow, t.factor, daysOut),
    })).sort((a, b) => a.fare - b.fare);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Flights · {MONTH_NAMES[month].slice(0, 3)} {selectedDay}
        </Text>
        {flights.map((f, i) => {
          const cat = priceCategory(f.fare);
          const tagStyle = cat === 'low' ? styles.priceTagLow
            : cat === 'medium' ? styles.priceTagMed
            : styles.priceTagHigh;
          return (
            <View key={i} style={styles.flightRow}>
              <View>
                <Text style={styles.flightTime}>{f.label}</Text>
                <Text style={styles.flightSlot}>{f.slot} departure · ~1h 40m</Text>
              </View>
              <View style={[tagStyle, styles.flightFareTag]}>
                <Text style={styles.flightFareText}>${f.fare}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  }

  renderDowInsights() {
    const { month, year } = this.state;
    const now = new Date();
    const daysOut = 28;

    const dowData = DOW_LABELS.map((label, dow) => ({
      label,
      fare: computeFare(month, dow, 1.0, daysOut),
    }));
    const minFare = Math.min(...dowData.map((d) => d.fare));
    const maxFare = Math.max(...dowData.map((d) => d.fare));
    const range = maxFare - minFare || 1;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Best Days to Fly</Text>
        <Text style={styles.sectionSub}>Typical fares for {MONTH_NAMES[month]}</Text>
        {dowData.map((d) => {
          const pct = ((d.fare - minFare) / range);
          const barColor = pct < 0.33 ? '#2eb82e' : pct < 0.66 ? '#f0a500' : '#d93025';
          const barWidth = 20 + Math.round((1 - pct) * 120);
          return (
            <View key={d.label} style={styles.dowRow}>
              <Text style={styles.dowLabel}>{d.label}</Text>
              <View style={[styles.dowBar, { width: barWidth, backgroundColor: barColor }]} />
              <Text style={styles.dowFare}>${d.fare}</Text>
              {d.fare === minFare && <Text style={styles.dowBest}> ★ Best</Text>}
            </View>
          );
        })}
      </View>
    );
  }

  renderTimeInsights() {
    const { month } = this.state;
    const sorted = [...DEPART_TIMES].sort((a, b) => a.factor - b.factor);
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Best Departure Times</Text>
        {sorted.map((t, i) => {
          const fare = computeFare(month, 2, t.factor, 28); // Wednesday baseline
          const cat = priceCategory(fare);
          const tagStyle = cat === 'low' ? styles.priceTagLow
            : cat === 'medium' ? styles.priceTagMed
            : styles.priceTagHigh;
          return (
            <View key={i} style={styles.timeRow}>
              <Text style={styles.timeLabel}>{t.label}</Text>
              <Text style={styles.timeSlot}>{t.slot}</Text>
              <View style={[tagStyle, styles.timeTag]}>
                <Text style={styles.priceTagText}>~${fare}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  }

  renderTips() {
    return (
      <View style={[styles.section, styles.tipsSection]}>
        <Text style={styles.sectionTitle}>Booking Tips</Text>
        {[
          { icon: '📅', tip: 'Book 3–6 weeks out for lowest fares on this route.' },
          { icon: '📆', tip: 'Tuesday & Wednesday departures average 10–15% cheaper.' },
          { icon: '🌅', tip: 'Early-morning (5–7 AM) flights are typically the cheapest.' },
          { icon: '🔔', tip: 'Southwest drops sale fares on Tuesdays around 12 PM PT.' },
          { icon: '🔄', tip: 'No change fees — rebook if a lower fare appears.' },
        ].map((item, i) => (
          <View key={i} style={styles.tipRow}>
            <Text style={styles.tipIcon}>{item.icon}</Text>
            <Text style={styles.tipText}>{item.tip}</Text>
          </View>
        ))}
      </View>
    );
  }

  renderLegend() {
    return (
      <View style={styles.legend}>
        {[
          { style: styles.priceTagLow, label: 'Low (≤$89)' },
          { style: styles.priceTagMed, label: 'Mid ($90–$109)' },
          { style: styles.priceTagHigh, label: 'High ($110+)' },
        ].map((item, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[item.style, styles.legendSwatch]} />
            <Text style={styles.legendLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    );
  }

  render() {
    return (
      <View style={styles.root}>
        {this.renderHeader()}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {this.renderMonthNav()}
          {this.renderLegend()}
          {this.renderCalendar()}
          {this.renderSelectedDayFlights()}
          {this.renderDowInsights()}
          {this.renderTimeInsights()}
          {this.renderTips()}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Prices are estimates based on historical Southwest fare patterns.
              Always verify at southwest.com.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}

const SW_BLUE = '#304CB2';
const SW_ORANGE = '#E87722';
const SW_YELLOW = '#FFBF27';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F6FB',
  },
  header: {
    backgroundColor: SW_BLUE,
    paddingTop: 44,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SW_ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerHeart: {
    color: '#fff',
    fontSize: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRoute: {
    color: SW_YELLOW,
    fontSize: 12,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SW_BLUE,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#253d8f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  monthLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e9f0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginRight: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: '#555',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e9f0',
  },
  calCell: {
    width: '14.28%',
    minHeight: 54,
    padding: 2,
    alignItems: 'center',
  },
  calCellSelected: {
    backgroundColor: '#eef2ff',
    borderRadius: 6,
  },
  calCellInner: {
    alignItems: 'center',
  },
  calDowHeader: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
    marginBottom: 2,
  },
  calDayNum: {
    fontSize: 13,
    color: '#222',
    fontWeight: '500',
    marginBottom: 2,
  },
  calDayToday: {
    color: SW_BLUE,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  calDayPast: {
    color: '#ccc',
  },
  priceTagLow: {
    backgroundColor: '#d4edda',
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  priceTagMed: {
    backgroundColor: '#fff3cd',
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  priceTagHigh: {
    backgroundColor: '#f8d7da',
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  priceTagText: {
    fontSize: 9,
    color: '#333',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: SW_BLUE,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
  },
  flightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  flightTime: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  flightSlot: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  flightFareTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  flightFareText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  dowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dowLabel: {
    width: 36,
    fontSize: 13,
    color: '#444',
    fontWeight: '500',
  },
  dowBar: {
    height: 14,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  dowFare: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    width: 40,
  },
  dowBest: {
    fontSize: 11,
    color: '#2eb82e',
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timeLabel: {
    width: 70,
    fontSize: 13,
    fontWeight: '600',
    color: '#222',
  },
  timeSlot: {
    flex: 1,
    fontSize: 12,
    color: '#888',
  },
  timeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  tipsSection: {
    marginBottom: 4,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 5,
  },
  tipIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
  },
  footer: {
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 11,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 16,
  },
});

module.exports = SouthwestFlightTracker;
