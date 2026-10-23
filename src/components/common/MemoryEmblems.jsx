import {
  Binoculars,
  Feather,
  Fish,
  Flame,
  Scale,
  Waypoints,
  Zap,
} from 'lucide-react'
import ElephantIcon from './icons/ElephantIcon'
import SheepIcon from './icons/SheepIcon'

const TONE_BY_STATE = {
  low: 'memory-low',
  mid: 'memory-mid',
  high: 'memory-high',
}

const toValue = (raw, fallback, min, max) => {
  const numeric = Number(raw)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(max, Math.max(min, numeric))
}

const stateOf = (value, lowBelow, highAbove) => {
  if (value <= lowBelow) return 'low'
  if (value >= highAbove) return 'high'
  return 'mid'
}

const EMBLEM_DEFS = [
  {
    key: 'cognitive-balance',
    field: 'affinityBiasMultiplier',
    min: 0,
    max: 2,
    lowBelow: 0.75,
    highAbove: 1.35,
    titleKey: 'bot.affinity_bias_title',
    titleDefault: 'Cognitive Balance',
    variants: {
      low: {
        Icon: Zap,
        labelKey: 'bot.memory_emblem.cognitive_low_label',
        labelDefault: 'Logical',
        descKey: 'bot.memory_emblem.cognitive_low_desc',
        descDefault:
          'Shortcut recall: the bot jumps straight to its core through the most efficient logical path.',
      },
      mid: {
        Icon: Scale,
        labelKey: 'bot.memory_emblem.cognitive_mid_label',
        labelDefault: 'Balanced Cognition',
        descKey: 'bot.memory_emblem.cognitive_mid_desc',
        descDefault:
          'A healthy mix of shortcut logic and passionate, high-affinity pathways.',
      },
      high: {
        Icon: Flame,
        labelKey: 'bot.memory_emblem.cognitive_high_label',
        labelDefault: 'Emotional',
        descKey: 'bot.memory_emblem.cognitive_high_desc',
        descDefault:
          'The bot travels to its core through emotionally charged, high-affinity pathways.',
      },
    },
  },
  {
    key: 'forgetting-speed',
    field: 'forgetfulnessMultiplier',
    min: 0,
    max: 2,
    lowBelow: 0.75,
    highAbove: 1.35,
    titleKey: 'bot.forgetfulness_title',
    titleDefault: 'Forgetting Speed',
    variants: {
      low: {
        Icon: ElephantIcon,
        labelKey: 'bot.memory_emblem.forget_low_label',
        labelDefault: 'Elephant Memory',
        descKey: 'bot.memory_emblem.forget_low_desc',
        descDefault:
          'Nothing fades: memories persist almost permanently and pruning barely touches them.',
      },
      mid: {
        Icon: Scale,
        labelKey: 'bot.memory_emblem.forget_mid_label',
        labelDefault: 'Balanced Memory',
        descKey: 'bot.memory_emblem.forget_mid_desc',
        descDefault:
          'Memories cool down at a natural pace; unused paths fade gradually.',
      },
      high: {
        Icon: Fish,
        labelKey: 'bot.memory_emblem.forget_high_label',
        labelDefault: 'Alzheimer',
        descKey: 'bot.memory_emblem.forget_high_desc',
        descDefault:
          'Memories evaporate almost instantly; the bot lives in the moment and forgets old paths fast.',
      },
    },
  },
  {
    key: 'associative-scope',
    field: 'recallPathLimitMultiplier',
    min: 0,
    max: 2,
    lowBelow: 0.75,
    highAbove: 1.35,
    titleKey: 'bot.associative_scope_title',
    titleDefault: 'Associative Scope',
    variants: {
      low: {
        Icon: Binoculars,
        labelKey: 'bot.memory_emblem.scope_low_label',
        labelDefault: 'Autism-like',
        descKey: 'bot.memory_emblem.scope_low_desc',
        descDefault:
          'Only the single recalled thread surfaces; surrounding context is ignored.',
      },
      mid: {
        Icon: Scale,
        labelKey: 'bot.memory_emblem.scope_mid_label',
        labelDefault: 'Balanced Scope',
        descKey: 'bot.memory_emblem.scope_mid_desc',
        descDefault:
          'A moderate halo of associations surfaces with each recalled memory.',
      },
      high: {
        Icon: Waypoints,
        labelKey: 'bot.memory_emblem.scope_high_label',
        labelDefault: 'Big Picture',
        descKey: 'bot.memory_emblem.scope_high_desc',
        descDefault:
          'Distant memories light up together; the bot connects everything into a sprawling web.',
      },
    },
  },
  {
    key: 'memory-fixation',
    field: 'maxStrengthMultiplier',
    min: 0.5,
    max: 2,
    lowBelow: 0.8,
    highAbove: 1.4,
    titleKey: 'bot.fixation_title',
    titleDefault: 'Memory Fixation',
    variants: {
      low: {
        Icon: Feather,
        labelKey: 'bot.memory_emblem.fixation_low_label',
        labelDefault: 'Open-Minded',
        descKey: 'bot.memory_emblem.fixation_low_desc',
        descDefault:
          'Beliefs stay loose and adaptable; repeated ideas never harden into dogma.',
      },
      mid: {
        Icon: Scale,
        labelKey: 'bot.memory_emblem.fixation_mid_label',
        labelDefault: 'Balanced Fixation',
        descKey: 'bot.memory_emblem.fixation_mid_desc',
        descDefault:
          'Repeated ideas take root without becoming rigid.',
      },
      high: {
        Icon: SheepIcon,
        labelKey: 'bot.memory_emblem.fixation_high_label',
        labelDefault: 'Resilient',
        descKey: 'bot.memory_emblem.fixation_high_desc',
        descDefault:
          'Repeated ideas calcify into unshakeable dogma and resist change or fading.',
      },
    },
  },
]

export function getMemoryEmblems(settings, t) {
  if (!settings) return []

  return EMBLEM_DEFS.map((def) => {
    const value = toValue(settings[def.field], 1, def.min, def.max)
    const state = stateOf(value, def.lowBelow, def.highAbove)
    const variant = def.variants[state]
    const label = t(variant.labelKey, variant.labelDefault)

    return {
      key: def.key,
      label,
      description: label,
      Icon: variant.Icon,
      tone: TONE_BY_STATE[state],
      size: 25,
    }
  })
}
