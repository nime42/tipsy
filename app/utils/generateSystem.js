function generateSystem(matches, options = {}) {
  const { half = 3, full = 3, valueWeight = 0.4, xUncertaintyWeight = 0.05 } = options;

  // 1. Analysera varje match
  const analysed = matches.map((match) => analyseMatch(match, valueWeight, xUncertaintyWeight));

  // 2. Välj vilka matcher som ska helgarderas
  const fullMatches = analysed.sort((a, b) => b.fullValue - a.fullValue).slice(0, full);

  const fullSet = new Set(fullMatches.map((m) => m.index));

  // 3. Välj vilka av återstående matcher som ska halvgarderas
  const halfMatches = analysed
    .filter((m) => !fullSet.has(m.index))
    .sort((a, b) => b.halfValue - a.halfValue)
    .slice(0, half);

  const halfSet = new Set(halfMatches.map((m) => m.index));

  // 4. Bestäm tecken för varje match
  const selections = analysed
    .sort((a, b) => a.index - b.index)
    .map((match) => {
      if (fullSet.has(match.index)) {
        return ["1", "X", "2"];
      }

      if (halfSet.has(match.index)) {
        return match.bestTwo;
      }

      return [match.best];
    });

  // 5. Skapa alla rader
  //const rows = cartesianProduct(selections);

  return {
    selections,
    analysis: analysed,
  };
}

function analyseMatch(match, valueWeight = 0.4, xUncertaintyWeight = 1.5) {
  const odds = [match.odds1, match.oddsX, match.odds2];

  const folk = [match.streck1, match.streckX, match.streck2];

  // -------------------------
  // 1. Odds -> sannolikheter
  // -------------------------

  const implied = odds.map((o) => 1 / o);

  const sum = implied.reduce((a, b) => a + b, 0);

  const probability = implied.map((p) => p / sum);

  // -------------------------
  // 2. Value mot svenska folket
  // -------------------------

  const value = probability.map((p, i) => {
    const f = folk[i] / 100;

    return p / f;
  });

  // -------------------------
  // 5. Osäkerhet
  // -------------------------

  const uncertainty = calculateUncertainty(probability[0], probability[1], probability[2]);

  // -------------------------
  // 3. Kombinera sannolikhet
  //    och value
  // -------------------------

  const score = probability.map((p, i) => {
    return p * Math.pow(value[i], valueWeight);
  });

  console.log("score X", score[1], "uncertainty", uncertainty, "xUncertaintyWeight", xUncertaintyWeight);
  score[1] *= 1 + xUncertaintyWeight * uncertainty;
  console.log("score X after", score[1]);

  // -------------------------
  // 4. Rangordna tecknen
  // -------------------------

  const signs = ["1", "X", "2"];

  const ranked = signs
    .map((sign, i) => ({
      sign,
      probability: probability[i],
      value: value[i],
      score: score[i],
    }))
    .sort((a, b) => b.score - a.score);

  // Hur mycket vi tjänar på att
  // lägga till ytterligare tecken.
  //const halfValue = ranked[1].score;
  //const fullValue = ranked[1].score + ranked[2].score;

  const halfValue = ranked[1].score * (0.5 + uncertainty);
  const fullValue = (ranked[1].score + ranked[2].score) * (0.5 + uncertainty);

  return {
    index: match.index,

    probability: {
      1: probability[0],
      X: probability[1],
      2: probability[2],
    },

    value: {
      1: value[0],
      X: value[1],
      2: value[2],
    },

    score: {
      1: score[0],
      X: score[1],
      2: score[2],
    },

    uncertainty,

    best: ranked[0].sign,

    bestTwo: [ranked[0].sign, ranked[1].sign].sort(
      (a, b) => signs.indexOf(a) - signs.indexOf(b),
    ),

    halfValue,
    fullValue,

    ranking: ranked,
  };
}

function calculateUncertainty(p1, px, p2) {
  const probabilities = [p1, px, p2];

  // Entropi
  let entropy = 0;

  for (const p of probabilities) {
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }

  // Maximal entropi för tre utfall = log2(3)
  const maxEntropy = Math.log2(3);

  // Normaliserat till 0–1
  return entropy / maxEntropy;
}

function cartesianProduct(arrays) {
  return arrays.reduce(
    (result, current) => {
      return result.flatMap((row) => current.map((value) => [...row, value]));
    },
    [[]],
  );
}

function prepareBetInfo(betInfo) {
  let res = [];

  let nrOfMatches = Math.min(betInfo.odds?.length, betInfo.svenskaFolket?.length);
  for (let i = 0; i < nrOfMatches; i++) {
    let odds = betInfo.odds[i];
    let svFolket = betInfo.svenskaFolket[i];
    let m = {
      index: i + 1,
      odds1: Number(odds["one"].replace(",", ".")),
      oddsX: Number(odds["x"].replace(",", ".")),
      odds2: Number(odds["two"].replace(",", ".")),
      streck1: Number(svFolket["one"].replace(",", ".")),
      streckX: Number(svFolket["x"].replace(",", ".")),
      streck2: Number(svFolket["two"].replace(",", ".")),
    };
    res.push(m);
  }

  return res;
}

function getSystemFromSelections(selections) {
  return selections.map((s) => s.join(""));
}

module.exports = {
  generateSystem,
  prepareBetInfo,
  analyseMatch,
};
