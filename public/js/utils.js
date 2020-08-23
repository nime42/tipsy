

function getUrlVars() {
  var vars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,
    function (m, key, value) {
      vars[key] = value;
    });
  return vars;
}

function removeUrlVars() {
  window.location.href = window.location.href.split(/[?#]/)[0]
}



function reloadIfLoggedOut(jqxhr) {
  if (jqxhr.getResponseHeader("content-type").match(/text\/html;/) !== null) {
    deleteCookie("SessId");
    window.location.href = window.location.pathname;
  }
}


function collectUserInfo(div, passwordCantBeEmpty) {
  var conf = {};
  conf.username = $("div").find("#username").val().trim();
  conf.name = $("div").find("#name").val().trim();
  conf.email = $("div").find("#email").val().trim();
  conf.phonenr = $("div").find("#phonenr").val().trim();
  conf.sendremainder =  $("div").find("#notify-me").prop("checked")?1:0;

  conf.password = $("div").find("#password").val().trim();
  var pwd2 = $("div").find("#confirm-password").val().trim();

  if (conf.username === "") {
    modalPopUp("#popup","Användarinfo", "Användarnamn saknas!!");
    return null;
  }

  if (conf.email === "" || !conf.email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
    modalPopUp("#popup","Användarinfo", "Mailadress saknas eller verkar vara ogiltig!!");
    return null;
  }
  if (passwordCantBeEmpty) {
    if (conf.password === "") {b
      modalPopUp("#popup","Användarinfo", "Lösenord saknas!!");
      return null;
    }
  }

  if (conf.password !== pwd2) {
    modalPopUp("#popup","Användarinfo", "Lösenorden stämmer inte överens!!");
    return null;
  }

  if($("#accept-terms").length>0 && $("#accept-terms").is(":checked")==false) {
    modalPopUp("#popup","Godkänn villkor", "Du måste godkänna villkoren!");
    return null;
  }

  if (conf.password === "") {
    conf.password = undefined;
  }
  return conf;
}


function collectLoginInfo(div) {
  var conf = {};
  conf.username = $("div").find("#username").val().trim();
  conf.password = $("div").find("#password").val().trim();

  if (conf.username === "") {
    modalPopUp("#popup","Inloggning", "Användarnamn saknas!!");
    return null;
  }
  if (conf.password === "") {
    modalPopUp("#popup","Inloggning", "Lösenord saknas!!");
    return null;
  }
  return conf;

}

function getCookie(name) {
  var cookies = document.cookie.split(';');
  for (var i = 0; i < cookies.length; ++i) {
    var pair = cookies[i].trim().split('=');
    if (pair[0] == name)
      return pair[1];
  }
  return null;
};

function deleteCookie(name) {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}


// This script is released to the public domain and may be used, modified and
// distributed without restrictions. Attribution not necessary but appreciated.
// Source: http://weeknumber.net/how-to/javascript 

// Returns the ISO week of the date.
Date.prototype.getWeek = function() {
  var date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  // January 4 is always in week 1.
  var week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

function getWeekDay(date) {
  var days = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör'];
  return days[date.getDay()];
}


function sendRows(drawData,rows,systemSize) {
  var form=$("#send-rows");

  var product="";
  switch(drawData.product) {
    case "Stryktipset": 
        product="Stryktipset"
        break;
    case "Europatipset":
        product="Europatipset";
        break;
    case "Topptipset":  
        product="Topptipset,Omg="+drawData.drawnumber+",Insats=1";
        break;
    case "Topptipset Extra":
        product="Topptipset,Europa,Omg="+drawData.drawnumber+",Insats=1";
        break;
    case "Topptipset Stryk":
        product="Topptipset,Stryk,Omg="+drawData.drawnumber+",Insats=1";
  }
  var betRow=rows.join(",");
  if(systemSize==1) {
    betRow="E,"+betRow;
  } else {
    betRow="M"+systemSize+","+betRow;
  }

  var fileContent=product+"\n"+betRow;
  console.log(fileContent);

  var f=new File([new Blob([fileContent])], "filename.txt");
 
  let list = new DataTransfer();
  list.items.add(f);
  form.find("#file")[0].files=list.files;
  form.submit();
}
/**
 * Takes a multiline string with bets, example:
 * "12
 *  2x
 * "
 * and instanciates the betting table with this rows.
 * 
 * @param {*} tableElem - a table element to put the rows 
 * @param {*} rowLines - a string with multiple lines each line should match [1Xx2]+
 */
function pasteRows(tableElem,rowLines) {
  if(rowLines==null || rowLines.match(/^([1xX2]+\n?)+$/)==null) {
    return false;
  }
  clearRows(tableElem);
  var rows=rowLines.trim().split("\n");
  for(var i=0;i<rows.length;i++) {
    var rowElem=tableElem.find("#row-"+(i+1));
    var bets=rowElem.find(".1x2");
    rows[i].split("").forEach(b=>{
      switch(b.toLowerCase()) {
        case "1":
          bets[0].click();
          break;
          case "x":
            bets[1].click();
            break;
          case "2":
            bets[2].click();
            break;
        }

    })
  }
  return true;
}



function clearRows(tableElem) {
  tableElem.find(".1x2").addClass("off").removeClass("on");
}


function isDemo() {
  if(globals.userinfo.userid<0 && !globals.activeGroup.admin) {
    return true;
  } else {
    return false;
  }
}