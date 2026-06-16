const flowers = [
  {
    id: 'rose_red',
    name: '红玫瑰',
    type: 'flower',
    color: '#E63946',
    hsl: { h: 355, s: 78, l: 56 },
    category: 'rose',
    unlockLevel: 1
  },
  {
    id: 'rose_pink',
    name: '粉玫瑰',
    type: 'flower',
    color: '#F4A6B8',
    hsl: { h: 345, s: 75, l: 80 },
    category: 'rose',
    unlockLevel: 1
  },
  {
    id: 'rose_white',
    name: '白玫瑰',
    type: 'flower',
    color: '#F8F4E3',
    hsl: { h: 48, s: 50, l: 93 },
    category: 'rose',
    unlockLevel: 2
  },
  {
    id: 'tulip_yellow',
    name: '黄郁金香',
    type: 'flower',
    color: '#FFD93D',
    hsl: { h: 49, s: 100, l: 62 },
    category: 'tulip',
    unlockLevel: 1
  },
  {
    id: 'tulip_purple',
    name: '紫郁金香',
    type: 'flower',
    color: '#9B5DE5',
    hsl: { h: 270, s: 72, l: 63 },
    category: 'tulip',
    unlockLevel: 3
  },
  {
    id: 'sunflower',
    name: '向日葵',
    type: 'flower',
    color: '#F77F00',
    hsl: { h: 30, s: 100, l: 48 },
    category: 'sunflower',
    unlockLevel: 2
  },
  {
    id: 'lily_white',
    name: '白百合',
    type: 'flower',
    color: '#FFFFFF',
    hsl: { h: 0, s: 0, l: 100 },
    category: 'lily',
    unlockLevel: 4
  },
  {
    id: 'carnation_pink',
    name: '粉康乃馨',
    type: 'flower',
    color: '#FF7AA2',
    hsl: { h: 341, s: 100, l: 73 },
    category: 'carnation',
    unlockLevel: 3
  },
  {
    id: 'hydrangea_blue',
    name: '蓝绣球',
    type: 'flower',
    color: '#48CAE4',
    hsl: { h: 190, s: 74, l: 59 },
    category: 'hydrangea',
    unlockLevel: 5
  },
  {
    id: 'peony_cream',
    name: '奶油牡丹',
    type: 'flower',
    color: '#F5E6D3',
    hsl: { h: 32, s: 55, l: 89 },
    category: 'peony',
    unlockLevel: 4
  }
];

const leaves = [
  {
    id: 'eucalyptus',
    name: '尤加利叶',
    type: 'leaf',
    color: '#6B9080',
    hsl: { h: 152, s: 18, l: 49 },
    category: 'eucalyptus',
    unlockLevel: 1
  },
  {
    id: 'olive_leaf',
    name: '橄榄叶',
    type: 'leaf',
    color: '#556B2F',
    hsl: { h: 80, s: 40, l: 29 },
    category: 'olive',
    unlockLevel: 1
  },
  {
    id: 'fern_leaf',
    name: '蕨类叶',
    type: 'leaf',
    color: '#2D6A4F',
    hsl: { h: 152, s: 40, l: 30 },
    category: 'fern',
    unlockLevel: 2
  },
  {
    id: 'baby_breath',
    name: '满天星',
    type: 'leaf',
    color: '#E8E8E8',
    hsl: { h: 0, s: 0, l: 91 },
    category: 'filler',
    unlockLevel: 3
  },
  {
    id: 'ivy_leaf',
    name: '常春藤',
    type: 'leaf',
    color: '#386641',
    hsl: { h: 133, s: 31, l: 31 },
    category: 'ivy',
    unlockLevel: 4
  }
];

const levels = [
  {
    id: 1,
    name: '浪漫婚礼',
    scene: 'wedding',
    description: '为西式婚礼打造浪漫花束，配色需温馨典雅',
    targetStyle: 'romantic',
    requiredScore: 60,
    maxAttempts: 5,
    preferredColors: [
      { h: 345, s: 75, l: 80, name: '粉色' },
      { h: 0, s: 0, l: 100, name: '白色' },
      { h: 355, s: 78, l: 56, name: '红色' }
    ],
    unlockFlowers: ['rose_white'],
    unlockLeaves: ['fern_leaf'],
    backgroundGradient: ['#FFE5EC', '#FFF0F5']
  },
  {
    id: 2,
    name: '温馨居家',
    scene: 'home',
    description: '为客厅茶几搭配阳光活力花束，提亮空间氛围',
    targetStyle: 'warm',
    requiredScore: 65,
    maxAttempts: 5,
    preferredColors: [
      { h: 30, s: 100, l: 48, name: '橙色' },
      { h: 49, s: 100, l: 62, name: '黄色' },
      { h: 152, s: 18, l: 49, name: '绿色' }
    ],
    unlockFlowers: ['sunflower'],
    unlockLeaves: [],
    backgroundGradient: ['#FFF8E7', '#FFEFD5']
  },
  {
    id: 3,
    name: '节日庆典',
    scene: 'festival',
    description: '春节拜年花束，需喜庆热烈、红金配色',
    targetStyle: 'festive',
    requiredScore: 70,
    maxAttempts: 4,
    preferredColors: [
      { h: 355, s: 78, l: 56, name: '红色' },
      { h: 49, s: 100, l: 62, name: '金色' },
      { h: 270, s: 72, l: 63, name: '紫色' }
    ],
    unlockFlowers: ['tulip_purple', 'carnation_pink'],
    unlockLeaves: ['baby_breath'],
    backgroundGradient: ['#FFE4E1', '#FFF5E1']
  },
  {
    id: 4,
    name: '清新告白',
    scene: 'confession',
    description: '一场精心准备的告白仪式，花束需清新动人',
    targetStyle: 'pure',
    requiredScore: 72,
    maxAttempts: 4,
    preferredColors: [
      { h: 0, s: 0, l: 100, name: '白色' },
      { h: 345, s: 75, l: 80, name: '粉色' },
      { h: 32, s: 55, l: 89, name: '奶油色' }
    ],
    unlockFlowers: ['lily_white', 'peony_cream'],
    unlockLeaves: ['ivy_leaf'],
    backgroundGradient: ['#F0F8FF', '#FFF0F5']
  },
  {
    id: 5,
    name: '海洋婚礼',
    scene: 'wedding',
    description: '海边主题婚礼，蓝白配色，浪漫梦幻',
    targetStyle: 'ocean',
    requiredScore: 75,
    maxAttempts: 3,
    preferredColors: [
      { h: 190, s: 74, l: 59, name: '蓝色' },
      { h: 0, s: 0, l: 100, name: '白色' },
      { h: 270, s: 72, l: 63, name: '淡紫' }
    ],
    unlockFlowers: ['hydrangea_blue'],
    unlockLeaves: [],
    backgroundGradient: ['#E0F7FA', '#E3F2FD']
  }
];

module.exports = { flowers, leaves, levels };
