

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,    
    function(m,key,value) {
      vars[key] = value;
    });
    return vars;
  }


  function popup(div,title,message) {
    $(div).find("#popup-header").text(title);
    $(div).find("#popup-message").text(message);
    $(div).modal('show');
  }

  function dialog(div,title,message,button1,button2) {
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


function collectUserInfo(div,passwordCantBeEmpty) {
  var conf = {};
  conf.username = $("div").find("#username").val().trim();
  conf.name = $("div").find("#name").val().trim();
  conf.email = $("div").find("#email").val().trim();
  conf.phonenr = $("div").find("#phonenr").val().trim();

  conf.password = $("div").find("#password").val().trim();
  var pwd2 = $("div").find("#confirm-password").val().trim();

  if (conf.username === "") {
    $("div").find("#error-message").text("Användarnamn saknas!!").show();
    return null;
  }

  if (conf.email === "" || !conf.email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
    $("div").find("#error-message").text("Mailadress saknas eller verkar vara ogiltig!!").show();
    return null;
  }
  if (passwordCantBeEmpty) {
    if (conf.password === "") {
      $("div").find("#error-message").text("Lösenord saknas!!").show();
      return null;
    }
  }

  if (conf.password !== pwd2) {
    $("div").find("#error-message").text("Lösenorden stämmer inte överens!!").show();
    return null;
  }

  if(conf.password==="") {
    conf.password=undefined;
  }
  return conf;
}


function collectLoginInfo(div) {
  var conf = {};
  conf.username = $("div").find("#username").val().trim();
  conf.password = $("div").find("#password").val().trim();

  if (conf.username === "") {
    $("div").find("#error-message").text("Användarnamn saknas!!").show();
    return null;
  }
  if (conf.password === "") {
    $("div").find("#error-message").text("Lösenord saknas!!").show();
    return null;
  }
  return conf;

}

function getCookie(name) {
  var cookies = document.cookie.split(';');
  for(var i=0 ; i < cookies.length ; ++i) {
      var pair = cookies[i].trim().split('=');
      if(pair[0] == name)
          return pair[1];
  }
  return null;
};

function deleteCookie(name) {
  document.cookie = name+"=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}