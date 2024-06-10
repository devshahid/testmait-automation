/**
 * Collection of components to be registered in the
 * TestMaiT dependency injection container and included
 * in tests via the tesmait.conf.js configuration file
 */
module.exports = {
  Assert: './lib/components/assert.js',
  ButtonLink: './lib/components/button.js',
  CheckBox: './lib/components/checkbox.js',
  DatePicker: './lib/components/date_picker.js',
  Dropdown: './lib/components/dropdown.js',
  Filter: './lib/components/filter.js',
  LmpApi: './lib/components/lmp/lmp_api_handler.js',
  Mobile: './lib/components/mobile_handlers.js',
  OpenApi: './lib/components/open_api/open_api_handler.js',
  Table: './lib/components/table.js',
  Textbox: './lib/components/textbox.js',
  SoapApi: './lib/components/soap_api_handler.js',
  USSD: './lib/components/mobile/ussd.js',
  MobileComponent: './lib/components/mobile/mobilecomponent.js',
  G2Ussd: './lib/components/mobile/g2ussd.js',
  G2Handlers: './lib/components/g2handlers.js',
  IFrame: './lib/components/frame.js',
};
