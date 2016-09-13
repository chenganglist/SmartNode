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
function judgeTaskID(postJSON,response)
{
	if( !postJSON.hasOwnProperty("taskID") )
	{
		var info = 	{ "error":  
		{  
			"msg": "请输入任务申请工单ID!",  
			"code":"00004"  
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


//---------------------开始--任务申请函数--开始--------------------//
//任务申请和任务函数--需要已经验证没有触发器，直接通过代码绑定到肖良平//
//任务修改和申请工单,内部函数不一，还是分开写，多提供一个接口的好：不能放在一起//
function taskRequest(response, postData)
{
	try
	{
		console.log( "Request handler 'taskRequest' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "taskInfo";
		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
	    //if( judgeTaskID(postJSON,response)==false ){  return;  };
		console.log(postJSON);
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		console.log(whereStr);

		//用户信息验证，验证用户名和动态令牌
		dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
				//console.log(result);
				if(result.length>0)
				{
					//动态令牌有效性判断
					if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };
					var whereStr = {"address":postJSON.stationAddress};

					//验证基站信息：查询申请的基站是否存在--因为数据库查询是异步的，所以必须嵌套
					dbClient.selectFunc( mongoClient, DB_CONN_STR, "stationInfo",  whereStr , function(result){
							//根据查询记录写入工单审批人信息
							//console.log(result);
							if(result.length>0)
							{
								postJSON.approvalPerson = result[0].approvalPerson;
								postJSON.approvalPhone = result[0].approvalPhone;
								postJSON.stationID = result[0].stationID;
								//postJSON.lockID = result[0].lockID;
								postJSON.lockID0 = result[0].lockID0;
								postJSON.lockID1 = result[0].lockID1;
								postJSON.lockID2 = result[0].lockID2;
								postJSON.lockID3 = result[0].lockID3;
								postJSON.lockID4 = result[0].lockID4;
								postJSON.lockID5 = result[0].lockID5;
								postJSON.lockID6 = result[0].lockID6;
								postJSON.lockID7 = result[0].lockID7;
								postJSON.LAT = result[0].LAT;
								postJSON.LON = result[0].LON;
								postJSON.HEI = result[0].HEI;
								postJSON.approveCode = result[0].approveCode;
								postJSON.stationAddress = result[0].address;
								postJSON.stationManagementProvince = result[0].managementProvince;
								postJSON.stationManagementCity = result[0].managementCity;
								postJSON.stationManagementArea = result[0].managementArea;
								//postJSON.keyLockID = result[0].keyLockID;
								//postJSON.bKey = result[0].bKey;
								//postJSON.nKey = result[0].nKey;
								postJSON.personID = "12345678";

								postJSON.taskID = parseInt(Date.now()).toString().substring(3);
								postJSON.applicationStatus = "pending";
								//postJSON.approveCode = "4201736374740106";
								postJSON.errOfWorkResultFlag = "未处理";
								postJSON.errOfPendingOrderFlag = "未处理";
								// try
								// {
								// 	if(result[0].approveCode == null ||
								// 	result[0].bKey == null ||
								// 	result[0].keyLockID == null ||
								// 	result[0].nKey == null	 )
								// 	{
								// 		postJSON.keyLockID = "500000004791";
								// 		postJSON.bKey = "0123456789ABCDEFEFCDAB8967452301";
								// 		postJSON.nKey = "DF2A7C33F71CD497";
								// 		postJSON.personID = "12345678";	
								// 		postJSON.approveCode = "4201010203040506";			
								// 		dbClient.updateMultiFunc(mongoClient, 
								// 			DB_CONN_STR, "stationInfo",
								// 			{stationID:result[0].stationID},
								// 			{$set:{"approveCode" : "4201010203040506",
								// 			"keyLockID" : "500000004791",
								// 			"bKey" : "0123456789ABCDEFEFCDAB8967452301",
								// 			"nKey" : "DF2A7C33F71CD497",
								// 			"personID" : "12345678"}} );
								// 	}
								// }catch(e){console.log(e)};
								//将时间类型转换为整型
								re = /^1\d{9}$/;
								if( !re.test(postJSON.taskStartTime) || !re.test(postJSON.taskEndTime) ) 
								{
										var info = 	{ "error":  
										{  
											"msg": "时间格式错误，请输入10位的时间戳!",  
											"code":"17007"  
										}  };
										response.write( JSON.stringify(info) );
										response.end();
										return;
								}
								if(postJSON.hasOwnProperty('taskStartTime'))
								{
									postJSON.taskStartTime = parseInt(postJSON.taskStartTime);
								}
								
								if(postJSON.hasOwnProperty('taskEndTime'))
								{
									postJSON.taskEndTime = parseInt(postJSON.taskEndTime);
								}
								
								if(postJSON.hasOwnProperty('applyTime'))
								{
									postJSON.applyTime = parseInt(postJSON.applyTime);
								}
								
								postJSON.approveTime = " ";
								postJSON.workStatus = "未完成";
								postJSON.workDescription = " ";
								postJSON.finishTime = " ";
						
								if(postJSON.hasOwnProperty("applyType") && postJSON.applyType == "app")
								{
											
									delete postJSON.accessToken;
									delete postJSON.operatorName;
									postJSON.taskStatus = "正常";
									postJSON.taskDescription = "工单等待审批";
									//插入请求数据
									dbClient.insertFunc( mongoClient, DB_CONN_STR, collectionName,  postJSON , function(result){
											//console.log(result);
											if( result.hasOwnProperty("errmsg") )
											{
												var info = 	{ "error":  
													{  
														"msg": "任务申请工单ID已存在!",  
														"code":"17001"  
													}  };
												response.write( JSON.stringify(info) );
												response.end();
											}else{
												var info = 	{ "success":  
												{  
													"msg": "任务申请工单申请成功!",  
													"code":"17000"  
												}  };
												response.write( JSON.stringify(info) );
												response.end();
											}
									});										
									return;
								}

								delete postJSON.accessToken;
								delete postJSON.operatorName;
								postJSON.taskStatus = "正常";
								postJSON.taskDescription = "工单等待审批";
								//插入请求数据
								dbClient.insertFunc( mongoClient, DB_CONN_STR, collectionName,  postJSON , function(result){
										//console.log(result);
										if( result.hasOwnProperty("errmsg") )
										{
											var info = 	{ "error":  
												{  
													"msg": "任务申请工单ID已存在!",  
													"code":"17001"  
												}  };
											response.write( JSON.stringify(info) );
											response.end();
										}else{
											var info = 	{ "success":  
											{  
												"msg": "任务申请工单申请成功!",  
												"code":"17000"  
											}  };
											response.write( JSON.stringify(info) );
											response.end();
										}
								});	

								// var whereStr = {"keyID":postJSON.applicantKeyID};
								// //验证电子钥匙的信息：查询电子钥匙ID是否存在--电子钥匙还需要做地域检查
								// dbClient.selectFunc( mongoClient, DB_CONN_STR, "keyInfo",  whereStr , function(result){
								// 	if(result.length>0)
								// 	{
								// 			//电子钥匙管理区域和基站管理区域包含关系判断待完成
								// 			//区域不包含则返回工单申请失败消息
								// 			postJSON.keyManagementProvince = result[0].managementProvince;
								// 			postJSON.keyManagementCity = result[0].managementCity;
								// 			postJSON.keyManagementArea = result[0].managementArea;
											
											// //省级区域判定
											// if(postJSON.keyManagementProvince != "ALL" &&
											// postJSON.keyManagementProvince != postJSON.stationManagementProvince)
											// {
											// 	var info = 	{ "error":  
											// 	{  
											// 		"msg": "电子钥匙管理的省级区域没有包含基站所属省级区域!",  
											// 		"code":"17004"  
											// 	}  };
											// 	response.write( JSON.stringify(info) );
											// 	response.end();
											// 	return;
											// }
											
											// //市级区域判定
											// if(postJSON.keyManagementProvince != "ALL" && postJSON.keyManagementCity != "ALL" &&
											// postJSON.keyManagementCity != postJSON.stationManagementCity)
											// {
											// 	var info = 	{ "error":  
											// 	{  
											// 		"msg": "电子钥匙管理的市级区域没有包含基站所属市级区域!",  
											// 		"code":"17005"  
											// 	}  };
											// 	response.write( JSON.stringify(info) );
											// 	response.end();	
											// 	return;
											// }
											
											// //地级区域判定
											// if(postJSON.keyManagementProvince != "ALL" && postJSON.keyManagementCity != "ALL" && postJSON.keyManagementArea != "ALL" &&
											// postJSON.keyManagementArea != postJSON.stationManagementArea)
											// {
											// 	var info = 	{ "error":  
											// 	{  
											// 		"msg": "电子钥匙管理的地级区域没有包含基站所属地级区域!",  
											// 		"code":"17006"  
											// 	}  };
											// 	response.write( JSON.stringify(info) );
											// 	response.end();	
											// 	return;
											// }
											
											// delete postJSON.accessToken;
											// delete postJSON.operatorName;
											// postJSON.taskStatus = "正常";
											// postJSON.taskDescription = "工单等待审批";
											// //插入请求数据
											// dbClient.insertFunc( mongoClient, DB_CONN_STR, collectionName,  postJSON , function(result){
											// 		//console.log(result);
											// 		if( result.hasOwnProperty("errmsg") )
											// 		{
											// 			var info = 	{ "error":  
											// 				{  
											// 					"msg": "任务申请工单ID已存在!",  
											// 					"code":"17001"  
											// 				}  };
											// 			response.write( JSON.stringify(info) );
											// 			response.end();
											// 		}else{
											// 			var info = 	{ "success":  
											// 			{  
											// 				"msg": "任务申请工单申请成功!",  
											// 				"code":"17000"  
											// 			}  };
											// 			response.write( JSON.stringify(info) );
											// 			response.end();
											// 		}
											// });	
									// }else
									// {
									// 	var info = 	{ "error":  
									// 	{  
									// 		"msg": "您的电子钥匙未录入系统!",  
									// 		"code":"17003"  
									// 	}  };
									// 	response.write( JSON.stringify(info) );
									// 	response.end();
									// }
								//});	
							}else
							{
									var info = 	{ "error":  
									{  
										"msg": "您申请的基站未录入系统!",  
										"code":"17002"  
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
//---------------------结束--任务申请和任务修改函数--结束--------------------//





//---------------------开始--管理员抓取工单--开始--------------------//
function taskFetch(response, postData)
{
	try
	{
		console.log( "Request handler 'taskFetch' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "taskInfo";
		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
		// if( !postJSON.hasOwnProperty('approvalPerson') ){ 
		// 	var info = 	{ "error":  
		// 	{  
		// 		"msg": "请输入审批人名字!",  
		// 		"code":"18002"  
		// 	}  };
		// 	response.write( JSON.stringify(info) );
		// 	response.end();
		// 	return;
		// }
		
		console.log(postJSON);
		//验证任务申请工单名和动态令牌
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


	       		whereStr = postJSON;

				var mstartTime = { "taskStartTime":{$gte:parseInt( postJSON.taskStartTime) } };
				var mendTime = { "taskEndTime":{$lte:parseInt( postJSON.taskEndTime) } };
				var mApplyStartTime = { "applyTime":{$gte:parseInt( postJSON.applyStartTime) } };
				var mApplyEndTime = { "applyTime":{$lte:parseInt( postJSON.applyEndTime) } };
				var mApplyRange = { "applyTime":{$gte:parseInt( postJSON.applyStartTime) , $lte:parseInt( postJSON.applyEndTime) } };

				if( postJSON.hasOwnProperty('taskStartTime') )
				{
					whereStr.taskStartTime = mstartTime.taskStartTime;
					//delete postJSON.taskStartTime; 
				}

				if( postJSON.hasOwnProperty('taskEndTime') )
				{
					whereStr.taskEndTime = mendTime.taskEndTime;
					//delete postJSON.taskEndTime; 
				}

				if( postJSON.hasOwnProperty('applyStartTime') )
				{
					whereStr.applyTime = mApplyStartTime.applyTime;
					console.log( mApplyStartTime.applyTime );
					//delete postJSON.taskStartTime; 
				}

				if( postJSON.hasOwnProperty('applyEndTime') )
				{
					whereStr.applyTime = mApplyEndTime.applyTime;
					console.log( mApplyEndTime.applyTime );
					//delete postJSON.taskEndTime; 
				}

				if( postJSON.hasOwnProperty('applyEndTime') && postJSON.hasOwnProperty('applyStartTime') )
				{
					whereStr.applyTime = mApplyRange.applyTime;
					console.log( "both" );
				}

			    delete whereStr.applyStartTime;
			    delete whereStr.applyEndTime;
				console.log(whereStr);
				

				dbClient.selectFunc( mongoClient, DB_CONN_STR, "taskInfo",  whereStr , 
					function(result){
					//console.log(result);
					if( result.length>0 )
					{
						//为了快速返回数据，将更新状态的操作置后
						var json = {success:result};
						response.write( JSON.stringify(json) );
						response.end();

						for(var i=0;i<result.length;i++)
						{
							try
							{
								//更新工单状态--根据审批时间判断工单异常--审批时间大于申请的上站开始时间
								if( result[i].applicationStatus == "pending" && Date.now()/1000 > result[i].taskStartTime )
								{       
								    result[i].taskStatus = "异常";
								    result[i].taskDescription = "工单未及时审批";

									//更新工单状态
									var whereTask = {taskID:result[i].taskID};
									console.log(result[i].taskID);
									console.log( typeof(result[i].taskID) );
									var updateStr = {$set:  {taskStatus:result[i].taskStatus, taskDescription:result[i].taskDescription}  };
									dbClient.updateMultiFunc( mongoClient, DB_CONN_STR, "taskInfo", whereTask, updateStr);
	
								}
							}catch(e)
							{
								console.log("update log");
							}

							try
							{
								var whereTask = {taskID:result[i].taskID , operationResult:"开锁成功"};
								//更新工单状态--根据上站时间与工作时间判断工单异常--上站结束时间已过，工作人员未上站

								//console.log(result);
								try
								{
									if( Date.now()/1000 > result[i].taskEndTime )
									{
										result[i].taskStatus = "异常";
										result[i].taskDescription = "工程师未及时上站";
										dbClient.selectFunc( mongoClient, DB_CONN_STR, "appTaskInfo",  whereTask , function(result){
											if(result.length<=0)
											{
                                                try{
                                                    //更新工单状态
                                                    var whereTask = {taskID:result[i].taskID};
                                                    var updateStr = {$set:  {taskStatus:result[i].taskStatus, taskDescription:result[i].taskDescription}  };
                                                    dbClient.updateMultiFunc( mongoClient, DB_CONN_STR, "taskInfo", whereTask, updateStr);                                                   
                                                }catch(e)
                                                {
                                                    
                                                }

											}
										});	
									}
								}catch(e)
								{
									console.log("工单判断异常，可能缺少参数");
								}	
								
							}catch(e)
							{
								console.log("error "+e);
								console.log("查询参数不足,参数不足，参数不足");
							}
						}


					}else{
						var info = 	{ "error":  
						{  
							"msg": "暂时没有需要处理的工单!",  
							"code":"18001"  
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
//---------------------结束--管理员抓取工单--结束--------------------//



//---------------------开始--任务工单审批函数--开始--------------------//
//---------------------需要通过触发器生成校验码和参数--------------------//
function taskAuthenticate(response, postData)
{
	try
	{
		console.log( "Request handler 'taskAuthenticate' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "taskInfo";

		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
	    if( judgeTaskID(postJSON,response)==false ){  return;  };
		//验证任务申请工单名和动态令牌
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
			//console.log(result);

			if(result.length>0)
			{
				//动态令牌有效性判断
				if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };

				if( result[0].hasOwnProperty('doorAuthorization') == false || result[0].doorAuthorization != "true" )
				{	
					var info = 	{ "error":  
						{  
							"msg": "你没有审批基站开门的权限!",  
							"code":"00014"  
						}  };
					response.write( JSON.stringify(info) );
					response.end();
					return;
				}
				
				delete postJSON.operatorName;
				delete postJSON.accessToken;
				//这里需要根据基站和电子钥匙信息生成授权码，授权时间
				//var newStartTime = parseInt(Date.now()/1000);
				//var newEndTime = newStartTime + 24*3600;
				//postJSON.approveCode = (newStartTime/400).toString();
				//平台码
				//postJSON.approveCode = "42 01 73 63 74 74 01 06";
				//postJSON.approveStartTime = newStartTime.toString();
				//postJSON.approveEndTime = newEndTime.toString();
				//postJSON.approveTimes = "5";
				//originalName
				var whereStr = {taskID:postJSON.taskID};
				delete postJSON.taskID;

				postJSON.taskStatus = "正常";
				postJSON.taskDescription = "工单已经审批";

				if(postJSON.hasOwnProperty('approveTime'))
				{
					postJSON.approveTime = parseInt(postJSON.approveTime);
				}
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
					console.log("审批结果 "+result);
					var info = 	{ "success":  
					{  
						"msg": "任务工单信息授权成功,授权状态为："+postJSON.applicationStatus,  
						"applicationStatus":postJSON.applicationStatus,
						"code":"19000"  
					}  };
					response.write( JSON.stringify(info) );
					response.end();
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
//---------------------结束--任务工单审批函数--结束--------------------//



//---------------------开始--任务申请工单授权状态抓取函数--开始--------------------//
function taskAuthFetch(response, postData)
{
	try
	{
		console.log( "Request handler 'taskAuthFetch' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "taskInfo";

		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
	 	//  if( !postJSON.hasOwnProperty('applicantName') ){ 
		// 	var info = 	{ "error":  
		// 	{  
		// 		"msg": "请输入申请人的名字!",  
		// 		"code":"20002"  
		// 	}  };
		// 	response.write( JSON.stringify(info) );
		// 	response.end();
		// 	return;
		// }
		//验证任务申请工单名和动态令牌
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
			//console.log(result);

			if(result.length>0)
			{
				//动态令牌有效性判断
				if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };
				
				//查询工单
				delete postJSON.operatorName; 
				delete postJSON.accessToken; 

			    var whereStr = postJSON;

				var mstartTime = { "taskStartTime":{$gte:parseInt( postJSON.taskStartTime) } };
				var mendTime = { "taskEndTime":{$lte:parseInt( postJSON.taskEndTime) } };

				if( postJSON.hasOwnProperty('taskStartTime') )
				{
					whereStr.taskStartTime = mstartTime.taskStartTime;
					//delete postJSON.taskStartTime; 
				}

				if( postJSON.hasOwnProperty('taskEndTime') )
				{
					whereStr.taskEndTime = mstartTime.taskEndTime;
					//delete postJSON.taskEndTime; 
				}

				console.log(whereStr);
				dbClient.selectFunc( mongoClient, DB_CONN_STR, collectionName, whereStr,function(result){
					if( result.length > 0 )
					{
						var json = {success:result};
						response.write( JSON.stringify(json) );
						response.end();
					}else{
						var info = 	{ "error":  
						{  
							"msg": "您没有申请任务!",  
							"code":"20001"  
						}  };
						response.write( JSON.stringify(result) );
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
//---------------------结束--任务申请工单授权状态抓取函数--结束--------------------//





//---------------------开始--任务申请工单完成后，提交工说明单信息函数--开始--------------------//
function taskCommit(response, postData)
{
	try
	{
		console.log( "Request handler 'taskCommit' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "taskInfo";

		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
	    if( judgeTaskID(postJSON,response)==false ){  return;  };
		//验证任务申请工单名和动态令牌
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
			//console.log(result);

			if(result.length>0)
			{
				//动态令牌有效性判断
				if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };
				
				//originalName
				var whereStr = {taskID:postJSON.taskID};
				delete postJSON.taskID;
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
					var info = 	{ "success":  
					{  
						"msg": "任务工单信息提交成功!",  
						"code":"21000"  
					}  };
					response.write( JSON.stringify(info) );
					response.end();
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
//---------------------结束--任务申请工单完成后，提交工说明单信息函数--结束--------------------//



//---------------------开始--下载工单日志函数--开始--------------------//
function downloadTask(response, postData)
{
	try
	{
		console.log( "Request handler 'downloadTask' was called." );
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
				
				var fileName = postJSON.operatorName+"任务信息";
				delete postJSON.operatorName; 
				delete postJSON.accessToken; 
				dbClient.selectFunc( mongoClient, DB_CONN_STR, "taskInfo",  postJSON , 
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
							            caption:'作业编号',
							            type:'string',
							        },
							        {
							            caption:'基站地址',
							            type:'string',
							        },     
							        {
							            caption:'工单开始时间',
							            type:'string',
							        },
							        {
							            caption:'工单结束时间',
							            type:'string',
							        },						
							        {
							            caption:'工单描述',
							            type:'string',
							        },
							        {
							            caption:'工单类型',
							            type:'string',
							        },     
							        {
							            caption:'申请者',
							            type:'string',
							        },
							        {
							            caption:'审批人',
							            type:'string',
							        },
   							        {
							            caption:'工单所属片区',
							            type:'string',
							        },
							        {
							            caption:'申请状态',
							            type:'string'
							        }
							];
							conf.rows = [];
							for(var i=0;i<result.length;i++)
							{
								conf.rows[i] = [ result[i].taskID, result[i].stationAddress,
								new Date(result[i].taskStartTime*1000).toISOString() , new Date(result[i].taskEndTime*1000).toISOString(), result[i].applyDescription,
								result[i].applicationType,result[i].applicantName, result[i].approvalPerson,
								result[i].stationManagementProvince+result[i].stationManagementCity+result[i].stationManagementArea,
								result[i].applicationStatus ];
							}

							var result = nodeExcel.execute(conf);
							console.log('export successfully!');
							fs.writeFileSync('/usr/share/nginx/MBS_WebSourceCode/'+fileName+'.xlsx', result, 'binary');
							var info = 	{ "success":  
							{  
								"url": 'https://www.smartlock.top/'+fileName+'.xlsx',  
								"code":"22000"  
							}  };
							response.write( JSON.stringify(info) );
							response.end();
					}else{
						var info = 	{ "error":  
						{  
							"msg": "没有数据记录!",  
							"code":"22001"  
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
//---------------------结束--下载工单日志函数--结束--------------------//



//---------------------开始--任务申请修改--开始--------------------//
function taskChange(response, postData)
{
	try
	{
		console.log( "Request handler 'taskChange' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "taskInfo";
		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
	    //if( judgeTaskID(postJSON,response)==false ){  return;  };
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
					
					//更新请求数据
					var whereStr = {taskID:postJSON.originalTaskID};
					delete postJSON.originalTaskID;
					delete postJSON.operatorName;
					delete postJSON.accessToken;
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
						var info = 	{ "success":  
						{  
							"msg": "任务工单信息修改成功!",  
							"code":"23000"  
						}  };
						response.write( JSON.stringify(info) );
						response.end();
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
//---------------------结束--任务申请修改--结束--------------------//



//---------------------开始--上传APP历史数据接口--开始--------------------//
function appTaskRecord(response, postData)
{
	try
	{
		console.log( "Request handler 'appTaskRecord' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "appTaskInfo";
		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
	    //if( judgeTaskID(postJSON,response)==false ){  return;  };
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
					delete postJSON.operatorName;
					delete postJSON.accessToken;
					if(postJSON.hasOwnProperty('taskCommitTime'))
					{
						postJSON.taskCommitTime = parseInt(postJSON.taskCommitTime);
					}

					// try
					// {
					// 	//修改工单开门码，对工单列表修改所有的工单开门码
					// 	var whereStr = {lockID:postJSON.lockID};
					// 	var updateStr = {};
					// 	if(postJSON.operationResult ==  "修改密码成功" )
					// 	{
					// 		updateStr = {$set:{approveCode:postJSON.approveCode}};
					// 		dbClient.updateMultiFunc( mongoClient, DB_CONN_STR, "stationInfo", whereStr, updateStr);
					// 	}

							

					// }catch(e)
					// {
					// 	console.log(e);
					// }


					try
					{
						//更新基站开关门状态
						var whereStr = {lockID:postJSON.lockID};
						var updateStr = {};
						if(postJSON.operationResult ==  "上锁成功！" )
						{
							updateStr = {$set:{doorStatus:"closed"}};
							dbClient.updateFunc( mongoClient, DB_CONN_STR, "stationInfo",  whereStr , updateStr , function(result){
								//console.log(result);	
							});	
						}

						if(postJSON.operationResult ==  "开锁成功" )
						{
							updateStr = {$set:{doorStatus:"open"}};
							dbClient.updateFunc( mongoClient, DB_CONN_STR, "stationInfo",  whereStr , updateStr , function(result){
								//console.log(result);	
							});	
						}

					}catch(e)
					{
						console.log(e);
					}
	

					//插入请求数据
					dbClient.insertFunc( mongoClient, DB_CONN_STR, collectionName,  postJSON , function(result){
							//console.log(result);

							var info = 	{ "success":  
							{  
								"msg": "APP记录信息提交成功!",  
								"code":"29000"  
							}  };
							response.write( JSON.stringify(info) );
							response.end();
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
//---------------------结束--上传APP历史数据接口--结束--------------------//



//---------------------开始--查询APP历史数据接口--开始--------------------//
function appTaskConsult(response, postData)
{
	try
	{
		console.log( "Request handler 'appTaskConsult' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "appTaskInfo";
		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
	    //if( judgeTaskID(postJSON,response)==false ){  return;  };
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
					
					//更新请求数据
					delete postJSON.operatorName;
					delete postJSON.accessToken;

					var whereStr = postJSON;

					var mStartTime = { "taskCommitTime":{$gte:parseInt( postJSON.taskCommitStartTime) } };
					var mEndTime = { "taskCommitTime":{$lte:parseInt( postJSON.taskCommitEndTime) } };
					var mRange = { "taskCommitTime":{$gte:parseInt( postJSON.taskCommitStartTime) , $lte:parseInt( postJSON.taskCommitEndTime) } };

					if( postJSON.hasOwnProperty('taskCommitStartTime') )
					{
						whereStr.taskCommitTime = mStartTime.taskCommitTime;
						//delete postJSON.taskStartTime; 
					}

					if( postJSON.hasOwnProperty('taskCommitEndTime') )
					{
						whereStr.taskCommitTime = mEndTime.taskCommitTime;
						//delete postJSON.taskEndTime; 
					}

					if( postJSON.hasOwnProperty('taskCommitStartTime') && postJSON.hasOwnProperty('taskCommitEndTime') )
					{
						whereStr.taskCommitTime = mRange.taskCommitTime;
						console.log( mApplyRange.taskCommitTime );
					}

				    delete whereStr.taskCommitStartTime;
				    delete whereStr.taskCommitEndTime;

				    console.log(whereStr);
					dbClient.selectFunc( mongoClient, DB_CONN_STR, collectionName, whereStr,function(result){
						if( result.length > 0 )
						{
							var json = {success:result};
							response.write( JSON.stringify(json) );
							response.end();
						}else{
							var info = 	{ "error":  
							{  
								"msg": "没有查询记录!",  
								"code":"30001"  
							}  };
							response.write( JSON.stringify(result) );
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
//---------------------结束--查询APP历史数据接口--结束--------------------//



//---------------------开始--工单申请记录数据分析统计接口--开始--------------------//
function taskAnalyse(response, postData)
{
	try
	{
		console.log( "Request handler 'taskAnalyse' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "taskInfo";
		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };

		console.log(postJSON);
		//验证任务申请工单名和动态令牌
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


			    whereStr = postJSON;

				var mstartTime = { "taskStartTime":{$gte:parseInt( postJSON.taskStartTime) } };
				var mendTime = { "taskEndTime":{$lte:parseInt( postJSON.taskEndTime) } };
				var mApplyStartTime = { "applyTime":{$gte: Date.parse(postJSON.queryStartTime)/1000 } };
				var mApplyEndTime = { "applyTime":{$lte: Date.parse(postJSON.queryEndTime)/1000 } };
				var mApplyRange = { "applyTime":{$gte:Date.parse(postJSON.queryStartTime)/1000 , $lte:Date.parse(postJSON.queryEndTime)/1000 } };

				if( postJSON.hasOwnProperty('taskStartTime') )
				{
					whereStr.taskStartTime = mstartTime.taskStartTime;
					//delete postJSON.taskStartTime; 
				}

				if( postJSON.hasOwnProperty('taskEndTime') )
				{
					whereStr.taskEndTime = mendTime.taskEndTime;
					//delete postJSON.taskEndTime; 
				}

				if( postJSON.hasOwnProperty('queryStartTime') )
				{
					whereStr.applyTime = mApplyStartTime.applyTime;
					console.log( mApplyStartTime.applyTime );
					//delete postJSON.taskStartTime; 
				}

				if( postJSON.hasOwnProperty('queryEndTime') )
				{
					whereStr.applyTime = mApplyEndTime.applyTime;
					console.log( mApplyEndTime.applyTime );
					//delete postJSON.taskEndTime; 
				}

				if( postJSON.hasOwnProperty('queryStartTime') && postJSON.hasOwnProperty('queryEndTime') )
				{
					whereStr.applyTime = mApplyRange.applyTime;
					console.log( mApplyRange );
				}

			    delete whereStr.applyStartTime;
			    delete whereStr.applyEndTime;
			    delete whereStr.queryStartTime;
			    delete whereStr.queryEndTime;
			    
				console.log(whereStr);
				
				dbClient.selectFunc( mongoClient, DB_CONN_STR, collectionName,  whereStr , 
					function(result){
					//console.log(result);
					if( result.length>0 )
					{
						var json;
						var marray = [];
						var mmStartTime;
						var mmEndTime;
						for(var i=0;i<result.length;i++)
						{
							if(result[i].hasOwnProperty('applyTime'))
							{
								mmStartTime =  result[i].applyTime - result[i].applyTime%(3600*24) - 8*3600;
								break;
							}
						}

						for(var i=result.length-1;i>-1;i--)
						{
							if(result[i].hasOwnProperty('applyTime'))
							{
								mmEndTime =  result[i].applyTime - result[i].applyTime%(3600*24) - 8*3600;
								break;
							}
						}

						console.log("查询开始时间 "+formatToDetailDate(mmStartTime*1000)+" 查询结束时间 "+formatToDetailDate(mmEndTime*1000))
						
						var curPos = 0;
						for(var mmtime=mmStartTime;mmtime<mmEndTime+24*3600;mmtime=mmtime+24*3600)
						{
							marray.push( {date:formatToDate(mmtime*1000),num:0} );
							for(var j = 0;j<result.length;j++)
							{
								console.log(result[j].applyTime+" "+mmtime)
								if( result[j].hasOwnProperty('applyTime') 
									&& (result[j].applyTime>mmtime) 
									&& (result[j].applyTime<mmtime+24*3600) )
								{
									marray[curPos].num++;
								}
							}
							curPos++;
						}

						json = {success:marray};
						response.write( JSON.stringify(json) );

						response.end();

					}else{
						var json = 	{ "error":  
							{  
								"msg": "没有查询记录",  
								"code":"31001"  
							}  };
						response.write( JSON.stringify(json) );
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
//---------------------结束--工单申请记录数据分析统计接口--结束--------------------//



//---------------------开始--各地市门锁工单操作记录统计接口--开始--------------------//
function taskCalculate(response, postData)
{
	try
	{
		console.log( "Request handler 'taskCalculate' was called.");
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "appTaskInfo";
		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };

		console.log(postJSON);
		//验证任务申请工单名和动态令牌
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


			    whereStr = postJSON;

				var mStartTime = { "taskCommitTime":{$gte: Date.parse(postJSON.queryStartTime)/1000  } };
				var mEndTime = { "taskCommitTime":{$lte: Date.parse(postJSON.queryEndTime)/1000 } };
				var mRange = { "taskCommitTime":{$gte: Date.parse(postJSON.queryStartTime)/1000 , $lte: Date.parse(postJSON.queryEndTime)/1000 } };

				if( postJSON.hasOwnProperty('queryStartTime') )
				{
					whereStr.taskCommitTime = mStartTime.taskCommitTime;
					//delete postJSON.taskStartTime; 
				}

				if( postJSON.hasOwnProperty('queryEndTime') )
				{
					whereStr.taskCommitTime = mEndTime.taskCommitTime;
					//delete postJSON.taskEndTime; 
				}

				if( postJSON.hasOwnProperty('queryStartTime') && postJSON.hasOwnProperty('queryEndTime') )
				{
					whereStr.taskCommitTime = mRange.taskCommitTime;
					console.log( mRange.taskCommitTime );
				}

				if( postJSON.hasOwnProperty('taskType'))
				{
					if(postJSON.taskType == "open")
					{
						whereStr.operationResult = "开锁成功";
					}else if(postJSON.taskType == "close")
					{
						whereStr.operationResult = "上锁成功！";
					}
				}

				delete whereStr.taskType;
			    delete whereStr.taskCommitStartTime;
			    delete whereStr.taskCommitEndTime;
			    delete whereStr.queryStartTime;
			    delete whereStr.queryEndTime;

			    console.log(whereStr);
				
				dbClient.selectFunc( mongoClient, DB_CONN_STR, collectionName,  whereStr , 
					function(result){
					//console.log(result);
					if( result.length>0 )
					{
						var json;
						var marray = [];
						var mmStartTime;
						var mmEndTime;
						for(var i=0;i<result.length;i++)
						{
							if(result[i].hasOwnProperty('taskCommitTime'))
							{
								var mtime = parseInt(result[i].taskCommitTime);
								mmStartTime =  mtime - mtime%(3600*24) - 8*3600;
								break;
							}
						}

						for(var i=result.length-1;i>-1;i--)
						{
							if(result[i].hasOwnProperty('taskCommitTime'))
							{
								var mtime = parseInt(result[i].taskCommitTime);
								mmEndTime =  mtime - mtime%(3600*24) - 8*3600;
								break;
							}
						}

						console.log("查询开始时间 "+formatToDetailDate(mmStartTime*1000)+" 查询结束时间 "+formatToDetailDate(mmEndTime*1000))		
						var curPos = 0;
						for(var mmtime=mmStartTime;mmtime<mmEndTime+24*3600;mmtime=mmtime+24*3600)
						{
							marray.push( {date:formatToDate(mmtime*1000),num:0} );
							for(var j = 0;j<result.length;j++)
							{
								console.log(result[j].taskCommitTime+" "+mmtime)
								if( result[j].hasOwnProperty('taskCommitTime') 
									&& (parseInt(result[j].taskCommitTime)>mmtime) 
									&& (parseInt(result[j].taskCommitTime)<mmtime+24*3600) )
								{
									marray[curPos].num++;
								}
							}
							curPos++;
						}

						json = {success:marray};
						response.write( JSON.stringify(json) );

						response.end();
					}else{
						var json = {success:0};
						response.write( JSON.stringify(json) );
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
//---------------------结束--各地市门锁工单操作记录统计接口--结束--------------------//



//---------------------开始--模块导出接口声明--开始--------------------//
exports.taskRequest = taskRequest; //任务申请和任务修改
exports.taskFetch = taskFetch;
exports.taskAuthenticate = taskAuthenticate;
exports.taskAuthFetch = taskAuthFetch;
exports.taskCommit = taskCommit;
exports.downloadTask = downloadTask;
exports.taskChange = taskChange;
exports.appTaskRecord = appTaskRecord;
exports.appTaskConsult = appTaskConsult;
exports.taskAnalyse = taskAnalyse;
exports.taskCalculate = taskCalculate;
//---------------------结束--模块导出接口声明--结束--------------------//

