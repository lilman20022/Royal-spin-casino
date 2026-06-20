/**
 * Modern Casino Games Controller
 * Implements 6 modern slot games with professional bonus mechanics
 * Inspired by NetEnt, Pragmatic Play, and IGT titles
 */

// AZTEC GOLD - Pyramid Bonus Theme
const AZTEC_GOLD_CONFIG = {
  name: 'Aztec Gold',
  reels: 5,
  rows: 3,
  symbols: {
    0: { label: 'AZTEC GOLD', color: 0xfbbf24, textColor: 0x000000, glow: 0xfcd34d },
    1: { label: 'PYRAMID', color: 0xb45309, textColor: 0xffffff, glow: 0xf59e0b },
    2: { label: 'JAGUAR', color: 0x7c2d12, textColor: 0xffffff, glow: 0xf97316 },
    3: { label: 'MASK', color: 0x6b21a8, textColor: 0xffffff, glow: 0xa855f7 }
  },
  bonusConfig: {
    triggerSymbol: 0,
    triggerThreshold: 3,
    baseSpinsAwarded: 8,
    pyramidMultiplier: 2.5
  }
};

// STARBURST - Expanding Wilds Theme
const STARBURST_CONFIG = {
  name: 'Starburst',
  reels: 5,
  rows: 3,
  symbols: {
    0: { label: 'STARBURST', color: 0x06b6d4, textColor: 0xffffff, glow: 0x22d3ee },
    1: { label: 'JEWEL', color: 0xec4899, textColor: 0xffffff, glow: 0xf472b6 },
    2: { label: 'DIAMOND', color: 0xfbbf24, textColor: 0x000000, glow: 0xfcd34d },
    3: { label: 'RUBY', color: 0xef4444, textColor: 0xffffff, glow: 0xf87171 }
  },
  bonusConfig: {
    triggerSymbol: 0,
    triggerThreshold: 4,
    expandingWildMultiplier: 3.0,
    reSpinCount: 3
  }
};

// BOOK OF RA - Expanding Symbols Theme
const BOOK_OF_RA_CONFIG = {
  name: 'Book of Ra',
  reels: 5,
  rows: 3,
  symbols: {
    0: { label: 'BOOK', color: 0xfbbf24, textColor: 0x000000, glow: 0xfcd34d },
    1: { label: 'PHARAOH', color: 0xfbbf24, textColor: 0x000000, glow: 0xfcd34d },
    2: { label: 'SCARAB', color: 0x10b981, textColor: 0xffffff, glow: 0x34d399 },
    3: { label: 'SPHINX', color: 0xf59e0b, textColor: 0xffffff, glow: 0xfbbf24 }
  },
  bonusConfig: {
    triggerSymbol: 0,
    triggerThreshold: 3,
    baseSpinsAwarded: 10,
    expandingSymbolMultiplier: 5.0
  }
};

// SWEET BONANZA - Cluster Mechanics Theme
const SWEET_BONANZA_CONFIG = {
  name: 'Sweet Bonanza',
  reels: 6,
  rows: 5,
  symbols: {
    0: { label: 'CANDY', color: 0xef4444, textColor: 0xffffff, glow: 0xf87171 },
    1: { label: 'LOLLIPOP', color: 0xf97316, textColor: 0xffffff, glow: 0xfbbf24 },
    2: { label: 'GRAPE', color: 0x8b5cf6, textColor: 0xffffff, glow: 0xa78bfa },
    3: { label: 'MELON', color: 0x10b981, textColor: 0xffffff, glow: 0x34d399 }
  },
  bonusConfig: {
    triggerSymbol: 0,
    triggerThreshold: 8,
    clusterThreshold: 8,
    baseMultiplier: 2.0,
    cascadeMultiplier: 1.5,
    baseSpinsAwarded: 5
  }
};

// GONZO'S QUEST - Avalanche Mechanic Theme
const GONZOS_QUEST_CONFIG = {
  name: "Gonzo's Quest",
  reels: 5,
  rows: 3,
  symbols: {
    0: { label: 'GONZO', color: 0xfbbf24, textColor: 0x000000, glow: 0xfcd34d },
    1: { label: 'IDOL', color: 0xfbbf24, textColor: 0x000000, glow: 0xfcd34d },
    2: { label: 'MASK', color: 0xef4444, textColor: 0xffffff, glow: 0xf87171 },
    3: { label: 'SKULL', color: 0x64748b, textColor: 0xffffff, glow: 0x94a3b8 }
  },
  bonusConfig: {
    triggerSymbol: 0,
    triggerThreshold: 3,
    avalancheMultiplier: 1.0,
    maxAvalanches: 5,
    multiplierIncrease: 1.0
  }
};

// REACTOONZ - Quantum Mechanics Theme
const REACTOONZ_CONFIG = {
  name: 'Reactoonz',
  reels: 7,
  rows: 7,
  symbols: {
    0: { label: 'QUANTUM', color: 0x06b6d4, textColor: 0xffffff, glow: 0x22d3ee },
    1: { label: 'ALIEN', color: 0xec4899, textColor: 0xffffff, glow: 0xf472b6 },
    2: { label: 'GAMER', color: 0x8b5cf6, textColor: 0xffffff, glow: 0xa78bfa },
    3: { label: 'NEON', color: 0xfbbf24, textColor: 0x000000, glow: 0xfcd34d }
  },
  bonusConfig: {
    triggerSymbol: 0,
    triggerThreshold: 5,
    quantumMultiplier: 2.0,
    cascadeCount: 10
  }
};

/**
 * Evaluate Aztec Gold Payline
 */
export const evaluateAztecGoldPayline = (matrix) => {
  let aztecCount = 0;
  let pyramidCount = 0;
  matrix.forEach(col => col.forEach(id => {
    if (id === 0) aztecCount++;
    if (id === 1) pyramidCount++;
  }));

  if (aztecCount >= 5) return 30.0;
  if (aztecCount >= 4) return 12.0;
  if (aztecCount >= 3) return 4.0;
  if (pyramidCount >= 3) return 2.5;
  return 0;
};

/**
 * Evaluate Starburst Payline
 */
export const evaluateStarburstPayline = (matrix) => {
  let starburstCount = 0;
  matrix.forEach(col => col.forEach(id => { if (id === 0) starburstCount++; }));

  if (starburstCount >= 5) return 25.0;
  if (starburstCount >= 4) return 8.0;
  if (starburstCount >= 3) return 3.0;
  return 0;
};

/**
 * Evaluate Book of Ra Payline
 */
export const evaluateBookOfRaPayline = (matrix) => {
  let bookCount = 0;
  let pharaohCount = 0;
  matrix.forEach(col => col.forEach(id => {
    if (id === 0) bookCount++;
    if (id === 1) pharaohCount++;
  }));

  if (bookCount >= 5) return 50.0;
  if (bookCount >= 4) return 15.0;
  if (bookCount >= 3) return 5.0;
  if (pharaohCount >= 3) return 3.0;
  return 0;
};

/**
 * Evaluate Sweet Bonanza Payline
 */
export const evaluateSweetBonanzaPayline = (matrix) => {
  let candyCount = 0;
  let lollipopCount = 0;
  matrix.forEach(col => col.forEach(id => {
    if (id === 0) candyCount++;
    if (id === 1) lollipopCount++;
  }));

  if (candyCount >= 10) return 35.0;
  if (candyCount >= 8) return 12.0;
  if (candyCount >= 6) return 4.0;
  if (lollipopCount >= 5) return 2.5;
  return 0;
};

/**
 * Evaluate Gonzo's Quest Payline
 */
export const evaluateGonzosQuestPayline = (matrix) => {
  let gonzoCount = 0;
  let idolCount = 0;
  matrix.forEach(col => col.forEach(id => {
    if (id === 0) gonzoCount++;
    if (id === 1) idolCount++;
  }));

  if (gonzoCount >= 5) return 40.0;
  if (gonzoCount >= 4) return 14.0;
  if (gonzoCount >= 3) return 5.0;
  if (idolCount >= 4) return 4.0;
  return 0;
};

/**
 * Evaluate Reactoonz Payline
 */
export const evaluateReactoonzPayline = (matrix) => {
  let quantumCount = 0;
  let alienCount = 0;
  matrix.forEach(col => col.forEach(id => {
    if (id === 0) quantumCount++;
    if (id === 1) alienCount++;
  }));

  if (quantumCount >= 8) return 50.0;
  if (quantumCount >= 6) return 18.0;
  if (quantumCount >= 4) return 6.0;
  if (alienCount >= 5) return 5.0;
  return 0;
};

/**
 * Get payline evaluator for modern games
 */
export const getModernGamePaylineEvaluator = (gameId) => {
  const evaluators = {
    AZTEC_GOLD: evaluateAztecGoldPayline,
    STARBURST: evaluateStarburstPayline,
    BOOK_OF_RA: evaluateBookOfRaPayline,
    SWEET_BONANZA: evaluateSweetBonanzaPayline,
    GONZOS_QUEST: evaluateGonzosQuestPayline,
    REACTOONZ: evaluateReactoonzPayline
  };
  return evaluators[gameId] || (() => 0);
};

/**
 * Get game configuration
 */
export const getModernGameConfig = (gameId) => {
  const configs = {
    AZTEC_GOLD: AZTEC_GOLD_CONFIG,
    STARBURST: STARBURST_CONFIG,
    BOOK_OF_RA: BOOK_OF_RA_CONFIG,
    SWEET_BONANZA: SWEET_BONANZA_CONFIG,
    GONZOS_QUEST: GONZOS_QUEST_CONFIG,
    REACTOONZ: REACTOONZ_CONFIG
  };
  return configs[gameId];
};

/**
 * Check if modern game triggers bonus
 */
export const checkModernGameBonusTrigger = (gameId, matrix) => {
  const config = getModernGameConfig(gameId);
  if (!config) return { triggered: false };

  let triggerCount = 0;
  matrix.forEach(col => col.forEach(id => {
    if (id === config.bonusConfig.triggerSymbol) triggerCount++;
  }));

  if (triggerCount >= config.bonusConfig.triggerThreshold) {
    return {
      triggered: true,
      bonusType: `${gameId}_BONUS`,
      spinsAwarded: config.bonusConfig.baseSpinsAwarded || 5,
      multiplier: config.bonusConfig.pyramidMultiplier || 
                  config.bonusConfig.expandingWildMultiplier ||
                  config.bonusConfig.expandingSymbolMultiplier ||
                  config.bonusConfig.baseMultiplier ||
                  config.bonusConfig.avalancheMultiplier ||
                  config.bonusConfig.quantumMultiplier
    };
  }

  return { triggered: false };
};

export {
  evaluateAztecGoldPayline,
  evaluateStarburstPayline,
  evaluateBookOfRaPayline,
  evaluateSweetBonanzaPayline,
  evaluateGonzosQuestPayline,
  evaluateReactoonzPayline
};
