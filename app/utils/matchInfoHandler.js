

const fetch = require('node-fetch'); 
var config=require('../../resources/config.js');


function getMatchDates(product, year, month, callback) {
    let httpReq = config.matchInfo.url + "/draw/results/datepicker?product=" + product + "&year=" + year + "&month=" + month + "&_=" + new Date().getTime();
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




function getDraw(product, draw, callback) {
    let httpReq = config.matchInfo.url + "/draw/" + product.toLowerCase().replace(" ","") + "/draws/" + draw + "?_=" + new Date().getTime();
    fetch(httpReq)
        .then(res => res.json())
        .then(
            json => {
                callback(true, parseDraw(json));
            },
            err => callback(false, err)
        );
}


function getDrawAndResult(product, draw, callback) {
    let urls=[];
    urls.push("/draw/" + product.toLowerCase().replace(" ","") + "/draws/" + draw);
    urls.push("/draw/" + product.toLowerCase().replace(" ","") + "/draws/forecast/" + draw);
    urls.push("/draw/" + product.toLowerCase().replace(" ","") + "/draws/" + draw+"/result");
    let httpReq=config.matchInfo.url+"/multifetch?urls="+urls.join("|")+"&_="+ new Date().getTime();
    fetch(httpReq)
        .then(res => res.json())
        .then(
            json => {
                let res={};
                res.draws=parseDraw(json.responses[0]);
                res.forecast=parseForecast(json.responses[1]);
                res.result=parseResult(json.responses[2]);
                callback(true,res);
                
            },
            err => callback(false, err)
        );
}

//getDrawAndResult('topptipsetextra',1275,function(status,data) {console.log(status,data)});

function getDrawAndResultCache(draws, callback=console.log) {
    let nrofCalls=draws.length;
    let cache={};
    if(nrofCalls===0) {
        callback(cache);
        return;
    };
    draws.forEach(d=>{
        let product=d.product;
        let drawNumber=d.drawnumber;
        getDrawAndResult(product,drawNumber, function(status,response) {
            nrofCalls--;
            cache[product+";"+drawNumber]={status:status,response:response};
            if(nrofCalls===0) {
                callback(cache);
            }
            
        });


    });

}

/*
var draws=[ { drawnumber: 4652, product: 'Stryktipset' } ];

getDrawAndResultCache(draws);
//getDraw2("europatipset",1966,function(status,data) {console.log(status,data)});
*/

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
        row.cancelled=e.cancelled;
        row.eventNumber=e.eventNumber;
        row.outcome=e.outcome;
        if(row.cancelled && row.outcome) {
            row.result="Lottad "+row.outcome;
        } else {
            row.result=e.outcomeScore.home+" - "+e.outcomeScore.away;
        }
        row.status="Avslutad"; // To harmonze with drawInfo (see parseDraw)
        res.results.push(row);

    });
    return res;
}

function parseForecast(data) {
    
    let r = data.forecastResult;

    if(r===undefined) {
        return null;
    }
    //console.log(r.drawResults);
    let matchInfo=r.drawResults.map(e=>{return {home:e.home,away:e.away,outcome:e.outcome,time:e.time}});
    let res={};
    if(r.winresult) {
        res.winresult=r.winresult.map(e=>{e.amount=e.winValue;return e});
        res.matchInfo=matchInfo;
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
    res.rowPrice=r.rowPrice.replace(",",".");
    res.draws=[];
    r.drawEvents.forEach(e => {
        let row={};
        row.eventDescription=e.eventDescription;
        row.eventNumber=e.eventNumber;
        row.odds=e.odds;
        row.svenskaFolket=e.svenskaFolket;
        row.match=e.match;
        row.matchTime=getMatchTime(row.match);
        row.status=e.match.status;//To harmonize with resultInfo (see parseResult)
        let current=e.match.result.find(e=>(e.description==="Full time" ));
        if(current) {
            row.result=current.home+" - "+current.away;//Also for harmonizing with resultInfo
        } else {
            current=e.match.result.find(e=>(e.description.match(/.*Current/i)));
            if(current) {
                row.result=current.home+" - "+current.away;//Also for harmonizing with resultInfo
            } else {
             row.result="0 - 0";
            }
        }


        res.draws.push(row);

    });
    return res;
}

function getMatchTime(match) {
    if(match.status.match(/Halvtid/i)) {
        return "HT";
    }

    if(match.status.match(/halvlek/i)) {
        let d=new Date(match.statusTime);
        let now=new Date();
        let minutes=Math.ceil((now-d)/(1000*60));
        
        if(minutes>45) {
            minutes=45;
        }
        if(match.status.match(/andra halvlek/i)) {
            minutes+=45;
        }
        return minutes+"'";

    } else {
        return null;
    }
    
}

module.exports={
    getPlayable:getPlayable,
    getDrawAndResult:getDrawAndResult,
    getDrawAndResultCache:getDrawAndResultCache,
    getMatchDates:getMatchDates
}


