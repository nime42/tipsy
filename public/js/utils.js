

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

function popup(div, title, message) {
  $(div).find("#popup-header").text(title);
  $(div).find("#popup-message").text(message);
  $(div).modal('show');
}

function dialog(div, title, message, button1, button2) {
  $(div).find("#modal-title").text(title);
  $(div).find("#modal-message").html(message);

  $(div).find("#button1").html(button1.text);
  $(div).find("#button1").unbind("click");
  $(div).find("#button1").click(button1.func);

  $(div).find("#button2").html(button2.text);
  $(div).find("#button2").unbind("click");
  $(div).find("#button2").click(button2.func);


  $(div).modal('show')

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

  conf.password = $("div").find("#password").val().trim();
  var pwd2 = $("div").find("#confirm-password").val().trim();

  if (conf.username === "") {
    popup("#popup","Användarinfo", "Användarnamn saknas!!");
    return null;
  }

  if (conf.email === "" || !conf.email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
    popup("#popup","Användarinfo", "Mailadress saknas eller verkar vara ogiltig!!");
    return null;
  }
  if (passwordCantBeEmpty) {
    if (conf.password === "") {b
      popup("#popup","Användarinfo", "Lösenord saknas!!");
      return null;
    }
  }

  if (conf.password !== pwd2) {
    popup("#popup","Användarinfo", "Lösenorden stämmer inte överens!!");
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
    popup("#popup","Inloggning", "Användarnamn saknas!!");
    return null;
  }
  if (conf.password === "") {
    popup("#popup","Inloggning", "Lösenord saknas!!");
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
  return;
  /*
  var f=new File([new Blob([fileContent]), "filename.txt");
 
  let list = new DataTransfer();
  list.items.add(f);
  form.find("#file")[0].files=list.files;
  form.submit();*/
}