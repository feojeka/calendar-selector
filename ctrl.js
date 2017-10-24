/**
 * Created by evgenygolubev on 17.08.17.
 */

export class CalendarSelectorComponentController {
  constructor($window, HotelFilterService, AppConfiguration) {

    this._HotelFilterService = HotelFilterService;
    this._AppConfiguration = AppConfiguration;

    this.filter = this._HotelFilterService.getFilter();
    this.m = $window.moment;
    this.prevDate = this.m();
    this.nextDate = this.m().add(1, 'M');
    this.weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    this.$onInit = this._onInit;
  }

  _onInit() {

    if (this._rangeExist()) {
      this.prevDate = this.m(this.filter.checkIn);
      this.nextDate = this.m(this.filter.checkIn).add(1, 'M');
    }
    this._buildCalendars();
  }

  _buildCalendars() {

    this.prevMonthWeeks = this._buildMonthWeeks(this.prevDate);
    this.nextMonthWeeks = this._buildMonthWeeks(this.nextDate);
    this.disactivePrev = !this._prevIsAvailable();
  }

  /**
   * Build [week][day] array for month from date param
   *
   * @param {Moment} date
   * @returns {Array}
   * @private
   */
  _buildMonthWeeks(date) {

    let year = date.year();
    let month = date.month();
    // First day of month
    let monthStartDay = this.m([year, month]);
    // Week number of month start day 0-6
    let weekNumberOfMonthStartDay = monthStartDay.day();
    let daysInMoth = monthStartDay.daysInMonth();
    let today = this.m();
    // Count increment of days
    let countDays = 1;
    // Returned month weeks days array
    let monthWeeks = [];
    // checkIn date (from hotels filter)
    let checkInDate = this.m(this.filter.checkIn);
    // checkOut date (from hotels filter)
    let checkOutDate = this.m(this.filter.checkOut);
    // Range of checkIn checkOut
    let rangeCheckInCheckOut = this._rangeExist() ? this.m.range(checkInDate, checkOutDate) : null;

    // Weeks cycle. Max weeks in month can be 6.
    for (let i = 0; i < 6; i++) {
      monthWeeks[i] = [];
      // Days cycle. Check day and add some properties for it.
      for (let j = 0; j <= 6; j++) {
        // Check if days inside in current month
        let inMonth = true;
        // Check if day need to be checked
        let checked = false;
        // Check if day in month but was expire.
        let expired = false;
        // Value for view
        let value = countDays;
        // Moment object for day
        let date = this.m([year, month, countDays]);
        // Check if day is checkIn
        let isCheckIn = false;
        // Check if day is checkOut
        let isCheckOut = false;
        // Check if we have only checkIn day
        let onlyCheckIn = false;

        if (countDays > daysInMoth) {
          inMonth = false;
          checked = false;
          expired = false;
          value = '';
          date = null;
        }

        if (i === 0) {
          if (j < weekNumberOfMonthStartDay) {
            inMonth = false;
            checked = false;
            expired = false;
            value = '';
            date = null;
            countDays = 0;
          }
        }

        if ((countDays <= daysInMoth && this.m([year, month, countDays]).diff(today, 'days') < 0)
          || this.m([year, month, countDays]).diff(today, 'days') > this._AppConfiguration.maxAvailableDays) {
          expired = true;
        }

        if (countDays <= daysInMoth && rangeCheckInCheckOut) {
          if (rangeCheckInCheckOut.contains(this.m([year, month, countDays]))) {
            checked = true;
            if (checkInDate.date() === countDays && checkInDate.month() === month) {
              isCheckIn = true;
            }
            if (checkOutDate.date() === countDays && checkOutDate.month() === month) {
              isCheckOut = true;
            }
          }
        } else {
          if (checkInDate.date() === countDays && checkInDate.month() === month) {
            checked = true;
            onlyCheckIn = true;
          }
        }

        // Create day object with params
        monthWeeks[i][j] = {
          inMonth: inMonth,
          checked: checked,
          expired: expired,
          value: value,
          date: date,
          isCheckIn: isCheckIn,
          isCheckOut: isCheckOut,
          onlyCheckIn: onlyCheckIn
        };

        countDays++;
      }
    }

    return monthWeeks;
  }

  _rangeExist() {

    return this.filter.checkIn && this.filter.checkOut;
  }

  _prevIsAvailable() {

    let today = this.m();

    return this.prevDate.diff(today, 'months', true) > 0;
  }

  next() {

    this.prevDate.add(1, 'M');
    this.nextDate.add(1, 'M');
    this._buildCalendars();
  }

  prev() {

    if (this._prevIsAvailable()) {
      this.prevDate.add(-1, 'M');
      this.nextDate.add(-1, 'M');
      this._buildCalendars();
    }
  }

  /**
   * Select day method. There is we check selected day
   * on some properties, configure hotels filter checkIn
   * and check out params and build calendars;
   *
   * @param {Object} day
   */
  selectDate(day) {

    let formattedDate, diff;

    if (!day.inMonth || day.expired) {
      return;
    }

    // Reset date selected flag
    this.states.dateSelected = true;
    formattedDate = day.date.format('YYYY-MM-DD');

    if (this._rangeExist()) {
      this.filter.checkIn = formattedDate;
      this.filter.checkOut = '';
      this._buildCalendars();
      return;
    }

    if (!this.filter.checkIn && !this.filter.checkOut) {
      this.filter.checkIn = formattedDate;
      this._buildCalendars();
      return;
    }

    if (this.filter.checkIn && !this.filter.checkOut) {
      if (this.m(this.filter.checkIn).date() === day.date.date() &&
          this.m(this.filter.checkIn).month() === day.date.month() &&
          this.m(this.filter.checkIn).year() === day.date.year()) {
        return;
      }

      // Date range was selected
      this.states.dateSelected = true;
      diff = day.date.diff(this.m(this.filter.checkIn), 'days');

      if (diff < 0) {
        if (diff < -(this._AppConfiguration.maxRangeDays)) {
          this.filter.checkIn = formattedDate;
        } else {
          this.filter.checkOut = this.filter.checkIn;
          this.filter.checkIn = formattedDate;
        }
      } else {
        if (diff > this._AppConfiguration.maxRangeDays) {
          this.filter.checkIn = formattedDate;
        } else {
          this.filter.checkOut = formattedDate;
        }
      }
      this._buildCalendars();
      return;
    }
  }

}

CalendarSelectorComponentController.$inject = ['$window', 'HotelFilterService', 'AppConfiguration'];
