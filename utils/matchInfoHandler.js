

const fetch = require('node-fetch'); 

const url = "https://api.spela.svenskaspel.se";

function getMatchDates(product, year, month, callback) {
    let httpReq = url + "/draw/results/datepicker?product=" + product + "&year=" + year + "&month=" + month + "&_=" + new Date().getTime();

    fetch(httpReq)
    .then(res => res.json())
    .then(
        json => {
            if (json.error) {
                callback(false, json.error);
            } else {
                callback(true, json.resultDates);
            }        },
        err => callback(false, err)
    );

}




function getDraw(product, draw, withResult, callback) {
    if (withResult) {
        draw += "/result";
    }
    let httpReq = url + "/draw/" + product + "/draws/" + draw + "?_=" + new Date().getTime();
    fetch(httpReq)
        .then(res => res.json())
        .then(
            json => {
                if (withResult)
                    callback(true, parseResult(json));
                else {
                    callback(true, parseDraw(json));
                }
            },
            err => callback(false, err)
        );
}






function getMatches(date, product, callback) {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    //console.log(year,month);
    getMatchDates(product, year, month, function (status, resultDates) {
        if (status) {

            let res = resultDates.find(e => {
                let d = new Date(e.date);
                if (d.getFullYear() == date.getFullYear() && d.getMonth() == date.getMonth() && d.getDate() == date.getDate()) {
                    return true;
                }
            });
            let withResult = false;
            if (res.drawState === "Finalized") {
                withResult = true;
            }

            if (res) {
                getDraw(res.product, res.drawNumber, withResult, function (status, data) {
                    if (status) {
                        callback(true, res.drawState, data)
                    } else {
                        callback(false, data)
                    }
                });
            }


        } else {
            callback(false, resultDates);
        }
        //console.log(resultDates);
    });

}

function getPlayable(product,callback) {
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    //console.log(year,month);
    getMatchDates(product, year, month, function (status, resultDates) {
        if (status) {
            let res = resultDates.find(e => {
                return e.drawState === "Open";
            });


            if (res) {
                getDraw(res.product, res.drawNumber, false, function (status, data) {
                    if (status) {
                        callback(true, data);
                    } else {
                        callback(false, data);
                    }
                });
            } else {
                callback(false,"NOT_PLAYABLE");
            }
        } else {
            callback(false, resultDates);
        }


    });


}



function parseResult(data) {
    let r = data.result;

    let res={};
    res.cancelled=r.cancelled;
    res.productName = r.productFamily?r.productFamily:r.productName;
    res.distribution=r.distribution;
    res.drawNumber=r.drawNumber;
    res.regCloseTime=r.regCloseTime;
    res.results=[];
    r.events.forEach(e => {
        let row={};
        row.eventDescription=e.eventDescription;
        row.outcome=e.outcome;
        row.outcomeScore=e.outcomeScore;
        res.results.push(row);

    });
    return res;
}


function parseDraw(data) {                

    let r = data.draw;

    let res={};
    res.drawState=r.drawState;
    res.productName = r.productFamily?r.productFamily:r.productName; //handle when productName="topptipset Extra for example"
    res.drawNumber=r.drawNumber;
    res.regCloseTime=r.regCloseTime;
    res.draws=[];
    r.drawEvents.forEach(e => {
        let row={};
        row.eventDescription=e.eventDescription;
        row.eventNumber=e.eventNumber;
        row.odds=e.odds;
        row.svenskaFolket=e.svenskaFolket;
        row.match=e.match;
        res.draws.push(row);

    });
    return res;
}



module.exports={
    getPlayable:getPlayable,
    getDraw:getDraw
}


