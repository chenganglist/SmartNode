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
function judgeCompanyToken(postJSON,response)
{
	if( !postJSON.hasOwnProperty('operatorName') || !postJSON.hasOwnProperty('accessToken') )
	{
			var info = 	{ "error":  
				{  
					"msg": "请输入公司名和动态令牌",  
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





//---------------------开始--company添加函数--开始--------------------//
function addCompany(response, postData)
{
	try
	{
		console.log( "Request handler 'addCompany' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "companyInfo";
		//判断操作者和动态令牌是否存在
		if( judgeCompanyToken(postJSON,response)==false ){  return;  };

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

					try{
						delete postJSON.accessToken;
						delete postJSON.operatorName;

						//var operatorInfo = result[0];

						//插入请求数据
						dbClient.insertFunc( mongoClient, DB_CONN_STR, collectionName,  postJSON , function(result){
								
								if( result.hasOwnProperty("errmsg") )
								{
									var info = 	{ "error":  
										{  
											"msg": "公司ID已经存在!",  
											"code":"38001"  
										}  };
									response.write( JSON.stringify(info) );
									response.end();
								}else{
									var info = 	{ "success":  
									{  
										"msg": "公司添加成功!",  
										"code":"38000"  
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
//---------------------结束--company添加函数--结束--------------------//




//---------------------开始--公司删除函数--开始--------------------//
function deleteCompany(response, postData)
{
	try
	{
		console.log( "Request handler 'deleteCompany' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "companyInfo";

		//判断操作者和动态令牌是否存在
		if( judgeCompanyToken(postJSON,response)==false ){  return;  };

		//验证用户名和动态令牌
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
			//console.log(result);
			if(result.length>0)
			{
				//动态令牌有效性判断
				if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };


				// if( result[0].hasOwnProperty('deleteStaffAction') == false || result[0].deleteStaffAction != "true" )
				// {	
				// 	var info = 	{ "error":  
				// 		{  
				// 			"msg": "你没有删除公司的权限!",  
				// 			"code":"00008"  
				// 		}  };
				// 	response.write( JSON.stringify(info) );
				// 	response.end();
				// 	return;
				// }

				var whereStr = {companyID:postJSON.companyID};
				dbClient.selectFunc( mongoClient, DB_CONN_STR, collectionName,  whereStr , function(result){
					//console.log(result);
					if(result.length>0)
					{
						var whereStr = {companyID:postJSON.companyID};
						dbClient.deleteFunc( mongoClient, DB_CONN_STR, collectionName,  whereStr , function(result){
							//console.log("删除信息"+result);
							var info = 	{ "success":  
							{  
								"msg": "公司删除成功!",  
								"code":"39000"  
							}  };
							response.write( JSON.stringify(info) );
							response.end();
						});	
					}else
					{
						var info = 	{ "error":  
						{  
							"msg": "您要删除的公司不存在!",  
							"code":"39001"  
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
//---------------------结束--公司删除函数--结束--------------------//



//---------------------开始--公司更新函数--开始--------------------//
function updateCompany(response, postData)
{
	try
		{
		console.log( "Request handler 'updateCompany' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "companyInfo";

		//判断操作者和动态令牌是否存在
		if( judgeCompanyToken(postJSON,response)==false ){  return;  };

		//验证用户名和动态令牌
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
			//console.log(result);

			if(result.length>0)
			{
				//动态令牌有效性判断
				if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };

				// if( result[0].hasOwnProperty('updateStaffAction') == false || result[0].updateStaffAction != "true" )
				// {	
				// 	var info = 	{ "error":  
				// 		{  
				// 			"msg": "你没有修改公司的权限!",  
				// 			"code":"00007"  
				// 		}  };
				// 	response.write( JSON.stringify(info) );
				// 	response.end();
				// 	return;
				// }

				//originalCompany
				var whereStr = {companyID:postJSON.originalCompanyID};
				delete postJSON.originalCompanyID; //删除字段
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
							"msg": "公司名或手机号重复!",  
							"code":"400001"  
						}  };
						response.write( JSON.stringify(info) );
						response.end();
					}else{
						var info = 	{ "success":  
							{  
								"msg": "公司信息编辑成功!",  
								"code":"40000"  
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
//---------------------结束--公司更新函数--结束--------------------//




//---------------------开始--公司查询函数--开始--------------------//
function selectCompany(response, postData)
{
	try
		{
		console.log( "Request handler 'selectCompany' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "companyInfo";
		//判断操作者和动态令牌是否存在
		if( judgeCompanyToken(postJSON,response)==false ){  return;  };

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


				// if( result[0].hasOwnProperty('queryStaffAction') == false || result[0].queryStaffAction != "true" )
				// {	
				// 	var info = 	{ "error":  
				// 		{  
				// 			"msg": "你没有查询公司的权限!",  
				// 			"code":"00009"  
				// 		}  };
				// 	response.write( JSON.stringify(info) );
				// 	response.end();
				// 	return;
				// }

				delete postJSON.operatorName; 
				delete postJSON.accessToken; 
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
//---------------------结束--公司查询函数--结束--------------------//



//---------------------开始--Excel表格下载接口--开始--------------------//
function downloadCompany(response, postData)
{
	try
	{
		console.log( "Request handler 'downloadCompany' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "companyInfo";
		//判断操作者和动态令牌是否存在
		if( judgeCompanyToken(postJSON,response)==false ){  return;  };

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
				
				// if( result[0].hasOwnProperty('queryStaffAction') == false || result[0].queryStaffAction != "true" )
				// {	
				// 	var info = 	{ "error":  
				// 		{  
				// 			"msg": "你没有查询公司的权限!",  
				// 			"code":"00009"  
				// 		}  };
				// 	response.write( JSON.stringify(info) );
				// 	response.end();
				// 	return;
				// }	
							
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
							            caption:'公司名',
							            type:'string',
							        },
							        {
							            caption:'联系方式',
							            type:'string',
							        },
							        {
							            caption:'公司类型',
							            type:'string'
							        },
							        {
							            caption:'公司联系人',
							            type:'string'
							        },
							        {
							            caption:'公司地址',
							             type:'string'              
							        }
							];
							conf.rows = [];
							for(var i=0;i<result.length;i++)
							{
								conf.rows[i] = [result[i].companyName, result[i].phone,
								result[i].companyType, result[i].contactName, result[i].address ];
							}

							var result = nodeExcel.execute(conf);
							console.log('export successfully!');
							fs.writeFileSync('/usr/share/nginx/MBS_WebSourceCode/'+fileName+'.xlsx', result, 'binary');
							var info = 	{ "success":  
							{  
								"url": 'https://www.smartlock.top/'+fileName+'.xlsx',  
								"code":"42000"  
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
exports.addCompany = addCompany;
exports.updateCompany = updateCompany;
exports.deleteCompany = deleteCompany;
exports.selectCompany = selectCompany;
exports.downloadCompany = downloadCompany;
//---------------------结束--模块导出接口声明--结束--------------------//
