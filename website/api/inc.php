<?php 
$my_user = "root";
$my_pass = "root";
$my_host = "localhost";
$my_db = "evosynth";
Class Database {
    
    public static function getLink(){
        global $my_user, $my_pass, $my_host, $my_db;
        //    //echo ("database.php: connecting on ".$my_host);
        $link = mysqli_connect($my_host, $my_user, $my_pass);
        //$link = mysqli_connect("localhost", $my_user, $my_pass);
        if (!$link) {
            die('Could not connect: ' .mysqli_connect_error());
        }
        else {
            return $link;
        }
    }

    public static function sanitise($str){
        $str = mysqli_real_escape_string(Database::getLink(), $str);
        return $str;
    }

    public static function queryToArray($sql){
        global $my_user, $my_pass, $my_host, $my_db, $config_enable_cache;
        $link = Database::getLink();
        $db_selected = mysqli_select_db($link, $my_db);
        if (!$db_selected) {
            die ('Can\'t use '.$my_db.' : ' . mysqli_error($link));
        }
        // Perform Query
        $result = mysqli_query($link, $sql);
        $id = mysqli_insert_id($link);
        if ($id > 0){// we did an insert, just return the id
            return $id;
        }
        //echo ("\ndatabase qtoa before proc id is $id");
        if (!$result) {
            $message  = 'Invalid query: ' . mysqli_error($link) . "\n";
            $message .= 'Whole query: ' . $sql;
            die($message);
        }
        if ($result === true){
            // probably an insert..
            return false;
        }
        $rows = array();
        while ($row = mysqli_fetch_assoc($result)) {
            $rows[] = $row;
        }
        return $rows;
    }
}

class SynthesizerHelper {
    public static function removeBadSynths($synths){
        $good_synths = array();
        if (is_array($synths)){
            for ($i=0;$i<sizeof($synths);$i++){
                // check the level ...
                $genome = $synths[$i]["genome"];
                $genome_obj = json_decode(str_replace("\\\"", "", $genome));
                //echo ($genome_obj->dna[0]);
                if (is_object($genome_obj) && is_array($genome_obj->dna) && 
                    sizeof($genome_obj->dna) > 0){
                    //echo ("\n<br/>dna length "+sizeof($genome_obj->dna));
                    //if (isset($genome_obj, "dna")){
                    $synths[$i]["genome"] = $genome_obj;
                    $good_synths[] = $synths[$i];
                }
            }
        }
        return $good_synths;
    }

}
?>
