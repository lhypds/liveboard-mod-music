import type { ModuleEntry } from "@modules";
import moduleConfig from "./modules.config.json" with { type: "json" };
import * as Chord from "./Chord";

const settings = moduleConfig.comp_set.mods.Chord;
const modules: Record<string, ModuleEntry> = settings.enabled ? {
  Chord: {
    component: Chord.default,
    config: { ...Chord.config, allowMultipleInstances: settings.allowMultipleInstances },
  },
} : {};

export default modules;
