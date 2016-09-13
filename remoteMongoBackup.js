//执行脚本   mongo localhost:27017/csis  mongoShell.js
//localhost:27017/csis
//var cursor = db.getCollectionNames(); // 获取collection 名
//print(cursor);
//数据库名  备份目的地（备份文件名）  备份时间 
//192.168.1.155/csis
var dbClient = require("./Mongo");  //数据库模块
var mongoClient = require('mongodb').MongoClient;
var DB_CONN_STR = 'mongodb://192.168.1.155:27017/csis';	
var collectionName = "backupInfo";

//---------------------开始--时间戳转日期--开始--------------------//
function add0(m){return m<10?'0'+m:m }
function formatToDate(timeStamp)
{
	//shijianchuo是整数，否则要parseInt转换
	var time = new Date(timeStamp);
	var y = time.getFullYear();
	var m = time.getMonth()+1;
	var d = time.getDate();
	var h = time.getHours();
	var mm = time.getMinutes();
	var s = time.getSeconds();
	return y+'-'+add0(m)+'-'+add0(d);
}
function formatToDetailDate(timeStamp)
{
	//shijianchuo是整数，否则要parseInt转换
	var time = new Date(timeStamp);
	var y = time.getFullYear();
	var m = time.getMonth()+1;
	var d = time.getDate();
	var h = time.getHours();
	var mm = time.getMinutes();
	var s = time.getSeconds();
	return y+'-'+add0(m)+'-'+add0(d) +' '+add0(h)+':'+add0(mm)+':'+add0(s);
}
//---------------------结束--时间戳转日期--结束--------------------//



//第一步：node调用shell完成备份
var exec = require('child_process').exec; 

var cmdStr = 'mongodump  -h 192.168.1.155 -d csis -o /usr/local/mongoBackup';
exec(cmdStr);



//第二步：node将备份记录写入数据库
var insertStr = {dbName:"csis",backupDir:"/usr/local/mongoBackup",backupTime:"",backupTimeStamp:""};
var timeStamp = Date.now();
insertStr.backupTime = formatToDetailDate(timeStamp);
insertStr.backupTimeStamp = parseInt(timeStamp/1000);


cmdStr = 'ip addr | grep \"192.168.1.1..\" -o'
exec(cmdStr, function callback(error, stdout, stderr) {
	console.log(stdout);
	insertStr.backHostIP = stdout.substring(0,stdout.length-1);
	//插入数据
	dbClient.insertFunc( mongoClient, DB_CONN_STR, "backupInfo",  insertStr , function(result){});	
});



//第三步：预留数据恢复脚本
//mongorestore -h  192.168.1.162 -d  csis --dir  /usr/local/mongoBackup/csis

