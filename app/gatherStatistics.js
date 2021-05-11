var sqlite3 = require('better-sqlite3');
var db = new sqlite3('./resources/tipsy_statistics.db');
db.pragma("foreign_keys = ON");


var matchInfoHandler=require('./utils/matchInfoHandler.js');
const fetch = require('node-fetch'); 
var config=require('../resources/config.js');

function getDraw(product, draw, callback) {
    let httpReq = config.matchInfo.url + "/draw/" + product.toLowerCase().replace(" ","") + "/draws/" + draw + "?_=" + new Date().getTime();

    console.log(httpReq);
    fetch(httpReq)
        .then(res => res.json())
        .then(
            json => {
                callback(true, json);
            },
            err => callback(false, err)
        );
}


function getResult(home,away) {
    let h=parseInt(home);
    let a=parseInt(away);
    if(isNaN(h) || isNaN(a)) {
        return null;
    }
    if(h>a) {
        return "one";
    }
    if(h===a) {
        return "x";
    }
    return "two";
}

function getBestValue(bets) { 
    if(bets===null) {
        return {k:null,v:null};
    }
    return Object.keys(bets).map(k=>{return {k:k,v:bets[k]};}).sort((e1,e2)=>{return e2.v-e1.v})[0];

}

function updateStatistics(product,year,month) {
    if(year==undefined) {
        date = new Date();
        year = date.getFullYear();
        month = date.getMonth() + 1;
    }
    matchInfoHandler.getMatchDates(product,year,month,function(status,res) {
        //res=[{product:"topptipset",drawNumber:1438,drawState:"Open"}];
        res.forEach(function(m) {
            console.log(m.product,m.drawNumber,m.drawState);
            if(needUpdate(m.product,m.drawNumber)) {
                getDraw(m.product,m.drawNumber,function(stat,res) {
                    if(status) {
                        let svF_nrOfRights=null;
                        let tiotid_nrOfRights=null;
                        let odds_nrOfRights=null;
                        let draw={};
                        //console.log(res.draw);
                        draw.product=m.product;
                        draw.drawNumber=m.drawNumber;
                        draw.drawState=res.draw.drawState;
                        draw.drawdate=res.draw.regCloseTime;
                        draw.rows=[];
                        res.draw.drawEvents.forEach((e,i)=>{
                            let row={};
                            row.matchNr=i+1;
                            row.match=e.eventDescription;
                            let r=[];
                            if(e.match.result && e.match.result.length>0) {
                                r=e.match.result[e.match.result.length-1];
                            }
                            row.matchId=e.match.matchId; //lägg in denna också
                            row.home= r.home;
                            row.away=r.away;
                            row.actual=getResult(r.home,r.away);

                            row.odds=e.odds;
                            row.bestOdds=getBestValue(e.odds);
                            
                            row.svF=e.svenskaFolket;
                            row.bestSvF=getBestValue(e.svenskaFolket);

                            row.tioTid=e.tioTidningarsTips;
                            row.bestTioTid=getBestValue(e.tioTidningarsTips);




                            row.mutuals=e.match.mutuals;
                            row.home_latest=e.match.participants[0].latest;
                            row.home_goalAvg=e.match.participants[0].goalAvg;
                            row.home_trend=e.match.participants[0].trend;
                            row.home_teamId=e.match.participants[0].id;
                            row.home_teamName=e.match.participants[0].name;
                            row.away_latest=e.match.participants[1].latest;
                            row.away_goalAvg=e.match.participants[1].goalAvg;
                            row.away_trend=e.match.participants[1].trend;
                            row.away_teamId=e.match.participants[1].id;
                            row.away_teamName=e.match.participants[1].name;
    
                            if(row.bestOdds.k && row.bestOdds.k===row.actual) {
                                if(odds_nrOfRights===null) odds_nrOfRights=0;
                                odds_nrOfRights++;
                            }
    
                            if(row.bestSvF.k && row.bestSvF.k===row.actual) {
                                if(svF_nrOfRights===null) svF_nrOfRights=0;
                                svF_nrOfRights++;
                            }
                            if(row.bestTioTid.k && row.bestTioTid.k===row.actual) {
                                if( tiotid_nrOfRights===null)  tiotid_nrOfRights=0;
                                tiotid_nrOfRights++;
                            }
                            draw.rows.push(row);
                        });
                        draw.SvF_nrOfRights=svF_nrOfRights;
                        draw.tioTid_nrOfRights=tiotid_nrOfRights;
                        draw.odds_nrOfRights=odds_nrOfRights;
                        updateDraw(draw);
                        
    
                    }
                });
            }
        })
    
    });

}


function needUpdate(product,drawNumber) {
    let sql="select drawstate from draws where product=? and drawnumber=?";
    const row=db.prepare(sql).get(product,drawNumber);
    if(row===undefined || row.drawstate!=="Finalized") {
        return true;
    } else {
        return false;
    }
}

function updateDraw(draw) {
    console.log(draw.product,draw.drawNumber);
    //console.log(draw);

    let sql="\
    insert into draws(product,drawnumber,drawdate,drawstate,svf_nrofrights,tiotid_nrofrights,odds_nrofrights)\
    values(@product,@drawNumber,@drawdate,@drawState,@SvF_nrOfRights,@tioTid_nrOfRights,@odds_nrOfRights)\
    on conflict(product,drawnumber) do update set\
    drawdate=coalesce(excluded.drawdate,drawdate),\
    drawstate=coalesce(excluded.drawstate,drawstate),\
    svf_nrofrights=coalesce(excluded.svf_nrofrights,svf_nrofrights),\
    tiotid_nrofrights=coalesce(excluded.tiotid_nrofrights,tiotid_nrofrights),\
    odds_nrofrights=coalesce(excluded.odds_nrofrights,odds_nrofrights)";


    const res = db.prepare(sql).run(draw);

    sql="select id from draws where product=? and drawnumber=?";
    const row=db.prepare(sql).get(draw.product,draw.drawNumber);
    let drawId=row.id;

    sql="INSERT INTO draw_rows (drawId,matchId, matchNr, home_teamName, home_teamId, home_goals, away_teamName, away_teamId,away_goals,result)\
    VALUES (@drawId,@matchId, @matchNr, @home_teamName, @home_teamId, @home, @away_teamName, @away_teamId, @away,@actual)\
    on conflict(drawId,matchNr) do update set\
    matchId=coalesce(excluded.matchId,matchId),\
    home_teamName=coalesce(excluded.home_teamName,home_teamName),\
    home_teamId=coalesce(excluded.home_teamId,home_teamId),\
    home_goals=coalesce(excluded.home_goals,home_goals),\
    away_teamName=coalesce(excluded.away_teamName,away_teamName),\
    away_teamId=coalesce(excluded.away_teamId,away_teamId),\
    away_goals=coalesce(excluded.away_goals,away_goals),\
    result=coalesce(excluded.result,result)\
    ";

    let stmt=db.prepare(sql);

    sql="INSERT INTO odds (drawId, matchNr, type, outcome, odds) VALUES (?, ?, ?, ?, ?)\
    on conflict(drawId, matchNr,type,outcome) do update set\
    odds=coalesce(excluded.odds,odds)";
    let oddsStmt=db.prepare(sql);
    
    for(let i=0;i<draw.rows.length;i++) {
        let r=draw.rows[i];
        r.drawId=drawId;
        console.log(r.drawId,r.matchNr);
        stmt.run(r);

        for(let key in r.svF) {
            oddsStmt.run(r.drawId,r.matchNr,"SvenskaFolket",key,r.svF[key]);
        }

        for(let key in r.tioTid) {
            oddsStmt.run(r.drawId,r.matchNr,"TioTidningar",key,r.tioTid[key]);
        }

        for(let key in r.odds) {
            oddsStmt.run(r.drawId,r.matchNr,"odds",key,r.odds[key]);
        }


    }
}

function getSuggestions() {
    matchInfoHandler.getPlayable("topptipsetfamily",function(status,data) {
        if(status) {
            console.log("-------ToppTipset------");
            suggest(data[0].draws);
            //compareTeams(data[0].regCloseTime,data[0].draws);
            console.log("\n\n");

        }
        return;

        console.log("---------------------------");
        matchInfoHandler.getPlayable("stryktipset",function(status,data) {
            if(status) {
                console.log("-------strykTipset------");
                suggest(data[0].draws);
                console.log("\n\n");
            }
            console.log("---------------------------");

            matchInfoHandler.getPlayable("europatipset",function(status,data) {
                if(status) {
                    console.log("-------EuropaTipset------");
                    suggest(data[0].draws);
                    console.log("\n\n");
                }
            });
        

        });
    

    });




    /*
    matchInfoHandler.getPlayable("stryktipset",function(status,data) {
        console.log(status,data);
    });

    matchInfoHandler.getPlayable("europatipset",function(status,data) {
        console.log(status,data);
    });
    */

}

function suggest_old(matchData) {
    matchData.forEach(r=>{
        console.log(r.eventDescription);
        console.log(r.svenskaFolket);

        let actual=undefined;
        if(r.match.result && r.match.result.length>0) {
            let l=r.match.result[r.match.result.length-1];
            actual=getResult(l.home,l.away); 
        }
        console.log("actual",actual);
        let res={'one':0,'x':0,'two':0};
        Object.keys(r.svenskaFolket).forEach(k=>{
            let p=calcOdds2("SvenskaFolket",'one',k,r.svenskaFolket[k]);
            //console.log('one',k,p);
            res['one']+=p;

            p=calcOdds2("SvenskaFolket",'x',k,r.svenskaFolket[k]);
            //console.log('x',k,p);
            res['x']+=p;

            p=calcOdds2("SvenskaFolket",'two',k,r.svenskaFolket[k]);
            //console.log('two',k,p);
            res['two']+=p;
        })
 
        let ordered=Object.keys(res).map(k=>{return {k:k,v:res[k]};}).sort((e1,e2)=>{return e2.v-e1.v});
        console.log(ordered[0]);
        console.log(ordered[0].v/(ordered[0].v+ordered[1].v+ordered[2].v))
        console.log("--------------");

    })

}


function suggest(matchData) {
    let props=[];
    matchData.forEach(r=>{
        console.log(r.eventDescription);
        console.log(r.svenskaFolket);

        let actual=undefined;
        if(r.match.result && r.match.result.length>0) {
            let l=r.match.result[r.match.result.length-1];
            actual=getResult(l.home,l.away); 
        }
        console.log("actual",actual);
        let res={'one':0,'x':0,'two':0};
        let totP={'one':1,'x':1,'two':1};
        Object.keys(r.svenskaFolket).filter(k=>(["one","x","two"].find(e=>(e===k)))).forEach(k=>{
            let p=calcOdds3("SvenskaFolket",r.svenskaFolket[k],k,'one');
            props.push({event:r.eventDescription,outcome:"one",prop:p});
            res['one']+=p;
            totP['one']*=p;
            p=calcOdds3("SvenskaFolket",r.svenskaFolket[k],k,'x');
            props.push({event:r.eventDescription,outcome:"x",prop:p});

            res['x']+=p;
            totP['x']*=p;
            p=calcOdds3("SvenskaFolket",r.svenskaFolket[k],k,'two');
            props.push({event:r.eventDescription,outcome:"two",prop:p});
            res['two']+=p;
            totP['two']*=p;
        })
 
        let ordered=Object.keys(res).map(k=>{return {k:k,v:res[k]};}).sort((e1,e2)=>{return e2.v-e1.v});

        console.log(ordered[0]);
        console.log(ordered[0].v/(ordered[0].v+ordered[1].v+ordered[2].v))
        console.log(totP);
        console.log("--------------");

    });      

    let grouped=[];
    props.forEach(e=>{
        if(grouped[e.event+";"+e.outcome]) {
            grouped[e.event+";"+e.outcome].prop+=e.prop;
        } else {
            grouped[e.event+";"+e.outcome]=e;
        }
    });

    console.log("--------minst chans--------------");
    Object.keys(grouped).map(k=>{let e=grouped[k];e.prop=e.prop/3;return e;}).sort((a,b)=>{return a.prop-b.prop;}).forEach(e=> {
        console.log(e);
    });
    //console.log(grouped);

    /*console.log("ordered props");
    props.sort((a,b)=>{return a.prop-b.prop;}).forEach(e=> {
        console.log(e);
    });*/
    console.log("-------------------");



}


function compareTeams(drawClosingTime,matchData) {
    matchData.forEach(r=>{
        console.log(r.eventDescription);
        //console.log(r);
        
        let matchStart=r.match.matchStart;
        let homeId=r.match.participants[0].id;
        let awayId=r.match.participants[1].id;
        let homeTeamMatches=getOldResults(homeId,drawClosingTime);
        let awayTeamMatches=getOldResults(awayId,drawClosingTime);
        console.log(homeTeamMatches);
        console.log(awayTeamMatches);

    })
}

function getOldResults(teamId,matchStart) {
    let res={};

    let sql="select distinct drawdate,matchid, home_teamName,home_teamid, away_teamName,away_teamid,home_goals,away_goals from v_draw_rows where (home_teamid=? or away_teamid=?) and drawdate<? order by drawdate desc";
    res.matches=db.prepare(sql).all(teamId,teamId,matchStart);
    res.trend=[];
    res.homeTrend=[];
    res.awayTrend=[];
    res.matches.forEach(m=>{
        m.result=getResult(m.home_goals,m.away_goals);
        m.win=null;
        if(teamId===m.home_teamId) {
            switch(m.result) {
                case "one":
                    m.win=true;
                    break;
                case "two":
                    m.win=false;
            }
            m.homeWin=m.win;
            res.homeTrend.push(m.win);
        } else {
            switch(m.result) {
                case "one":
                    m.win=false;
                    break;
                case "two":
                    m.win=true;
            }
            m.awayWin=m.win;
            res.awayTrend.push(m.win);

        }


        //res.wins[m.result]=res.wins[m.result]?res.wins[m.result]+1:1;
        res.trend.push(m.win);
    })
    //res.matches=undefined;
    return res;

}




function calcOdds(type,outcome,subset) {
    let sql="\
    select count(*) as cnt,result from v_draw_rows r\
    left join odds o on r.drawid=o.drawid and r.matchnr=o.matchnr\
    where drawstate='Finalized' and result is not null and o.type=? and o.outcome=? and o.odds=?\
    group by result";
    const row=db.prepare(sql).all(type,outcome,subset);
    return row;

}

function calcOdds2(type,result,outcome,odds) {
    
    let res={};
    res.P_outCome=P_outcome(outcome);
    res.P_C_outcome=P_C_outcome(type,outcome,odds);
    res.P_C_outcome_outcome_o=P_C_outcome_outcome_o(type,result,outcome,odds);
    res.res=(res.P_outCome*res.P_C_outcome_outcome_o)/res.P_C_outcome;
    console.log("When "+type+":P("+outcome+")="+odds+" => P("+result+")="+res.res);
    return res.res;

}

function calcOdds3(type,odds,outcome,actual) {
 
    let sql="select count(*) as cnt from v_draw_rows_and_odds where type=? and odds/5=?/5 and outcome=?";
    let tot=db.prepare(sql).get(type,odds,outcome).cnt;
    sql+=" and result=?";
    let act=db.prepare(sql).get(type,odds,outcome,actual).cnt;
    let res=act/(tot*1.0);
    console.log("When "+type+":P("+outcome+")="+odds+" => P("+actual+")="+res);
    return res;




}


function main(argv) {
    if(argv.length<3) {
        console.log("Usage: "+argv[1]+" [getStatistics|suggest]");
        return;    
    }
    if(argv[2].match(/.*stat.*/i)!=null) {
        updateStatistics("topptipsetfamily");
        updateStatistics("stryktipset");
        updateStatistics("europatipset");  
    } else {
        getSuggestions();
    }
}


//P(Outcome=o| c(o)=x) = P(outcome=0)*P(c(o)=x|Outcome=o) / P(c(o)=x)

function P_outcome(outcome) {
    let sql="select count(*) as cnt from v_draw_rows where drawstate='Finalized' and result is not null";
    let tot=db.prepare(sql).get().cnt;

    sql+=" and result=?";

    let result=db.prepare(sql).get(outcome).cnt;

    return result/(tot*1.0);
}

function P_C_outcome(type,outcome,odds) {
    //console.log(type,outcome,odds);


    let sql="\
    select count(*) as cnt from  v_draw_rows_and_odds where type=? and outcome=?\
    ";
    let tot=db.prepare(sql).get(type,outcome);

    sql+=" and odds/5=?/5";
    let oddsCnt=db.prepare(sql).get(type,outcome,odds);

    return oddsCnt.cnt/(tot.cnt*1.0);

}

function P_C_outcome_outcome_o(type,result,outcome,odds) {
    //console.log(type,outcome,odds);


    let sql="\
    select count(*) as cnt from  v_draw_rows_and_odds where type=? and result=? and outcome=?\
    ";
    let tot=db.prepare(sql).get(type,result,outcome);

    sql+=" and odds/5=?/5";
    let oddsCnt=db.prepare(sql).get(type,result,outcome,odds);

    return oddsCnt.cnt/(tot.cnt*1.0);

}



/*
getDraw("topptipsetstryk",668,function(status,data) {
    suggest(data.draw.drawEvents);
})

return;
*/

main(process.argv);

/*

updateStatistics("stryktipset",2020,7);
updateStatistics("stryktipset",2020,8);
updateStatistics("stryktipset",2020,9);

updateStatistics("europatipset",2020,7);
updateStatistics("europatipset",2020,8);
updateStatistics("europatipset",2020,9);

updateStatistics("topptipsetfamily",2020,7);
updateStatistics("topptipsetfamily",2020,8);
updateStatistics("topptipsetfamily",2020,9);
*/



