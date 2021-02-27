


var matchInfoHandler=require('./utils/matchInfoHandler.js');

var fs=require('fs');


function main(argv) {
    let argDescr=" [stryktips|europatips|topptips] -row [SvF|Odds|1,X,2..] -maxErrors n -singles [0,2,3..] -impossibles [0:X,1:2..] -outfile [filename]";
    if(argv.length<3) {
        console.log("Usage: "+argv[1]+argDescr);
        return;    
    }

    let options=parseOptions(argv.slice(2));

    if(argv[2].match(/stryk.*/i))  {
        makeReducedSystem("stryktipset",options);

    } else if(argv[2].match(/euro.*/i)) {
        makeReducedSystem("europatipset",options);

    } else if(argv[2].match(/topp.*/i)) {
        makeReducedSystem("topptipsetfamily",options);
    } else {
        console.log("Unknown gametype:"+argv[2])
        console.log("Usage: "+argv[1]+argDescr);
        return;            
    }

}

function parseOptions(argv) {
    let cmdLine = argv.join(" ");
    let args = {};
    let matches = cmdLine.match(/-[^ ]+ [^ ]+/g);
    if (matches) {
        matches.forEach(e => {
            const [param, val] = e.split(" ");
            args[param]=val;
        })
    }
    let params={};

    if(args["-row"]) {
        params.row=args["-row"].split(",");
    }

    if(args["-maxErrors"]) {
        params.maxErrors=args["-maxErrors"];
    } else {
        params.maxErrors=0;
    }

    if(args["-singles"]) {
        params.singles=args["-singles"].split(",");
    } else {
        params.singles=[];
    }

    if(args["-impossibles"]) {
        params.impossibles=args["-impossibles"].split(",").map(e=>{
            [pos,val]=e.split(":");
            return {pos:pos,val:val};
        });
    }
    
    if(args["-outfile"]) {
        params.outfile=args["-outfile"];
    } 

    params.cmdLine=argv.join(" ");

    return params;

}

function printSystemFile(product,drawnumber,systems,file) {
    let outStream;
    if(file) {
        outStream=fs.createWriteStream(file);
    } else {
        outStream=process.stdout;
    }
    let headerText;
    if(product.match(/topp.*/i)) {
        headerText=product.replace(" ",",")+",Omg="+drawnumber+",Insats=1";  
    } else {
        headerText=product;
    }
    outStream.write(headerText+"\n");
    systems.forEach(s=>{
        if(s.size>1) {
            outStream.write("M"+s.size+","+s.row+"\n");
        } else {
            outStream.write("E,"+s.row+"\n");
        }
    })
}

function makeReducedSystem(product,options) {
    matchInfoHandler.getPlayable(product,function(status,data) {
        if(status) {
            let draw=data[0];

            let drawnumber= draw.drawNumber;
            let product= draw.productName;

            let svfBets=[];
            let oddsBets=[];
            draw.draws.forEach(d=>{
                //console.log(d);
                console.log(d.eventDescription);
                let svF=getBet('percent',d.svenskaFolket);
                console.log(" Svenska Folket:"+"("+svF.suggestion+")"+svF.text);
                svfBets.push(svF.suggestion);
                let odds=getBet('odds',d.odds);
                console.log("         Oddset:"+"("+odds.suggestion+")"+odds.text);
                oddsBets.push(odds.suggestion);

                
            });
            let row=undefined;
            if(options.row) {
                if(options.row[0].toLowerCase().startsWith("s")) {
                    row=svfBets;
                } else if(options.row[0].toLowerCase().startsWith("o")) {
                    row=oddsBets;
                } else {
                    row=options.row;
                }
            } else {
                console.log("\nNo row is supplied");
                return;
            }

            options.row=row.join(",");
            console.log();
            let systems=makeSystem(row,options.singles,options.maxErrors,options.impossibles); 

            let singleOutfile;
            if(options.outfile) {
                singleOutfile=options.outfile.replace(/(\..*$|$)/,"_enkel$1");
                console.log("Systemfil:"+options.outfile);
            } else {
                console.log("Systemrader:");
            }
            printSystemFile(product,drawnumber,systems.systems.filter(s=>(s.size>1)),options.outfile);

            console.log();

            if(singleOutfile) {
                console.log("EnkelSystemfil:"+singleOutfile);
            } else {
                console.log("Enkelrader:");
            }
            printSystemFile(product,drawnumber,systems.systems.filter(s=>(s.size===1)),singleOutfile);

            console.log("\nSystem storlek:"+systems.size);


            if(options.outfile) {
                let optionFile=options.outfile.replace(/(\..*$|$)/,"_options$1");
                try {fs.unlinkSync(optionFile);} catch(err) {}
                fs.appendFileSync(optionFile,JSON.stringify(options, null, 2));
            } else {
                console.log(options);
            }
            

        }
    })

}




function getBet(type,matchData) {
    let text=matchData.one+"\t"+matchData.x+"\t"+matchData.two;
    let odds=Object.keys(matchData).map(e=>({symbol:e,value:matchData[e].replace(',','.')}));
    //console.log(odds);
    let suggestion;
    if(type=="percent") {
        suggestion=odds.sort((a,b)=>(b.value-a.value))[0].symbol;
    } else {
        suggestion=odds.sort((a,b)=>(a.value-b.value))[0].symbol;
    }

    switch(suggestion) {
        case "one":
            suggestion= '1';
            break;
        case "x":
            suggestion= 'X';
            break;
        case "two":
            suggestion= '2';
            break;
    }


    return {text:text,suggestion:suggestion};
}

//========================================================

function makeSystem(bets,singlePositions, maxErrors,impossibles) {
    let systems = [];
    let size=0;

    let orgValues=singlePositions.sort().map(e=>({pos:e,val:bets[e]}));



    for(let i=orgValues.length-1;i>=0;i--) {
        bets.splice(orgValues[i].pos,1);
    }

    let restore=function(system) {
        for(let i=0;i<orgValues.length;i++) {
            system.splice(orgValues[i].pos,0,orgValues[i].val);
        }
        return system;
    }

    let removeImpossibles=function(system,impossibles) {
        
        impossibles && impossibles.forEach(e=>{
            system[e.pos]=system[e.pos].replace(e.val,"");
        });
        return system;
    }




    for (let i = 0; i <= maxErrors; i++) {
        let errorComb = pickOutN(Array(bets.length).fill().map((element, index) => index), i);
        errorComb.forEach(p => {
            let system=generateRows(p, bets);
            systems.push(system);
        })

    }
    let res=[]
    systems.forEach(s=>{
        let r=createSystemRow(removeImpossibles(restore(s),impossibles));
        res.push(r);
        size+=r.size;
    })
    return {size:size,systems:res};
}

function createSystemRow(system) {
    let size=system.reduce((total,e)=>(total*e.length),1);
    let row=system.join(',');
    return {size:size,row:row};
}

function generateRows(positions,bets) {
    let allVals=['1','X','2'];
    let alts=[]
    positions.forEach(e=>{
        let v=bets[e];
        alts.push({position:e,value:allVals.filter(e=>(e!==v))});
    });
    let system=bets.slice();
    alts.forEach(o=>{
        system[o.position]=o.value.join("");
    })
    return system;
}

function pickOutN(array,n) {
    let res=[];
    if(n<=0) {
        return [[]];
    } else {
        for(let i=0;i<array.length;i++) {
            let v=array[i];
            let rest=array.slice();rest.splice(i);
            let sub=pickOutN(rest,n-1);
            //console.log(v,rest,sub);
            sub.forEach(e=>{
                res.push(e.concat(v));
            })

        }
        return res;
    }
}






main(process.argv);