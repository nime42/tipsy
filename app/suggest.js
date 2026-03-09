function calcOdds(bet, arr1X2) {
  let res;
  let [odds1, oddsX, odds2] = arr1X2;
  switch (bet) {
    case "one":
      res = -odds1;
      break;
    case "x":
      res = -oddsX;
      break;
    case "two":
      res = -odds2;
      break;
  }
  return res;
}

function calcOddsSvenskaFolket(bet, arr1X2) {
  let res = 0;
  let [odds1, oddsX, odds2] = arr1X2;
  switch (bet) {
    case "one":
      res = odds1;
      res += (odds1 - oddsX) * 0.5;
      res += (odds1 - odds2) * 0.5;
      break;
    case "x":
      res = oddsX;
      res += (oddsX - odds1) * 0.5;
      res += (oddsX - odds2) * 0.5;
      break;
    case "two":
      res = odds2;
      res += (odds2 - odds1) * 0.5;
      res += (odds2 - oddsX) * 0.5;
      break;
  }
  return res;
}

function createLikelyArray(type, odds) {
  let likelyArray = [];
  let calcOddsFunc = calcOdds;
  let oddsList = odds.odds;
  if (type === "SvenskaFolket") {
    calcOddsFunc = calcOddsSvenskaFolket;
    oddsList = odds.svenskaFolket;
  }
  oddsList.forEach((o, i) => {
    let odds1x2 = [
      Number(("" + o.one).replace(",", ".")),
      Number(("" + o.x).replace(",", ".")),
      Number(("" + o.two).replace(",", ".")),
    ];
    ["one", "x", "two"].forEach((b) => {
      let sortOrder = calcOddsFunc(b, odds1x2);
      likelyArray.push({ matchNr: i + 1, bet: b, order: sortOrder });
    });
  });

  likelyArray.sort((a, b) => {
    return a.order - b.order;
  });
  return likelyArray;
}

function toBetReprestentation(bet) {
  switch (bet) {
    case "1":
      return "one";
    case "X":
      return "x";
    case "2":
      return "two";
    default:
      return "?";
  }
}

function createLookupBetArray(userRow) {
  let lookup = {};
  userRow.forEach((r, i) => {
    r.split("").forEach((b) => {
      lookup[`${i + 1},${toBetReprestentation(b)}`] = r;
    });
  });
  return lookup;
}

function createLookupResultArray(result) {
  let lookup = {};
  result.forEach((r, i) => {
    lookup[`${i + 1},${r}`] = 1;
  });
  return lookup;
}

function colorize(row, colorMap, char) {
  let colors = {
    green: "\u001b[32m",
    red: "\u001b[31m",
    blue: "\u001b[34m",
    yellow: "\u001b[37m",
    white: "\x1b[37m",
  };
  let reset = "\u001b[39m";

  return row
    .split("")
    .map((c) => {
      let color = colors[colorMap[c]];
      return `${color}${char != undefined ? char : c}${reset}`;
    })
    .join("");
}

function suggest(userRow, odds, result) {
  let oddsLikelyArray = createLikelyArray("odds", odds);
  let svenskaFolketLikelyArray = createLikelyArray("SvenskaFolket", odds);
  let lookupArray = createLookupBetArray(userRow);

  let oddsDistribution = oddsLikelyArray.map((o) => {
    if (lookupArray[`${o.matchNr},${o.bet}`] === undefined) {
      return "0";
    } else {
      return "X";
    }
  });
  let svFolketDistribution = svenskaFolketLikelyArray.map((o) => {
    if (lookupArray[`${o.matchNr},${o.bet}`] === undefined) {
      return "0";
    } else {
      return "X";
    }
  });

  let resultSvFolketDistribution;
  let resultOddsDistribution;
  if (result) {
    let resultLookup = createLookupResultArray(result);
    resultSvFolketDistribution = svenskaFolketLikelyArray.map((o) => {
      if (resultLookup[`${o.matchNr},${o.bet}`] === undefined) {
        return 0;
      } else {
        return 1;
      }
    });

    resultOddsDistribution = oddsLikelyArray.map((o) => {
      if (resultLookup[`${o.matchNr},${o.bet}`] === undefined) {
        return 0;
      } else {
        return 1;
      }
    });
  }

  console.log(
    colorize(oddsDistribution.join(""), { X: "red", 0: "white" }, "*")
  );
  if (resultOddsDistribution) {
    console.log(
      colorize(resultOddsDistribution.join(""), { 1: "blue", 0: "white" }, "*")
    );
  }

  console.log(
    colorize(svFolketDistribution.join(""), { X: "red", 0: "white" }, "*")
  );
  if (resultSvFolketDistribution) {
    console.log(
      colorize(
        resultSvFolketDistribution.join(""),
        { 1: "blue", 0: "white" },
        "*"
      )
    );
  }
}

function text2Symbol(bet) {
  switch (bet) {
    case "one":
      return "1";
    case "x":
      return "X";
    case "two":
      return "2";
    default:
      console.err("wrong bet value" + bet);
  }
}

function makeSuggestion(userRow, odds) {
  let oddsLikelyArray = createLikelyArray("odds", odds);
  let userBets = userRow;
  if (userBets[0].bet !== undefined) {
    userBets = userBets.map((e) => e.bet);
  }
  let lookupArray = createLookupBetArray(userBets);

  let oddsDistribution = oddsLikelyArray.map((o) => {
    if (lookupArray[`${o.matchNr},${o.bet}`] === undefined) {
      return 0;
    } else {
      return 1;
    }
  });

  let removeCandidates = [];
  [30, 31, 32, 33].forEach((i) => {
    if (oddsDistribution[i] === 1) {
      let candidate = oddsLikelyArray[i];
      removeCandidates.push(candidate);
    }
  });

  let addCandidates = [];
  [35,36, 37, 38].forEach((i) => {
    if (oddsDistribution[i] === 0) {
      let candidate = oddsLikelyArray[i];
      addCandidates.push(candidate);
    }
  });
  let newUserBets = [...userBets];
  
  
  removeCandidates.forEach((c) => {
    let bets = newUserBets[c.matchNr - 1];
    if (bets.length === 3) {
      let addCandidateIndex = addCandidates.findIndex((e) => {
        if (newUserBets[e.matchNr - 1].length === 2) {
          return true;
        } else {
          return false;
        }
      });
      if (addCandidateIndex > -1) {
        let addCandidate = addCandidates[addCandidateIndex];
        newUserBets[addCandidate.matchNr - 1] += text2Symbol(addCandidate.bet);
        newUserBets[c.matchNr - 1] = newUserBets[c.matchNr - 1].replace(
          text2Symbol(c.bet),
          ""
        );
        addCandidates.splice(addCandidateIndex, 1);
      }
    } else if (bets.length === 2) {
      newUserBets[c.matchNr - 1] = newUserBets[c.matchNr - 1].replace(
        text2Symbol(c.bet),
        ""
      );
      let toAdd = "1X2"
        .replace(newUserBets[c.matchNr - 1], "")
        .replace(text2Symbol(c.bet), "");
      newUserBets[c.matchNr - 1] += toAdd;
    } else if (bets.length === 1) {
      let mostUnlikely = oddsLikelyArray.find((e) => e.matchNr === c.matchNr);
      newUserBets[c.matchNr - 1] = "1X2"
        .replace(text2Symbol(mostUnlikely.bet), "")
        .replace(text2Symbol(c.bet), "");
    }
  });

  addCandidates.forEach((c) => {
    let bets = newUserBets[c.matchNr - 1];
    if (bets.length === 1) {
      newUserBets[c.matchNr - 1] = text2Symbol(c.bet);
    } else if (bets.length === 2) {
      let mostUnlikely = oddsLikelyArray.find((e) => e.matchNr === c.matchNr);
      newUserBets[c.matchNr - 1] = newUserBets[c.matchNr - 1].replace(
        text2Symbol(mostUnlikely.bet),
        text2Symbol(c.bet)
      );
    }
  });

  console.log(
    "Odds:" + colorize(oddsDistribution.join(""), { 1: "red", 0: "white" }, "*")
  );

  let newLookupArray = createLookupBetArray(newUserBets);

  let newOddsDistribution = oddsLikelyArray.map((o) => {
    if (newLookupArray[`${o.matchNr},${o.bet}`] === undefined) {
      return 0;
    } else {
      return 1;
    }
  });

  console.log(
    "newO:" +
      colorize(newOddsDistribution.join(""), { 1: "red", 0: "white" }, "*")
  );

  let differ = 0;
  for (let i = 0; i < userBets.length; i++) {
    if (userBets[i] != newUserBets[i]) {
      differ++;
    }
  }


  let MIN_CHANGES=4;
  let current=5;
  for (let d = differ; d < MIN_CHANGES; d++) {
    for (let i = current; i < newOddsDistribution.length; i=i+2) {
      if (newOddsDistribution[i] === 1) {
        let candidate = oddsLikelyArray[i];
        let bet = newUserBets[candidate.matchNr - 1];
        if(bet.length===2 && newUserBets[candidate.matchNr - 1]===userBets[candidate.matchNr - 1]) {
          let toKeep=bet.replace(text2Symbol(candidate.bet),"");
          toAdd="1X2".replace(toKeep,"").replace(text2Symbol(candidate.bet),"")
          console.log(bet);
          newUserBets[candidate.matchNr - 1]=toKeep+toAdd;
          current=i+1;
          break;
        }
      }
    }
  }



  return newUserBets;
}

module.exports = {
  makeSuggestion: makeSuggestion,
  createLikelyArray: createLikelyArray,
  createLookupBetArray: createLookupBetArray,
  createLookupResultArray: createLookupResultArray,
  colorize: colorize,
};
