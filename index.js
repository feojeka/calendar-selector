/**
 * Created by evgenygolubev on 17.08.17.
 */

export const CALENDAR_SELECTOR_COMPONENT_NAME = 'calendarSelectorComponent';

export const calendarSelectorComponent = {
  bindings: {
    states: '=',
    activeTab: '=',
    clearActiveTab: '&'
  },
  controller: require('./ctrl.js').CalendarSelectorComponentController,
  template: require('./tpl.html')
};
