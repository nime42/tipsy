var sqlite3 = require('better-sqlite3');
var statDb = new sqlite3('./resources/tipsy_statistics.db');


var tipsyDb=require('./db/dbFunctions_better.js');


var matchInfoHandler=require('./utils/matchInfoHandler.js');

var tipsyExpertId=-1;
tipsyExpertGroup=-20;


function main(argv) {
    if(argv.length<3) {
        console.log("Usage: "+argv[1]+" [stryktips|europatips|topptips]");
        return;    
    }

    if(argv[2].match(/stryk.*/i))  {
        makePlay("stryktipset");

    } else if(argv[2].match(/euro.*/i)) {
        makePlay("europatipset");

    } else if(argv[2].match(/topp.*/i)) {
        makePlay("topptipsetfamily");
    } else {
        console.log("Unknown gametype:"+argv[2])
        console.log("Usage: "+argv[1]+" [stryktips|europatips|topptips]");
        return;            
    }

}

function checkIfPlayExists(product,drawnumber) {
    let sql="select * from draws where product=? and drawnumber=? and groupid=?";
    let db=tipsyDb.getDbInstance();
    let row = db.prepare(sql).get(product,drawnumber, tipsyExpertGroup);
    if(row) {
        return true;
    } else {
        return false;
    }

}

function makePlay(product) {
    matchInfoHandler.getPlayable(product,function(status,data) {
        if(status) {
            let draw=data[0];
            if(false && checkIfPlayExists(draw.productName,draw.drawNumber)) {
                return;
            }

            let play={
                groupid: tipsyExpertGroup,
                drawnumber: draw.drawNumber,
                product: draw.productName,
                drawstate: draw.drawState,
                regclosetime: draw.regCloseTime,
                rowprice: draw.rowPrice,
                extra_bet: "false"

            }
            let bets=[];
            draw.draws.forEach(d=>{
                let bet={
                    rownr:d.eventNumber,
                    teams:d.eventDescription,
                    matchstart:d.match.matchStart,
                    bet:getBet(d.svenskaFolket)                    
                }
                
                bets.push(bet);
            });
            play.rows=bets;

            tipsyDb.addPlay(tipsyExpertId,play, function(status,data) {
                if(!status) {
                    console.log("Error in play",data);             
                    
                } 
            })
            
        }
    })

}

function getBet(matchData) {
    console.log(matchData);
    let odds={
        'one':0.0,
        'x':0.0,
        'two':0.0
    }
    odds.one+=calcOdds('SvenskaFolket',matchData.one,'one','one');
    odds.one+=calcOdds('SvenskaFolket',matchData.x,'x','one');
    odds.one+=calcOdds('SvenskaFolket',matchData.two,'two','one');
    odds.x+=calcOdds('SvenskaFolket',matchData.one,'one','x');
    odds.x+=calcOdds('SvenskaFolket',matchData.x,'x','x');
    odds.x+=calcOdds('SvenskaFolket',matchData.two,'two','x');

    odds.two+=calcOdds('SvenskaFolket',matchData.one,'one','two');
    odds.two+=calcOdds('SvenskaFolket',matchData.x,'x','two');
    odds.two+=calcOdds('SvenskaFolket',matchData.two,'two','two');
 
    let best=Object.keys(odds).map(k=>({k:k,o:odds[k]})).sort((e1,e2)=>(e2.o-e1.o))[0].k;
    console.log(best);
    switch(best) {
        case "one": return '1';
        case "x": return 'X';
        case "two":return '2';
    }


}

function calcOdds(type,odds,outcome,actual) {
 
    let sql="select count(*) as cnt from v_draw_rows_and_odds where type=? and odds/5=?/5 and outcome=?";
    let tot=statDb.prepare(sql).get(type,odds,outcome).cnt;
    sql+=" and result=?";
    let act=statDb.prepare(sql).get(type,odds,outcome,actual).cnt;
    let res=act/(tot*1.0);
    //console.log("When "+type+":P("+outcome+")="+odds+" => P("+actual+")="+res);
    return res;




}

main(process.argv);