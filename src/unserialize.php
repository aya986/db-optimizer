<?php
require __DIR__ . '/../vendor/autoload.php';

use Predis;

// this method was changed to simple function
function UnserializingString($string)
{
  return  unserialize($string);
}


$client = new Predis\Client();

$id = $argv[1];
$value = $client->get($id);
if (!empty($value)) $client->del($id);
$client->disconnect();

if (empty(trim($value))) {
	echo json_encode([]);
} else {
	$value =  UnserializingString($value);
	echo json_encode($value);
}
