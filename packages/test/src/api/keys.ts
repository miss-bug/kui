export const keys = {
  Numpad1: '\uE01B',
  Numpad2: '\uE01C',
  PageUp: '\uE00E',
  PageDown: '\uE00F',
  End: '\uE010',
  Home: '\uE011',
  Delete: '\uE017',
  BACKSPACE: '\uE003',
  TAB: '\uE004',
  ENTER: '\uE007',
  DELETE: '\uE017',
  CONTROL: '\uE009',
  META: '\uE03D',
  ESCAPE: '\uE00C',
  ctrlOrMeta: process.platform === 'darwin' ? '\uE03D' : '\uE009',

  // Send NULL to release Control key at the end of the call, otherwise the state of Control is kept between calls
  ctrlN: ['\uE009', 'n', 'NULL'],
  ctrlP: ['\uE009', 'p', 'NULL'],
  ctrlC: ['\uE009', 'c', 'NULL']
}
