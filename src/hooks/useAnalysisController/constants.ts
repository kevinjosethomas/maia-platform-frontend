export const COLORS = {
  good: ['#238b45', '#41ab5d', '#74c476', '#a1d99b', '#c7e9c0'],
  ok: ['#ec7014', '#feb24c', '#fed976', '#ffeda0', '#ffffcc'].reverse(),
  blunder: ['#cb181d', '#ef3b2c', '#fb6a4a', '#fc9272', '#fcbba1'].reverse(),
}

export const MAIA_MODELS = [
  'maia_kdd_1100',
  'maia_kdd_1200',
  'maia_kdd_1300',
  'maia_kdd_1400',
  'maia_kdd_1500',
  'maia_kdd_1600',
  'maia_kdd_1700',
  'maia_kdd_1800',
  'maia_kdd_1900',
]

export const BLUNDER_THRESHOLD = 0.1 // 10% winrate drop
export const INACCURACY_THRESHOLD = 0.05 // 5% winrate drop
export const GOOD_THRESHOLD = -INACCURACY_THRESHOLD // -0.05 (less than 5% winrate loss)
export const OK_THRESHOLD = -BLUNDER_THRESHOLD // -0.1 (between 5% and 10% winrate loss)
