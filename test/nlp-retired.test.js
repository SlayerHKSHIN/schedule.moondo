const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');

test('unused NLP endpoint and embedded LLM client stay retired', () => {
  const serverSource = fs.readFileSync(path.join(projectRoot, 'server.js'), 'utf8');

  assert.doesNotMatch(serverSource, /routes\/nlp/);
  assert.doesNotMatch(serverSource, /\/api\/nlp/);
  assert.equal(fs.existsSync(path.join(projectRoot, 'routes', 'nlp.js')), false);
  assert.equal(fs.existsSync(path.join(projectRoot, 'utils', 'llmClient.js')), false);
});
