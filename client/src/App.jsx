import { useState, useEffect, useRef } from 'react';

const API_BASE = '/api';

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

function shadeColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (
    0x1000000 +
    (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)
  ).toString(16).slice(1);
}

const FLOWER_ICONS = {
  rose: '🌹',
  tulip: '🌷',
  sunflower: '🌻',
  lily: '🌸',
  carnation: '🌺',
  hydrangea: '💮',
  peony: '🏵️',
  default: '🌸'
};

const LEAF_ICONS = {
  eucalyptus: '🌿',
  olive: '🍃',
  fern: '🌾',
  filler: '✨',
  ivy: '🌱',
  default: '🍀'
};

function getIcon(item) {
  if (item.type === 'flower') {
    return FLOWER_ICONS[item.category] || FLOWER_ICONS.default;
  }
  return LEAF_ICONS[item.category] || LEAF_ICONS.default;
}

export default function App() {
  const [, setGameState] = useState(null);
  const [levels, setLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [availableFlowers, setAvailableFlowers] = useState([]);
  const [availableLeaves, setAvailableLeaves] = useState([]);
  const [materialTab, setMaterialTab] = useState('flower');
  const [bouquet, setBouquet] = useState([]);
  const [remainingAttempts, setRemainingAttempts] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [resultModal, setResultModal] = useState(null);
  const [removeMode, setRemoveMode] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const canvasRef = useRef(null);
  const itemIdCounter = useRef(0);

  useEffect(() => {
    loadGameData();
  }, []);

  const loadGameData = async () => {
    try {
      const [stateRes, levelsRes] = await Promise.all([
        fetch(`${API_BASE}/game/state`).then(r => r.json()),
        fetch(`${API_BASE}/levels`).then(r => r.json())
      ]);

      if (stateRes.success) {
        setGameState(stateRes.data);
      }
      if (levelsRes.success) {
        setLevels(levelsRes.data);
        const firstUnlocked = levelsRes.data.find(l => l.isUnlocked && !l.isCompleted);
        if (firstUnlocked) {
          selectLevel(firstUnlocked.id);
        } else if (levelsRes.data.length > 0) {
          selectLevel(levelsRes.data[0].id);
        }
      }
    } catch (err) {
      console.error('加载游戏数据失败:', err);
    }
  };

  const selectLevel = async (levelId) => {
    try {
      const res = await fetch(`${API_BASE}/levels/${levelId}`).then(r => r.json());
      if (res.success) {
        setSelectedLevel(res.data.level);
        setAvailableFlowers(res.data.availableFlowers);
        setAvailableLeaves(res.data.availableLeaves);
        setRemainingAttempts(res.data.remainingAttempts);
        setBouquet([]);
        setRemoveMode(false);
        setResultModal(null);
        itemIdCounter.current = 0;
      }
    } catch (err) {
      console.error('加载关卡失败:', err);
    }
  };

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', JSON.stringify(item));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    if (!canvasRef.current) return;

    let item = draggedItem;
    if (!item) {
      try {
        const data = e.dataTransfer.getData('text/plain');
        item = JSON.parse(data);
      } catch (err) {
        return;
      }
    }

    if (!item) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    addItemToBouquet(item, x, y);
    setDraggedItem(null);
  };

  const addItemToBouquet = (item, x, y) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const maxX = (rect?.width || 600) - 80;
    const maxY = (rect?.height || 480) - 100;

    const posX = x ? Math.max(10, Math.min(maxX, x - 36)) : 50 + Math.random() * (maxX - 50);
    const posY = y ? Math.max(10, Math.min(maxY, y - 36)) : 50 + Math.random() * (maxY - 50);

    const newItem = {
      ...item,
      uniqueId: ++itemIdCounter.current,
      x: posX,
      y: posY
    };

    setBouquet(prev => [...prev, newItem]);
  };

  const handleMaterialClick = (item) => {
    if (removeMode) return;
    addItemToBouquet(item);
  };

  const handleBouquetItemClick = (uniqueId) => {
    if (removeMode) {
      setBouquet(prev => prev.filter(item => item.uniqueId !== uniqueId));
    }
  };

  const handleBouquetItemDragStart = (e, item) => {
    if (removeMode) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('bouquet-item', item.uniqueId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleBouquetItemDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (!canvasRef.current) return;

    const uniqueId = e.dataTransfer.getData('bouquet-item');
    if (!uniqueId) {
      handleDrop(e);
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 36;
    const y = e.clientY - rect.top - 36;

    setBouquet(prev => prev.map(item => {
      if (item.uniqueId == uniqueId) {
        const maxX = rect.width - 80;
        const maxY = rect.height - 100;
        return {
          ...item,
          x: Math.max(10, Math.min(maxX, x)),
          y: Math.max(10, Math.min(maxY, y))
        };
      }
      return item;
    }));
  };

  const resetBouquet = () => {
    setBouquet([]);
    setRemoveMode(false);
  };

  const resetAttempts = async () => {
    if (!selectedLevel) return;
    try {
      const res = await fetch(`${API_BASE}/game/reset/attempts/${selectedLevel.id}`, {
        method: 'POST'
      }).then(r => r.json());
      if (res.success) {
        setRemainingAttempts(res.data.remainingAttempts);
        resetBouquet();
      }
    } catch (err) {
      console.error('重置尝试次数失败:', err);
    }
  };

  const evaluateBouquet = async () => {
    if (!selectedLevel || bouquet.length === 0) return;

    setIsEvaluating(true);
    try {
      const res = await fetch(`${API_BASE}/game/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          levelId: selectedLevel.id,
          bouquet: bouquet.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            color: item.color
          }))
        })
      }).then(r => r.json());

      if (res.success) {
        setRemainingAttempts(res.data.remainingAttempts);
        setResultModal(res.data);

        if (res.data.isPassed) {
          loadGameData();
        }
      } else {
        alert(res.error || '评分失败');
      }
    } catch (err) {
      console.error('评分失败:', err);
      alert('评分失败，请重试');
    } finally {
      setIsEvaluating(false);
    }
  };

  const closeResultModal = () => {
    setResultModal(null);
  };

  const nextLevel = () => {
    const currentIdx = levels.findIndex(l => l.id === selectedLevel.id);
    if (currentIdx >= 0 && currentIdx < levels.length - 1) {
      const nextLevelData = levels[currentIdx + 1];
      if (nextLevelData.isUnlocked) {
        selectLevel(nextLevelData.id);
      }
    }
  };

  const retryLevel = () => {
    resetBouquet();
    setResultModal(null);
  };

  const getProgressClass = (score, target) => {
    const ratio = score / Math.max(target, 1);
    if (ratio >= 1) return 'good';
    if (ratio >= 0.6) return 'medium';
    return 'poor';
  };

  const bgGradient = selectedLevel?.backgroundGradient;
  const cssVars = {
    '--bg-from': bgGradient?.[0] || '#FFE5EC',
    '--bg-to': bgGradient?.[1] || '#FFF0F5'
  };

  const currentMaterials = materialTab === 'flower' ? availableFlowers : availableLeaves;

  return (
    <div className="app">
      <header className="app-header">
        <h1>🌸 花束搭配闯关游戏 🌸</h1>
        <p>拖拽花材叶材，搭配出最美的花束吧！</p>
      </header>

      <div className="main-layout">
        <aside className="panel">
          <h2 className="panel-title">🎯 关卡列表</h2>
          <ul className="level-list">
            {levels.map(level => (
              <li
                key={level.id}
                className={`level-item ${
                  selectedLevel?.id === level.id ? 'active' : ''
                } ${level.isCompleted ? 'completed' : ''} ${!level.isUnlocked ? 'locked' : ''}`}
                onClick={() => level.isUnlocked && selectLevel(level.id)}
              >
                <div className="level-header">
                  <span className="level-name">
                    第{level.id}关 · {level.name}
                  </span>
                  <span className={`level-badge ${level.scene}`}>
                    {level.scene === 'wedding' ? '婚礼' :
                     level.scene === 'home' ? '居家' :
                     level.scene === 'festival' ? '节日' :
                     level.scene === 'confession' ? '告白' : level.scene}
                  </span>
                </div>
                <p className="level-desc">{level.description}</p>
                <div className="level-score">
                  <span>目标分数</span>
                  <span className="target">{level.requiredScore}分</span>
                </div>
                <div className="level-status">
                  {level.isCompleted && <span className="status-tag completed">✓ 已通关</span>}
                  {!level.isUnlocked && <span className="status-tag locked">🔒 未解锁</span>}
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <main className="panel canvas-wrapper">
          {selectedLevel ? (
            <>
              <div className="scene-header">
                <div className="scene-info">
                  <h2>{selectedLevel.name}</h2>
                  <p>{selectedLevel.description}</p>
                </div>
                <div className="scene-stats">
                  <div className="stat-box">
                    <div className="stat-label">目标分数</div>
                    <div className="stat-value">{selectedLevel.requiredScore}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">剩余次数</div>
                    <div className={`stat-value ${remainingAttempts <= 1 ? 'warning' : ''}`}>
                      {remainingAttempts}
                    </div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">花束数量</div>
                    <div className="stat-value">{bouquet.length}</div>
                  </div>
                </div>
              </div>

              <div
                className={`canvas-area ${isDragOver ? 'drag-over' : ''}`}
                style={cssVars}
                ref={canvasRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleBouquetItemDrop}
              >
                {bouquet.length === 0 ? (
                  <div className="canvas-placeholder">
                    <div className="canvas-placeholder-icon">💐</div>
                    <div className="canvas-placeholder-text">
                      从右侧拖入花材叶材，或点击添加
                    </div>
                  </div>
                ) : (
                  <div className="bouquet-display">
                    {bouquet.map(item => (
                      <div
                        key={item.uniqueId}
                        className={`bouquet-item ${removeMode ? 'remove-mode' : ''}`}
                        style={{
                          left: item.x,
                          top: item.y,
                          '--flower-color': item.color,
                          '--flower-color-dark': shadeColor(item.color, -15)
                        }}
                        draggable={!removeMode}
                        onClick={() => handleBouquetItemClick(item.uniqueId)}
                        onDragStart={(e) => handleBouquetItemDragStart(e, item)}
                      >
                        <div className={`flower-shape ${item.type}`}>
                          <span className="flower-icon">{getIcon(item)}</span>
                        </div>
                        <span className="item-name">{item.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="canvas-actions">
                <button
                  className="btn btn-primary"
                  onClick={evaluateBouquet}
                  disabled={bouquet.length === 0 || isEvaluating || remainingAttempts <= 0}
                >
                  {isEvaluating ? '⏳ 评分中...' : '✨ 提交花束并评分'}
                </button>
                <button
                  className={`btn ${removeMode ? 'btn-danger' : 'btn-warning'}`}
                  onClick={() => setRemoveMode(!removeMode)}
                  disabled={bouquet.length === 0}
                >
                  {removeMode ? '✓ 完成删除' : '🗑️ 删除模式'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={resetBouquet}
                  disabled={bouquet.length === 0}
                >
                  🔄 一键重置
                </button>
                {remainingAttempts === 0 && !resultModal?.isPassed && (
                  <button
                    className="btn btn-secondary"
                    onClick={resetAttempts}
                  >
                    💫 重置次数
                  </button>
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
              <div style={{ fontSize: '60px', marginBottom: '16px' }}>🌺</div>
              <p style={{ fontSize: '16px' }}>请从左侧选择一个关卡开始游戏</p>
            </div>
          )}
        </main>

        <aside className="panel">
          <h2 className="panel-title">🎨 花材素材库</h2>

          <div className="material-tabs">
            <button
              className={`material-tab ${materialTab === 'flower' ? 'active' : ''}`}
              onClick={() => setMaterialTab('flower')}
            >
              🌸 花材 ({availableFlowers.length})
            </button>
            <button
              className={`material-tab ${materialTab === 'leaf' ? 'active' : ''}`}
              onClick={() => setMaterialTab('leaf')}
            >
              🍃 叶材 ({availableLeaves.length})
            </button>
          </div>

          <div className="material-list">
            {currentMaterials.map(item => (
              <div
                key={item.id}
                className="material-card"
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onClick={() => handleMaterialClick(item)}
                title={`${item.name} - 点击或拖拽添加`}
              >
                <div
                  className="material-color"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${item.color} 0%, ${shadeColor(item.color, -15)} 100%)`
                  }}
                >
                  {getIcon(item)}
                </div>
                <span className="material-name">{item.name}</span>
              </div>
            ))}
          </div>

          {selectedLevel?.preferredColors && (
            <div className="preferred-colors">
              <div className="preferred-title">🎯 本关推荐配色：</div>
              <div className="preferred-list">
                {selectedLevel.preferredColors.map((c, idx) => (
                  <span key={idx} className="preferred-color">
                    <span
                      className="preferred-dot"
                      style={{ background: hslToHex(c.h, c.s, c.l) }}
                    />
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {bouquet.length > 0 && (
            <div className="bouquet-summary" style={{ marginTop: '16px' }}>
              <div className="score-detail-title">📊 当前花束构成</div>
              <div className="summary-grid">
                <div className="summary-item">
                  <div className="summary-value">
                    {bouquet.filter(b => b.type === 'flower').length}
                  </div>
                  <div className="summary-label">花材</div>
                </div>
                <div className="summary-item">
                  <div className="summary-value">
                    {bouquet.filter(b => b.type === 'leaf').length}
                  </div>
                  <div className="summary-label">叶材</div>
                </div>
                <div className="summary-item">
                  <div className="summary-value">
                    {new Set(bouquet.map(b => b.category)).size}
                  </div>
                  <div className="summary-label">种类</div>
                </div>
              </div>
            </div>
          )}

          {remainingAttempts > 0 && remainingAttempts <= 2 && (
            <div className="attempts-info warning" style={{ marginTop: '16px' }}>
              ⚠️ 只剩 {remainingAttempts} 次搭配机会了！
            </div>
          )}
        </aside>
      </div>

      {resultModal && (
        <div className="result-modal-overlay" onClick={closeResultModal}>
          <div className="result-modal" onClick={e => e.stopPropagation()}>
            <div className="result-header">
              <div className="result-icon">
                {resultModal.isPassed ? '🎉' : remainingAttempts <= 0 ? '😢' : '💪'}
              </div>
              <h2 className={`result-title ${resultModal.isPassed ? 'passed' : 'failed'}`}>
                {resultModal.isPassed ? '恭喜通关！' : '继续加油！'}
              </h2>
              <p className="result-subtitle">
                {resultModal.isPassed
                  ? '花束搭配非常出色，解锁新素材！'
                  : remainingAttempts <= 0
                  ? '搭配次数已用完，可重置后再试'
                  : '再调整一下配色会更棒的'}
              </p>
            </div>

            <div className="total-score">
              <div className="total-score-label">总分</div>
              <div className="total-score-value">{resultModal.totalScore}</div>
              <div className="total-score-target">
                目标 {resultModal.requiredScore} 分 ·
                你 {' '}
                <span style={{ color: resultModal.isPassed ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>
                  {resultModal.isPassed ? '已达标' : `还差 ${resultModal.requiredScore - resultModal.totalScore} 分`}
                </span>
              </div>
            </div>

            <div className="score-breakdown">
              <div className="score-item">
                <span className="score-item-label">🎨 配色和谐度 (45%)</span>
                <span className="score-item-value">{resultModal.colorScore.score}</span>
              </div>
              <div className="score-item">
                <span className="score-item-label">🎯 场景匹配度 (45%)</span>
                <span className="score-item-value">{resultModal.styleScore.score}</span>
              </div>
              <div className="score-item">
                <span className="score-item-label">✨ 多样性加分</span>
                <span className="score-item-value positive">+{resultModal.diversityBonus}</span>
              </div>
            </div>

            <div className="score-detail-card">
              <div className="score-detail-title">配色分析详情</div>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${getProgressClass(resultModal.colorScore.details?.colorHarmony || 0, 80)}`}
                  style={{ width: `${resultModal.colorScore.details?.colorHarmony || 0}%` }}
                />
              </div>
              <div className="progress-label">
                <span>色相和谐度</span>
                <span>{resultModal.colorScore.details?.colorHarmony || 0}%</span>
              </div>

              <div className="progress-bar" style={{ marginTop: '10px' }}>
                <div
                  className={`progress-fill ${getProgressClass(resultModal.colorScore.details?.saturationHarmony || 0, 80)}`}
                  style={{ width: `${resultModal.colorScore.details?.saturationHarmony || 0}%` }}
                />
              </div>
              <div className="progress-label">
                <span>饱和度和谐</span>
                <span>{resultModal.colorScore.details?.saturationHarmony || 0}%</span>
              </div>

              <div className="progress-bar" style={{ marginTop: '10px' }}>
                <div
                  className={`progress-fill ${getProgressClass(resultModal.colorScore.details?.lightHarmony || 0, 80)}`}
                  style={{ width: `${resultModal.colorScore.details?.lightHarmony || 0}%` }}
                />
              </div>
              <div className="progress-label">
                <span>亮度和谐度</span>
                <span>{resultModal.colorScore.details?.lightHarmony || 0}%</span>
              </div>

              {resultModal.styleScore.matchedColors?.length > 0 && (
                <div className="matched-colors">
                  {resultModal.styleScore.matchedColors.map((m, idx) => (
                    <div key={idx} className="matched-item">
                      ✓ {m.target}匹配度 {m.matchScore}%
                      {m.item && ` (${m.item})`}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {resultModal.bouquetStats && (
              <div className="bouquet-summary">
                <div className="score-detail-title">🌸 花束统计</div>
                <div className="summary-grid">
                  <div className="summary-item">
                    <div className="summary-value">{resultModal.bouquetStats.totalItems}</div>
                    <div className="summary-label">总数量</div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-value">{resultModal.bouquetStats.flowerCount}</div>
                    <div className="summary-label">花材</div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-value">{resultModal.bouquetStats.leafCount}</div>
                    <div className="summary-label">叶材</div>
                  </div>
                </div>
              </div>
            )}

            {resultModal.unlockMessage && resultModal.unlockMessage.length > 0 && (
              <div className="unlock-section">
                <div className="unlock-title">🎁 解锁新素材：</div>
                <ul className="unlock-list">
                  {resultModal.unlockMessage.map((u, idx) => (
                    <li key={idx} className="unlock-item">
                      {u.type} · {u.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={retryLevel}>
                🔄 重新搭配
              </button>
              {resultModal.isPassed && resultModal.nextLevelUnlocked && (
                <button className="btn btn-primary" onClick={nextLevel}>
                  下一关 ➡️
                </button>
              )}
              {!resultModal.isPassed && (
                <button className="btn btn-primary" onClick={closeResultModal}>
                  继续调整
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
