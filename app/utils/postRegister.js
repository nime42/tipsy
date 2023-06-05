var matchInfoHandler = require('./matchInfoHandler.js');
var db = require('../db/dbFunctions_better.js');



function main(argv) {
  let argdescr = `
  usage: ${argv[1]} product drawid groupid userid row
    product : stryktipset|europatipset|topptipset
    drawid: the numerical SvSp id for the draw
    groupid: the numerical id of the group
    userid: the users numerical id
    row: the system in the form as "12,1,X2...."
  `;
  if (argv.length < 7) {
    console.log(argdescr);
    return;
  }

  

  let product = argv[2];
  let drawId = argv[3];
  let groupId=argv[4];
  let userId=argv[5];
  let row=argv[6].replace(/\s/g,"").split(",");

  matchInfoHandler.getDraw(product, drawId, (status, data) => {
    if(status) {
    let postdata = {
      groupid: groupId,
      drawnumber: data.drawNumber,
      product: data.productName,
      drawstate: "Open",
      regclosetime: data.regCloseTime,
      rowprice: 1.00,
      extra_bet: 0,
      rows: []
    }

    for (let rownr = 0; rownr < 13; rownr++) {
      let r = {
        rownr: rownr + 1,
        teams: data.draws[rownr].eventDescription,
        bet: row[rownr]
      }
      postdata.rows.push(r);
    }

    console.log(postdata);


    db.addPlay(userId, postdata, function (status, data) {
      if (status) {
        let newDrawId = data.drawId;
        let sql = "update draws set created=datetime(?, 'unixepoch') where id=?"
        db.getDbInstance().prepare(sql).run(new Date(postdata.regclosetime).getTime() / 1000, newDrawId);

        sql="select name, groupname from v_group_members vgm where groupid = ? and userid =?";
        let res=db.getDbInstance().prepare(sql).get(groupId,userId);
        console.log(res);
        console.log(`draw is added for "${res.name}" in group "${res.groupname}"`);
      } else {
        console.log("something went wrong:"+data);
      }
    })
  } else {
    console.log("something went wrong:"+data);
  }

  });

}

/*
args=[
  "node",
  "dummy",
  "stryktipset",
   4796,
    4, 20,
    "X2,1X,X2,1X,1,1X,1X,2,1,1,1X,1X,1"
]
main(args);*/

main(process.argv);
