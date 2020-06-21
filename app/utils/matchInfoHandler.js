

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




function getDraw_old(product, draw, withResult, callback) {
    if (withResult) {
        draw += "/result";
    }
    let httpReq = url + "/draw/" + product.toLowerCase().replace(" ","") + "/draws/" + draw + "?_=" + new Date().getTime();
    console.log(httpReq);
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


function getDraw(product, draw, callback) {
    let urls=[];
    urls.push("/draw/" + product.toLowerCase().replace(" ","") + "/draws/" + draw);
    urls.push("/draw/" + product.toLowerCase().replace(" ","") + "/draws/forecast/" + draw);
    urls.push("/draw/" + product.toLowerCase().replace(" ","") + "/draws/" + draw+"/result");
    let httpReq=url+"/multifetch?urls="+urls.join("|")+"&_="+ new Date().getTime();

    console.log(httpReq);
    fetch(httpReq)
        .then(res => res.json())
        .then(
            json => {
                //console.log(json);
                let res={};
                res.draws=parseDraw(json.responses[0]);
                res.forecast=parseForecast(json.responses[1]);
                res.result=parseResult(json.responses[2]);
                callback(true,res);
                
            },
            err => callback(false, err)
        );
}

//getDraw2("europatipset",1966,function(status,data) {console.log(status,data)});


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
                getDraw(res.product, res.drawNumber, function (status, data) {
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
    if(r===undefined) {
        return null;
    }

    let res={};
    res.cancelled=r.cancelled;
    res.productName = r.productName;
    res.distribution=r.distribution;
    res.drawNumber=r.drawNumber;
    res.regCloseTime=r.regCloseTime;
    res.results=[];
    r.events.forEach(e => {
        let row={};
        row.eventDescription=e.eventDescription;
        row.eventNumber=e.eventNumber;
        row.outcome=e.outcome;
        row.result=e.outcomeScore.home+" - "+e.outcomeScore.away;
        res.results.push(row);

    });
    res.distribution=r.distribution;
    return res;
}

function parseForecast(data) {
    let r = data.forecastResult;
    if(r===undefined) {
        return null;
    }
    let res={};
    if(r.winresult) {
        res.winresult=r.winresult.map(e=>{e.amount=e.winValue;return e});
        return res;
    } else {
        return null;
    }
}

function parseDraw(data) {                

    let r = data.draw;

    if(r===undefined) {
        return null;
    }

    let res={};
    res.drawState=r.drawState;
    res.productName = r.productName, //r.productFamily?r.productFamily:r.productName; //handle when productName="topptipset Extra for example"
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

        let current=e.match.result.find(e=>(e.descripton=="Full time" || e.description.match(/.*Current/i)));
        if(current) {
            row.result=current.home+" - "+current.away;
        } else {
            row.result="0 - 0";
        }



        res.draws.push(row);

    });
    return res;
}



module.exports={
    getPlayable:getPlayable,
    getDraw:getDraw
}


