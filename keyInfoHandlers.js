var querystring = require("querystring"); //post原始数据转JSON对象处理模块
var dbClient = require("./Mongo");  //数据库模块

//---------------------开始--判断updateStr是否为空，为空不要更新数据--开始--------------------//
function isOwnEmpty(obj)
{
    for(var name
in obj)
    {
        if(obj.hasOwnProperty(name))
        {
            return false;
        }
    }
    return true;
};
//---------------------开始--判断updateStr是否为空，为空不要更新数据--开始--------------------//


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

//封装JSON字段不确定参数判断函数---待完成
function judgeKeyID(postJSON,response)
{
	if( !postJSON.hasOwnProperty("keyID") )
	{
		var info = 	{ "success":  
		{  
			"msg": "请输入电子钥匙ID!",  
			"code":"00003"  
		}  };
		response.write( JSON.stringify(info) );
		response.end();
		return false;
	}
	return true;
}

//---------------------开始--验证动态令牌--开始--------------------//
function judgeUserToken(postJSON,response)
{
	if( !postJSON.hasOwnProperty('operatorName') || !postJSON.hasOwnProperty('accessToken') )
	{
			var info = 	{ "error":  
				{  
					"msg": "请输入用户名和动态令牌",  
					"code":"00001"  
				}  };
			response.write( JSON.stringify(info) );
			response.end();
			return false;
	}
	return true;
}
//---------------------开始--验证动态令牌--开始--------------------//

//---------------------开始--验证动态令牌有效期--开始--------------------//
function judgeTokenTime(endTime,response)
{
	var nowTime = parseInt(Date.now()/1000);
	if( nowTime>endTime )
	{
		var info = 	{ "error":  
		{  
			"msg": "动态令牌已过期，请重新登陆",  
			"code":"00006"  
		}  };
		response.write( JSON.stringify(info) );
		response.end();
		return false;
	}
	return true;
}
//---------------------开始--验证动态令牌有效期--开始--------------------//

//---------------------开始--电子钥匙添加函数--开始--------------------//
function addKey(response, postData)
{
	try
	{
		console.log( "Request handler 'addKey' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "keyInfo";
		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
	    if( judgeKeyID(postJSON,response)==false ){  return;  };
		console.log(postJSON);
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		console.log(whereStr);
		//验证用户名和动态令牌
		dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
				//console.log(result);
				if(result.length>0)
				{
					//动态令牌有效性判断
					if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };

					if( result[0].hasOwnProperty('addKeyAction') == false || result[0].addKeyAction != "true" )
					{	
						var info = 	{ "error":  
							{  
								"msg": "你没有添加电子钥匙的权限!",  
								"code":"00010"  
							}  };
						response.write( JSON.stringify(info) );
						response.end();
						return;
					}		
								
					delete postJSON.accessToken;
					delete postJSON.operatorName;
					//插入请求数据
					dbClient.insertFunc( mongoClient, DB_CONN_STR, collectionName,  postJSON , function(result){
							if( result.hasOwnProperty("errmsg") )
							{
								var info = 	{ "error":  
									{  
										"msg": "电子钥匙ID已存在!",  
										"code":"12001"  
									}  };
								response.write( JSON.stringify(info) );
								response.end();
							}else{
								var info = 	{ "success":  
								{  
									"msg": "电子钥匙添加成功!",  
									"code":"12000"  
								}  };
								response.write( JSON.stringify(info) );
								response.end();
							}
					
					});	
				}else{
					var info = 	{ "error":  
						{  
							"msg": "用户名不存在或动态令牌已过期",  
							"code":"00000"  
						}  };
					response.write( JSON.stringify(info) );
					response.end();
					return;
				}	
		});
	}catch(e)
	{
			var info = 	{ "error":  
			{  
				"msg": "请检查参数是否错误，或者联系服务器管理员",  
				"code":"00001"  
			}  };
			response.write( JSON.stringify(info) );
			response.end();
	}

}
//---------------------结束--电子钥匙添加函数--结束--------------------//




//---------------------开始--电子钥匙删除函数--开始--------------------//
function deleteKey(response, postData)
{
	try
	{
		console.log( "Request handler 'deleteKey' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "keyInfo";

		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
	    if( !postJSON.hasOwnProperty("deleteList") )
	    {
			var info = 	{ "error":  
			{  
				"msg": "请输入要删除的电子钥匙数组数据!",  
				"code":"13001"  
			}  };
			response.write( JSON.stringify(info) );
			response.end();
			return;
	    }

		//验证电子钥匙名和动态令牌
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
			//console.log(result);
			if(result.length>0)
			{
				//动态令牌有效性判断
				if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };

				if( result[0].hasOwnProperty('deleteKeyAction') == false || result[0].deleteKeyAction != "true" )
				{	
					var info = 	{ "error":  
						{  
							"msg": "你没有删除电子钥匙的权限!",  
							"code":"00011"  
						}  };
					response.write( JSON.stringify(info) );
					response.end();
					return;
				}

				var keyStr = postJSON.deleteList.toString();
				keyStr = keyStr.replace("[","");
				keyStr = keyStr.replace("]","");
				console.log(keyStr);

				var keyList = keyStr.split(",");

				for(var i=0;i<keyList.length;i++)
				{
					console.log(keyList[i]);
					console.log("删除的电子钥匙： "+keyList[i]);
					var whereStr = {keyID:keyList[i].toString()};
					dbClient.deleteFunc( mongoClient, DB_CONN_STR, collectionName,  whereStr , function(result){
						console.log("删除信息"+result);
					});	
				}
				var info = 	{ "success":  
				{  
					"msg": "电子钥匙删除成功!",  
					"code":"13000"  
				}  };
				response.write( JSON.stringify(info) );
				response.end();
			}else{
					var info = 	{ "error":  
					{  
						"msg": "用户名不存在或动态令牌已过期!",  
						"code":"00000"  
					}  };
					response.write( JSON.stringify(info) );
					response.end();	
			}
		});
	}catch(e)
	{
			var info = 	{ "error":  
			{  
				"msg": "请检查参数是否错误，或者联系服务器管理员",  
				"code":"00001"  
			}  };
			response.write( JSON.stringify(info) );
			response.end();	
	}

}
//---------------------结束--电子钥匙删除函数--结束--------------------//



//---------------------开始--电子钥匙更新函数--开始--------------------//
function updateKey(response, postData)
{
	try
	{
		console.log( "Request handler 'updateKey' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "keyInfo";

		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
	    //if( judgeKeyID(postJSON,response)==false ){  return;  };
		//验证电子钥匙名和动态令牌
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
			//console.log(result);

			if(result.length>0)
			{
				//动态令牌有效性判断
				if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };

				if( result[0].hasOwnProperty('updateKeyAction') == false || result[0].updateKeyAction != "true" )
				{	
					var info = 	{ "error":  
						{  
							"msg": "你没有修改电子钥匙的权限!",  
							"code":"00013"  
						}  };
					response.write( JSON.stringify(info) );
					response.end();
					return;
				}
				//originalName
				var whereStr = {keyID:postJSON.originalKeyID};
				delete postJSON.accessToken;
				delete postJSON.operatorName;
				delete postJSON.originalKeyID;

				// isOwnEmpty(postJSON)
				// {
				// 	var info = 	{ "error":  
				// 		{  
				// 			"msg": "你没有指定修改任何属性!",  
				// 			"code":"00014"  
				// 		}  };
				// 	response.write( JSON.stringify(info) );
				// 	response.end();
				// 	return;					
				// }
				var updateStr = {$set: postJSON };
				dbClient.updateFunc( mongoClient, DB_CONN_STR, collectionName, whereStr, updateStr,function(result){
					if( result.hasOwnProperty("errmsg") )
					{
						var info = 	{ "error":  
							{  
								"msg": "电子钥匙ID已存在!",  
								"code":"14001"  
							}  };
						response.write( JSON.stringify(info) );
						response.end();
					}else{
						var info = 	{ "success":  
						{  
							"msg": "电子钥匙信息编辑成功!",  
							"code":"14000"  
						}  };
						response.write( JSON.stringify(info) );
						response.end();
					}
				});	
			}else{
					var info = 	{ "error":  
					{  
						"msg": "用户名不存在或动态令牌已过期!",  
						"code":"00000"  
					}  };
					response.write( JSON.stringify(info) );
					response.end();	
			}
		});
	}catch(e)
	{
			var info = 	{ "error":  
			{  
				"msg": "请检查参数是否错误，或者联系服务器管理员",  
				"code":"00001"  
			}  };
			response.write( JSON.stringify(info) );
			response.end();	
	}

}
//---------------------结束--电子钥匙更新函数--结束--------------------//




//---------------------开始--电子钥匙查询函数--开始--------------------//
function selectKey(response, postData)
{
	try
	{
		console.log( "Request handler 'selectKey' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "keyInfo";
		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
		
		console.log(postJSON);
		//验证电子钥匙名和动态令牌
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		console.log(whereStr);

		dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
			//console.log(result);
			if(result.length>0)
			{
				//动态令牌有效性判断
				if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };

				if( result[0].hasOwnProperty('queryKeyAction') == false || result[0].queryKeyAction != "true" )
				{	
					var info = 	{ "error":  
						{  
							"msg": "你没有查询电子钥匙的权限!",  
							"code":"00012"  
						}  };
					response.write( JSON.stringify(info) );
					response.end();
					return;
				}

				delete postJSON.operatorName; 
				delete postJSON.accessToken; 
				console.log(postJSON);
				dbClient.selectFunc( mongoClient, DB_CONN_STR, collectionName,  postJSON , 
					function(result){
					if( result.length>0 )
					{
						var json = {success:result};

						response.write( JSON.stringify(json) );
						response.end();
					}else{
						var info = 	{ "error":  
						{  
							"msg": "没有查询记录!",  
							"code":"15001"  
						}  };
						response.write( JSON.stringify(info) );
						response.end();
					}
				
				});	
			}else{
				var info = 	{ "error":  
					{  
						"msg": "用户名不存在或动态令牌已过期",  
						"code":"00000"  
					}  };
				response.write( JSON.stringify(info) );
				response.end();
				return;
			}
		});

	}catch(e)
	{
			var info = 	{ "error":  
			{  
				"msg": "请检查参数是否错误，或者联系服务器管理员",  
				"code":"00001"  
			}  };
			response.write( JSON.stringify(info) );
			response.end();	
	}

}
//---------------------结束--电子钥匙查询函数--结束--------------------//



//---------------------开始--downloadKey函数--开始--------------------//
function downloadKey(response, postData)
{
	try
	{
		console.log( "Request handler 'downloadUser' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "userInfo";
		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
		//var fileName = postJSON.operatorName + "电子钥匙信息";
		console.log(postJSON);
		//验证用户名和动态令牌
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		console.log(whereStr);
		dbClient.selectFunc( mongoClient, DB_CONN_STR, collectionName,  whereStr , function(result){
			//console.log(result);
			if(result.length>0)
			{
				//动态令牌有效性判断
				if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };
				if( result[0].hasOwnProperty('queryKeyAction') == false || result[0].queryKeyAction != "true" )
				{	
					var info = 	{ "error":  
						{  
							"msg": "你没有查询电子钥匙的权限!",  
							"code":"00012"  
						}  };
					response.write( JSON.stringify(info) );
					response.end();
					return;
				}
				 

				var fileName = postJSON.operatorName + "电子钥匙信息";
				delete postJSON.operatorName; 
				delete postJSON.accessToken; 
				dbClient.selectFunc( mongoClient, DB_CONN_STR, "keyInfo",  postJSON , 
					function(result){
					//console.log(result);
					if( result.length>0 )
					{
							var fs = require('fs');
							var nodeExcel = require('excel-export');
							var conf ={};
							conf.name = "mysheet";

							conf.cols = [       
							        {
							            caption:'电子钥匙ID',
							            type:'string',
							        },
							        {
							            caption:'有效省级地域',
							            type:'string',
							        },
							        {
							            caption:'有效市级地域',
							            type:'string'
							        },
							        {
							            caption:'有效区级地域',
							             type:'string'              
							        },							        
							        {
							            caption:'电子钥匙网格ID',
							            type:'string'
							        },
							];
							conf.rows = [];
							for(var i=0;i<result.length;i++)
							{
								conf.rows[i] = [result[i].keyID, result[i].managementProvince,
								result[i].managementCity, result[i].managementArea, result[i].gridID ];
							}

							var result = nodeExcel.execute(conf);
							console.log('export successfully!');
							fs.writeFileSync('/usr/share/nginx/MBS_WebSourceCode/'+fileName+'.xlsx', result, 'binary');
							var info = 	{ "success":  
							{  
								"url": 'https://www.smartlock.top/'+fileName+'.xlsx',  
								"code":"16000"  
							}  };
							response.write( JSON.stringify(info) );
							response.end();
					}else{
						var info = 	{ "error":  
						{  
							"msg": "没有数据记录!",  
							"code":"16001"  
						}  };
						response.write( JSON.stringify(info) );
						response.end();
					}
				
				});	
			}else{
				var info = 	{ "error":  
					{  
						"msg": "用户名不存在或动态令牌已过期",  
						"code":"00000"  
					}  };
				response.write( JSON.stringify(info) );
				response.end();
				return;
			}
		});
	}catch(e)
	{
			var info = 	{ "error":  
			{  
				"msg": "请检查参数是否错误，或者联系服务器管理员",  
				"code":"00001"  
			}  };
			response.write( JSON.stringify(info) );
			response.end();	
	}

}
//---------------------结束--downloadKey函数--结束--------------------//




//---------------------开始--电子钥匙日志查询函数--开始--------------------//
function queryKeyLog(response, postData)
{
	try
	{
		console.log( "Request handler 'queryKeyLog' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	

		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
		
		console.log(postJSON);

		//验证用户名和动态令牌
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		console.log(whereStr);
		dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
			//console.log(result);
			if(result.length>0)
			{
				//动态令牌有效性判断
				if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };
				if( result[0].hasOwnProperty('queryKeyAction') == false || result[0].queryKeyAction != "true" )
				{	
					var info = 	{ "error":  
						{  
							"msg": "你没有查询电子钥匙的权限!",  
							"code":"00012"  
						}  };
					response.write( JSON.stringify(info) );
					response.end();
					return;
				}

				delete postJSON.operatorName; 
				delete postJSON.accessToken; 
				var mstartTime = { "taskStartTime":{$gte:parseInt( postJSON.startTime) } };
				var mendTime = { "taskEndTime":{$lte:parseInt( postJSON.endTime) } };

				var whereStr  = {};

				if( postJSON.hasOwnProperty('startTime') )
				{
					whereStr.taskStartTime = mstartTime.taskStartTime;
					//delete postJSON.startTime; 
				}

				if( postJSON.hasOwnProperty('endTime') )
				{
					whereStr.taskEndTime = mstartTime.taskEndTime;
					//delete postJSON.endTime; 
				}

				if( postJSON.hasOwnProperty('keyID') )
				{
					whereStr.applicantKeyID = postJSON.keyID;   
				}


				if( postJSON.hasOwnProperty('keyManagementProvince') )
				{
					whereStr.keyManagementProvince = postJSON.keyManagementProvince;  
				}

				if( postJSON.hasOwnProperty('keyManagementCity') )
				{
					whereStr.keyManagementCity = postJSON.keyManagementCity;  
				}


				if( postJSON.hasOwnProperty('keyManagementArea') )
				{
					whereStr.keyManagementArea = postJSON.keyManagementArea;  
				}


				//{"taskStartTime":{$gte:parseInt(startTime)}}   {"taskEndTime":{$lte:parseInt(endTime) }}
				dbClient.selectFunc( mongoClient, DB_CONN_STR, "taskInfo",  whereStr , 
					function(result){
					if( result.length>0 )
					{
						var json = {success:result};
						response.write( JSON.stringify(json) );
						response.end();
					}else{
						var info = 	{ "error":  
						{  
							"msg": "没有查询记录!",  
							"code":"26001"  
						}  };
						response.write( JSON.stringify(info) );
						response.end();
					}
				
				});	
			}else{
				var info = 	{ "error":  
					{  
						"msg": "用户名不存在或动态令牌已过期",  
						"code":"00000"  
					}  };
				response.write( JSON.stringify(info) );
				response.end();
				return;
			}
		});
	}catch(e)
	{
			var info = 	{ "error":  
			{  
				"msg": "请检查参数是否错误，或者联系服务器管理员",  
				"code":"00001"  
			}  };
			response.write( JSON.stringify(info) );
			response.end();	
	}

}
//---------------------结束--电子钥匙日志查询函数--结束--------------------//




//---------------------开始--电子钥匙日志Excel表格下载接口--开始--------------------//
function downloadKeyLog(response, postData)
{
	try
	{
		console.log( "Request handler 'downloadKeyLog' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	

		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
		
		console.log(postJSON);

		//验证用户名和动态令牌
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		var fileName = postJSON.operatorName + "电子钥匙日志";

		console.log(whereStr);
		dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
			//console.log(result);
			if(result.length>0)
			{
				//动态令牌有效性判断
				if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };
				if( result[0].hasOwnProperty('queryKeyAction') == false || result[0].queryKeyAction != "true" )
				{	
					var info = 	{ "error":  
						{  
							"msg": "你没有查询电子钥匙的权限!",  
							"code":"00012"  
						}  };
					response.write( JSON.stringify(info) );
					response.end();
					return;
				}

				delete postJSON.operatorName; 
				delete postJSON.accessToken; 
				var mstartTime = { "taskStartTime":{$gte:parseInt( postJSON.startTime) } };
				var mendTime = { "taskEndTime":{$lte:parseInt( postJSON.endTime) } };

				var whereStr  = {};

				if( postJSON.hasOwnProperty('startTime') )
				{
					whereStr.taskStartTime = mstartTime.taskStartTime;
					//delete postJSON.startTime; 
				}

				if( postJSON.hasOwnProperty('endTime') )
				{
					whereStr.taskEndTime = mstartTime.taskEndTime;
					//delete postJSON.endTime; 
				}

				if( postJSON.hasOwnProperty('keyID') )
				{
					whereStr.applicantKeyID = postJSON.keyID;   
				}

				if( postJSON.hasOwnProperty('keyManagementProvince') )
				{
					whereStr.keyManagementProvince = postJSON.keyManagementProvince;  
				}

				if( postJSON.hasOwnProperty('keyManagementCity') )
				{
					whereStr.keyManagementCity = postJSON.keyManagementCity;  
				}


				if( postJSON.hasOwnProperty('keyManagementArea') )
				{
					whereStr.keyManagementArea = postJSON.keyManagementArea;  
				}


				//{"taskStartTime":{$gte:parseInt(startTime)}}   {"taskEndTime":{$lte:parseInt(endTime) }}
				dbClient.selectFunc( mongoClient, DB_CONN_STR, "taskInfo",  whereStr , 
					function(result){
					if( result.length>0 )
					{
							var fs = require('fs');
							var nodeExcel = require('excel-export');
							var conf ={};
							conf.name = "mysheet";

							conf.cols = [       
							        {
							            caption:'基站ID',
							            type:'string',
							        },
							        {
							            caption:'基站地址',
							            type:'string',
							        },
							        {
							            caption:'电子钥匙ID',
							            type:'string',
							        },
							        {
							            caption:'任务ID',
							            type:'string',
							        },
	 						        {
							            caption:'电子钥匙有效省级区域',
							            type:'string',
							        },
							        {
							            caption:'电子钥匙有效市级区域',
							            type:'string',
							        },
							        {
							            caption:'电子钥匙有效地级区域',
							            type:'string',
							        },
	 						        {
							            caption:'基站有效省级区域',
							            type:'string',
							        },
							        {
							            caption:'基站有效市级区域',
							            type:'string',
							        },
							        {
							            caption:'基站有效地级区域',
							            type:'string',
							        },
							        {
							            caption:'任务申请人',
							            type:'string'
							        },
							        {
							            caption:'申请人联系方式',
							            type:'string'
							        },
							        {
							            caption:'任务申请描述',
							             type:'string'              
							        },
							        {
							            caption:'任务起始时间',
							             type:'string'              
							        },
							        {
							            caption:'任务终止时间',
							             type:'string'              
							        }

							];
							conf.rows = [];


							for(var i=0;i<result.length;i++)
							{

								var startDate = new Date(result[i].taskStartTime * 1000); 
								var endDate = new Date(result[i].taskEndTime * 1000);

								var startDateTime = (startDate.getFullYear()) + "-" + (startDate.getMonth() + 1) + "-" +
								(startDate.getDate()) + "   " + 
								 (startDate.getHours()) + ":" + (startDate.getMinutes()) + ":" + (startDate.getSeconds());

								var endDateTime  = (endDate.getFullYear()) + "-" + (endDate.getMonth() + 1) + "-" +(endDate.getDate()) + "   " + (endDate.getHours()) + ":" + (endDate.getMinutes()) + ":" + (endDate.getSeconds());

								conf.rows[i] = [result[i].stationID, result[i].stationAddress,result[i].applicantKeyID, result[i].taskID,
								result[i].keyManagementProvince, result[i].keyManagementCity, result[i].keyManagementArea,
								result[i].stationManagementProvince, result[i].stationManagementCity, result[i].stationManagementArea,
								result[i].applicantName, result[i].applicantPhone, result[i].applyDescription,
								startDateTime
								, endDateTime ];
							}

							var result = nodeExcel.execute(conf);
							console.log('export Log successfully!');
							fs.writeFileSync('/usr/share/nginx/MBS_WebSourceCode/'+fileName+'电子钥匙日志.xlsx', result, 'binary');
							var info = 	{ "success":  
							{  
								"url": 'https://www.smartlock.top/'+fileName+'电子钥匙日志.xlsx',  
								"code":"27000"  
							}  };
							response.write( JSON.stringify(info) );
							response.end();
					}else{
						var info = 	{ "error":  
						{  
							"msg": "没有查询记录!",  
							"code":"27001"  
						}  };
						response.write( JSON.stringify(info) );
						response.end();
					}
				
				});	
			}else{
				var info = 	{ "error":  
					{  
						"msg": "用户名不存在或动态令牌已过期",  
						"code":"00000"  
					}  };
				response.write( JSON.stringify(info) );
				response.end();
				return;
			}
		});
	}catch(e)
	{
			var info = 	{ "error":  
			{  
				"msg": "请检查参数是否错误，或者联系服务器管理员",  
				"code":"00001"  
			}  };
			response.write( JSON.stringify(info) );
			response.end();	
	}


}
//---------------------结束--电子钥匙日志Excel表格下载接口--结束--------------------//


//---------------------开始--查询所有数据表函数--开始--------------------//
function selectAll(response, postData)
{
	try
	{
		console.log( "Request handler 'selectAll' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';
		var collectionName;	
		var objectid = require('objectid')
		//指定数据表的名称
		if(!postJSON.hasOwnProperty("collectionName"))
		{
			collectionName = "userInfo";
		}else{
			collectionName = postJSON.collectionName;
		}

		try{
			if(postJSON.hasOwnProperty("_id"))
			{
				postJSON._id = objectid(postJSON._id);
			}	
		}catch(e)
		{

		}



		//一些数据类型必须统一起来，尤其是整型--按照stationID查询时，需要先转换为整型
		// if(postJSON.hasOwnProperty("stationID"))
		// {
		// 	postJSON.stationID = parseInt(postJSON.stationID);
		// }


		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
		
		console.log(postJSON);
		//验证电子钥匙名和动态令牌
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		console.log(whereStr);

		dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
			//console.log(result);
			if(result.length>0)
			{
				//动态令牌有效性判断
				if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };

				delete postJSON.operatorName; 
				delete postJSON.accessToken; 
				delete postJSON.collectionName;
				var lockNum = postJSON.lockNum;
				delete postJSON.lockNum;
				console.log(postJSON);
				if( postJSON.hasOwnProperty('approveStartTime') )
				{
					postJSON.approveTime = {$gte:parseInt( postJSON.approveStartTime) };
					delete postJSON.approveStartTime; 
				}

				if( postJSON.hasOwnProperty('approveEndTime') )
				{
					postJSON.approveTime = {$lte:parseInt( postJSON.approveEndTime) };
					delete postJSON.approveEndTime; 
				}

				if( postJSON.hasOwnProperty('approveStartTime') && postJSON.hasOwnProperty('approveEndTime') )
				{
					postJSON.approveTime = {$lte:parseInt( postJSON.approveEndTime),
					$gte:parseInt( postJSON.approveStartTime) };
					delete postJSON.approveStartTime; 
					delete postJSON.approveEndTime; 
				}

				if( postJSON.hasOwnProperty('applyStartTime') )
				{
					postJSON.applyTime = {$gte:parseInt( postJSON.applyStartTime) } ;
					delete postJSON.applyStartTime; 
				}

				if( postJSON.hasOwnProperty('applyEndTime') )
				{
					postJSON.applyTime = {$lte:parseInt( postJSON.applyEndTime) };
					delete postJSON.applyEndTime; 
				}

				if( postJSON.hasOwnProperty('applyEndTime') && postJSON.hasOwnProperty('applyStartTime') )
				{
					postJSON.applyTime = {$gte:parseInt( postJSON.applyStartTime) , $lte:parseInt( postJSON.applyEndTime) };
					delete postJSON.applyEndTime; 
					delete postJSON.applyStartTime; 
				}
				dbClient.selectFunc( mongoClient, DB_CONN_STR, collectionName,  postJSON , 
					function(result){
					if( result.length>0 )
					{
						if(result.length>100)
						{
							result = result.slice(0,100);
						}
						var json = {success:result};
						response.write( JSON.stringify(json) );
						response.end();
					}/*else if(collectionName == "lockInfo")
					{
						//没有锁具信息，则自动附加之,首先用户需要按lockID查询
						// if(postJSON.hasOwnProperty("lockID") == false)
						// {
						// 	var info = 	{ "error":  
						// 	{  
						// 		"msg": "没有查询记录!",  
						// 		"code":"15001"  
						// 	}  };
						// 	response.write( JSON.stringify(info) );
						// 	response.end();	
						// 	return;						
						// }
						// var insertData =  {lockID:postJSON.lockID,
						// 	"lockName" : postJSON.address+"锁具"+lockNum, "lockState" : "正常", "lockCompany" : "A公司", 
						// 	"stationID" : postJSON.stationID, "address" : ''+postJSON.address, 
						// 	"managementProvince" : postJSON.managementProvince,
						// 	"managementCity" : postJSON.managementCity,"lockOriginID":"未知",
						// 	"managementArea" : postJSON.managementArea, "LAT" : postJSON.LAT, 
						// 	 "LON" : postJSON.LON, "HEI" : postJSON.HEI, "keyLockID" : "500000002440", 
						// 	 "bKey" : "0123456789ABCDEFEFCDAB8967452301", "nKey" : "70509E1C1A124577", 
						// 	 "personID" : "12345678", "approveCode" : "4201736374740106"};
						// var json = {success:insertData};
						// response.write( JSON.stringify(json) );
						// response.end();
						// dbClient.insertFunc( mongoClient, DB_CONN_STR, collectionName,  insertData,function(result){});
					}*/else{
						var info = 	{ "error":  
						{  
							"msg": "没有查询记录,如果你是从基站获取的锁具ID，建议你从前端先录入该锁具信息!",  
							"code":"15001"  
						}  };
						response.write( JSON.stringify(info) );
						response.end();
					}
				});	
			}else{
				var info = 	{ "error":  
					{  
						"msg": "用户名不存在或动态令牌已过期",  
						"code":"00000"  
					}  };
				response.write( JSON.stringify(info) );
				response.end();
				return;
			}
		});

	}catch(e)
	{
			var info = 	{ "error":  
			{  
				"msg": "请检查参数是否错误，或者联系服务器管理员",  
				"code":"00001"  
			}  };
			response.write( JSON.stringify(info) );
			response.end();	
	}

}
//---------------------结束--查询所有数据表函数--结束--------------------//




//---------------------开始--添加所有数据的函数--开始--------------------//
function addAll(response, postData)
{
	try
	{
		console.log( "Request handler 'addAll' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		//指定数据表的名称
		if(!postJSON.hasOwnProperty("collectionName"))
		{
			collectionName = "userInfo";
		}else{
			collectionName = postJSON.collectionName;
		}

		//一些数据类型必须统一起来，尤其是整型
		// if(postJSON.hasOwnProperty("stationID"))
		// {
		// 	postJSON.stationID = parseInt(postJSON.stationID);
		// }

		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };

		console.log(postJSON);
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};

		console.log(whereStr);
		//验证用户名和动态令牌
		dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
				//console.log(result);
				if(result.length>0)
				{
					//动态令牌有效性判断
					if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };
	
								
					delete postJSON.accessToken;
					delete postJSON.operatorName;
					delete postJSON.collectionName;
					//插入请求数据
					dbClient.insertFunc( mongoClient, DB_CONN_STR, collectionName,  postJSON , function(result){
							if( result.hasOwnProperty("errmsg") )
							{
								var info = 	{ "error":  
									{  
										"msg": "信息已存在!",  
										"code":"44001"  
									}  };
								response.write( JSON.stringify(info) );
								response.end();
							}else{
								var info = 	{ "success":  
								{  
									"msg": "信息添加成功!",  
									"code":"44000"  
								}  };
								response.write( JSON.stringify(info) );
								response.end();
							}
					
					});	
				}else{
					var info = 	{ "error":  
						{  
							"msg": "用户名不存在或动态令牌已过期",  
							"code":"00000"  
						}  };
					response.write( JSON.stringify(info) );
					response.end();
					return;
				}	
		});
	}catch(e)
	{
			var info = 	{ "error":  
			{  
				"msg": "请检查参数是否错误，或者联系服务器管理员",  
				"code":"00001"  
			}  };
			response.write( JSON.stringify(info) );
			response.end();
	}

}
//---------------------结束--添加所有数据的函数--结束--------------------//




//---------------------开始--删除所有数据的函数--开始--------------------//
function deleteAll(response, postData)
{
	try
	{
		console.log( "Request handler 'deleteAll' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		//指定数据表的名称
		if(!postJSON.hasOwnProperty("collectionName"))
		{
			collectionName = "userInfo";
		}else{
			collectionName = postJSON.collectionName;
		}
		var objectid = require('objectid')
		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
	    if( !postJSON.hasOwnProperty("delIdList") )
	    {
			var info = 	{ "error":  
			{  
				"msg": "请输入要删除的ID数组数据!",  
				"code":"45001"  
			}  };
			response.write( JSON.stringify(info) );
			response.end();
			return;
	    }

		//验证电子钥匙名和动态令牌
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
			//console.log(result);
			if(result.length>0)
			{
				//动态令牌有效性判断
				if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };

				if(postJSON.delAll == "yes")
				{
					dbClient.deleteFunc( mongoClient, DB_CONN_STR, collectionName,  {} , function(result){
							console.log("删除信息"+result);
						});	
					var info = 	{ "success":  
					{  
						"msg": "表单已经清空!",  
						"code":"45000"  
					}  };
					response.write( JSON.stringify(info) );
					response.end();
					return;
				}
				var keyStr = postJSON.delIdList.toString();
				keyStr = keyStr.replace("[","");
				keyStr = keyStr.replace("]","");
				console.log(keyStr);

				var keyList = keyStr.split(",");

				for(var i=0;i<keyList.length;i++)
				{
					console.log(keyList[i]);
					console.log("删除的id： "+keyList[i]);
					var isError = false;
					//删除数据时转换为objectid类型
					try{
						var whereStr = {_id:objectid(keyList[i].toString())};
						dbClient.deleteFunc( mongoClient, DB_CONN_STR, collectionName,  whereStr , function(result){
							console.log("删除信息"+result);
						});	
					}catch(e){
						var info = 	{ "error":  
						{  
							"msg": "传入非法ID!",  
							"code":"45002"  
						}  };
						response.write( JSON.stringify(info) );
						response.end();	
						isError = true;		
						return;			
					}
					if(isError==true)
					{
						return;
					}

				}
				var info = 	{ "success":  
				{  
					"msg": "信息删除成功!",  
					"code":"45000"  
				}  };
				response.write( JSON.stringify(info) );
				response.end();
			}else{
					var info = 	{ "error":  
					{  
						"msg": "用户名不存在或动态令牌已过期!",  
						"code":"00000"  
					}  };
					response.write( JSON.stringify(info) );
					response.end();	
			}
		});
	}catch(e)
	{
			var info = 	{ "error":  
			{  
				"msg": "请检查参数是否错误，或者联系服务器管理员",  
				"code":"00001"  
			}  };
			response.write( JSON.stringify(info) );
			response.end();	
	}

}
//---------------------结束--删除所有数据的函数--结束--------------------//



//---------------------开始--修改所有数据的函数--开始--------------------//
function updateAll(response, postData)
{
	try
	{
		console.log( "Request handler 'updateAll' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		//指定数据表的名称
		if(!postJSON.hasOwnProperty("collectionName"))
		{
			collectionName = "userInfo";
		}else{
			collectionName = postJSON.collectionName;
		}
		var objectid = require('objectid')
		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
	    //if( judgeKeyID(postJSON,response)==false ){  return;  };
		//验证电子钥匙名和动态令牌
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
			//console.log(result);

			if(result.length>0)
			{
				//动态令牌有效性判断
				if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };

				//originalName--首先转换为objectID
				try{
					var whereStr = {_id:objectid(postJSON.originalID)};
					delete postJSON.accessToken;
					delete postJSON.operatorName;
					delete postJSON.originalID;
					delete postJSON.collectionName;

					// isOwnEmpty(postJSON)
					// {
					// 	var info = 	{ "error":  
					// 		{  
					// 			"msg": "你没有指定修改任何属性!",  
					// 			"code":"00014"  
					// 		}  };
					// 	response.write( JSON.stringify(info) );
					// 	response.end();
					// 	return;					
					// }
					if(postJSON.hasOwnProperty("applyTime"))
					{
						postJSON.applyTime =  parseInt(postJSON.applyTime);
					}
					if(postJSON.hasOwnProperty("approveTime"))
					{
						postJSON.approveTime =  parseInt(postJSON.approveTime);
					}
					var updateStr = {$set: postJSON };
					dbClient.updateFunc( mongoClient, DB_CONN_STR, collectionName, whereStr, updateStr,function(result){
						if( result.hasOwnProperty("errmsg") )
						{
							var info = 	{ "error":  
								{  
									"msg": "信息重复!",  
									"code":"46001"  
								}  };
							response.write( JSON.stringify(info) );
							response.end();
						}else{
							var info = 	{ "success":  
							{  
								"msg": "信息编辑成功!",  
								"code":"46000"  
							}  };
							response.write( JSON.stringify(info) );
							response.end();
						}
					});	
				}catch(e)
				{
					var info = 	{ "error":  
					{  
						"msg": "传入非法ID!",  
						"code":"46002"  
					}  };
					response.write( JSON.stringify(info) );
					response.end();	
					return;
				}
			}else{
					var info = 	{ "error":  
					{  
						"msg": "用户名不存在或动态令牌已过期!",  
						"code":"00000"  
					}  };
					response.write( JSON.stringify(info) );
					response.end();	
			}
		});
	}catch(e)
	{
			var info = 	{ "error":  
			{  
				"msg": "请检查参数是否错误，或者联系服务器管理员",  
				"code":"00001"  
			}  };
			response.write( JSON.stringify(info) );
			response.end();	
	}

}
//---------------------结束--修改所有数据的函数--结束--------------------//


//---------------------开始--查询所有数据表函数--开始--------------------//
function selectAllSpecial(response, postData)
{
	try
	{
		console.log( "Request handler 'selectAllSpecial' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';
		var collectionName = "gridInfo";	
		if(postJSON.hasOwnProperty("collectionName"))
		{
			collectionName = postJSON.collectionName;
		}
		whereStr = {};
		dbClient.selectFunc( mongoClient, DB_CONN_STR, collectionName,  whereStr , function(result){
			//console.log(result);
			if(result.length>0)
			{
				var json = {data:result};
				response.write( JSON.stringify(json) );
				response.end();
			}else{
				var info = 	{ "error":  
					{  
						"msg": "No query Result",  
						"code":"15001"  
					}  };
				response.write( JSON.stringify(info) );
				response.end();
				return;
			}
		});

	}catch(e)
	{
			var info = 	{ "error":  
			{  
				"msg": "请检查参数是否错误，或者联系服务器管理员",  
				"code":"00001"  
			}  };
			response.write( JSON.stringify(info) );
			response.end();	
	}

}
//---------------------结束--查询所有数据表函数--结束--------------------//


//---------------------开始--模块导出接口声明--开始--------------------//
exports.addKey = addKey;
exports.selectAll = selectAll;
exports.updateKey = updateKey;
exports.deleteKey = deleteKey;
exports.selectKey = selectKey;
exports.downloadKey = downloadKey;
exports.queryKeyLog = queryKeyLog;
exports.downloadKeyLog = downloadKeyLog;
exports.updateAll = updateAll;
exports.addAll = addAll;
exports.deleteAll = deleteAll;
exports.selectAllSpecial = selectAllSpecial;
//---------------------结束--模块导出接口声明--结束--------------------//
