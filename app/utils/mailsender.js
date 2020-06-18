var nodemailer = require('nodemailer');

var db=require('../db/dbfunctions.js');

var service="gmail";
var user="nilsmeinhard@gmail.com";
var passwd="s01r0s20!";

var transporter = nodemailer.createTransport({
    service: service,//smtp.gmail.com  //in place of service use host...
    secure: false,//true
    port: 25,//465
    tls: {
        rejectUnauthorized: false
    },
    auth: {
      user: user,
      pass: passwd
    }

  });
  

function sendMail(from,to,subject,text, callback) {
    var mailOptions = {
        from: from,
        to: to,
        subject: subject,
        text: text
      };
      transporter.sendMail(mailOptions, callback);      
}


function sendPasswordReset(userId,mailadress,req,res,callback) {
    db.createPassWordResetToken(userId,function(status,token) {
        if(status) {
            var resetLink = req.protocol + '://' + req.get('host') +"/login-register.html?reset-token="+token;
            console.log(resetLink);
            res.sendStatus(200); 
        } else {
            res.sendStatus(500);
        }

    });

} 


function inviteMember(groupAdmin,groupId,mailadress,req,res,callback) {
    db.inviteUserToGroup(groupAdmin,mailadress,groupId,function(status,data) {
        if(status) {
            var token=data;
            var inviteLink = req.protocol + '://' + req.get('host') +"/login-register.html?invite-token="+token;
            console.log(inviteLink);
            res.sendStatus(200); 
        } else {
            if(data.errno===19) {
                res.sendStatus(403);
            } else {
                res.sendStatus(500);
            }
        }

    });

} 




module.exports = {
    sendMail:sendMail,
    sendPasswordReset:sendPasswordReset,
    inviteMember:inviteMember
}