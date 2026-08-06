/**
 * Panel layout, on dockview — the same library the platform's other editor
 * runtime (tic80-web-editor) uses, so a participant meets one set of manners
 * across workshops: drag a divider to resize, drag a tab to rearrange, double
 * click a tab to maximise.
 *
 * The panels are the app's existing DOM, moved rather than rebuilt: the code
 * editor, the exercise (statement header, Test, results), and the machine
 * (registers and memory). Nothing in ui.js needs to know this happened, beyond
 * being told when its panel changed size so Monaco and Blockly can re-measure.
 *
 * `dockview-core` is the framework-free build; the UMD file carries its own
 * CSS. If it is missing the app falls back to the plain CSS split, so a
 * vendor/ that was never fetched degrades instead of breaking.
 */
(function () {
  var STORAGE_KEY = 'miniasm-layout';
  var resizeHandlers = [];

  function api() {
    return window['dockview-core'] || window.dockviewCore || null;
  }

  function panelDefs() {
    var editor = document.querySelector('.panel-editor');
    var state = document.querySelector('.panel-state');
    if (!editor || !state) return null;

    // The machine is what is left of the state panel once the exercise moves
    // out: options, registers, memory.
    var machine = document.createElement('div');
    machine.className = 'dock-machine';
    ['.state-options', '.table-block.registers', '.table-block.memory']
      .forEach(function (selector) {
        var node = state.querySelector(selector);
        if (node) machine.appendChild(node);
      });

    return {
      code: { title: 'Code', element: editor },
      exercise: { title: 'Exercice', element: document.getElementById('exercise-panel') },
      machine: { title: 'Machine', element: machine },
    };
  }

  function build() {
    var dockview = api();
    var root = document.getElementById('root');
    var defs = panelDefs();
    if (!dockview || !root || !defs) return null;

    var host = document.createElement('div');
    host.id = 'dock';
    host.className = 'dockview-theme-dark';
    root.innerHTML = '';
    root.appendChild(host);

    var component = dockview.createDockview(host, {
      className: 'dockview-theme-dark',
      createComponent: function (options) {
        var def = defs[options.name];
        var element = document.createElement('div');
        element.className = 'dock-panel';
        if (def && def.element) {
          def.element.classList.add('dock-content');
          element.appendChild(def.element);
        }
        return {
          element: element,
          init: function () { /* content is already built by ui.js */ },
        };
      },
    });

    // Default: a vertical split — code on the left, the machine beside it, with
    // the exercise under the machine. Everything is draggable from here, and
    // whatever the participant ends up with is what comes back next time.
    //
    // The sizes matter more than they look. Embedded, the whole app is about
    // half a screen, and dockview's own default gives the second group whatever
    // is left — which was a strip too narrow to read a register table in. The
    // machine needs a real share, and a floor for when the pane is dragged
    // narrow.
    function defaultLayout() {
      var width = host.clientWidth || 900;
      var height = host.clientHeight || 600;
      var machineWidth = Math.max(300, Math.round(width * 0.42));

      component.addPanel({ id: 'code', component: 'code', title: defs.code.title });
      component.addPanel({
        id: 'machine', component: 'machine', title: defs.machine.title,
        position: { referencePanel: 'code', direction: 'right' },
        initialWidth: machineWidth,
      });
      component.addPanel({
        id: 'exercise', component: 'exercise', title: defs.exercise.title,
        position: { referencePanel: 'machine', direction: 'below' },
        initialHeight: Math.round(height * 0.45),
      });
    }

    var restored = false;
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        component.fromJSON(JSON.parse(saved));
        restored = component.panels.length > 0;
      }
    } catch (e) {
      restored = false;
    }
    if (!restored) {
      try { component.clear(); } catch (e) { /* nothing to clear */ }
      defaultLayout();
    }

    var save = function () {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(component.toJSON()));
      } catch (e) { /* private mode, or quota */ }
    };
    component.onDidLayoutChange(save);

    // Monaco and Blockly both measure themselves once and need telling when
    // their box changes — which, with draggable dividers, is often.
    component.onDidLayoutChange(notifyResize);
    window.addEventListener('resize', notifyResize);

    return component;
  }

  function notifyResize() {
    for (var i = 0; i < resizeHandlers.length; i++) {
      try { resizeHandlers[i](); } catch (e) { /* one bad handler is not fatal */ }
    }
  }

  window.MiniASMLayout = {
    /** Called by ui.js once its DOM exists. Returns false if dockview is absent. */
    start: function () {
      var component = build();
      this.component = component || null;
      if (component) document.body.classList.add('docked');
      return !!component;
    },
    /** Re-measure hook for anything that caches its own size. */
    onResize: function (handler) { resizeHandlers.push(handler); },
    /** Put the panels back where they started. */
    reset: function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
      location.reload();
    },
  };
})();
