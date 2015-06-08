<?php
require 'Slim/Slim.php';
require 'inc.php';
\Slim\Slim::registerAutoloader();

$app = new \Slim\Slim();

$app->post('/synthesizers', function () use ($app){
        $resp = array();
        $req = $app->request();
        $nickname = Database::sanitise($req->post('nickname'));
        $email_address = Database::sanitise($req->post('email'));
        $sound_name = Database::sanitise($req->post('name'));
        $sound_tag = Database::sanitise($req->post('tag'));
        $genome = Database::sanitise($req->post('genome'));
        $sql = "INSERT INTO synthesizers (nickname, email_address, name, tag, genome)";
        $sql .= " VALUES ('$nickname', '$email_address', '$sound_name', '$sound_tag', '$genome')";
        $id = Database::queryToArray($sql);
        // now sanitise the post data
        //$resp["message"] = "synthesizer saved.";
        $resp["id"] = $id;
        $resp["message"] = $genome;
        echo json_encode(str_replace("\\\"", "", $resp));
    });


$app->get("/synthesizers", function() use ($app){
        $resp = array();
        $req = $app->request();
        $email_address = Database::sanitise($req->get('email_address'));
        //$sql = "SELECT nickname, name, genome FROM synthesizers WHERE email_address!='$email_address'";
        $sql = "SELECT id, nickname, name, genome FROM synthesizers ";
        $sql .= " ORDER BY ID DESC LIMIT 5";
        //$sql .= "ORDER BY datetime";
        $synths = Database::queryToArray($sql);
        $synths = SynthesizerHelper::removeBadsynths($synths);
        echo json_encode($synths);
    });


$app->get("/saved_synthesizers", function() use ($app){
        $resp = array();
        $req = $app->request();
        $email_address = Database::sanitise($req->get('email_address'));
        //$sql = "SELECT nickname, name, genome FROM synthesizers WHERE email_address!='$email_address'";
        $sql = "SELECT id, nickname, name, genome FROM synthesizers ";
        //$sql .= " ORDER BY ID DESC LIMIT 5";
        $sql .= "ORDER BY datetime";
        $synths = Database::queryToArray($sql);
        $synths = SynthesizerHelper::removeBadsynths($synths);
        echo json_encode($synths);
    });

$app->get("/breed_history", function() use ($app){
        $resp = array();
        $req = $app->request();
        $email_address = Database::sanitise($req->get('email_address'));
        //$sql = "SELECT nickname, name, genome FROM synthesizers WHERE email_address!='$email_address'";
        $sql = "SELECT id, nickname, name, genome FROM synthesizers ";
        //$sql .= " ORDER BY ID DESC LIMIT 5";
        $sql .= "ORDER BY datetime";
        $synths = Database::queryToArray($sql);
        $synths = SynthesizerHelper::removeBadsynths($synths);
        echo json_encode($synths);
    });


$app->post('/logs', function () use ($app){
        $resp = array();
        $req = $app->request();
        $nickname = Database::sanitise($req->post('nickname'));
        $ip = "";
        $ip = $_SERVER['REMOTE_ADDR']?:($_SERVER['HTTP_X_FORWARDED_FOR']?:$_SERVER['HTTP_CLIENT_IP']);
        //    $ip = Database::sanitise($req->post('email'));
        $breeders = Database::sanitise($req->post('breeders'));
        $sql = "INSERT INTO logs (nickname, ip, breeders)";
        $sql .= " VALUES ('$nickname', '$ip', '$breeders')";
        $id = Database::queryToArray($sql);
        // now sanitise the post data
        //$resp["message"] = "synthesizer saved.";
        $resp["id"] = $id;
        echo json_encode(str_replace("\\\"", "", $resp));
    });

/** get a list of logged sessions (basically select from logs table, group by ip). It does not print out the IP addresses */
$app->get("/sessions", function() use ($app){
        $resp = array();
        $req = $app->request();
        $sql = "SELECT id, datetime, count(*) as breeds FROM logs GROUP BY ip ";
        $sql .= "ORDER BY datetime ASC";
        $sessions = Database::queryToArray($sql);
        echo json_encode($sessions);
    });

/** get the complete logged breeding session which contains the sent id
 *  do it like this to avoid revealing IP addresses for privacy innit 
 */
$app->get("/sessions/:id", function($id) use ($app){
        $resp = array();
        $req = $app->request();
        // first retrieve the required session so we can 
        // find the ip address
        $id = Database::sanitise($id);
        $sql = "SELECT id, ip FROM Logs where id='$id'";
        $sessions = Database::queryToArray($sql);
        if (sizeof($sessions) == 0){// invalid id
            $resp["error"] = "invalid id";
            echo json_encode($resp);
        }
        else {// valid id
            $session = $sessions[0];
            $ip = $session["ip"];
            // get the rest of the logs for this session
            $sql = "SELECT id, datetime, breeders from Logs where ip='$ip' ORDER BY  datetime ASC";
            $sessions = Database::queryToArray($sql);
            $new_sess = array();
            foreach ($sessions as $session){
                // an array of synths
                $synths = json_decode($session["breeders"]);
                //print_r($synths);
                //$synths = SynthesizerHelper::removeBadsynths($synths);
                $new_sess[] = array("breeders"=>$synths);
            }
            echo json_encode($new_sess);
        }
    });

$app->run();
