module.exports = {

    app: {
        http:8080,
        https:8443
    },

    mail: {
        service: "gmail",
        user: "tipsy.nu@gmail.com",
        passwd: "xxxxxx",        
        port:25
    },

    matchInfo: {
        url:"https://api.spela.svenskaspel.se"
    },

    certs: {
        privateKey:"./resources/private.key",
        certificate:"./resources/certificate.crt",
        ca:"./resources/ca_bundle.crt"

    }


}