/**
 * @jest-environment jsdom
 *
 * Unit tests for the MiniASM UI: DOM structure, lang, and config used by the UI.
 * Full UI (Monaco, Blockly) is not loaded here; we test structure and dependencies.
 */
const path = require('path');
const fs = require('fs');

describe('MiniASM UI', () => {
  describe('index.html structure', () => {
    let html;

    beforeAll(() => {
      const htmlPath = path.join(__dirname, '../index.html');
      html = fs.readFileSync(htmlPath, 'utf8');
    });

    it('has mode navigation with sandbox button and dropdown', () => {
      expect(html).toMatch(/id="mode-nav"/);
      expect(html).toMatch(/data-mode="sandbox"/);
      expect(html).toMatch(/Sandbox/);
      expect(html).toMatch(/id="nav-dropdown"/);
      expect(html).toMatch(/id="nav-dropdown-toggle"/);
      expect(html).toMatch(/id="nav-dropdown-menu"/);
    });
    it('has debug cheat button in nav', () => {
      expect(html).toMatch(/id="btn-cheat-progress"/);
    });
    it('has editor panel with Code/Blocks toggle', () => {
      expect(html).toMatch(/id="btn-mode-code"/);
      expect(html).toMatch(/id="btn-mode-blocks"/);
      expect(html).toMatch(/class="[^"]*code-wrap/);
      expect(html).toMatch(/class="[^"]*blocks-wrap/);
    });
    it('has Run, Step, Reset buttons', () => {
      expect(html).toMatch(/id="btn-run"/);
      expect(html).toMatch(/id="btn-step"/);
      expect(html).toMatch(/id="btn-reset"/);
    });
    it('has test button (for exercises)', () => {
      expect(html).toMatch(/id="btn-panel-test"/);
    });
    it('has status element', () => {
      expect(html).toMatch(/id="status"/);
    });
    it('has registers table', () => {
      expect(html).toMatch(/id="registers-table"/);
      expect(html).toMatch(/<thead/);
      expect(html).toMatch(/<tbody/);
    });
    it('has memory table', () => {
      expect(html).toMatch(/id="memory-table"/);
      expect(html).toMatch(/id="memory-thead-row"/);
      expect(html).toMatch(/<tbody/);
    });
    it('has exercise panel with expected elements', () => {
      expect(html).toMatch(/id="exercise-panel"/);
      expect(html).toMatch(/id="ex-title"/);
      expect(html).toMatch(/id="ex-goal"/);
      expect(html).toMatch(/id="ex-body"/);
      expect(html).toMatch(/id="ex-available"/);
      expect(html).toMatch(/id="btn-panel-test"/);
      expect(html).toMatch(/id="btn-hint"/);
      expect(html).toMatch(/id="ex-hints"/);
      expect(html).toMatch(/id="test-results"/);
    });
    it('has Monaco editor container', () => {
      expect(html).toMatch(/id="monaco-editor"/);
    });
    it('has Blockly workspace container', () => {
      expect(html).toMatch(/id="blockly-workspace"/);
    });
  });

  describe('lang (MiniASMLang)', () => {
    beforeAll(() => {
      require(path.join(__dirname, '../js/config.js'));
      require(path.join(__dirname, '../js/lang.js'));
      require(path.join(__dirname, '../js/lang-fr.js'));
    });

    it('T returns string for known key in English', () => {
      window.MiniASMLang.setCurrent('en');
      const T = window.MiniASMLang.T;
      expect(T('stopped')).toBe('Stopped');
      expect(T('halted')).toBe('Halted');
      expect(T('btnRun')).toBe('Run');
      expect(T('btnStep')).toBe('Step');
      expect(T('btnReset')).toBe('Reset');
    });
    it('T returns string for known key in French', () => {
      window.MiniASMLang.setCurrent('fr');
      const T = window.MiniASMLang.T;
      expect(T('stopped')).toBe('Arrêté');
      expect(T('halted')).toBe('Terminé');
      expect(T('btnRun')).toBe('Exécuter');
      expect(T('btnStep')).toBe('Pas à pas');
      expect(T('btnReset')).toBe('Réinitialiser');
      window.MiniASMLang.setCurrent('en');
    });
    it('T substitutes placeholders', () => {
      const T = window.MiniASMLang.T;
      expect(T('challengePrefix', { id: 1, title: 'Addition' })).toMatch(/Addition/);
      expect(T('tutorialPrefix', { id: 0, title: 'Hello' })).toMatch(/Hello/);
      expect(T('hintBox', { num: 1, total: 3, text: 'Hello' })).toMatch(/1/);
      expect(T('hintBox', { num: 1, total: 3, text: 'Hello' })).toMatch(/3/);
      expect(T('hintBox', { num: 1, total: 3, text: 'Hello' })).toMatch(/Hello/);
    });
    it('T supports nested translation keys', () => {
      window.MiniASMLang.setCurrent('en');
      expect(window.MiniASMLang.T('exercises.0.title')).toBe('Hello, Machine!');

      window.MiniASMLang.setCurrent('fr');
      expect(window.MiniASMLang.T('exercises.0.title')).toBe('Bonjour, Machine !');

      window.MiniASMLang.setCurrent('en');
    });
    it('T can return non-string values for key-path nodes', () => {
      const ex = window.MiniASMLang.T('exercises.0');
      expect(ex).toHaveProperty('title');
      expect(ex).toHaveProperty('hints');
      expect(Array.isArray(ex.hints)).toBe(true);
    });
    it('T returns key for unknown key', () => {
      const T = window.MiniASMLang.T;
      expect(T('nonexistentKey')).toBe('nonexistentKey');
    });
    it('LANGUAGES has at least one language', () => {
      expect(window.MiniASMLang.LANGUAGES.length).toBeGreaterThanOrEqual(1);
    });
    it('current() returns language object', () => {
      const current = window.MiniASMLang.current();
      expect(current).toHaveProperty('code');
      expect(current).toHaveProperty('name');
      expect(current).toHaveProperty('exercises');
    });
    it('supports both English and French language packs', () => {
      expect(window.MiniASMLang.setCurrent('en')).toBe(true);
      expect(window.MiniASMLang.current().code).toBe('en');
      expect(window.MiniASMLang.T('btnTest')).toBe('▶ Test');

      expect(window.MiniASMLang.setCurrent('fr')).toBe(true);
      expect(window.MiniASMLang.current().code).toBe('fr');
      expect(window.MiniASMLang.T('btnTest')).toBe('▶ Tester');

      window.MiniASMLang.setCurrent('en');
    });
    it('can switch to French language pack', () => {
      const ok = window.MiniASMLang.setCurrent('fr');
      expect(ok).toBe(true);
      expect(window.MiniASMLang.T('btnRun')).toBe('Exécuter');
      window.MiniASMLang.setCurrent('en');
    });
    it('builds exercises under both English and French locales', () => {
      const exRel = '../js/exercises.js';
      const exResolved = require.resolve(path.join(__dirname, exRel));

      // English build
      window.MiniASMLang.setCurrent('en');
      delete window.MiniASMExercises;
      delete require.cache[exResolved];
      jest.isolateModules(() => require(exRel));
      expect(window.MiniASMExercises.EXERCISES.length).toBeGreaterThan(0);
      expect(window.MiniASMExercises.EXERCISES[0].title).toMatch(/Hello, Machine!/);

      // French build
      window.MiniASMLang.setCurrent('fr');
      delete window.MiniASMExercises;
      delete require.cache[exResolved];
      jest.isolateModules(() => require(exRel));
      expect(window.MiniASMExercises.EXERCISES.length).toBeGreaterThan(0);
      expect(window.MiniASMExercises.EXERCISES[0].title).toMatch(/Bonjour, Machine !/);

      // Reset to English for the rest of the suite
      window.MiniASMLang.setCurrent('en');
      delete window.MiniASMExercises;
      delete require.cache[exResolved];
      jest.isolateModules(() => require(exRel));
    });
  });

  describe('config (MiniASMConfig)', () => {
    beforeAll(() => {
      if (!window.MiniASMConfig) {
        require(path.join(__dirname, '../js/config.js'));
      }
    });

    it('has registers.count and prefix', () => {
      const CFG = window.MiniASMConfig;
      expect(CFG.registers.count).toBe(4);
      expect(CFG.registers.prefix).toBe('r');
    });
    it('has memory.size and columns', () => {
      const CFG = window.MiniASMConfig;
      expect(CFG.memory.size).toBe(64);
      expect(CFG.memory.columns).toBe(16);
    });
    it('has REG_NAMES array', () => {
      expect(window.MiniASMConfig.REG_NAMES).toEqual(['r0', 'r1', 'r2', 'r3']);
    });
    it('has Register enum', () => {
      const R = window.MiniASMConfig.Register;
      expect(R.R0).toBe(0);
      expect(R.R3).toBe(3);
    });
  });
});
