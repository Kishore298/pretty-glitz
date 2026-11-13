/**
 * Bangle Colour Presets & Sizing Standards for PrettyGlitz
 * Curated authentic Indian jewellery shades grouped by colour family.
 */

export const BANGLE_COLOR_FAMILIES = [
  {
    family: 'Pink & Red',
    colors: [
      { name: 'Rani Pink', hex: '#E0218A' },
      { name: 'Ruby Red', hex: '#C41E3A' },
      { name: 'Velvet Maroon', hex: '#800020' },
      { name: 'Crimson Red', hex: '#DC143C' },
      { name: 'Rose Pink', hex: '#E86A92' },
      { name: 'Baby Pink', hex: '#F4C2C2' },
      { name: 'Deep Wine', hex: '#58111A' },
      { name: 'Magenta', hex: '#D10068' },
      { name: 'Cherry Red', hex: '#990000' },
      { name: 'Coral Pink', hex: '#F88379' },
    ],
  },
  {
    family: 'Green',
    colors: [
      { name: 'Emerald Green', hex: '#26B543' },
      { name: 'Bottle Green', hex: '#004225' },
      { name: 'Mehendi Green', hex: '#5B7035' },
      { name: 'Mint Green', hex: '#98FF98' },
      { name: 'Olive Green', hex: '#708238' },
      { name: 'Parrot Green', hex: '#50C878' },
      { name: 'Pista Green', hex: '#93C572' },
      { name: 'Dark Forest Green', hex: '#013220' },
    ],
  },
  {
    family: 'Blue',
    colors: [
      { name: 'Royal Blue', hex: '#4169E1' },
      { name: 'Peacock Blue', hex: '#005A9C' },
      { name: 'Navy Blue', hex: '#000080' },
      { name: 'Sky Blue', hex: '#87CEEB' },
      { name: 'Turquoise Blue', hex: '#40E0D0' },
      { name: 'Teal Blue', hex: '#008080' },
      { name: 'Cobalt Blue', hex: '#0047AB' },
    ],
  },
  {
    family: 'Yellow & Gold',
    colors: [
      { name: 'Mustard Yellow', hex: '#E1AD01' },
      { name: 'Haldi Yellow', hex: '#FFA500' },
      { name: 'Lemon Yellow', hex: '#FFF44F' },
      { name: 'Antique Gold', hex: '#D4AF37' },
      { name: 'Metallic Gold', hex: '#FFD700' },
      { name: 'Champagne Gold', hex: '#F7E7CE' },
      { name: 'Golden Yellow', hex: '#FFDF00' },
    ],
  },
  {
    family: 'Purple & Violet',
    colors: [
      { name: 'Deep Purple', hex: '#800080' },
      { name: 'Lavender', hex: '#B57EDC' },
      { name: 'Plum', hex: '#8E3A59' },
      { name: 'Aubergine / Jamun', hex: '#3B0910' },
      { name: 'Lilac', hex: '#C8A2C8' },
      { name: 'Violet', hex: '#7F00FF' },
    ],
  },
  {
    family: 'Orange & Peach',
    colors: [
      { name: 'Coral Orange', hex: '#FF7F50' },
      { name: 'Rust Orange', hex: '#C04000' },
      { name: 'Peach', hex: '#FFE5B4' },
      { name: 'Amber', hex: '#FFBF00' },
      { name: 'Tangerine', hex: '#F28500' },
      { name: 'Copper Orange', hex: '#D97443' },
    ],
  },
  {
    family: 'Brown & Bronze',
    colors: [
      { name: 'Chocolate Brown', hex: '#5C4033' },
      { name: 'Coffee Brown', hex: '#4A2E18' },
      { name: 'Copper Bronze', hex: '#B87333' },
      { name: 'Tan Brown', hex: '#D2B48C' },
    ],
  },
  {
    family: 'Black & White',
    colors: [
      { name: 'Jet Black', hex: '#111111' },
      { name: 'Pearl White', hex: '#FDFDFD' },
      { name: 'Off-White / Cream', hex: '#FDFBF7' },
      { name: 'Silver Metallic', hex: '#C0C0C0' },
      { name: 'Gunmetal Grey', hex: '#2A3439' },
    ],
  },
];

export const ALL_BANGLE_COLORS = BANGLE_COLOR_FAMILIES.flatMap((f) =>
  f.colors.map((c) => ({ ...c, family: f.family }))
);

export const STANDARD_BANGLE_SIZES = ['2.2', '2.4', '2.6', '2.8', '2.10', '2.12'];
export const DEFAULT_ACTIVE_SIZES = ['2.4', '2.6', '2.8'];

