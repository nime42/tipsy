var fs = require('fs');
var http = require('http');
var https = require('https');
var db=require('./db/dbFunctions_better.js');
var mailSender=require('./utils/mailSender.js');
var sessionHandler=require('./utils/sessionHandler.js');
var matchInfoHandler=require('./utils/matchInfoHandler.js');
var webScraper=require('./utils/webScraper.js');
var statisticsManager=require('./utils/statisticsManager.js');
require('log-timestamp');

sessionHandler.resumeSessions(db.getDbInstance());


var config=require('../resources/config.js');


var privateKey  = fs.readFileSync('./resources/private.key', 'utf8');
var certificate = fs.readFileSync('./resources/certificate.crt', 'utf8');
var ca = fs.readFileSync('./resources/ca_bundle.crt', 'utf8');

var credentials = {key: privateKey, cert: certificate,ca:ca};
var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies


const cookieParser = require('cookie-parser');
app.use(cookieParser());


app.use((req, res, next) => {

    if(req.url.startsWith("/.well-known/pki-validation")) {
        next();
        return;
    }



    if (!req.headers.host) {
        res.sendStatus(406);
        return;
    }

    if (req.headers.host.indexOf('localhost') > -1 || req.secure) {
        next()
    } else {
        res.redirect('https://' + req.headers.host + req.url);
    }

}); 



app.use((req,res,next)=>{
    if(sessionHandler.getSession(req)) {
        next();
        return;
    }

 
    if(
        req.url.startsWith("/handlebars") || 
        req.url.startsWith("/.well-known/pki-validation") ||
        req.url.startsWith("/js") || 
        req.url.startsWith("/css") ||
        req.url.startsWith("/img") ||
        req.url.startsWith("/favicon.ico") ||   
        req.url.startsWith("/main.html") ||
        req.url.startsWith("/login") ||
        req.url.startsWith("/demoLogin") ||
        req.url.startsWith("/Villkorstxt.pdf") ||
        req.url.startsWith("/register") ||
        req.url.startsWith("/forgotPassword") ||
        req.url.startsWith("/resetPassword") ||
        req.url.startsWith("/shutdown") ||
        req.url.startsWith("/updateAllResults")
    ) {
        next();
        return;
    }

    res.redirect('/main.html');

    });






app.enable("trust proxy"); //So Morgan logging displays remote-address


//---------------------------
var morgan = require('morgan')
var path = require('path')
var rfs = require('rotating-file-stream') // version 2.x

morgan.token('remote-user', function (req, res) { let session=sessionHandler.getSession(req); if(session) {return session.userId} else {return ""}});

// create a rotating write stream
var accessLogStream = rfs.createStream('access.log', {
    interval: '7d', // rotate daily
    path: path.join('log')
  })
  
  // setup the logger
  app.use(morgan('common', { stream: accessLogStream }))
  
  app.use(express.static('public'))


//---------------------------



app.get("/shutdown",(req,res) => {
    var isLocal = (req.connection.localAddress === req.connection.remoteAddress);
    if(isLocal) {
        console.log("Shutting down!");
        res.sendStatus(200);
        try {
            sessionHandler.saveSessions(db.getDbInstance(),function(err) {process.exit()});
        } catch(e) {
            console.log("Failed to save sessions",e);
            process.exit();
        }
    }

})

app.get("/updateAllResults",(req,res) => {
    var isLocal = (req.connection.localAddress === req.connection.remoteAddress);
    if(isLocal) {
        res.sendStatus(200);
        updateAllResults();
    }

})


app.get("/systemStatistics",(req,res) => {
    statisticsManager.gatherStatistics('./log/access.log',function(stats) {
        res.json(stats);
    })
})

 
app.get('/', (req, res) => {
    res.redirect('/main.html');
       
})

app.post('/login',(req,res)=> {
    var username = req.body.username;
    var password = req.body.password;
    db.authenticateUser(username,password,function(status,userId){
        if(status) {
            sessionHandler.addSession(req,res,userId);
            res.sendStatus(200);
        } else {
            res.sendStatus(401);
        }
    });
})

app.get('/demoLogin', (req, res) => {
    let userId=-13;
    sessionHandler.addSession(req,res,userId);
    res.sendStatus(200);
       
})

app.get('/logout',(req,res)=> {
    sessionHandler.invalidateSession(req,res);
    res.sendStatus(200);
})

app.post('/register',(req,res)=> {
    var username = req.body.username;
    try {
        db.getDbInstance().transaction(() => {
            db.createUser(username, function (status, id, err) {
                if (status) {
                    db.updateUserInfo(id, req.body, function (status, err) {
                        if (status) {
                            sessionHandler.addSession(req, res, id);
                            res.sendStatus(200);
                        } else {
                            res.sendStatus(500);
                            throw "rollback";
                        }
                    })
                } else {
                    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                        res.sendStatus(403);
                    } else {
                        res.sendStatus(500);
                    }
                }
            });


        })();
    } catch (err) {
        if (err !== "rollback") {
            console.log("register",err);
        }
    }

})

app.post('/forgotPassword',(req,res)=> {
    var email,userName;

    if(req.body.identityType==="by-mail-adress") {
        email=req.body.identity;
    } else {
        userName=req.body.identity;
    }    

    db.getUserInfoByUserNameOrEmailOrPhone(userName,email,null,function(status,row) {
        if(status) {
            if(row.length===0) {
                res.sendStatus(404);
                return;
            } else {
                var userId=row.userid;
                var mailAdr=row.email;
                mailSender.sendPasswordReset(userId,mailAdr,req,res);
            }
        } else {
            res.sendStatus(500);
        }
    })

});


app.post('/resetPassword', (req, res) => {
    var token = req.body.resetToken;
    var password = req.body.password;
    db.resetPassword(token, password, function (status, userIdOrErr) {
        if(status) {
            sessionHandler.addSession(req,res,userIdOrErr);
            res.sendStatus(200);
        } else {
            if(userIdOrErr) {
                console.log("Failed to resetPassword",userIdOrErr);
                res.sendStatus(500);
            } else {
                res.sendStatus(404);  
            }
        }
    });

})


app.get('/getUserInfo',(req,res)=> {
    var userId=sessionHandler.getSession(req).userId;
    db.getUserInfo(userId,function(status,userInfo){
        if(status) { 
            res.json(userInfo); 
        } else {
            console.log('getUserInfo',userInfo);
            res.sendStatus(404);  

        }
    })

})

app.get('/getGroups',(req,res)=> {
    var userId=sessionHandler.getSession(req).userId;
    db.getGroups(userId,function(status,groups){
        if(status) { 
            res.json(groups); 
        } else {
            console.log("getGroups",groups);
            res.sendStatus(404);  

        }
    })

})


app.post('/searchGroups',(req,res)=> {
    var searchVal=req.body.searchVal;
    db.searchGroups(searchVal,function(status,groups){
        if(status) { 
            res.json(groups); 
        } else {
            console.log("searchGroups",groups);
            res.sendStatus(404);  

        }
    })

})

app.post('/applyForMembership',(req,res)=> {
    var groupName=req.body.groupName;
    var userId=sessionHandler.getSession(req).userId;
      

    db.applyForMembership(groupName,userId,function(status,mess) {
        if(status===true) {
            res.sendStatus(200);    
            notifyAdmin(groupName);  
        } else {
            if(mess==="NO_SUCH_GROUP") {
                res.sendStatus(404); 
            } else if(mess==="ALREADY_MEMBER") {
                res.sendStatus(409); 
            } else if("APPLICATION_ALREADY_EXISTS") {
                res.sendStatus(200);
            } else {
                res.sendStatus(500);                
            }
       }

    });
})

function notifyAdmin(groupName) {
    let dbI=db.getDbInstance();
    let sql="select email from v_group_members where groupname=? and admin=true;"
    let rows=dbI.prepare(sql).all(groupName);

    let admins=rows.map(r=>{return r.email}).join(",");
    if(admins!="") {
        mailSender.sendApprovalNotification(groupName,admins,function(status,data) {
            if(!status) {
                console.log("notifyAdmin",data);
            }
        })
    }
}


app.post('/removeApplicant',(req,res)=> {
    let adminId=sessionHandler.getSession(req).userId;
    let userId=req.body.userId;
    let groupId=req.body.groupId;
    db.removeApplicant(adminId,userId,groupId, function(status,err) {
        if(status) {
            res.sendStatus(200);                    
        } else {
            res.sendStatus(500);
        }
    })
});

app.post('/approveApplicant',(req,res)=> {
    let adminId=sessionHandler.getSession(req).userId;
    let userId=req.body.userId;
    let groupId=req.body.groupId;
    db.approveApplicant(adminId,userId,groupId, function(status,data) {
        if(status) {
            res.json(data);                   
        } else {
            res.sendStatus(500);
        }
    })
});


app.post('/getGroupMembers',(req,res)=> {
    let userId=sessionHandler.getSession(req).userId;
    let groupId=req.body.groupId
    db.getGroupMembers(userId,groupId,function(status,rows){
        if(status) { 
            let members=rows;
            db.getInvitesAndApplications(userId,groupId,function(status,data){
                if(status) {
                    res.json({
                        members:members,
                        invites:data.invites,
                        applications:data.applications
                    });  
                } else {
                    console.log("getInvites",data);
                    res.sendStatus(500);  
        
                }
            });
             
        } else {
            console.log("getGroupMembers",rows);
            res.sendStatus(500);  

        }
    })

})


app.post('/swapSortOrder',(req,res)=> {
    var userId=sessionHandler.getSession(req).userId;
    let groupId=req.body.groupId;
    let from=req.body.from;
    let to=req.body.to;
    db.swapSortOrder(userId,from,to,groupId,function(status,err) {
        if(status) {
            res.sendStatus(200);
        } else {
            if(err==="NOT_GROUPADMIN") {
                res.sendStatus(403);
            } else {
                res.sendStatus(500);
            }
        }
    })


})

app.post('/updateUserInfo',(req,res)=> {
    var userId=sessionHandler.getSession(req).userId;

    db.updateUserInfo(userId,req.body, function(status,err) {
        if(status) {
            res.sendStatus(200);                    
        } else {
            console.log("updateUserInfo",err);
            res.sendStatus(500);
        }
    })

})

app.post('/createGroup',(req,res)=> {
    var userId=sessionHandler.getSession(req).userId;

    db.createGroup(userId,req.body.groupName, function(status,groupId,err) {
        if(status) {
            res.sendStatus(200);                    
        } else {
            if(err.code==='SQLITE_CONSTRAINT_UNIQUE') {
                res.sendStatus(403);
            } else {
                res.sendStatus(500);
            }
        }
    })

})

app.post('/updateGroup',(req,res)=> {
    var userId=sessionHandler.getSession(req).userId;
    var groupId=req.body.groupId;
    var groupName=req.body.groupName

    db.updateGroup(userId,groupId,groupName, function(status,err) {
        if(status) {
            res.sendStatus(200);                    
        } else {
            if(err.code==='SQLITE_CONSTRAINT_UNIQUE') {
                res.sendStatus(403);
            } else {
                res.sendStatus(500);
            }
        }
    })

})


app.post('/deleteGroup',(req,res)=> {
    var userId=sessionHandler.getSession(req).userId;
    var groupId=req.body.groupId;

    db.deleteGroup(userId,groupId, function(status,err) {
        if(status) {
            res.sendStatus(200);                    
        } else {
            res.sendStatus(500);
        }
    })

})

app.post('/inviteMemberToGroup', (req, res) => {
    var userId = sessionHandler.getSession(req).userId;
    var groupId = req.body.groupId;
    var email = req.body.email;
    db.getGroupInfo(groupId, userId, function (status, groupInfo) {
        if (status) {
            mailSender.inviteMember(userId, groupInfo, email, req, res, function (status, err) {
                if (status) {
                    res.sendStatus(200);
                } else {
                    if (err.errno === 19) {
                        res.sendStatus(403);
                    } else {
                        res.sendStatus(500);
                    }
                }
            });
        } else {
            res.sendStatus(500);
        }
    })

});




app.post('/deleteInviteToGroup',(req,res)=> {
    var userId=sessionHandler.getSession(req).userId;
    var groupId=req.body.groupId;
    var email=req.body.email;
    db.deleteInviteToGroup(userId,email,groupId, function(status,err) {
        if(status) {
            res.sendStatus(200);                    
        } else {
            res.sendStatus(500);
        }
    })

});

app.post('/addInvitedUserToGroup',(req,res)=> {
    var userId=sessionHandler.getSession(req).userId;
    var token=req.body.inviteToken;
    db.addInvitedUserToGroup(userId,token, function(status,data) {
        if(status) {
            res.json({groupName:data});
        } else {
            if(data==="no invite") {
                res.sendStatus(404);
            } else {
                res.sendStatus(500);
            }
        }
    })
})


app.post('/removeMember',(req,res)=> {
    var userId=sessionHandler.getSession(req).userId;
    var member=req.body.member;
    var groupId=req.body.groupId;

    db.deleteUserFromGroup(userId,member,groupId, function(status,err) {
        if(status) {
            res.sendStatus(200);                    
        } else {
            console.log("removeMember",err);
            res.sendStatus(500);
        }
    })

})

app.post('/getPlayable',(req,res)=> {
    var product=req.body.product;
    matchInfoHandler.getPlayable(product,function(status,data) {
        if(status) {
            res.json(data);
        } else {
            if(data==="NOT_PLAYABLE") {
                res.sendStatus(403);
            } else {
                res.sendStatus(404);
            }
        }
    })

});

app.post('/play',(req,res)=> {
    var userId=sessionHandler.getSession(req).userId;
    db.addPlay(userId,req.body, function(status,data) {
        if(status) {
            res.sendStatus(200);                    
        } else {
            console.log("play",data);
            res.sendStatus(500);
        }
    })
});


app.get('/getResults',(req,res)=> {
    var userId=sessionHandler.getSession(req).userId;
    var groupId=req.query.groupId;
    var page=req.query.page;
    db.getResults(userId,groupId,page,function(status,data) {
        if(status) {
            res.json(data);
        } else {
            console.log("getResults",data);
            res.sendStatus(500);
        }

    })

});


app.get('/updateResults',(req,res)=> {
    var groupId=req.query.groupId;
    updateResults(groupId,function() {
        res.sendStatus(200);
    });
    
});


function updateResults(groupId, callback = console.log) {
    let sql = "select distinct drawnumber,product from draws where drawstate<>'Finalized' and groupid=?";
    let dbi = db.getDbInstance();
    const notFinalizedDraws = dbi.prepare(sql).all(groupId);
    matchInfoHandler.getDrawAndResultCache(notFinalizedDraws, function (cache) {
        sql = "select id,drawnumber,product from draws where drawstate<>'Finalized' and groupid=?";
        let drawsToUpdate = dbi.prepare(sql).all(groupId);
        let nrOfFinalized = 0;
        drawsToUpdate.forEach(function (r) {
            let drawId = r.id;
            let drawNumber = r.drawnumber;
            let product = r.product;
            let drawResult = cache[product + ";" + drawNumber];

            if (drawResult.status) {
                checkDraw(drawId, drawResult.response);
                if (drawResult.response.draws && drawResult.response.draws.drawState === "Finalized") {
                    nrOfFinalized++;
                }
            }

        });

        if(drawsToUpdate.length>0 && nrOfFinalized===drawsToUpdate.length) {
            sendRemainder(groupId);
        }

        callback(true);
    });

}

function updateAllResults() {
    //Skip demo-groups e.g groupid< 0
    let sql = "select distinct drawnumber,product from draws where drawstate<>'Finalized' and groupid>=0";
    let dbi = db.getDbInstance();
    const notFinalizedDraws = dbi.prepare(sql).all();
    matchInfoHandler.getDrawAndResultCache(notFinalizedDraws, function (cache) {
        sql = "select distinct groupid from draws where drawstate<>'Finalized' and groupid>=0";
        const rows = dbi.prepare(sql).all();
        for (let i=0;i<rows.length;i++) {
            let groupId=rows[i].groupid;
            console.log("updating all results in group "+groupId);
            sql = "select id,drawnumber,product from draws where drawstate<>'Finalized' and groupid=?";
            let drawsToUpdate = dbi.prepare(sql).all(groupId);
            let nrOfFinalized = 0;
            drawsToUpdate.forEach(function (r) {
                let drawId = r.id;
                let drawNumber = r.drawnumber;
                let product = r.product;
                let drawResult = cache[product + ";" + drawNumber];
    
                if (drawResult.status) {
                    checkDraw(drawId, drawResult.response);
                    if (drawResult.response.draws && drawResult.response.draws.drawState === "Finalized") {
                        nrOfFinalized++;
                    }
                }
    
            });
    
            if(drawsToUpdate.length>0 && nrOfFinalized===drawsToUpdate.length) {
                sendRemainder(groupId);
            }
        }

    })
   
}



function checkDraw(drawId,SvSpResponse) {
    //console.log("checkDraw",drawId,SvSpResponse);
    let matches = [];
    let outcome = null;
    if (SvSpResponse.result !== null) {
        matches = SvSpResponse.result.results;
        outcome = SvSpResponse.result.distribution;
    } else {
        if(SvSpResponse.draws) {
            matches = SvSpResponse.draws.draws;
        }
        if (SvSpResponse.forecast) {
            outcome = SvSpResponse.forecast.winresult;
        }
    }

    if (SvSpResponse.draws) {
        for (let m = 0; m < SvSpResponse.draws.draws.length; m++) {
            let e = SvSpResponse.draws.draws[m];
            matches[m].matchStart = e.match ? e.match.matchStart : undefined;
            if(SvSpResponse.forecast && SvSpResponse.forecast.matchInfo) {
                matches[m].lastEvent=SvSpResponse.forecast.matchInfo[m].time;
            }
        }
    }


    let matchRows = [];
    matches.forEach(e => {
        let row = {}
        row.status = e.status;
        row.rownr = e.eventNumber;
        row.result = e.result;
        row.matchStart=e.matchStart;
        row.matchTime=e.matchTime;
        row.lastEvent=e.lastEvent;
        matchRows.push(row);
    });

    let drawState = SvSpResponse.draws.drawState;

    let dbi = db.getDbInstance();
    try {
        dbi.transaction(() => {
            db.updateMatchResults(drawId,matchRows);
            if (outcome !== null) {
                db.updateDrawResult(drawId, drawState, outcome);
            }
        })();
        return true;
    } catch (err) {
        console.log("Error in checkDraw:", err);
        return false;
    }

}


app.post('/deleteDraw',(req,res)=> {
    var userId=sessionHandler.getSession(req).userId;
    var groupId=req.body.groupId;
    var drawId=req.body.drawId;

    db.deleteDraw(drawId,userId,groupId, function(status,err) {
        if(status) {
            res.sendStatus(200);                    
        } else {
            console.log("deleteDraw",err);
            res.sendStatus(500);
        }
    })

})

app.post('/getUserSurplus', (req,res)=>{
    var userId=sessionHandler.getSession(req).userId;
    var groupId=req.body.groupId;
    db.getUserSurplus(userId,groupId,function(surplus) {
        res.json({surplus:surplus});
    })
   
})


app.post('/getStatistics',(req,res)=>{
    var userId=sessionHandler.getSession(req).userId;
    var groupId=req.body.groupId;
    db.getStatistics(userId,groupId,function(status,resOrErr) {
        if(status) {
            res.json(resOrErr);
        } else {
            if(resOrErr==="NOT_GROUPMEMBER") {
                res.sendStatus(403);
            } else {
                res.sendStatus(500);
            }
        }
    })
   
})


app.post('/getEvents',(req,res)=>{
    var userId=sessionHandler.getSession(req).userId;
    var groupId=req.body.groupId;
    var page=req.body.page;
    db.getEvents(userId,groupId,page,function(status,resOrErr) {
        if(status) {
            res.json(resOrErr);
        } else {
            if(resOrErr==="NOT_GROUPMEMBER") {
                res.sendStatus(403);
            } else {
                res.sendStatus(500);
            }
        }
    })
   
})


app.post('/deleteEvent',(req,res)=> {
    var userId=sessionHandler.getSession(req).userId;
    var groupId=req.body.groupId;
    var eventId=req.body.eventId;
    db.deleteEvent(userId,groupId,eventId, function(status,err) {
        if(status) {
            res.sendStatus(200);                    
        } else {
            res.sendStatus(500);
        }
    })

})



app.post('/makePayment',(req,res)=>{
    var userId=sessionHandler.getSession(req).userId;
    var groupId=req.body.groupId;
    var amount=req.body.amount;
    db.makePayment(userId,groupId,amount,function(status,err) {
        if(status) {
           
            if(req.body.mailTo) {
                mailSender.sendPaymentList(req.body.mailTo,req.body.mailBody,function(status,err) {
                    if(status) {
                        res.sendStatus(200);
                    } else {
                        res.sendStatus(406);
                    }
                })
        
            } else {
                res.sendStatus(200);
            }
        
        } else {
            if(err==="OVERDRAW") {
                res.sendStatus(400);
            } else {
                res.sendStatus(500);
            }
        }
    })


})


app.post('/getNextInLine',(req,res)=> {
    var groupId=req.body.groupId;
    db.getNextInLine(groupId,function(data){
            res.json(data);
    })
})

function sendRemainder(groupId) {
    db.getNextInLine(groupId,function(next) {
        if(next && next.sendRemainder && next.remainderMail!==null) {
            mailSender.sendRemainder(next.groupName,next.nextInLine,next.remainderMail,function(status,res) {
                if(status===false) {
                    console.log("sendRemainder("+groupId+"):"+res);
                }
            });
        }
    
    });
}


app.post('/getToplist',(req,res)=>{
    var userId=sessionHandler.getSession(req).userId;
    var groupId=req.body.groupId;
    db.getToplist(userId,groupId,function(status,data) {
        if(status) {
            res.json(data);
        } else {
            if(data==="NO_DRAWS"|| data==="NOT_ENOUGH_DRAWS") {
                res.sendStatus(404);
            } else if(data===NOT_GROUPMEMBER) { 
                res.sendStatus(401);                
            } else {
                res.sendStatus(500);
            }
        }

    })
})

app.post("/getRowsFromLink",(req,res)=>{
    var link=req.body.link;
    (async () => {
        var rows=await webScraper.getRows(link);
        res.json(rows);
    })()

});
process.on('SIGINT', function(e) {
    console.log("exit");
    sessionHandler.saveSessions(db.getDbInstance(),function(err) {process.exit()});
});



var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(config.app.http,() => console.log('App listening at http://localhost:'+config.app.http));
httpsServer.listen(config.app.https,() => console.log('App listening at https://localhost:'+config.app.https));

