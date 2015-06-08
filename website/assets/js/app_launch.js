/** edit this file to reflect the address of the API on your server 
*/
$(document).ready(function () {
    var server = "http://localhost:8080/~matthew/evoaudioserve/website/api/index.php/";
    evo =Evosynthapp({
        "server_url": server,
        "client_url": client,
    });

    evo.load({component: "nav"});
});
