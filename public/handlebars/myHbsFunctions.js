
if (!('hbsTemplates' in Object)) {
    hbsTemplates = {};
}
function precompileHbs(callback) {

    var nrOfTemplates=$("script[type='text/x-handlebars-templates']").size();

    $("script[type='text/x-handlebars-templates']").each(function (i, s) {
        var url = s.getAttribute("src");
        var templatePrefix = url.substring(url.lastIndexOf('/') + 1).replace(".hbs", "");

        if (!hbsTemplates[templatePrefix]) {
            hbsTemplates[templatePrefix] = {};
        }

        var tmpdiv='_tmp_' + templatePrefix;

        $("body").append("<div id='"+tmpdiv + "'/>");
        $("#"+tmpdiv).load(url, function (resp, status, jqxhr) {
            if (jqxhr.status !== 200) {
                console.log("failed to precompile url '" + url + "' because: "+jqxhr.status+": " + jqxhr.statusText);
            } else {
                $("script[type='text/x-handlebars-template']").each(function (i, e) {
                    var template=$("#"+tmpdiv).find("#" + e.id).html();
                    hbsTemplates[templatePrefix][e.id] = Handlebars.compile(template);
                });
                $("body").remove("#"+tmpdiv);
            }
            if(--nrOfTemplates==0 && callback) {
                callback();
            }
        });


    });

}


function hbsModal(div,template,data) {
    if($(div).children().length>0) {
        $(div).children().remove();
    }
    $(div).append(template(data));
    $(div).modal('show');
   
}


Handlebars.registerHelper('ifeq', function (a, b, options) {
    if (a == b) { return options.fn(this); }
    return options.inverse(this);
});

Handlebars.registerHelper('ifnoteq', function (a, b, options) {
    if (a != b) { return options.fn(this); }
    return options.inverse(this);
});

Handlebars.registerHelper("inc", function(value, options)
{
    return parseInt(value) + 1;
});


Handlebars.registerHelper({
    eq: function(v1, v2) {console.log(v1,v2);return v1 === v2},
    ne: function(v1, v2) {return v1!== v2},
    lt: function(v1, v2) {return v1 < v2},
    gt: function(v1, v2) {return v1 > v2},
    lte: function(v1, v2) {return v1 <= v2},
    gte: function(v1, v2) {return v1 >= v2}
    
});