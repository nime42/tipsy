var sqlite3 = require('better-sqlite3');


var config = require('../resources/config.js');
var tipsyDb = require('./db/dbFunctions_better.js');


var matchInfoHandler = require('./utils/matchInfoHandler.js');

const user_id = tipsyDb.getDbInstance().prepare("SELECT id FROM users WHERE username='tipsy_experten'").get().id;
const group_id = tipsyDb.getDbInstance().prepare("SELECT id FROM groups WHERE groupname='Tipsys experttips'").get().id;


let wholeGuards = 0;
let halfGuards = 0;

function main(argv) {
    if (argv.length < 3) {
        console.log("Usage: " + argv[1] + " [stryktips|europatips|topptips] wholeGards halfGards");

        return;
    }

    if (argv[3]) {
        wholeGuards = Number(argv[3]);
    }
    if (argv[4]) {
        halfGuards = Number(argv[4]);
    }

    if (argv[2].match(/stryk.*/i)) {
        makePlay("stryktipset");

    } else if (argv[2].match(/euro.*/i)) {
        makePlay("europatipset");

    } else if (argv[2].match(/topp.*/i)) {
        makePlay("topptipsetfamily");
    } else {
        console.log("Unknown gametype:" + argv[2])
        console.log("Usage: " + argv[1] + " [stryktips|europatips|topptips]");
        return;
    }

}


const { runPythonWithData } = require("./utils/callPython.js");
function predict(betInfo) {
    const svFolket = betInfo.svenskaFolket;
    const odds = betInfo.odds;
    if (svFolket.length !== odds.length || (svFolket.length !== 8 && svFolket.length !== 13)) {
        console.err("Invalid input data");
        return null;
    }
    let rows = [];
    for (let i = 0; i < svFolket.length; i++) {
        const sv_1 = (svFolket[i].one != undefined ? svFolket[i].one : 30) / 100.0;
        const sv_x = (svFolket[i].x != undefined ? svFolket[i].x : 30) / 100.0;
        const sv_2 = (svFolket[i].two != undefined ? svFolket[i].two : 30) / 100.0;
        if (!odds[i]) {
            odds[i] = {}
        }
        const odds_1 = odds[i].one ? odds[i].one.replace(",", ".") : 1.0;
        const odds_x = odds[i].x ? odds[i].x.replace(",", ".") : 1.0;
        const odds_2 = odds[i].two ? odds[i].two.replace(",", ".") : 1.0;

        let cols = [sv_1, sv_x, sv_2, odds_1, odds_x, odds_2].join(",");
        rows.push(cols);
    }
    let oddsString = rows.join(";");
    const pythonscript = config.predictions.python_script;
    const model = config.predictions.model_file;
    return runPythonWithData(pythonscript, [model, oddsString]);
}

function getPredictions(predictions) {

    let result = predictions.trim().split(/\r?\n/).map(r => r.replace(/ +/g, " ").split(" "))
    let headers = result[0];
    let rows = result.slice(1).map(r => [Number(r[0]), r[1], ...r.slice(2).map(v => Number(v))]);
    let newRows = [];
    return { headers: headers, rows: rows };

}

function addOddsData(drawInfo) {
    drawInfo.svenskaFolket = drawInfo.draws.map(d => (d.svenskaFolket));
    drawInfo.odds = drawInfo.draws.map(d => (d.odds));
}

function addGuards(predictions, full, half) {
    let suggestions = predictions.rows.map(r => r[1]);
    const entropies = [...predictions.rows].sort((a, b) => (b[5] - a[5]));
    for (let i = 0; i < full; i++) {
        suggestions[entropies[i][0]] = "1X2";
    }
    for (let i = full; i < full + half; i++) {
        const [row, symbol, prob_1, prob_X, prob_2] = entropies[i];
        let extra = ""
        switch (symbol) {
            case "1":
                prob_X > prob_2 ? extra = "X" : extra = "2";
                break;
            case "X":
                prob_1 > prob_2 ? extra = "1" : extra = "2";
                break;
            case "2":
                prob_1 > prob_X ? extra = "1" : extra = "X";
                break;
        }
        suggestions[row] = symbol + extra;
    }
    return suggestions;
}



function makePlay(product) {
    matchInfoHandler.getPlayable(product, function (status, data) {
        if (status) {
            let draw = data[0];
            draw.groupid = group_id;
            addOddsData(draw);
            predict(draw).then((output) => {
                const predictions = getPredictions(output);
                const suggestions = addGuards(predictions, wholeGuards, halfGuards);
                const rows = draw.draws.map((r, i) => ({ teams: r.eventDescription, rownr: r.eventNumber, matchstart: r.match.matchStart, bet: suggestions[i] }));
                const betInfo = {
                    product: draw.productName,
                    regclosetime: draw.regCloseTime,
                    drawstate: draw.drawState,
                    rowprice: draw.rowPrice,
                    drawnumber: draw.drawNumber,
                    groupid: group_id,
                    extra_bet: "false",
                    rows: rows
                }

                tipsyDb.addPlay(user_id, betInfo, function (status, data) {
                    if (status) {
                        console.log("Play added successfully.");
                    } else {
                        console.error("Failed to add play:", data);
                    }
                });


            }).catch((error) => {
                console.error("Error during prediction:", error);
            });



        }
    })

}



main(process.argv);