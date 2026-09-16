import type { ModuleEntry } from "@modules";
import moduleConfig from "./modules.config.json" with { type: "json" };
import * as Chord from "./Chord";
import * as Scale from "./Scale";
import * as Progression from "./Progression";
import * as Metronome from "./Metronome";
import * as Tuner from "./Tuner";

type Settings = { enabled?: boolean; allowMultipleInstances?: boolean };

const availableModules: Record<string, ModuleEntry> = {
  Chord: { component: Chord.default, config: Chord.config },
  Scale: { component: Scale.default, config: Scale.config },
  Progression: { component: Progression.default, config: Progression.config },
  Metronome: { component: Metronome.default, config: Metronome.config },
  Tuner: { component: Tuner.default, config: Tuner.config },
};

// Accept both the flat config and the grouped comp_set config. The board reads
// allowMultipleInstances from the flat form only, so it is copied onto each config here.
const rawConfig: Record<string, unknown> = moduleConfig;
const group = rawConfig.comp_set as { mods?: Record<string, Settings> } | undefined;
const settings = (group?.mods ?? rawConfig) as Record<string, Settings>;

const modules: Record<string, ModuleEntry> = Object.fromEntries(
  Object.entries(availableModules)
    .filter(([key]) => settings[key]?.enabled !== false)
    .map(([key, entry]): [string, ModuleEntry] => {
      const multiple = settings[key]?.allowMultipleInstances;
      return [key, multiple === undefined ? entry : { ...entry, config: { ...entry.config, allowMultipleInstances: multiple } }];
    }),
);

export default modules;
