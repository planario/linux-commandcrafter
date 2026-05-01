/* Alpine.js component definitions. Registered before Alpine boots. */
window.LCC = window.LCC || {};

document.addEventListener('alpine:init', () => {
  Alpine.data('builderPane', () => ({
    builderId: null,
    bind(id) {
      this.builderId = id;
      // Trigger an initial build so the user sees a non-empty preview.
      this.$nextTick(() => {
        const form = this.$el.querySelector('form');
        if (form && window.htmx) {
          window.htmx.trigger(form, 'builder-refresh');
        }
      });
    },
    reset() {
      const form = this.$el.querySelector('form');
      if (!form) return;
      form.reset();
      // Restore checked/value attributes from the server template (form.reset() handles defaults).
      form.dispatchEvent(new Event('builder-refresh'));
    },
  }));

  Alpine.data('analyzer', () => ({
    command: '',
    loading: false,
    cooldown: 0,
    error: '',
    result: null,
    safetyClass: '',
    onKey(event) {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        this.analyze();
      }
    },
    async analyze() {
      this.error = ''; this.result = null;
      const cmd = (this.command || '').trim();
      if (!cmd) return;
      this.loading = true;
      try {
        const resp = await fetch('/api/analyze', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ command: cmd }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          this.error = data.error || `Request failed (${resp.status}).`;
          if (resp.status === 429) {
            const m = /(\d+)s/.exec(this.error);
            this.startCooldown(m ? parseInt(m[1], 10) : 10);
          }
          return;
        }
        this.result = data;
        this.safetyClass = 'is-' + (data.safetyLevel || 'caution').toLowerCase();
        this.startCooldown(10);
      } catch (e) {
        this.error = 'Network error: ' + e.message;
      } finally {
        this.loading = false;
      }
    },
    startCooldown(seconds) {
      this.cooldown = seconds;
      const tick = () => {
        if (this.cooldown <= 0) return;
        this.cooldown -= 1;
        if (this.cooldown > 0) setTimeout(tick, 1000);
      };
      setTimeout(tick, 1000);
    },
  }));

  Alpine.data('aliasView', () => ({
    aliases: [],
    editingId: null,
    form: { name: '', command: '', description: '', runInSubshell: false },
    init() {
      this.aliases = LCC.aliases.list();
      window.addEventListener('lcc:storage', e => {
        if (e.detail && e.detail.key === 'commandAliases') this.aliases = LCC.aliases.list();
      });
    },
    save() {
      if (!this.form.name || !this.form.command) return;
      const payload = { ...this.form };
      if (this.editingId) payload.id = this.editingId;
      LCC.aliases.save(payload);
      this.aliases = LCC.aliases.list();
      this.resetForm();
    },
    edit(alias) {
      this.editingId = alias.id;
      this.form = {
        name: alias.name || '',
        command: alias.command || '',
        description: alias.description || '',
        runInSubshell: !!alias.runInSubshell,
      };
    },
    remove(id) {
      if (!confirm('Delete this alias?')) return;
      LCC.aliases.remove(id);
      this.aliases = LCC.aliases.list();
      if (this.editingId === id) this.resetForm();
    },
    resetForm() {
      this.editingId = null;
      this.form = { name: '', command: '', description: '', runInSubshell: false };
    },
    aliasLine(alias) {
      const cmd = alias.runInSubshell ? `(${alias.command})` : alias.command;
      const escaped = (cmd || '').replace(/'/g, "'\\''");
      return `alias ${alias.name}='${escaped}'`;
    },
    installLine(alias) {
      const line = this.aliasLine(alias);
      const escaped = line.replace(/'/g, "'\\''");
      return `echo '${escaped}' >> ~/.bashrc && . ~/.bashrc`;
    },
  }));

  Alpine.data('historyView', () => ({
    entries: [],
    init() {
      this.entries = LCC.history.list();
      window.addEventListener('lcc:storage', e => {
        if (e.detail && e.detail.key === 'commandHistory') this.entries = LCC.history.list();
      });
    },
    formatTime(ts) { return LCC.formatTime(ts); },
    favorite(entry) {
      LCC.favorites.toggle(entry.command, entry.type);
    },
    copy(cmd) { LCC.copy(cmd); },
    clearAll() {
      if (!confirm('Clear your entire command history? This cannot be undone.')) return;
      LCC.history.clear();
      this.entries = [];
    },
  }));

  Alpine.data('favoritesView', () => ({
    entries: [],
    init() {
      this.entries = LCC.favorites.list();
      window.addEventListener('lcc:storage', e => {
        if (e.detail && e.detail.key === 'commandFavorites') this.entries = LCC.favorites.list();
      });
    },
    formatTime(ts) { return LCC.formatTime(ts); },
    remove(entry) {
      LCC.favorites.remove(entry.command);
      this.entries = LCC.favorites.list();
    },
    copy(cmd) { LCC.copy(cmd); },
  }));

  // Ansible playbook editor state.
  const ANSIBLE_PRESETS = {
    package: { label: 'Install (Generic)', name: 'Ensure package is installed', module: 'package', args: { name: 'nginx', state: 'present' } },
    apt:     { label: 'APT: Update & Install', name: 'Update cache and install via APT', module: 'apt', args: { name: 'nginx', state: 'present', update_cache: 'yes' } },
    dnf:     { label: 'DNF: Update & Install', name: 'Update cache and install via DNF', module: 'dnf', args: { name: 'nginx', state: 'present', update_cache: 'yes' } },
    yum:     { label: 'YUM: Update & Install', name: 'Update cache and install via YUM', module: 'yum', args: { name: 'nginx', state: 'present', update_cache: 'yes' } },
    service: { label: 'Manage Service', name: 'Ensure service is started', module: 'service', args: { name: 'nginx', state: 'started', enabled: 'yes' } },
    copy:    { label: 'Copy File', name: 'Copy local config to remote', module: 'copy', args: { src: '/local/path/file.conf', dest: '/etc/file.conf', mode: '0644' } },
    command: { label: 'Run Command', name: 'Execute shell command', module: 'command', args: { cmd: 'uptime' } },
    user:    { label: 'Manage User', name: 'Create deployment user', module: 'user', args: { name: 'deploy', state: 'present', shell: '/bin/bash' } },
  };

  Alpine.data('ansibleEditor', () => ({
    playbookName: 'My Automation Playbook',
    hosts: 'all',
    become: true,
    tasks: [],
    presetList: Object.keys(ANSIBLE_PRESETS).map(k => ({ key: k, label: ANSIBLE_PRESETS[k].label })),
    init() { /* nothing special */ },
    addTask(presetKey) {
      const preset = ANSIBLE_PRESETS[presetKey];
      if (!preset) return;
      this.tasks.push({
        id: LCC.uuid(),
        name: preset.name,
        module: preset.module,
        args: { ...preset.args },
      });
      this.bump();
    },
    removeTask(idx) {
      this.tasks.splice(idx, 1);
      this.bump();
    },
    bump() {
      this.$nextTick(() => {
        this.$el.closest('section').dispatchEvent(new Event('builder-refresh'));
      });
    },
  }));

  Alpine.data('bashEditor', () => ({
    blocks: [{ id: LCC.uuid(), type: 'shebang', data: { interpreter: '/bin/bash' } }],
    blockTypes: ['comment', 'variable', 'echo', 'read', 'command', 'if', 'for'],
    init() { /* default state above */ },
    addBlock(type) {
      const factories = {
        comment:  () => ({ type, data: { text: '' } }),
        variable: () => ({ type, data: { name: 'MY_VAR', value: '"hello"' } }),
        echo:     () => ({ type, data: { text: '"Hello, $MY_VAR"' } }),
        read:     () => ({ type, data: { prompt: 'Enter value: ', variable: 'USER_INPUT' } }),
        command:  () => ({ type, data: { command: 'date' } }),
        if:       () => ({ type, data: { condition: '[ -f "file.txt" ]', mainBlocks: [], elseBlocks: [] } }),
        for:      () => ({ type, data: { variable: 'i', list: '1 2 3', mainBlocks: [] } }),
      };
      const make = factories[type];
      if (!make) return;
      const block = make();
      block.id = LCC.uuid();
      this.blocks.push(block);
      this.bump();
    },
    removeBlock(idx) {
      this.blocks.splice(idx, 1);
      this.bump();
    },
    moveBlock(idx, dir) {
      const target = idx + dir;
      if (target < 0 || target >= this.blocks.length) return;
      const tmp = this.blocks[idx];
      this.blocks[idx] = this.blocks[target];
      this.blocks[target] = tmp;
      this.bump();
    },
    bump() {
      this.$nextTick(() => {
        this.$el.closest('section').dispatchEvent(new Event('builder-refresh'));
      });
    },
  }));
});
