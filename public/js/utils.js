

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


function reloadIfLoggedOut(jqxhr) {
  if (jqxhr.getResponseHeader("content-type").match(/text\/html;/) !== null) {
    location.reload();
  }
}