var fs = require('fs');
var http = require('http');
var https = require('https');
var db=require('./db/dbFunctions_better.js');
var mailsender=require('./utils/mailSender.js');
var sessionHandler=require('./utils/sessionHandler.js');
var matchInfoHandler=require('./utils/matchInfoHandler.js');

sessionHandler.resumeSessions(db.getDbInstance());


var config=require('../resources/config.js');


var privateKey  = fs.readFileSync('./resources/server.key', 'utf8');
var certificate = fs.readFileSync('./resources/server.crt', 'utf8');


var credentials = {key: privateKey, cert: certificate};
var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies


const cookieParser = require('cookie-parser');
app.use(cookieParser());



app.use((req,res,next)=>{
    if(sessionHandler.getSession(req)) {
        next();
        return;
    }

 
    if(
        req.url.startsWith("/handlebars") || 
        req.url.startsWith("/js") || 
        req.url.startsWith("/css") ||
        req.url.startsWith("/img") ||  
        req.url.startsWith("/main.html") || 
        req.url.startsWith("/login") ||
        req.url.startsWith("/register") ||
        req.url.startsWith("/forgotPassword") ||
        req.url.startsWith("/resetPassword") ||
        req.url.startsWith("/shutdown")
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
        sessionHandler.saveSessions(db.getDbInstance(),function(err) {process.exit()});
    }

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

app.get('/logout',(req,res)=> {
    sessionHandler.invalidateSession(req,res);
    res.sendStatus(200);
})

app.post('/register',(req,res)=> {
    console.log("register", req.body);
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
            console.log(err);
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
                mailsender.sendPasswordReset(userId,mailAdr,req,res);
            }
        } else {
            res.sendStatus(500);
        }
    })

});


app.post('/resetPassword', (req, res) => {
    var token = req.body.resetToken;
    var password = req.body.password;
    db.resetPassword(token, password, function (status, err) {
        if(status) {
            res.sendStatus(200);
        } else {
            if(err) {
                console.log("Failed to resetPassword",err);
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
            console.log(userInfo);
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
            console.log(groups);
            res.sendStatus(404);  

        }
    })

})


app.post('/getGroupMembers',(req,res)=> {
    let userId=sessionHandler.getSession(req).userId;
    let groupId=req.body.groupId
    db.getGroupMembers(userId,groupId,function(status,rows){
        if(status) { 
            let members=rows;
            db.getInvites(userId,groupId,function(status,rows){
                if(status) {
                    res.json({
                        members:members,
                        invites:rows
                    });  
                } else {
                    console.log("getInvites",rows);
                    res.sendStatus(500);  
        
                }
            });
             
        } else {
            console.log("getGroupMembers",rows);
            res.sendStatus(500);  

        }
    })

})


app.post('/updateUserInfo',(req,res)=> {
    var userId=sessionHandler.getSession(req).userId;

    db.updateUserInfo(userId,req.body, function(status,err) {
        if(status) {
            res.sendStatus(200);                    
        } else {
            console.log(err);
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
            mailsender.inviteMember(userId, groupInfo, email, req, res, function (status, err) {
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
            res.sendStatus(500);
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
            console.log(err);
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
            console.log(data);
            res.sendStatus(500);
        }
    })
});


app.get('/getResults',(req,res)=> {
    var userId=sessionHandler.getSession(req).userId;
    var groupId=req.query.groupId;
    db.getResults(userId,groupId,function(status,data) {
        if(status) {
            res.json(data);
        } else {
            //console.log(data);
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

function updateResults(groupId,callback) {
    let sql="select id,drawnumber,product from draws where drawstate<>'Finalized' and groupid=?";
    let dbi=db.getDbInstance();
    const rows=dbi.prepare(sql).all(groupId);
    if(rows.length>0) {
        let drawToCheck=[];
        rows.forEach(r=>{
            let key=r.drawnumber+";"+r.product;
            if(drawToCheck[key]) {
                drawToCheck[key].push(r.id);
            } else {
                drawToCheck[key]=[r.id];
            }
        })
        let nrOfChecks=Object.keys(drawToCheck).length;
        if(nrOfChecks===0) {
            callback();
        }
        for(key in drawToCheck) {
            let tmp=key.split(";");
            let drawNumber=tmp[0];
            let product=tmp[1];
            let drawIds=drawToCheck[key];
            checkDraw(product,drawNumber,drawIds,function(status) {
                console.log(nrOfChecks);
                nrOfChecks--;
                if(nrOfChecks===0) {
                    callback();
                }
            });
        }
    } 
}


function checkDraw(product, drawNr, drawIds, callback = console.log) {
    matchInfoHandler.getDrawAndResult(product.toLowerCase(), drawNr, function (status, data) {
        if (status) {
            let matches = [];
            let outcome = null;
            if (data.result !== null) {
                matches = data.result.results;
                if (data.result) {
                    outcome = data.result.distribution;
                }
            } else {
                matches = data.draws.draws;
                if (data.forecast) {
                    outcome = data.forecast.winresult;
                }
            }
            let rows = [];
            matches.forEach(e => {
                let row = {}
                row.status = e.status;
                row.rownr = e.eventNumber;
                row.result = e.result;
                rows.push(row);

            });
            let drawState = data.draws.drawState;
            let dbi = db.getDbInstance();
            try {
                dbi.transaction(() => {
                    let sql = "update draw_rows set result=?,status=? where drawid=? and rownr=?"
                    let stmt = dbi.prepare(sql);
                    drawIds.forEach(i => {
                        rows.forEach(r => {
                            stmt.run(r.result, r.status, i, r.rownr);
                        });
                        if (outcome !== null) {
                            db.updateDrawResult(i, drawState, outcome);
                        }
                    });
                })();
                callback(true);
            } catch (err) {
                callback(false, err);
            }

        }
    })
}

app.post('/deleteDraw',(req,res)=> {
    var userId=sessionHandler.getSession(req).userId;
    var drawId=req.body.drawId;

    db.deleteDraw(drawId,userId, function(status,err) {
        if(status) {
            res.sendStatus(200);                    
        } else {
            console.log(err);
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


process.on('SIGINT', function(e) {
    console.log("exit");
    sessionHandler.saveSessions(db.getDbInstance(),function(err) {process.exit()});
});



var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(config.app.http,() => console.log('App listening at http://localhost:'+config.app.http));
httpsServer.listen(config.app.https,() => console.log('App listening at https://localhost:'+config.app.https));

