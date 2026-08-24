const tipsyUrl = "http://localhost:8080";
const username = "tipsy_experten";
const password = "123456";
const groupId = -20;
let token;

async function login(username, password) {
  let headers = new Headers();
  headers.append("Content-Type", "application/json");

  const response = await fetch(tipsyUrl + "/login", {
    method: "POST",
    headers: headers,
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  }
  return response.headers.get("set-cookie");
}

async function getPlayables(product) {
  let headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Cookie", token);

  const response = await fetch(tipsyUrl + "/getPlayable", {
    method: "POST",
    headers: headers,
    body: JSON.stringify({ product: product }),
  });

  const body = await response.text();

  if (!response.headers.get("content-type")?.includes("application/json")) {
    console.log("failed to get playables. Body is:"+body);
    return undefined;
  }
  return JSON.parse(body);
}

async function getPredictables(playables, nrOfFull, nrOfHalf) {
  const getDrawInfo = (data) => {
    const drawIndex = 0;
    const drawInfo = data[drawIndex];
    if (!drawInfo) {
      return undefined;
    }
    return {
      svenskaFolket: drawInfo.draws.map((d) => d.svenskaFolket),
      odds: drawInfo.draws.map((d) => d.odds),
      matches: drawInfo.draws.map((d) => d.eventDescription),
      drawnumber: drawInfo.drawNumber,
      product: drawInfo.productName,
      productId: drawInfo.productId,
    };
  };

  const drawInfo = getDrawInfo(playables);
  if (!drawInfo) {
    console.log("Failed to get playables");
    return undefined;
  }

  const requestBody = {
    gards: {
      full: nrOfFull,
      half: nrOfHalf,
    },
    betInfo: drawInfo,
    groupId: groupId,
  };

  let headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Cookie", token);

  const response = await fetch(tipsyUrl + "/getPredictions", {
    method: "POST",
    headers: headers,
    body: JSON.stringify(requestBody),
  });

  const body = await response.text();

  if (!response.headers.get("content-type")?.includes("application/json")) {
    return body;
  }
  const res = JSON.parse(body);
  return res.selections.map((r) => r.join(""));
}

async function play(playables, predictions) {
  const createDrawInfo = (data, bettings) => {
    let drawIndex = 0;
    let drawInfo = {
      groupid: groupId,
      drawnumber: data[drawIndex].drawNumber,
      product: data[drawIndex].productName,
      productId: data[drawIndex].productId,
      drawstate: data[drawIndex].drawState,
      regclosetime: data[drawIndex].regCloseTime,
      rowprice: data[drawIndex].rowPrice,
      extra_bet: 0,
      rows: [],
    };

    for (let i = 0; i < bettings.length; i++) {
      let row = {};
      row.rownr = i + 1;
      row.teams = data[drawIndex].draws[i].eventDescription;
      row.bet = bettings[i];
      row.matchstart = data[drawIndex].draws[i].match.matchStart;
      drawInfo.rows.push(row);
    }

    return drawInfo;
  };

  const draw = createDrawInfo(playables, predictions);

  let headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Cookie", token);

  const response = await fetch(tipsyUrl + "/play", {
    method: "POST",
    headers: headers,
    body: JSON.stringify(draw),
  });

  const body = await response.text();

  if (!response.headers.get("content-type")?.includes("application/json")) {
    return body;
  }
  const res = JSON.parse(body);
  return res;
}

async function predictAndPlay(product, full, half) {
  console.log(`getting playables for ${product}`);
  const p = await getPlayables(product);
  if (!p || p.length<1) {
    console.log("No playables");
    return null;
  }
  const predictions = await getPredictables(p, full, half);
  if (predictions) {
    await play(p, predictions);
    console.log("playing system: ", JSON.stringify(predictions));
  }
}

async function main(argv) {
  if (argv.length < 3) {
    console.log("Usage: " + argv[1] + " [stryktipset|europatipset|topptipsetfamily] fullGards halfGards");
    return;
  }
  const product = argv[2];
  const full =Number(argv[3]);
  const half=Number(argv[4]);


  token = await login(username, password);
  console.log("Logged in successfully");

  predictAndPlay(product, full, half);
}

main(process.argv);
