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




//---------------------开始--登陆处理函数--开始--------------------//
function login(response, postData)
{
	try
	{
		console.log( "Request handler 'login' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "userInfo";
		console.log(postJSON);

		var whereStr = {username:postJSON.username,password:postJSON.password};
		//查询用户名和密码
		dbClient.selectFunc( mongoClient, DB_CONN_STR, collectionName,  whereStr , function(result){
				if( result == "err" )
				{
					var info = 	{ "error":  
						{  
							"msg": "用户名或密码错误!",  
							"code":"01002"  
						}  };
					response.write( JSON.stringify(info) );
					response.end();
				}else{
					//更新数据库中的动态令牌
					var newAccessToken = Math.random().toString(36).substr(2);
					var newStartTime = parseInt(Date.now()/1000);
					var newEndTime = newStartTime + 24*3600;
					var updateStr = { $set: { "accessToken" : newAccessToken, "tokenStartTime":newStartTime.toString(), "tokenEndTime" : newEndTime.toString() }};
					dbClient.updateFunc( mongoClient, DB_CONN_STR, collectionName,  whereStr , updateStr,  function(result){
					 	//console.log(result);
						//再次查询，返回结果--更新后嵌套查询，避免动态令牌已过期
						dbClient.selectFunc( mongoClient, DB_CONN_STR, collectionName,  whereStr , function(result){
							var json = {
								success:
								{
									userInfo:{},
									regionInfo:{},
									permissions:{},
									tokenInfo:{}
								}
							};
							json.success.userInfo.username = result[0].username;
							json.success.userInfo.realname = result[0].realname;
							json.success.userInfo.phone = result[0].phone;
							json.success.userInfo.companyGroup = result[0].companyGroup;
							json.success.userInfo.company = result[0].company;
							json.success.userInfo.userDescription = result[0].userDescription;
							json.success.userInfo.userGroup = result[0].userGroup;
							json.success.userInfo.userType = result[0].userType;
							json.success.userInfo.companyCode = result[0].companyCode;
							json.success.userInfo.personID = "12345678";
							json.success.userInfo.companyID = result[0].companyID;


							json.success.regionInfo.managementProvince = result[0].managementProvince;
							json.success.regionInfo.managementCity = result[0].managementCity;
							json.success.regionInfo.managementArea = result[0].managementArea;
							
							json.success.permissions.addStationAction = result[0].addStationAction;
							json.success.permissions.deleteStationAction = result[0].deleteStationAction;
							json.success.permissions.queryStationAction = result[0].queryStationAction;
							json.success.permissions.updateStationAction = result[0].updateStationAction;
							
							json.success.permissions.addStaffAction = result[0].addStaffAction;
							json.success.permissions.deleteStaffAction = result[0].deleteStaffAction;
							json.success.permissions.queryStaffAction = result[0].queryStaffAction;
							json.success.permissions.updateStaffAction = result[0].updateStaffAction;
							
							json.success.permissions.addKeyAction = result[0].addKeyAction;
							json.success.permissions.deleteKeyAction = result[0].deleteKeyAction;
							json.success.permissions.queryKeyAction = result[0].queryKeyAction;
							json.success.permissions.updateKeyAction = result[0].updateKeyAction;

							json.success.permissions.addLockAction = result[0].addLockAction;
							json.success.permissions.deleteLockAction = result[0].deleteLockAction;
							json.success.permissions.queryLockAction = result[0].queryLockAction;
							json.success.permissions.updateLockAction = result[0].updateLockAction;
							json.success.permissions.doorAuthorization = result[0].doorAuthorization;

							json.success.permissions.personelLimit = result[0].personelLimit;
							json.success.permissions.zoneLimit = result[0].zoneLimit;
							json.success.permissions.authOfflineTime = result[0].authOfflineTime;
							json.success.permissions.phoneLimit = result[0].phoneLimit;
							json.success.permissions.phoneMEILimit = result[0].phoneMEILimit;
							json.success.permissions.offlineRefreshTime = result[0].offlineRefreshTime;

							json.success.tokenInfo.accessToken = result[0].accessToken;
							json.success.tokenInfo.tokenStartTime  = result[0].tokenStartTime ;
							json.success.tokenInfo.tokenEndTime = result[0].tokenEndTime;
							

							response.write( JSON.stringify(json) );
							response.end();
						});	
					});
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
//---------------------结束--登陆处理函数--结束--------------------//



//---------------------开始--用户添加函数--开始--------------------//
function addUser(response, postData)
{
	try
	{
		console.log( "Request handler 'addUser' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "userInfo";
		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };

		console.log(postJSON);
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		console.log(whereStr);
		//验证用户名和动态令牌
		dbClient.selectFunc( mongoClient, DB_CONN_STR, collectionName,  whereStr , function(result){
				//console.log(result);
				if(result.length>0)
				{
					//动态令牌有效性判断
					if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };

					try{
						if( result[0].hasOwnProperty('addStaffAction') == false || result[0].addStaffAction != "true" )
						{	
							var info = 	{ "error":  
								{  
									"msg": "你没有添加员工的权限!",  
									"code":"00006"  
								}  };
							response.write( JSON.stringify(info) );
							response.end();
							return;
						}

						if( !postJSON.hasOwnProperty('password') )
						{	
							postJSON.password = "123456";
						}
						delete postJSON.accessToken;
						delete postJSON.operatorName;

						var operatorInfo = result[0];

						//后台自动降级不合法的权限
						if( postJSON.hasOwnProperty('addStationAction') )
						{	
							if(operatorInfo.addStationAction == false)
							{
								operatorInfo.addStationAction = false;
							}
						}
						if( postJSON.hasOwnProperty('deleteStationAction') )
						{	
							if(operatorInfo.deleteStationAction == false)
							{
								operatorInfo.deleteStationAction = false;
							}
						}
						if( postJSON.hasOwnProperty('queryStationAction') )
						{	
							if(operatorInfo.queryStationAction == false)
							{
								operatorInfo.queryStationAction = false;
							}
						}
						if( postJSON.hasOwnProperty('updateStationAction') )
						{	
							if(operatorInfo.updateStationAction == false)
							{
								operatorInfo.updateStationAction = false;
							}
						}
						if( postJSON.hasOwnProperty('addStaffAction') )
						{	
							if(operatorInfo.addStaffAction == false)
							{
								operatorInfo.addStaffAction = false;
							}
						}
						if( postJSON.hasOwnProperty('deleteStaffAction') )
						{	
							if(operatorInfo.deleteStaffAction == false)
							{
								operatorInfo.deleteStaffAction = false;
							}
						}
						if( postJSON.hasOwnProperty('queryStaffAction') )
						{	
							if(operatorInfo.queryStaffAction == false)
							{
								operatorInfo.queryStaffAction = false;
							}
						}
						if( postJSON.hasOwnProperty('updateStaffAction') )
						{	
							if(operatorInfo.updateStaffAction == false)
							{
								operatorInfo.updateStaffAction = false;
							}
						}
						if( postJSON.hasOwnProperty('addKeyAction') )
						{	
							if(operatorInfo.addKeyAction == false)
							{
								operatorInfo.addKeyAction = false;
							}
						}
						if( postJSON.hasOwnProperty('deleteKeyAction') )
						{	
							if(operatorInfo.deleteKeyAction == false)
							{
								operatorInfo.deleteKeyAction = false;
							}
						}
						if( postJSON.hasOwnProperty('queryKeyAction') )
						{	
							if(operatorInfo.queryKeyAction == false)
							{
								operatorInfo.queryKeyAction = false;
							}
						}
						if( postJSON.hasOwnProperty('updateKeyAction') )
						{	
							if(operatorInfo.updateKeyAction == false)
							{
								operatorInfo.updateKeyAction = false;
							}
						}
						if( postJSON.hasOwnProperty('addLockAction') )
						{	
							if(operatorInfo.addLockAction == false)
							{
								operatorInfo.addLockAction = false;
							}
						}
						if( postJSON.hasOwnProperty('deleteLockAction') )
						{	
							if(operatorInfo.deleteLockAction == false)
							{
								operatorInfo.deleteLockAction = false;
							}
						}
						if( postJSON.hasOwnProperty('queryLockAction') )
						{	
							if(operatorInfo.queryLockAction == false)
							{
								operatorInfo.queryLockAction = false;
							}
						}
						if( postJSON.hasOwnProperty('updateLockAction') )
						{	
							if(operatorInfo.updateLockAction == false)
							{
								operatorInfo.updateLockAction = false;
							}
						}
						if( postJSON.hasOwnProperty('doorAuthorization') )
						{	
							if(operatorInfo.doorAuthorization == false)
							{
								operatorInfo.doorAuthorization = false;
							}
						}

						//插入请求数据
						dbClient.insertFunc( mongoClient, DB_CONN_STR, collectionName,  postJSON , function(result){
								
								if( result.hasOwnProperty("errmsg") )
								{
									var info = 	{ "error":  
										{  
											"msg": "用户或手机号已经存在!",  
											"code":"02001"  
										}  };
									response.write( JSON.stringify(info) );
									response.end();
								}else{
									var info = 	{ "success":  
									{  
										"msg": "用户添加成功!",  
										"code":"02000"  
									}  };
									response.write( JSON.stringify(info) );
									response.end();
								}
						
						});	
					}catch(e)
					{
							var info = 	{ "error":  
							{  
								"msg": "参数错误",  
								"code":"00011"  
							}  };
							response.write( JSON.stringify(info) );
							response.end();
							return;
					}


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
//---------------------结束--用户添加函数--结束--------------------//




//---------------------开始--用户删除函数--开始--------------------//
function deleteUser(response, postData)
{
	try
	{
		console.log( "Request handler 'deleteUser' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "userInfo";

		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };

		//验证用户名和动态令牌
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		dbClient.selectFunc( mongoClient, DB_CONN_STR, collectionName,  whereStr , function(result){
			//console.log(result);
			if(result.length>0)
			{
				//动态令牌有效性判断
				if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };


				if( result[0].hasOwnProperty('deleteStaffAction') == false || result[0].deleteStaffAction != "true" )
				{	
					var info = 	{ "error":  
						{  
							"msg": "你没有删除员工的权限!",  
							"code":"00008"  
						}  };
					response.write( JSON.stringify(info) );
					response.end();
					return;
				}

				var whereStr = {username:postJSON.username};
				dbClient.selectFunc( mongoClient, DB_CONN_STR, collectionName,  whereStr , function(result){
					//console.log(result);
					if(result.length>0)
					{
						var whereStr = {username:postJSON.username};
						dbClient.deleteFunc( mongoClient, DB_CONN_STR, collectionName,  whereStr , function(result){
							//console.log("删除信息"+result);
							var info = 	{ "success":  
							{  
								"msg": "用户删除成功!",  
								"code":"03000"  
							}  };
							response.write( JSON.stringify(info) );
							response.end();
						});	
					}else
					{
						var info = 	{ "error":  
						{  
							"msg": "您要删除的用户不存在!",  
							"code":"03001"  
						}  };
						response.write( JSON.stringify(info) );
						response.end();	
					}});

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
//---------------------结束--用户删除函数--结束--------------------//


//---------------------开始--用户配置函数--开始--------------------//
function personalConfig(response, postData)
{
	try
		{
		console.log( "Request handler 'personalConfig' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "userInfo";

		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };

		//验证用户名和动态令牌
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		dbClient.selectFunc( mongoClient, DB_CONN_STR, collectionName,  whereStr , function(result){
			//console.log(result);

			if(result.length>0)
			{
				//动态令牌有效性判断
				if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };

				if( result[0].hasOwnProperty('updateStaffAction') == false || result[0].updateStaffAction != "true" )
				{	
					var info = 	{ "error":  
						{  
							"msg": "你没有配置员工的权限!",  
							"code":"00007"  
						}  };
					response.write( JSON.stringify(info) );
					response.end();
					return;
				}

				//originalName
				var whereStr = {username:postJSON.operatorName};
				delete postJSON.originalName; //删除字段
				delete postJSON.accessToken;
				delete postJSON.operatorName;
				var updateStr = {$set: postJSON };
				// isOwnEmpty(postJSON)
				// {
				// 	var info = 	{ "error":  
				// 		{  
				// 			"msg": "你没有指定配置任何属性!",  
				// 			"code":"00014"  
				// 		}  };
				// 	response.write( JSON.stringify(info) );
				// 	response.end();
				// 	return;					
				// }
				dbClient.updateFunc( mongoClient, DB_CONN_STR, collectionName, whereStr, updateStr,function(result){
					if(result.hasOwnProperty("errmsg") )
					{
						var info = 	{ "error":  
						{  
							"msg": "用户名或手机号重复!",  
							"code":"040001"  
						}  };
						response.write( JSON.stringify(info) );
						response.end();
					}else{
						var info = 	{ "success":  
							{  
								"msg": "用户信息配置成功!",  
								"code":"04000"  
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
//---------------------结束--用户配置函数--结束--------------------//


//---------------------开始--用户更新函数--开始--------------------//
function updateUser(response, postData)
{
	try
		{
		console.log( "Request handler 'updateUser' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "userInfo";

		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };

		//验证用户名和动态令牌
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		dbClient.selectFunc( mongoClient, DB_CONN_STR, collectionName,  whereStr , function(result){
			//console.log(result);

			if(result.length>0)
			{
				//动态令牌有效性判断
				if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };

				if( result[0].hasOwnProperty('updateStaffAction') == false || result[0].updateStaffAction != "true" )
				{	
					var info = 	{ "error":  
						{  
							"msg": "你没有修改员工的权限!",  
							"code":"00007"  
						}  };
					response.write( JSON.stringify(info) );
					response.end();
					return;
				}

				//originalName
				var whereStr = {username:postJSON.originalName};
				delete postJSON.originalName; //删除字段
				delete postJSON.accessToken;
				delete postJSON.operatorName;
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
				dbClient.updateFunc( mongoClient, DB_CONN_STR, collectionName, whereStr, updateStr,function(result){
					if(result.hasOwnProperty("errmsg") )
					{
						var info = 	{ "error":  
						{  
							"msg": "用户名或手机号重复!",  
							"code":"040001"  
						}  };
						response.write( JSON.stringify(info) );
						response.end();
					}else{
						var info = 	{ "success":  
							{  
								"msg": "用户信息编辑成功!",  
								"code":"04000"  
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
//---------------------结束--用户更新函数--结束--------------------//




//---------------------开始--用户查询函数--开始--------------------//
function selectUser(response, postData)
{
	try
		{
		console.log( "Request handler 'selectUser' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "userInfo";
		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };

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


				if( result[0].hasOwnProperty('queryStaffAction') == false || result[0].queryStaffAction != "true" )
				{	
					var info = 	{ "error":  
						{  
							"msg": "你没有查询员工的权限!",  
							"code":"00009"  
						}  };
					response.write( JSON.stringify(info) );
					response.end();
					return;
				}

				delete postJSON.operatorName; 
				delete postJSON.accessToken; 
				dbClient.selectFunc( mongoClient, DB_CONN_STR, collectionName,  postJSON , 
					function(result){
						
					if( result.length>0 )
					{
						for(var i=0;i<result.length;i++)
						{
							var mjson = {
									userInfo:{},
									regionInfo:{},
									permissions:{},
									tokenInfo:{}
							};
							mjson.userInfo.username = result[i].username;
							mjson.userInfo.realname = result[i].realname;
							mjson.userInfo.phone = result[i].phone;
							mjson.userInfo.companyGroup = result[i].companyGroup;
							mjson.userInfo.company = result[i].company;
							mjson.userInfo.userDescription = result[i].userDescription;
							mjson.userInfo.userGroup = result[i].userGroup;
							mjson.userInfo.userType = result[i].userType;
							mjson.userInfo.companyCode = result[i].companyCode;
							
							mjson.regionInfo.managementProvince = result[i].managementProvince;
							mjson.regionInfo.managementCity = result[i].managementCity;
							mjson.regionInfo.managementArea = result[i].managementArea;
							
							mjson.permissions.addStationAction = result[i].addStationAction;
							mjson.permissions.deleteStationAction = result[i].deleteStationAction;
							mjson.permissions.queryStationAction = result[i].queryStationAction;
							mjson.permissions.updateStationAction = result[i].updateStationAction;
							
							mjson.permissions.addStaffAction = result[i].addStaffAction;
							mjson.permissions.deleteStaffAction = result[i].deleteStaffAction;
							mjson.permissions.queryStaffAction = result[i].queryStaffAction;
							mjson.permissions.updateStaffAction = result[i].updateStaffAction;
							
							mjson.permissions.addKeyAction = result[i].addKeyAction;
							mjson.permissions.deleteKeyAction = result[i].deleteKeyAction;
							mjson.permissions.queryKeyAction = result[i].queryKeyAction;
							mjson.permissions.updateKeyAction = result[i].updateKeyAction;

							mjson.permissions.addLockAction = result[i].addLockAction;
							mjson.permissions.deleteLockAction = result[i].deleteLockAction;
							mjson.permissions.queryLockAction = result[i].queryLockAction;
							mjson.permissions.updateLockAction = result[i].updateLockAction;
							mjson.permissions.doorAuthorization = result[i].doorAuthorization;

							mjson.permissions.personelLimit = result[0].personelLimit;
							mjson.permissions.zoneLimit = result[0].zoneLimit;
							mjson.permissions.authOfflineTime = result[0].authOfflineTime;
							mjson.permissions.phoneLimit = result[0].phoneLimit;
							mjson.permissions.phoneMEILimit = result[0].phoneMEILimit;
							mjson.permissions.offlineRefreshTime = result[0].offlineRefreshTime;
							
							mjson.tokenInfo.accessToken = result[i].accessToken;
							mjson.tokenInfo.tokenStartTime  = result[i].tokenStartTime ;
							mjson.tokenInfo.tokenEndTime = result[i].tokenEndTime;
							
							//rearrange result
							result[i] = mjson;
						}
						var json = {success:result};
						response.write( JSON.stringify(json) );
						response.end();
					}else{
						var info = 	{ "userInfo":  
						{  
							"msg": "没有查询记录!",  
							"code":"05001"  
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
//---------------------结束--用户查询函数--结束--------------------//



//---------------------开始--Excel表格下载接口--开始--------------------//
function downloadUser(response, postData)
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
				
				if( result[0].hasOwnProperty('queryStaffAction') == false || result[0].queryStaffAction != "true" )
				{	
					var info = 	{ "error":  
						{  
							"msg": "你没有查询员工的权限!",  
							"code":"00009"  
						}  };
					response.write( JSON.stringify(info) );
					response.end();
					return;
				}	
							
				var fileName = postJSON.operatorName;
				delete postJSON.operatorName; 
				delete postJSON.accessToken; 
				dbClient.selectFunc( mongoClient, DB_CONN_STR, collectionName,  postJSON , 
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
							            caption:'用户名',
							            type:'string',
							        },
							        {
							            caption:'联系方式',
							            type:'string',
							        },
							        {
							            caption:'用户类型',
							            type:'string'
							        },
							        {
							            caption:'公司',
							             type:'string'              
							        }
							];
							conf.rows = [];
							for(var i=0;i<result.length;i++)
							{
								conf.rows[i] = [result[i].username, result[i].phone,
								result[i].userType, result[i].company ];
							}

							var result = nodeExcel.execute(conf);
							console.log('export successfully!');
							fs.writeFileSync('/usr/share/nginx/MBS_WebSourceCode/'+fileName+'.xlsx', result, 'binary');
							var info = 	{ "success":  
							{  
								"url": 'https://www.smartlock.top/'+fileName+'.xlsx',  
								"code":"06000"  
							}  };
							response.write( JSON.stringify(info) );
							response.end();
					}else{
						var info = 	{ "error":  
						{  
							"msg": "没有数据记录!",  
							"code":"06001"  
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
//---------------------结束--Excel表格下载接口--结束--------------------//

//---------------------开始--函数--开始--------------------//
//---------------------结束--函数--结束--------------------//

//---------------------开始--模块导出接口声明--开始--------------------//
exports.login = login;
exports.addUser = addUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.selectUser = selectUser;
exports.downloadUser = downloadUser;
exports.personalConfig = personalConfig;

//---------------------结束--模块导出接口声明--结束--------------------//
