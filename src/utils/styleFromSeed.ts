const COLOR_PALETTE = [
  '#EFF6FF', '#F0FDF4', '#FEF3C7', '#FCE7F3', '#EDE9FE',
  '#FEE2E2', '#E0F2FE', '#F5F3FF', '#ECFDF5', '#FFF7ED',
  '#DBEAFE', '#DCFCE7', '#FEF9C3', '#FCE4EC', '#F3E5F5',
  '#FFEBEE', '#E1F5FE', '#F3E5F5', '#E8F5E9', '#FFF3E0',
];

const BORDER_PALETTE = [
  '#93C5FD', '#86EFAC', '#FCD34D', '#F9A8D4', '#C4B5FD',
  '#FCA5A5', '#7DD3FC', '#C4B5FD', '#6EE7B7', '#FDBA74',
  '#60A5FA', '#4ADE80', '#FACC15', '#F472B6', '#A78BFA',
  '#F87171', '#38BDF8', '#A78BFA', '#34D399', '#FB923C',
];

const SHAPES = ['circle', 'square', 'diamond', 'triangle', 'hexagon', 'star', 'cross', 'pentagon'];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function styleFromSeed(seed: number): {
  bgColor: string;
  borderColor: string;
  icon: string;
} {
  const rand = seededRandom(seed);
  const colorIdx = Math.floor(rand() * COLOR_PALETTE.length);
  const borderIdx = Math.floor(rand() * BORDER_PALETTE.length);
  const shapeIdx = Math.floor(rand() * SHAPES.length);

  return {
    bgColor: COLOR_PALETTE[colorIdx],
    borderColor: BORDER_PALETTE[borderIdx],
    icon: SHAPES[shapeIdx],
  };
}
