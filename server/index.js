const express = require('express');
const cors = require('cors');
const { flowers, leaves, levels } = require('./data');

const app = express();
const PORT = 9807;

app.use(cors());
app.use(express.json());

const gameState = {
  currentLevel: 1,
  unlockedFlowers: flowers.filter(f => f.unlockLevel <= 1).map(f => f.id),
  unlockedLeaves: leaves.filter(l => l.unlockLevel <= 1).map(l => l.id),
  completedLevels: [],
  levelAttempts: {}
};

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function colorDistance(hsl1, hsl2) {
  const dh = Math.min(Math.abs(hsl1.h - hsl2.h), 360 - Math.abs(hsl1.h - hsl2.h)) / 180;
  const ds = Math.abs(hsl1.s - hsl2.s) / 100;
  const dl = Math.abs(hsl1.l - hsl2.l) / 100;
  return Math.sqrt(dh * dh * 0.5 + ds * ds * 0.25 + dl * dl * 0.25);
}

function calculateColorHarmony(bouquetItems) {
  if (bouquetItems.length === 0) return { score: 0, details: {} };
  if (bouquetItems.length === 1) return { score: 50, details: { message: '至少添加2种花材才能进行配色评分' } };

  const hslColors = bouquetItems.map(item => {
    const all = [...flowers, ...leaves];
    const found = all.find(f => f.id === item.id);
    return found ? found.hsl : hexToHsl(item.color || '#888888');
  });

  let totalDistance = 0;
  let pairCount = 0;

  for (let i = 0; i < hslColors.length; i++) {
    for (let j = i + 1; j < hslColors.length; j++) {
      totalDistance += colorDistance(hslColors[i], hslColors[j]);
      pairCount++;
    }
  }

  const avgDistance = totalDistance / pairCount;

  const saturationValues = hslColors.map(c => c.s);
  const avgSaturation = saturationValues.reduce((a, b) => a + b, 0) / saturationValues.length;
  const satVariance = saturationValues.reduce((sum, s) => sum + Math.pow(s - avgSaturation, 2), 0) / saturationValues.length;
  const satHarmony = Math.max(0, 100 - Math.sqrt(satVariance) * 2);

  const lightValues = hslColors.map(c => c.l);
  const avgLight = lightValues.reduce((a, b) => a + b, 0) / lightValues.length;
  const lightVariance = lightValues.reduce((sum, l) => sum + Math.pow(l - avgLight, 2), 0) / lightValues.length;
  const lightHarmony = Math.max(0, 100 - Math.sqrt(lightVariance) * 2);

  let harmonyScore;
  if (avgDistance < 0.08) {
    harmonyScore = 50 + avgDistance * 625;
  } else if (avgDistance <= 0.25) {
    harmonyScore = 85 - (avgDistance - 0.08) * 150;
  } else if (avgDistance <= 0.5) {
    harmonyScore = 60 + (avgDistance - 0.25) * 100;
  } else {
    harmonyScore = 85 - (avgDistance - 0.5) * 80;
  }

  harmonyScore = Math.min(100, Math.max(0, harmonyScore));

  const finalScore = Math.round(harmonyScore * 0.5 + satHarmony * 0.25 + lightHarmony * 0.25);

  return {
    score: finalScore,
    details: {
      colorHarmony: Math.round(harmonyScore),
      saturationHarmony: Math.round(satHarmony),
      lightHarmony: Math.round(lightHarmony),
      avgColorDistance: avgDistance.toFixed(3)
    }
  };
}

function calculateStyleMatch(bouquetItems, level) {
  if (bouquetItems.length === 0 || !level.preferredColors) return { score: 0, matchedColors: [] };

  const hslColors = bouquetItems.map(item => {
    const all = [...flowers, ...leaves];
    const found = all.find(f => f.id === item.id);
    return found ? found.hsl : hexToHsl(item.color || '#888888');
  });

  let totalMatchScore = 0;
  const matchedColors = [];

  for (const preferredColor of level.preferredColors) {
    let bestMatch = 0;
    let bestMatchItem = null;

    for (let i = 0; i < hslColors.length; i++) {
      const distance = colorDistance(hslColors[i], preferredColor);
      const match = Math.max(0, 100 - distance * 200);
      if (match > bestMatch) {
        bestMatch = match;
        bestMatchItem = bouquetItems[i];
      }
    }

    if (bestMatch > 40) {
      matchedColors.push({
        target: preferredColor.name,
        matchScore: Math.round(bestMatch),
        item: bestMatchItem ? bestMatchItem.name : null
      });
    }

    totalMatchScore += bestMatch;
  }

  const styleScore = Math.round(totalMatchScore / level.preferredColors.length);

  return { score: styleScore, matchedColors };
}

function calculateDiversityBonus(bouquetItems) {
  const categories = new Set();
  const types = new Set();
  let flowerCount = 0;
  let leafCount = 0;

  bouquetItems.forEach(item => {
    const all = [...flowers, ...leaves];
    const found = all.find(f => f.id === item.id);
    if (found) {
      categories.add(found.category);
      types.add(found.type);
      if (found.type === 'flower') flowerCount++;
      else leafCount++;
    }
  });

  let bonus = 0;
  const varietyRatio = categories.size / Math.max(1, bouquetItems.length);

  if (varietyRatio >= 0.5) bonus += 10;
  if (varietyRatio >= 0.7) bonus += 5;

  if (flowerCount >= 2 && leafCount >= 1) bonus += 10;
  if (flowerCount >= 4) bonus += 5;
  if (bouquetItems.length >= 6) bonus += 5;

  return Math.min(25, bonus);
}

app.get('/api/game/state', (req, res) => {
  res.json({
    success: true,
    data: {
      ...gameState,
      unlockedFlowers: flowers.filter(f => gameState.unlockedFlowers.includes(f.id)),
      unlockedLeaves: leaves.filter(l => gameState.unlockedLeaves.includes(l.id)),
      allLevels: levels
    }
  });
});

app.get('/api/flowers/unlocked', (req, res) => {
  const data = {
    flowers: flowers.filter(f => gameState.unlockedFlowers.includes(f.id)),
    leaves: leaves.filter(l => gameState.unlockedLeaves.includes(l.id))
  };
  res.json({ success: true, data });
});

app.get('/api/levels', (req, res) => {
  const levelsWithStatus = levels.map(level => ({
    ...level,
    isCompleted: gameState.completedLevels.includes(level.id),
    isUnlocked: level.id <= gameState.currentLevel
  }));
  res.json({ success: true, data: levelsWithStatus });
});

app.get('/api/levels/:id', (req, res) => {
  const level = levels.find(l => l.id === parseInt(req.params.id));
  if (!level) {
    return res.status(404).json({ success: false, error: '关卡不存在' });
  }

  const availableFlowers = flowers.filter(f => f.unlockLevel <= level.id);
  const availableLeaves = leaves.filter(l => l.unlockLevel <= level.id);
  const attempts = gameState.levelAttempts[level.id] || 0;

  res.json({
    success: true,
    data: {
      level,
      availableFlowers,
      availableLeaves,
      remainingAttempts: Math.max(0, level.maxAttempts - attempts),
      isCompleted: gameState.completedLevels.includes(level.id)
    }
  });
});

app.post('/api/game/evaluate', (req, res) => {
  const { levelId, bouquet } = req.body;

  if (!levelId || !bouquet) {
    return res.status(400).json({ success: false, error: '缺少必要参数' });
  }

  const level = levels.find(l => l.id === levelId);
  if (!level) {
    return res.status(404).json({ success: false, error: '关卡不存在' });
  }

  if (!gameState.levelAttempts[levelId]) {
    gameState.levelAttempts[levelId] = 0;
  }

  if (gameState.levelAttempts[levelId] >= level.maxAttempts && !gameState.completedLevels.includes(levelId)) {
    return res.status(403).json({
      success: false,
      error: '尝试次数已用完',
      data: { remainingAttempts: 0 }
    });
  }

  if (bouquet.length === 0) {
    return res.json({
      success: true,
      data: {
        totalScore: 0,
        colorScore: { score: 0, details: {} },
        styleScore: { score: 0, matchedColors: [] },
        diversityBonus: 0,
        isPassed: false,
        remainingAttempts: level.maxAttempts - gameState.levelAttempts[levelId],
        message: '请至少添加一种花材或叶材'
      }
    });
  }

  gameState.levelAttempts[levelId]++;

  const colorScore = calculateColorHarmony(bouquet);
  const styleScore = calculateStyleMatch(bouquet, level);
  const diversityBonus = calculateDiversityBonus(bouquet);

  const totalScore = Math.round(colorScore.score * 0.45 + styleScore.score * 0.45 + diversityBonus);
  const isPassed = totalScore >= level.requiredScore;

  let unlockMessage = null;
  if (isPassed && !gameState.completedLevels.includes(levelId)) {
    gameState.completedLevels.push(levelId);

    if (level.unlockFlowers && level.unlockFlowers.length > 0) {
      level.unlockFlowers.forEach(fid => {
        if (!gameState.unlockedFlowers.includes(fid)) {
          gameState.unlockedFlowers.push(fid);
        }
      });
    }
    if (level.unlockLeaves && level.unlockLeaves.length > 0) {
      level.unlockLeaves.forEach(lid => {
        if (!gameState.unlockedLeaves.includes(lid)) {
          gameState.unlockedLeaves.push(lid);
        }
      });
    }

    if (gameState.currentLevel < levelId + 1) {
      gameState.currentLevel = levelId + 1;
    }

    const newlyUnlocked = [];
    level.unlockFlowers.forEach(fid => {
      const f = flowers.find(fl => fl.id === fid);
      if (f) newlyUnlocked.push({ type: '花材', name: f.name });
    });
    level.unlockLeaves.forEach(lid => {
      const l = leaves.find(lf => lf.id === lid);
      if (l) newlyUnlocked.push({ type: '叶材', name: l.name });
    });

    unlockMessage = newlyUnlocked.length > 0 ? newlyUnlocked : null;
  }

  res.json({
    success: true,
    data: {
      totalScore,
      colorScore,
      styleScore,
      diversityBonus,
      isPassed,
      requiredScore: level.requiredScore,
      remainingAttempts: Math.max(0, level.maxAttempts - gameState.levelAttempts[levelId]),
      usedAttempts: gameState.levelAttempts[levelId],
      maxAttempts: level.maxAttempts,
      unlockMessage,
      nextLevelUnlocked: isPassed && levels.some(l => l.id === levelId + 1),
      bouquetStats: {
        totalItems: bouquet.length,
        flowerCount: bouquet.filter(b => {
          const all = [...flowers, ...leaves];
          const found = all.find(f => f.id === b.id);
          return found && found.type === 'flower';
        }).length,
        leafCount: bouquet.filter(b => {
          const all = [...flowers, ...leaves];
          const found = all.find(f => f.id === b.id);
          return found && found.type === 'leaf';
        }).length,
        uniqueCategories: new Set(bouquet.map(b => {
          const all = [...flowers, ...leaves];
          const found = all.find(f => f.id === b.id);
          return found ? found.category : null;
        }).filter(Boolean)).size
      }
    }
  });
});

app.post('/api/game/reset/attempts/:levelId', (req, res) => {
  const levelId = parseInt(req.params.levelId);
  if (gameState.levelAttempts[levelId]) {
    gameState.levelAttempts[levelId] = 0;
  }
  const level = levels.find(l => l.id === levelId);
  res.json({
    success: true,
    data: {
      remainingAttempts: level ? level.maxAttempts : 0
    }
  });
});

app.post('/api/game/reset/all', (req, res) => {
  gameState.currentLevel = 1;
  gameState.unlockedFlowers = flowers.filter(f => f.unlockLevel <= 1).map(f => f.id);
  gameState.unlockedLeaves = leaves.filter(l => l.unlockLevel <= 1).map(l => l.id);
  gameState.completedLevels = [];
  gameState.levelAttempts = {};

  res.json({
    success: true,
    message: '游戏进度已重置'
  });
});

app.get('/api/colors/harmony', (req, res) => {
  const { colors } = req.query;
  if (!colors) return res.status(400).json({ error: '缺少颜色参数' });

  const colorArray = colors.split(',').map(c => {
    if (c.startsWith('#')) return hexToHsl(c);
    const [h, s, l] = c.split('|').map(Number);
    return { h, s, l };
  });

  const result = calculateColorHarmony(colorArray.map(hsl => ({ color: hslToHex(hsl.h, hsl.s, hsl.l) })));
  res.json({ success: true, data: result });
});

app.listen(PORT, () => {
  console.log(`🌸 花束游戏后端服务启动成功: http://localhost:${PORT}`);
  console.log(`📋 已加载 ${flowers.length} 种花材, ${leaves.length} 种叶材, ${levels.length} 个关卡`);
});

module.exports = app;
