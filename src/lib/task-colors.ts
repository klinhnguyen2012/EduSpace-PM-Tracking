const memberPalette = [
  { background: '#e4f3fa', color: '#256d91', border: '#c6e5f2' },
  { background: '#f2eafa', color: '#76519a', border: '#e2d2f1' },
  { background: '#fff0df', color: '#9a6126', border: '#f5dfc2' },
  { background: '#e4f4e9', color: '#397452', border: '#cde8d5' },
  { background: '#fde8ee', color: '#a14666', border: '#f4d2dd' },
  { background: '#f7f0d9', color: '#826b21', border: '#eae0b9' },
] as const

const memberColors: Record<string, (typeof memberPalette)[number]> = {
  Khoa: memberPalette[0],
  'Chiến': memberPalette[1],
  'Trân': memberPalette[3],
  Linh: memberPalette[4],
}

export const teamMemberNames = ['Khoa', 'Chiến', 'Trân', 'Linh'] as const

export function memberColor(name: string) {
  if (memberColors[name]) return memberColors[name]
  let hash = 0
  for (const character of name) hash = (hash * 31 + character.charCodeAt(0)) % memberPalette.length
  return memberPalette[hash]
}
