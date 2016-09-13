var httpsModule = require("https");
var fs = require('fs');
var url = require("url");
var querystring = require("querystring"); //post原始数据转JSON对象处理模块
var dbClient = require("./Mongo");  //数据库模块

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


//---------------------开始--https启动监听，路由分配函数--开始--------------------//
function start(route,handle){
	//https响应回调函数
	function onRequest(request,response)
	{
		var postData = "";
		var pathname = url.parse(request.url).pathname;
		console.log("Request for " + pathname + " started.");
		console.log("current time is "+ formatToDetailDate(Date.now()));

		request.setEncoding("utf8");
		request.addListener("data", function(postDataChunk)
		{
			postData += postDataChunk;
			//console.log("Received POST data chunk '"+ postDataChunk + "'.");
		});

		request.addListener("end", function() {
			if( request.method.toLowerCase() == 'post' )
			{
				route(handle, pathname, response, postData);
				var postJSON = querystring.parse(postData);
				var mongoClient = require('mongodb').MongoClient;
				var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
				var collectionName = "operateInfo";
				postJSON.apiName = pathname;
				postJSON.operateTime = formatToDetailDate(Date.now());
				postJSON.operateStamp = parseInt(Date.now()/1000);
				delete postJSON.accessToken;
				//插入请求数据
				dbClient.insertFunc( mongoClient, DB_CONN_STR, collectionName,  postJSON , function(result){});	

			}	
		});
		
	}

	var options = {
	     key: fs.readFileSync('/etc/nginx/server.key'),
	     cert: fs.readFileSync('/etc/nginx/server.crt')
	};

	var https = httpsModule.createServer(options, onRequest);

	https.listen(8000, function(err){  
        console.log("https listening on port: 8000");
	});
    console.log("server has started");

}
//---------------------结束--https启动监听，路由分配函数--结束--------------------//



//---------------------开始--模块导出接口声明--开始--------------------//
exports.start = start;
//---------------------结束--模块导出接口声明--结束--------------------//