import { BuilderPlugin } from '../types';

const registry: BuilderPlugin[] = [];

/**
 * Register a new command builder plugin.
 *
 * Call this once per builder, typically at module load time (side-effect import).
 * The id must be unique across all registered builders.
 *
 * Example — adding a custom builder in a fork:
 *
 *   import { registerBuilder } from './builders/registry';
 *   import { MyBuilder } from './components/MyBuilder';
 *
 *   registerBuilder({ id: 'mytool', label: 'mytool', component: MyBuilder });
 */
export function registerBuilder(plugin: BuilderPlugin): void {
  if (registry.some(p => p.id === plugin.id)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[registry] Builder "${plugin.id}" is already registered — skipping.`);
    }
    return;
  }
  registry.push(plugin);
}

/** Returns all registered builders sorted alphabetically by id. */
export function getBuilders(): ReadonlyArray<BuilderPlugin> {
  return [...registry].sort((a, b) => a.id.localeCompare(b.id));
}

/** Looks up a single registered builder by id. */
export function getBuilder(id: string): BuilderPlugin | undefined {
  return registry.find(p => p.id === id);
}
