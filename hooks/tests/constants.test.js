const test = require('node:test');
const assert = require('node:assert/strict');
const constants = require('../lib/constants.json');

test('constants: DESIGN_TOOLS에 figma/zeplin 항목이 있다', () => {
  assert.ok(constants.DESIGN_TOOLS, 'DESIGN_TOOLS 존재');
  assert.equal(constants.DESIGN_TOOLS.figma.label, 'Figma');
  assert.equal(constants.DESIGN_TOOLS.zeplin.label, 'Zeplin');
  assert.ok(Array.isArray(constants.DESIGN_TOOLS.figma.detectToolSuffixes));
  assert.ok(constants.DESIGN_TOOLS.figma.detectToolSuffixes.includes('get_design_context'));
  assert.ok(Array.isArray(constants.DESIGN_TOOLS.zeplin.detectToolSuffixes));
});
