var querystring = require("querystring"); //post原始数据转JSON对象处理模块
var dbClient = require("./Mongo");  //数据库模块


//---------------------开始--判断updateStr是否为空，为空不要更新数据--开始--------------------//
function isOwnEmpty(obj)
{
    for(var name in obj)
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
function judgeLockID(postJSON,response)
{
	if( !postJSON.hasOwnProperty("lockID") )
	{
		var info = 	{ "success":  
		{  
			"msg": "请输入锁具ID!",  
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

//---------------------开始--锁具添加函数--开始--------------------//
function addLock(response, postData)
{
	try
	{
		console.log( "Request handler 'addLock' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "lockInfo";
		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
	    if( judgeLockID(postJSON,response)==false ){  return;  };
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

					if( result[0].hasOwnProperty('addLockAction') == false || result[0].addLockAction != "true" )
					{	
						var info = 	{ "error":  
							{  
								"msg": "你没有添加锁具的权限!",  
								"code":"00010"  
							}  };
						response.write( JSON.stringify(info) );
						response.end();
						return;
					}		
								
					delete postJSON.accessToken;
					delete postJSON.operatorName;
					if(!postJSON.hasOwnProperty("approveCode"))
					{
						postJSON.approveCode = "4201736374740106";
					}
					//插入请求数据
					dbClient.insertFunc( mongoClient, DB_CONN_STR, collectionName,  postJSON , function(result){
							if( result.hasOwnProperty("errmsg") )
							{
								var info = 	{ "error":  
									{  
										"msg": "锁具ID已存在!",  
										"code":"12001"  
									}  };
								response.write( JSON.stringify(info) );
								response.end();
							}else{
								var info = 	{ "success":  
								{  
									"msg": "锁具添加成功!",  
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
//---------------------结束--锁具添加函数--结束--------------------//




//---------------------开始--锁具删除函数--开始--------------------//
function deleteLock(response, postData)
{
	try
	{
		console.log( "Request handler 'deleteLock' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "lockInfo";

		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
	    if( !postJSON.hasOwnProperty("deleteList") )
	    {
			var info = 	{ "error":  
			{  
				"msg": "请输入要删除的锁具数组数据!",  
				"code":"13001"  
			}  };
			response.write( JSON.stringify(info) );
			response.end();
			return;
	    }

		//验证锁具名和动态令牌
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
			//console.log(result);
			if(result.length>0)
			{
				//动态令牌有效性判断
				if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };

				if( result[0].hasOwnProperty('deleteLockAction') == false || result[0].deleteLockAction != "true" )
				{	
					var info = 	{ "error":  
						{  
							"msg": "你没有删除锁具的权限!",  
							"code":"00011"  
						}  };
					response.write( JSON.stringify(info) );
					response.end();
					return;
				}

				var lockStr = postJSON.deleteList.toString();
				lockStr = lockStr.replace("[","");
				lockStr = lockStr.replace("]","");
				console.log(lockStr);

				var lockList = lockStr.split(",");

				for(var i=0;i<lockList.length;i++)
				{
					console.log(lockList[i]);
					console.log("删除的锁具： "+lockList[i]);
					var whereStr = {lockID:lockList[i].toString()};
					dbClient.deleteFunc( mongoClient, DB_CONN_STR, collectionName,  whereStr , function(result){
						console.log("删除信息"+result);
					});	
				}
				var info = 	{ "success":  
				{  
					"msg": "锁具删除成功!",  
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
//---------------------结束--锁具删除函数--结束--------------------//



//---------------------开始--锁具更新函数--开始--------------------//
function updateLock(response, postData)
{
	try
	{
		console.log( "Request handler 'updateLock' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "lockInfo";

		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
	    //if( judgeLockID(postJSON,response)==false ){  return;  };
		//验证锁具名和动态令牌
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
			//console.log(result);

			if(result.length>0)
			{
				//动态令牌有效性判断
				if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };

				// if( result[0].hasOwnProperty('updateLockAction') == false || result[0].updateLockAction != "true" )
				// {	
				// 	var info = 	{ "error":  
				// 		{  
				// 			"msg": "你没有修改锁具的权限!",  
				// 			"code":"00013"  
				// 		}  };
				// 	response.write( JSON.stringify(info) );
				// 	response.end();
				// 	return;
				// }
				//originalName
				whereStr = {lockID:postJSON.originalLockID};
				if(postJSON.hasOwnProperty("originalKeyLockID"))
				{
					delete whereStr.lockID;
					whereStr.keyLockID = postJSON.originalKeyLockID;
				}
				delete postJSON.accessToken;
				delete postJSON.operatorName;
				delete postJSON.originalLockID;
				delete postJSON.originalKeyLockID;
				var updateStr = {$set: postJSON };
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
				// try{
				// 	postJSON.apiName = "更新密码";
				// 	var mmUpdateStr = {$set:postJSON};
				// 	//postJSON.nKey postJSON.bKey  postJSON.approveCode
				// 	console.log(whereStr);
				// 	console.log(postJSON);
				// 	dbClient.updateMultiFunc( mongoClient,DB_CONN_STR,"taskInfo",whereStr,mmUpdateStr);
				// 	dbClient.updateMultiFunc( mongoClient,DB_CONN_STR,"stationInfo",whereStr,mmUpdateStr);
				// }catch(e)
				// {
				// 	console.log("更新锁信息失败");
				// }

				dbClient.updateFunc( mongoClient, DB_CONN_STR, collectionName, whereStr, updateStr,function(result){
					if( result.hasOwnProperty("errmsg") )
					{
						var info = 	{ "error":  
							{  
								"msg": "锁具ID已存在!",  
								"code":"14001"  
							}  };
						response.write( JSON.stringify(info) );
						response.end();
					}else{
						var info = 	{ "success":  
						{  
							"msg": "锁具信息编辑成功!",  
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
//---------------------结束--锁具更新函数--结束--------------------//




//---------------------开始--锁具查询函数--开始--------------------//
function selectLock(response, postData)
{
	try
	{
		console.log( "Request handler 'selectLock' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "lockInfo";
		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
		
		console.log(postJSON);
		//验证锁具名和动态令牌
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		console.log(whereStr);

		dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
			//console.log(result);
			if(result.length>0)
			{
				//动态令牌有效性判断
				if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };

				if( result[0].hasOwnProperty('queryLockAction') == false || result[0].queryLockAction != "true" )
				{	
					var info = 	{ "error":  
						{  
							"msg": "你没有查询锁具的权限!",  
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
//---------------------结束--锁具查询函数--结束--------------------//



//---------------------开始--downloadLock函数--开始--------------------//
function downloadLock(response, postData)
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
		//var fileName = postJSON.operatorName + "锁具信息";
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
				if( result[0].hasOwnProperty('queryLockAction') == false || result[0].queryLockAction != "true" )
				{	
					var info = 	{ "error":  
						{  
							"msg": "你没有查询锁具的权限!",  
							"code":"00012"  
						}  };
					response.write( JSON.stringify(info) );
					response.end();
					return;
				}
				 

				var fileName = postJSON.operatorName + "锁具信息";
				delete postJSON.operatorName; 
				delete postJSON.accessToken; 
				dbClient.selectFunc( mongoClient, DB_CONN_STR, "lockInfo",  postJSON , 
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
							            caption:'锁具ID',
							            type:'string',
							        },						        
							        {
							            caption:'锁具所属基站ID',
							            type:'string'
							        },
							];
							conf.rows = [];
							for(var i=0;i<result.length;i++)
							{
								conf.rows[i] = [result[i].lockID, result[i].lockID ];
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
//---------------------结束--downloadLock函数--结束--------------------//




//---------------------开始--锁具日志查询函数--开始--------------------//
function queryLockLog(response, postData)
{
	try
	{
		console.log( "Request handler 'queryLockLog' was called." );
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
				if( result[0].hasOwnProperty('queryLockAction') == false || result[0].queryLockAction != "true" )
				{	
					var info = 	{ "error":  
						{  
							"msg": "你没有查询锁具的权限!",  
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

				if( postJSON.hasOwnProperty('lockID') )
				{
					whereStr.applicantLockID = postJSON.lockID;   
				}


				// if( postJSON.hasOwnProperty('lockManagementProvince') )
				// {
				// 	whereStr.lockManagementProvince = postJSON.lockManagementProvince;  
				// }

				// if( postJSON.hasOwnProperty('lockManagementCity') )
				// {
				// 	whereStr.lockManagementCity = postJSON.lockManagementCity;  
				// }


				// if( postJSON.hasOwnProperty('lockManagementArea') )
				// {
				// 	whereStr.lockManagementArea = postJSON.lockManagementArea;  
				// }


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
//---------------------结束--锁具日志查询函数--结束--------------------//




//---------------------开始--锁具日志Excel表格下载接口--开始--------------------//
function downloadLockLog(response, postData)
{
	try
	{
		console.log( "Request handler 'downloadLockLog' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	

		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
		
		console.log(postJSON);

		//验证用户名和动态令牌
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		var fileName = postJSON.operatorName + "锁具日志";

		console.log(whereStr);
		dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
			//console.log(result);
			if(result.length>0)
			{
				//动态令牌有效性判断
				if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };
				if( result[0].hasOwnProperty('queryLockAction') == false || result[0].queryLockAction != "true" )
				{	
					var info = 	{ "error":  
						{  
							"msg": "你没有查询锁具的权限!",  
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

				if( postJSON.hasOwnProperty('lockID') )
				{
					whereStr.applicantLockID = postJSON.lockID;   
				}

				// if( postJSON.hasOwnProperty('lockManagementProvince') )
				// {
				// 	whereStr.lockManagementProvince = postJSON.lockManagementProvince;  
				// }

				// if( postJSON.hasOwnProperty('lockManagementCity') )
				// {
				// 	whereStr.lockManagementCity = postJSON.lockManagementCity;  
				// }


				// if( postJSON.hasOwnProperty('lockManagementArea') )
				// {
				// 	whereStr.lockManagementArea = postJSON.lockManagementArea;  
				// }


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
							            caption:'锁具ID',
							            type:'string',
							        },
							        {
							            caption:'任务ID',
							            type:'string',
							        },
	 						        {
							            caption:'锁具有效省级区域',
							            type:'string',
							        },
							        {
							            caption:'锁具有效市级区域',
							            type:'string',
							        },
							        {
							            caption:'锁具有效地级区域',
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

								conf.rows[i] = [result[i].stationID, result[i].stationAddress,result[i].applicantLockID, result[i].taskID,
								result[i].lockManagementProvince, result[i].lockManagementCity, result[i].lockManagementArea,
								result[i].stationManagementProvince, result[i].stationManagementCity, result[i].stationManagementArea,
								result[i].applicantName, result[i].applicantPhone, result[i].applyDescription,
								startDateTime
								, endDateTime ];
							}

							var result = nodeExcel.execute(conf);
							console.log('export Log successfully!');
							fs.writeFileSync('/usr/share/nginx/MBS_WebSourceCode/'+fileName+'锁具日志.xlsx', result, 'binary');
							var info = 	{ "success":  
							{  
								"url": 'https://www.smartlock.top/'+fileName+'锁具日志.xlsx',  
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
//---------------------结束--锁具日志Excel表格下载接口--结束--------------------//


//---------------------开始--模块导出接口声明--开始--------------------//
exports.addLock = addLock;
exports.updateLock = updateLock;
exports.deleteLock = deleteLock;
exports.selectLock = selectLock;
exports.downloadLock = downloadLock;
exports.queryLockLog = queryLockLog;
exports.downloadLockLog = downloadLockLog;
//---------------------结束--模块导出接口声明--结束--------------------//
