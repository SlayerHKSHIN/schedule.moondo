import fs from 'fs';
import path from 'path';

const indexCss = fs.readFileSync(path.join(__dirname, '..', 'index.css'), 'utf8');

const ruleFor = (selector) => {
  const match = indexCss.match(new RegExp(`${selector}\\s*\\{([^}]+)\\}`));
  return match ? match[1] : '';
};

test('keeps the document element as the only vertical page scroller', () => {
  expect(ruleFor('html')).toMatch(/overflow-y:\s*auto/);
  expect(ruleFor('body')).toMatch(/overflow:\s*visible/);
  expect(ruleFor('#root')).toMatch(/overflow:\s*visible/);
  expect(indexCss).not.toMatch(/overscroll-behavior:\s*contain/);
});
