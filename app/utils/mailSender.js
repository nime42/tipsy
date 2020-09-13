var nodemailer = require('nodemailer');

var db=require('../db/dbFunctions.js');

var config=require('../../resources/config.js');



var transporter = nodemailer.createTransport({
    service: config.mail.service,//smtp.gmail.com  //in place of service use host...
    secure: false,//true
    port: config.mail.port,//465
    tls: {
        rejectUnauthorized: false
    },
    auth: {
      user: config.mail.user,
      pass: config.mail.passwd
    }

  });
  

function sendMail(from,to,cc,subject,text,html, callback) {
    var mailOptions = {
        from: from,
        to: to,
        cc:cc,
        subject: subject,
        text: text,
        html:html
      };
      console.log("Sending mail with subject '"+mailOptions.subject+"' to "+mailOptions.to);
      transporter.sendMail(mailOptions, callback);      
}


function sendPasswordReset(userId,mailadress,req,res,callback) {
    db.createPassWordResetToken(userId,function(status,token) {
        if(status) {
            var resetLink = req.protocol + '://' + req.get('host') +"/main.html?reset-token="+token;
            var from="tipsy.nu@gmail.com";
            var to=mailadress;
            var subject="Uppdatera lösenord";
            var message="Hej!\nAnvänd nedanstående länk för att återställa dit lösenord på tipsy.nu:\n"+resetLink+"\n"
            sendMail(from,to,undefined,subject,message,undefined, function(err) {
                if(err!==null) {
                    res.sendStatus(500);
                } else {
                    res.sendStatus(200);          
                }
            });
        } else {
            res.sendStatus(500);
        }

    });

} 


function inviteMember(groupAdmin,groupInfo,mailadress,req,res,callback) {
    db.inviteUserToGroup(groupAdmin,mailadress,groupInfo.groupid,function(status,data) {
        if(status) {
            var token=data;
            var inviteLink = req.protocol + '://' + req.get('host') +"/main.html?invite-token="+token;
            var name=groupInfo.name!==""?groupInfo.name:groupInfo.username;
            var ccmail=groupInfo.mail;
            var groupName=groupInfo.groupname;
            var message="Hej\nDu har blivit inbjuden av "+name+" att bli medlem i tipsgruppen "+groupName+" på www.tipsy.nu.\nAnvänd denna länk för att logga in eller skapa din användare:\n\t"+inviteLink+"\n\nMvh\nTipsy";
            var from="tipsy.nu@gmail.com";
            var to=mailadress;
            var subject="Inbjudan till Tipsy.nu";
            
            sendMail(from,to,undefined,subject,message,undefined, function(err) {
                if(err!==null) {
                    console.log("sendMail",err);
                    res.sendStatus(500);
                } else {
                    res.sendStatus(200);          
                }
            });

        } else {
            if(data.errno===19) {
                res.sendStatus(403);
            } else {
                res.sendStatus(500);
            }
        }

    });

} 

function sendPaymentList(to,mailBody,callback) {
    var from="tipsy.nu@gmail.com";
    var subject="Utbetalningslista från Tipsy.nu";
    var text="Det går inte att visa html-tabellen"
    sendMail(from,to,undefined,subject,text,mailBody, function(err) {
        if(err) {
            callback(false,err);
        } else {
            callback(true);
        }
    });

}

function sendRemainder(group,user,to,callback) {
    var from="tipsy.nu@gmail.com";
    var subject="Det är dags att spela!";
    var text="Hej "+user+"\nNu är det din tur att spela en rad för "+group+".\n";
    text+="\nSpela tillsammans!\n\nHälsar\nTipsy";
    sendMail(from,to,undefined,subject,text,undefined, function(err) {
        if(err) {
            callback(false,err);
        } else {
            callback(true);
        }
    });
}


function sendApprovalNotification(group,to,callback) {
    var from="tipsy.nu@gmail.com";
    var subject="Nya medlemsansökning att godkänna";
    var text="Hej\nEn ny medlem vill gå med i gruppen '"+group+"'.\n";
    text+="Logga in på https://www.tipsy.nu för att titta på ansökningen (under menyn Medlemmar)!"
    text+="\nSpela tillsammans!\n\nHälsar\nTipsy";
    sendMail(from,to,undefined,subject,text,undefined, function(err) {
        if(err) {
            callback(false,err);
        } else {
            callback(true);
        }
    });
}

module.exports = {
    sendMail:sendMail,
    sendPasswordReset:sendPasswordReset,
    inviteMember:inviteMember,
    sendPaymentList:sendPaymentList,
    sendRemainder:sendRemainder,
    sendApprovalNotification:sendApprovalNotification
}