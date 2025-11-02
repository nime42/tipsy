var sqlite3 = require('better-sqlite3');
const { argv } = require('process');

var db = new sqlite3('./resources/tipsy_statistics.db');
db.pragma("foreign_keys = ON");


function createDatafile(outfile, db) {
    const sql = `
        SELECT r.drawnumber , 
    CAST(sv1.odds as decimal)/100.0 as folket_1,CAST(svX.odds as decimal)/100.0 as folket_x,CAST(sv2.odds as decimal)/100.0 as folket_2,
    CAST(replace(o1.odds,',','.') as decimal) as odds_1,cast(replace(oX.odds,',','.') as decimal) as odds_x,cast(replace(o2.odds,',','.') as decimal) as odds_2,
    case r."result" when 'one' then '1' when 'x' then 'X' when 'two' then '2' end as resultat 
    from v_draw_rows r
    LEFT join odds o1 on r.drawId =o1.drawId and r.matchNr =o1.matchNr and o1."type" ='odds' and o1.outcome ='one'
    LEFT join odds oX on r.drawId =oX.drawId and r.matchNr =oX.matchNr and oX."type" ='odds' and oX.outcome ='x'
    LEFT join odds o2 on r.drawId =o2.drawId and r.matchNr =o2.matchNr and o2."type" ='odds' and o2.outcome ='two'
    LEFT join odds sv1 on r.drawId =sv1.drawId and r.matchNr =sv1.matchNr and sv1."type" ='SvenskaFolket' and sv1.outcome ='one' 
    LEFT join odds svX on r.drawId =svX.drawId and r.matchNr =svX.matchNr and svX."type" ='SvenskaFolket' and svX.outcome ='x'
    LEFT join odds sv2 on r.drawId =sv2.drawId and r.matchNr =sv2.matchNr and sv2."type" ='SvenskaFolket' and sv2.outcome ='two'
    where r.drawstate='Finalized' AND r.result IS not null and sv1.odds is not null and odds_1 is  not null
    order by drawnumber,r.matchNr
    `;
    const rows = db.prepare(sql).all();
    const fs = require('fs');
    const writeStream = fs.createWriteStream(outfile);
    writeStream.write("drawnumber,folket_1,folket_x,folket_2,odds_1,odds_x,odds_2,resultat\r\n");
    let currentDraw = null;
    let line = "";
    rows.forEach(r => {
        const line = [r.drawnumber, r.folket_1, r.folket_x, r.folket_2, r.odds_1, r.odds_x, r.odds_2, r.resultat].join(",");
        writeStream.write(line.trim() + "\r\n");
    });
    writeStream.end();
    console.log(`Datafile ${outfile} created.`);
}

if (argv.length < 3) {
    console.log("Usage: node create_datafile.js <outputfile>");
    process.exit(1);
}
createDatafile(argv[2], db);
db.close();


