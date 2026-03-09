var sqlite3 = require("better-sqlite3");
var statDb = new sqlite3("./resources/tipsy_statistics.db");
statDb.pragma("foreign_keys = ON");

var tipsyDb = new sqlite3("./resources/tipsy.db");
tipsyDb.pragma("foreign_keys = ON");

var fs = require("fs");

var suggest = require("./suggest");

function fetchStat() {
  let sql = `
  select r.*,o1.odds as odds1,oX.odds as oddsX,o2.odds as odds2, 
  sv1.odds as sv1,svX.odds as svX,sv2.odds as sv2
  from v_draw_rows r
  LEFT join odds o1 on r.drawId =o1.drawId and r.matchNr =o1.matchNr 
  LEFT join odds oX on r.drawId =oX.drawId and r.matchNr =oX.matchNr
  LEFT join odds o2 on r.drawId =o2.drawId and r.matchNr =o2.matchNr
  LEFT join odds sv1 on r.drawId =sv1.drawId and r.matchNr =sv1.matchNr 
  LEFT join odds svX on r.drawId =svX.drawId and r.matchNr =svX.matchNr
  LEFT join odds sv2 on r.drawId =sv2.drawId and r.matchNr =sv2.matchNr
  where o1."type" ='odds' and o1.outcome ='one'
  and oX."type" ='odds' and oX.outcome ='x'
  and o2."type" ='odds' and o2.outcome ='two'
  AND sv1."type" ='SvenskaFolket' and sv1.outcome ='one'
  and svX."type" ='SvenskaFolket' and svX.outcome ='x'
  and sv2."type" ='SvenskaFolket' and sv2.outcome ='two'
  and r.drawstate='Finalized'
  `;
  const rows = statDb.prepare(sql).all();
  let lookup = {};
  rows.forEach((r) => {
    let k = `${r.product},${r.drawnumber}`;
    if (lookup[k] === undefined) {
      lookup[k] = {
        result: [],
        odds: [],
        svFolket: [],
      };
    }
    lookup[k].result.push(r.result);
    lookup[k].svFolket.push({ one: r.sv1, x: r.svX, two: r.sv2 });
    lookup[k].odds.push({ one: r.odds1, x: r.oddsX, two: r.odds2 });
  });
  return lookup;
}

function prepareData(product, group) {
  let res = [];

  let statistics = fetchStat();

  let sql = `SELECT * FROM v_draws_in_groups vdig WHERE product=? and groupid=? order by created`;
  const rows = tipsyDb.prepare(sql).all(product,group);

  let parseRow = (row) => {
    let res = [];
    if (row === null) {
      return res;
    }

    return row.split("|").map((m) => {
      let [matchNr, descr, bet] = m.split(";");
      return bet;
    });
  };

  rows.forEach((r) => {
    let userRow = parseRow(r.rows);
    let stat = statistics[`${r.product.toLowerCase()},${r.drawnumber}`];
    if (stat) {
      res.push({
        info: r,
        userRow: userRow,
        result: stat.result,
        odds: { svenskaFolket: stat.svFolket, odds: stat.odds },
      });
    }
  });

  return res;
}

function suggestion(userRow, odds) {
  let oddsLikelyArray = suggest.createLikelyArray("odds", odds);
  console.log(userRow);
}

function collectTrainingData(data) {
  let trainingData = [];
  data.forEach((d) => {
    if (d.result.length < 13) {
      console.log("Missing results", d.info);
      return;
    }

    if (d.result[0] === null) {
      console.log("result is null", d.info);
      return;
    }
    let oddsLikelyArray = suggest.createLikelyArray("odds", d.odds);
    let lookupArray = suggest.createLookupBetArray(d.userRow);
    let oddsDistribution = oddsLikelyArray.map((o) => {
      if (lookupArray[`${o.matchNr},${o.bet}`] === undefined) {
        return 0;
      } else {
        return 1;
      }
    });

    let resultLookup = suggest.createLookupResultArray(d.result);
    let resultOddsDistribution = oddsLikelyArray.map((o) => {
      if (resultLookup[`${o.matchNr},${o.bet}`] === undefined) {
        return 0;
      } else {
        return 1;
      }
    });
    console.log(oddsDistribution.join(""));
    console.log(resultOddsDistribution.join(""));

    trainingData.push({
      input: oddsDistribution,
      output: resultOddsDistribution,
    });
  });
  return trainingData;
}

const brain = require("brain.js");

function train(trainData) {
  const config13 = {
    hiddenLayers: [39, 39],
    learningRate: 0.01,
    decayRate: 0.999,
  };

  const config8 = {
    hiddenLayers: [39, 39],
    learningRate: 0.01,
    decayRate: 0.999,
  };

  let config = config13;
  let systemSize = 13;

  if (trainData[0].input.length / 3 === 8) {
    config = config8;
    systemSize = 8;
  }

  const net = new brain.NeuralNetwork(config);
  net.train(trainData);
  console.log("done training");

  let jsonData = net.toJSON();
  let file = `./resources/nn/net${systemSize}.json`;
  fs.writeFile(file, JSON.stringify(jsonData), "utf8", (err) => {
    if (err) throw err;
    console.log(`saved ${file}`);
  });

  /*  trainData.forEach(d=>{
    let result=net.run(d.input).map(e=>Math.round(e)); 
    console.log(result.join(","))
    console.log(d.output.join(","));
    console.log("--------------");
  })*/
}

function loadNet(file) {
  const netConf = fs.readFileSync(file, { encoding: "utf8", flag: "r" });

  const net = new brain.NeuralNetwork();
  net.fromJSON(JSON.parse(netConf));
  return net;
}

function test(trainData) {
  let systemSize = 13;

  if (trainData[0].input.length / 3 === 8) {
    systemSize = 8;
  }
  let confFile = `./resources/nn/net${systemSize}.json`;
  let net = loadNet(confFile);

  trainData.forEach((d) => {
    let result = net.run(d.input).map((e) => Math.round(e));
    console.log(result.join(","));
    console.log(d.output.join(","));
    console.log("--------------");
  });
}

const net13 = loadNet("./resources/nn/net13.json");

function text2Symbol(bet) {
  switch (bet) {
    case "one":
      return "1";
    case "x":
      return "X";
    case "two":
      return "2";
    default:
      console.log("wrong bet value"+bet)
  }
}

function makeSuggestion(userRow, odds) {
  let oddsLikelyArray = suggest.createLikelyArray("odds", odds);
  let userBets = userRow;
  let lookupArray = suggest.createLookupBetArray(userBets);

  let oddsDistribution = oddsLikelyArray.map((o) => {
    if (lookupArray[`${o.matchNr},${o.bet}`] === undefined) {
      return 0;
    } else {
      return 1;
    }
  });

  let removeCandidates = [];
  [30,31, 32, 33].forEach((i) => {
    if (oddsDistribution[i] === 1) {
      let candidate=oddsLikelyArray[i]
      removeCandidates.push(candidate);
    }
  });

  let addCandidates=[];
  [36,37,38].forEach(i=>{
    if (oddsDistribution[i] === 0) {
      let candidate=oddsLikelyArray[i]
      addCandidates.push(candidate);
    }
  })
  let newUserBets = [...userBets];

  removeCandidates.forEach(c=>{
    let bets=newUserBets[c.matchNr-1];
    if(bets.length===3) {
      let addCandidateIndex=addCandidates.findIndex(e=>{
        if(newUserBets[e.matchNr-1].length===2) {
          return true;
        } else {
          return false;
        }
      });
      if(addCandidateIndex>-1) {
        let addCandidate=addCandidates[addCandidateIndex];
        newUserBets[addCandidate.matchNr-1]+=text2Symbol(addCandidate.bet);
        newUserBets[c.matchNr-1]=newUserBets[c.matchNr-1].replace(text2Symbol(c.bet),"");
        addCandidates.splice(addCandidateIndex,1)
      }
    } else if(bets.length===2) {
      newUserBets[c.matchNr-1]=newUserBets[c.matchNr-1].replace(text2Symbol(c.bet),"");
      let toAdd="1X2".replace(newUserBets[c.matchNr-1],"").replace(text2Symbol(c.bet),"");
      newUserBets[c.matchNr-1]+=toAdd;
    } else if(bets.length===1) {
      let mostUnlikely=oddsLikelyArray.find(e=>(e.matchNr===c.matchNr));
      newUserBets[c.matchNr-1]="1X2".replace(text2Symbol(mostUnlikely.bet),"").replace(text2Symbol(c.bet),"");
    }
  })

  
  addCandidates.forEach(c=>{
    let bets=newUserBets[c.matchNr-1];
    if(bets.length===1) {
      newUserBets[c.matchNr-1]=text2Symbol(c.bet);
    } else if(bets.length===2) {
      let mostUnlikely=oddsLikelyArray.find(e=>(e.matchNr===c.matchNr));
      newUserBets[c.matchNr-1]=newUserBets[c.matchNr-1].replace(text2Symbol(mostUnlikely.bet),text2Symbol(c.bet));
    }

  })

  console.log(
    "Odds:" +
      suggest.colorize(oddsDistribution.join(""), { 1: "red", 0: "white" }, "*")
  );


  let newLookupArray = suggest.createLookupBetArray(newUserBets);

  let newOddsDistribution = oddsLikelyArray.map((o) => {
    if (newLookupArray[`${o.matchNr},${o.bet}`] === undefined) {
      return 0;
    } else {
      return 1;
    }
  });

  console.log(
    "newO:" +
      suggest.colorize(newOddsDistribution.join(""), { 1: "red", 0: "white" }, "*")
  );


  return newUserBets;

}

function testMakeSuggestion() {
  let odds = {
    odds: [
      { one: 2.08, x: 4.15, two: 3.18 },
      { one: 1.51, x: 5.15, two: 5.65 },
      { one: 2.03, x: 3.59, two: 3.79 },
      { one: 2.62, x: 3.36, two: 2.79 },
      { one: 1.21, x: 7.8, two: 11.8 },
      { one: 1.92, x: 3.9, two: 3.83 },
      { one: 3.02, x: 3.63, two: 2.28 },
      { one: 2.16, x: 3.68, two: 3.21 },
      { one: 3.99, x: 3.65, two: 1.91 },
      { one: 2.29, x: 3.43, two: 3.14 },
      { one: 2.17, x: 3.36, two: 3.47 },
      { one: 2.93, x: 3.32, two: 2.47 },
      { one: 2.31, x: 3.24, two: 3.28 },
    ],
  };
  let userRow = [
    { bet: "1X" },
    { bet: "1" },
    { bet: "1X" },
    { bet: "1" },
    { bet: "1" },
    { bet: "1" },
    { bet: "1X2" },
    { bet: "1" },
    { bet: "1X" },
    { bet: "1" },
    { bet: "1X" },
    { bet: "1" },
    { bet: "1X2" },
  ];
  result = [
    "x",
    "x",
    "x",
    "one",
    "one",
    "one",
    "x",
    "x",
    "two",
    "x",
    "one",
    "one",
    "one",
  ];

  makeSuggestion(userRow, odds);

  let lookupArray = suggest.createLookupBetArray(userRow.map((r) => r.bet));

  let oddsLikelyArray = suggest.createLikelyArray("odds", odds);

  let resultLookup = suggest.createLookupResultArray(result);

  let resultOddsDistribution = oddsLikelyArray.map((o) => {
    if (resultLookup[`${o.matchNr},${o.bet}`] === undefined) {
      return 0;
    } else {
      return 1;
    }
  });

  console.log(
    " res:" +
      suggest.colorize(
        resultOddsDistribution.join(""),
        { 1: "blue", 0: "white" },
        "*"
      )
  );
}
function analyze(userRow, odds, result, info) {
  let oddsLikelyArray = suggest.createLikelyArray("odds", odds);
  let svenskaFolketLikelyArray = suggest.createLikelyArray(
    "SvenskaFolket",
    odds
  );
  let lookupArray = suggest.createLookupBetArray(userRow);

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
    let resultLookup = suggest.createLookupResultArray(result);
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

  let showOdds = true;
  let showSvF = false;

  if (showOdds) {
    console.log(
      "Odds:" +
        suggest.colorize(
          oddsDistribution.join(""),
          { X: "red", 0: "white" },
          "*"
        )
    );
    if (resultOddsDistribution) {
      console.log(
        " res:" +
          suggest.colorize(
            resultOddsDistribution.join(""),
            { 1: "blue", 0: "white" },
            "*"
          )
      );
    }
  }
  if (showSvF) {
    console.log(
      "svFo:" +
        suggest.colorize(
          svFolketDistribution.join(""),
          { X: "red", 0: "white" },
          "*"
        )
    );
    if (resultSvFolketDistribution) {
      console.log(
        " res:" +
          suggest.colorize(
            resultSvFolketDistribution.join(""),
            { 1: "blue", 0: "white" },
            "*"
          ) +
          ":" +
          info.created
      );
    }
  }
}


function analyze2(userRow, odds, result, info) {
  let matchOdds=odds.svenskaFolket;
  if(matchOdds.length<13) {
    console.log("missing odds");
    return;
  }
  let nrOfRights=0;
  let svFRow=[];
  userRow.forEach((r,i)=>{
    let outcome=Math.floor(Math.random() * 101);
    let o=matchOdds[i];
    let last=0;
    let res;
    ["one","x","two"].every(e=>{
      if((last+o[e])>outcome) {
        res=e;
        return false;
      }
      last+=o[e];
      return true;
    })
    res=text2Symbol(res);
    svFRow.push(res);
    if(r.search(res)>-1) {
      nrOfRights++;
    }
  })
  console.log(svFRow.join(","));
  console.log(result.map(e=>(text2Symbol(e))).join(","));

  console.log(nrOfRights);
}

function countNrOfRights(row,result) {
  let rights=0;
  result.forEach((r,i)=>{
    if(r!==null) {
      let symbol=text2Symbol(r);
      if(row[i].search(symbol)>-1) {
        rights++;
      }
    }
  })
  return rights;
}

//testMakeSuggestion();
//return;

let data = prepareData("Stryktipset", 4);

//let trainingData = collectTrainingData(data);

//train(trainingData);
//test(trainingData);
//return;

data.forEach((d) => {
  console.log(
    `${d.info.created},${d.info.created_by_name},${d.info.nrofrights} (${d.info.systemsize}))`
  );
  analyze2(d.userRow, d.odds, d.result, d.info);
  //let newUserRow=suggest.makeSuggestion(d.userRow,d.odds);
  //console.log(`nrofrights:${countNrOfRights(newUserRow,d.result)} org:${countNrOfRights(d.userRow,d.result)}`);
});

return;
