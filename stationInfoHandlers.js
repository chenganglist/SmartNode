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


//封装JSON字段不确定参数判断函数---待完成
function judgeOriginalStationID(postJSON,response)
{
	if( !postJSON.hasOwnProperty("originalStationID") )
	{
		var info = 	{ "error":  
		{  
			"msg": "请输入原始基站ID!",  
			"code":"00003"  
		}  };
		response.write( JSON.stringify(info) );
		response.end();
		return false;
	}
	return true;
}

//封装JSON字段不确定参数判断函数---待完成
function judgeStationID(postJSON,response)
{
	if( !postJSON.hasOwnProperty("stationID") )
	{
		var info = 	{ "error":  
		{  
			"msg": "请输入基站ID!",  
			"code":"00002"  
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


//---------------------开始--基站添加函数--开始--------------------//
function addStation(response, postData)
{
	try
	{
		console.log( "Request handler 'addStation' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "stationInfo";
		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
	    if( judgeStationID(postJSON,response)==false ){  return;  };

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
					if( result[0].hasOwnProperty('addStationAction') == false || result[0].addStationAction != "true" )
					{	
						var info = 	{ "error":  
							{  
								"msg": "你没有添加基站的权限!",  
								"code":"00002"  
							}  };
						response.write( JSON.stringify(info) );
						response.end();
						return;
					}
					postJSON.stationID = parseInt(postJSON.stationID);
					delete postJSON.accessToken;
					delete postJSON.operatorName;
					//判断用户chargePerson是否存在
					var whereStr = {"username":postJSON.chargePerson};
					dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
						//console.log(result);
						if(result.length>0)
						{

							//直接替换为系统中负责人的电话号码
							postJSON.chargePhone = result[0].phone;
							postJSON.chargeCompany = result[0].company;
		
							var whereStr = {"username":postJSON.approvalPerson};
							dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
								//console.log(result);
								if(result.length>0)
								{
										//直接替换为系统中审批人的电话号码
										postJSON.approvalPhone = result[0].phone;
										//插入请求数据
										dbClient.insertFunc( mongoClient, DB_CONN_STR, collectionName,  postJSON, function(result){
												if( result.hasOwnProperty("errmsg") )
												{
													var info = 	{ "error":  
														{  
															"msg": "基站ID或锁ID或基站地址重复!",  
															"code":"07001"  
														}  };
													response.write( JSON.stringify(info) );
													response.end();
												}else{
													var info = 	{ "success":  
													{  
														"msg": "基站添加成功!",  
														"code":"07000"  
													}  };
													response.write( JSON.stringify(info) );
													response.end();
												}
										
										});	

								}else{
									var info = 	{ "error":  
										{  
											"msg": "基站审批人没有录入系统",  
											"code":"07003"  
										}  };
									response.write( JSON.stringify(info) );
									response.end();
								}
							});
						}else{
								var info = 	{ "error":  
									{  
										"msg": "基站负责人没有录入系统",  
										"code":"07002"  
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
//---------------------结束--基站添加函数--结束--------------------//




//---------------------开始--基站删除函数--开始--------------------//
function deleteStation(response, postData)
{
	try
	{
		console.log( "Request handler 'deleteStation' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});

		var postJSON = querystring.parse(postData);

		console.log(postJSON);

		if( !postJSON.hasOwnProperty("deleteList") || !postJSON.hasOwnProperty("operatorName") || !postJSON.hasOwnProperty("accessToken"))
		{
			var info = 	{ "error":  
			{  
				"msg": "参数格式错误!",  
				"code":"08001"  
			}  };
			response.write( JSON.stringify(info) );
			response.end();
			return;
		}

		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "stationInfo";



		//验证用户名和动态令牌
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
			//console.log(result);
			if(result.length>0)
			{
				//动态令牌有效性判断
				if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };

				if( result[0].hasOwnProperty('deleteStationAction') == false || result[0].deleteStationAction != "true" )
				{	
					var info = 	{ "error":  
						{  
							"msg": "你没有删除基站的权限!",  
							"code":"00003"  
						}  };
					response.write( JSON.stringify(info) );
					response.end();
					return;
				}


				var stationStr = postJSON.deleteList.toString();
				stationStr = stationStr.replace("[","");
				stationStr = stationStr.replace("]","");
				console.log(stationStr);

				var stationList = stationStr.split(",");

				for(var i=0;i<stationList.length;i++)
				{
					console.log(stationList[i]);
					console.log("删除的基站： "+stationList[i]);
					//var whereStr = {stationID:stationList[i].toString()};
					try{
						var whereStr = {stationID:parseInt(stationList[i])};
						dbClient.deleteFunc( mongoClient, DB_CONN_STR, collectionName,  whereStr , function(result){
							console.log("删除信息"+result);
						});							
					}catch(e)
					{
						
					}

				}
				var info = 	{ "success":  
				{  
					"msg": "基站删除成功!",  
					"code":"08000"  
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
//---------------------结束--基站删除函数--结束--------------------//



//---------------------开始--基站更新函数--开始--------------------//
function updateStation(response, postData)
{
	try
	{
		console.log( "Request handler 'updateStation' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "stationInfo";

		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
	    if( judgeOriginalStationID(postJSON,response)==false ){  return;  };

		//验证用户名和动态令牌
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
				//console.log(result);
				if(result.length>0)
				{
					//动态令牌有效性判断
					if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };

					if( result[0].hasOwnProperty('updateStationAction') == false || result[0].updateStationAction != "true" )
					{	
						var info = 	{ "error":  
							{  
								"msg": "你没有修改基站的权限!",  
								"code":"00005"  
							}  };
						response.write( JSON.stringify(info) );
						response.end();
						return;
					}

					delete postJSON.accessToken;
					delete postJSON.operatorName;

					if( postJSON.hasOwnProperty("chargePerson") &&  postJSON.hasOwnProperty("approvalPerson") )
					{
									//判断用户chargePerson是否存在
									var whereStr = {"username":postJSON.chargePerson};
									dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
										//console.log(result);
										if(result.length>0)
										{
											//判断用户approvalPerson是否存在
											postJSON.chargePhone = result[0].phone;
											postJSON.chargeCompany = result[0].company;

											var whereStr = {"username":postJSON.approvalPerson};
											dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
												//console.log(result);
												if(result.length>0)
												{
													    //编辑基站信息
													    postJSON.approvalPhone = result[0].phone;
														var whereStr = {stationID:postJSON.originalStationID};
														var updateStr = {$set: postJSON };
														dbClient.updateFunc( mongoClient, DB_CONN_STR, collectionName, whereStr, updateStr,function(result){
															if( result.hasOwnProperty("errmsg") )
															{
																var info = 	{ "error":  
																	{  
																		"msg": "基站ID已存在!",  
																		"code":"09001"  
																	}  };
																response.write( JSON.stringify(info) );
																response.end();
															}else{
																var info = 	{ "success":  
																{  
																	"msg": "基站信息编辑成功!",  
																	"code":"09000"  
																}  };
																response.write( JSON.stringify(info) );
																response.end();
															}
														});									
												}else{
													var info = 	{ "error":  
														{  
															"msg": "基站审批人没有录入系统",  
															"code":"09003"  
														}  };
													response.write( JSON.stringify(info) );
													response.end();
												}
											});
										}else{
												var info = 	{ "error":  
													{  
														"msg": "基站负责人没有录入系统",  
														"code":"09002"  
													}  };
												response.write( JSON.stringify(info) );
												response.end();
										}
									});

					}else if( postJSON.hasOwnProperty("chargePerson") )
					{
									//判断用户chargePerson是否存在
									var whereStr = {"username":postJSON.chargePerson};
									dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
										//console.log(result);
										if(result.length>0)
										{
											    //编辑基站信息
											    postJSON.chargePhone = result[0].phone;
											    postJSON.chargeCompany = result[0].company;
											    
												var whereStr = {stationID:postJSON.originalStationID};
												var updateStr = {$set: postJSON };
												dbClient.updateFunc( mongoClient, DB_CONN_STR, collectionName, whereStr, updateStr,function(result){
													if( result.hasOwnProperty("errmsg") )
													{
														var info = 	{ "error":  
															{  
																"msg": "基站ID已存在!",  
																"code":"09001"  
															}  };
														response.write( JSON.stringify(info) );
														response.end();
													}else{
														var info = 	{ "success":  
														{  
															"msg": "基站信息编辑成功!",  
															"code":"09000"  
														}  };
														response.write( JSON.stringify(info) );
														response.end();
													}
												});									
										}else{
												var info = 	{ "error":  
													{  
														"msg": "基站负责人没有录入系统",  
														"code":"09002"  
													}  };
												response.write( JSON.stringify(info) );
												response.end();
										}
									});


					}else if( postJSON.hasOwnProperty("approvalPerson") )
					{
											//判断用户approvalPerson是否存在
											var whereStr = {"username":postJSON.approvalPerson};
											dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
												//console.log(result);
												if(result.length>0)
												{
													    //编辑基站信息
													    postJSON.approvalPhone = result[0].phone;
														var whereStr = {stationID:postJSON.originalStationID};
														var updateStr = {$set: postJSON };
														dbClient.updateFunc( mongoClient, DB_CONN_STR, collectionName, whereStr, updateStr,function(result){
															if( result.hasOwnProperty("errmsg") )
															{
																var info = 	{ "error":  
																	{  
																		"msg": "基站ID已存在!",  
																		"code":"09001"  
																	}  };
																response.write( JSON.stringify(info) );
																response.end();
															}else{
																var info = 	{ "success":  
																{  
																	"msg": "基站信息编辑成功!",  
																	"code":"09000"  
																}  };
																response.write( JSON.stringify(info) );
																response.end();
															}
														});									
												}else{
													var info = 	{ "error":  
														{  
															"msg": "基站审批人没有录入系统",  
															"code":"09003"  
														}  };
													response.write( JSON.stringify(info) );
													response.end();
												}
											});
									
					}else
					{

									    //编辑基站信息
										var whereStr = {stationID:postJSON.originalStationID};
										var updateStr = {$set: postJSON };
										dbClient.updateFunc( mongoClient, DB_CONN_STR, collectionName, whereStr, updateStr,function(result){
											if( result.hasOwnProperty("errmsg") )
											{
												var info = 	{ "error":  
													{  
														"msg": "基站ID已存在!",  
														"code":"09001"  
													}  };
												response.write( JSON.stringify(info) );
												response.end();
											}else{
												var info = 	{ "success":  
												{  
													"msg": "基站信息编辑成功!",  
													"code":"09000"  
												}  };
												response.write( JSON.stringify(info) );
												response.end();
											}
										});					
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
//---------------------结束--基站更新函数--结束--------------------//




//---------------------开始--基站查询函数--开始--------------------//
function selectStation(response, postData)
{
	try
	{
		console.log( "Request handler 'selectStation' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "stationInfo";
		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
		
		console.log(postJSON);
		if(postJSON.hasOwnProperty("stationID"))
		{
			postJSON.stationID = parseInt(postJSON.stationID);
		}
		//验证用户名和动态令牌
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};

		console.log(whereStr);
		dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
			//console.log(result);
			if(result.length>0)
			{
				//动态令牌有效性判断
				if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };
				// if( result[0].hasOwnProperty('queryStationAction') == false || result[0].queryStationAction != "true" )
				// {	
				// 	var info = 	{ "error":  
				// 		{  
				// 			"msg": "你没有查询基站的权限!",  
				// 			"code":"00004"  
				// 		}  };
				// 	response.write( JSON.stringify(info) );
				// 	response.end();
				// 	return;
				// }
				delete postJSON.operatorName; 
				delete postJSON.accessToken; 
				var consultNum = 0;


				if( postJSON.hasOwnProperty("lockNum") )
				{
					if(postJSON.lockNum == "Yes" )
					{
							consultNum = 1;
					}
				}

				if( postJSON.hasOwnProperty("address") )
				{
					postJSON.address =  {$regex:postJSON.address,$options:'i'};
				}

				delete postJSON.lockNum;

				dbClient.selectFunc( mongoClient, DB_CONN_STR, collectionName,  postJSON , 
					function(result){
					if( result.length>0 )
					{
						var json = {};
						switch(consultNum)
						{
							case 0:
							{
								var count = result.length;
								if(result.length>100)
								{
									result = result.slice(0,100);
								}
								//json.description = "总共查询到"+count+"条数据,限制返回"+result.length+"条";
								json.success = result;
								break;
							}
							case 1:
							{
								var marray = [];
								//console.log(result);
								//统计同一区域基站或门锁个数
								for(var i=0;i<result.length;i++)
								{
									try{
										var isExists = false;
										for(var j=0;j<marray.length;j++)
										{
											//去重计数
											if( marray[j].managementArea == result[i].managementArea)
											{
												isExists = true;
												marray[j].num++;
											}
										}
										if(isExists == false)
										{
											marray.push( {managementArea:result[i].managementArea, "num":1} );
										}
									}catch(e){
										console.log(e);
									}
								}
								json = { success:marray };
								break;
							}
						}

						response.write( JSON.stringify(json) );
						response.end();
					}else{

						if(consultNum > 0)
						{
							var info = 	{ "success":0};
							response.write( JSON.stringify(info) );
							response.end();
							return;
						}

						var info = 	{ "error":  
						{  
							"msg": "没有查询记录!",  
							"code":"10001"  
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
//---------------------结束--基站查询函数--结束--------------------//


//---------------------开始--全国地址分级查询函数--开始--------------------//
function selectAreaInfo(response, postData)
{
	try
	{
		console.log( "Request handler 'selectAreaInfo' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	
		var collectionName = "chinaInfo";
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

				delete postJSON.operatorName; 
				delete postJSON.accessToken; 
				try{
					if(postJSON.hasOwnProperty("areaID"))
					{
						postJSON.areaID = parseInt(postJSON.areaID);
					}
					if(postJSON.hasOwnProperty("areaParentID"))
					{
						postJSON.areaParentID = parseInt(postJSON.areaParentID);
					}
					if(postJSON.hasOwnProperty("areaLevel"))
					{
						postJSON.areaLevel = parseInt(postJSON.areaLevel);
					}
				}catch(e){
					console.log("type error");
				}

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
							"code":"42001"  
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
//---------------------结束--全国地址分级查询函数--结束--------------------//

//---------------------开始--Excel表格下载接口--开始--------------------//
function downloadStation(response, postData)
{
	try
	{
		console.log( "Request handler 'downloadStation' was called." );
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
				if( result[0].hasOwnProperty('queryStationAction') == false || result[0].queryStationAction != "true" )
				{	
					var info = 	{ "error":  
						{  
							"msg": "你没有查询基站的权限!",  
							"code":"00004"  
						}  };
					response.write( JSON.stringify(info) );
					response.end();
					return;
				}				
				var fileName = postJSON.operatorName;
				delete postJSON.operatorName; 
				delete postJSON.accessToken; 
				dbClient.selectFunc( mongoClient, DB_CONN_STR, "stationInfo",  postJSON , 
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
							            caption:'基站ID',
							            type:'string',
							        },
							        {
							            caption:'基站门锁ID',
							            type:'string'
							        },
							        {
							            caption:'基站地址',
							            type:'string',
							        },
							        {
							            caption:'基站负责人',
							            type:'string'
							        },
							        {
							            caption:'基站审批人',
							             type:'string'              
							        }
							];
							conf.rows = [];
							for(var i=0;i<result.length;i++)
							{
								conf.rows[i] = [result[i].stationID, result[i].lockID , result[i].address,
								result[i].chargePerson, result[i].approvalPerson ];
							}

							var result = nodeExcel.execute(conf);
							console.log('export successfully!');
							fs.writeFileSync('/usr/share/nginx/MBS_WebSourceCode/'+fileName+'基站信息.xlsx', result, 'binary');
							var info = 	{ "success":  
							{  
								"url": 'https://www.smartlock.top/'+fileName+'基站信息.xlsx',  
								"code":"11000"  
							}  };
							response.write( JSON.stringify(info) );
							response.end();
					}else{
						var info = 	{ "error":  
						{  
							"msg": "没有数据记录!",  
							"code":"11001"  
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



//---------------------开始--从Excel表格导入基站数据接口--开始--------------------//
function importDataFromExcel(response, postData)
{
	try
	{
		console.log( "Request handler 'importDataFromExcel' was called." );
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
				if( result[0].hasOwnProperty('addStationAction') == false || result[0].addStationAction != "true" )
				{	
					var info = 	{ "error":  
						{  
							"msg": "你没有添加基站的权限!",  
							"code":"00002"  
						}  };
					response.write( JSON.stringify(info) );
					response.end();
					return;
				}				
								var fileName = postJSON.operatorName;
				delete postJSON.operatorName; 
				delete postJSON.accessToken; 

				var excelImport = require('./node-excel.js');

				if( postJSON.importDestination == '0' )
				{
					excelImport.importStationFromExcel(postJSON.filename, response);
				}else if( postJSON.importDestination == '1' )
				{
					excelImport.importKeyFromExcel(postJSON.filename, response);
				}else{

					var failedInfo = 	{ "error":  
					{  
						"msg": "数据导入失败,参数错误，目标不存在",  
						"code":"28002"  
					}  };
					
					response.write( JSON.stringify(failedInfo) );
					response.end();
				}

			}else{
				var info = 	{ "error":  
					{  
						"msg": "用户名不存在或动态令牌已过期",  
						"code":"28000"  
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
//---------------------结束--从Excel表格导入基站数据接口--结束--------------------//




//---------------------开始--基站日志查询函数--开始--------------------//
function queryStationLog(response, postData)
{
	try
	{
		console.log( "Request handler 'queryStationLog' was called." );
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
				if( result[0].hasOwnProperty('queryStationAction') == false || result[0].queryStationAction != "true" )
				{	
					var info = 	{ "error":  
						{  
							"msg": "你没有查询基站的权限!",  
							"code":"00004"  
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

				if( postJSON.hasOwnProperty('stationID') )
				{
					whereStr.stationID = postJSON.stationID;   
				}

				if( postJSON.hasOwnProperty('address') )
				{
					whereStr.stationAddress = postJSON.address;  
				}

				if( postJSON.hasOwnProperty('stationManagementProvince') )
				{
					whereStr.stationManagementProvince = postJSON.stationManagementProvince;  
				}

				if( postJSON.hasOwnProperty('stationManagementCity') )
				{
					whereStr.stationManagementCity = postJSON.stationManagementCity;  
				}


				if( postJSON.hasOwnProperty('stationManagementArea') )
				{
					whereStr.stationManagementArea = postJSON.stationManagementArea;  
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
							"code":"24001"  
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
//---------------------结束--基站日志查询函数--结束--------------------//



//---------------------开始--基站日志Excel表格下载接口--开始--------------------//
function downloadStationLog(response, postData)
{
	try
	{
		console.log( "Request handler 'downloadStationLog' was called." );
		response.writeHead(200, {"Content-Type": "text/plain,charset=utf-8"});
		var postJSON = querystring.parse(postData);
		var mongoClient = require('mongodb').MongoClient;
		var DB_CONN_STR = 'mongodb://localhost:27017/csis';	

		//判断操作者和动态令牌是否存在
		if( judgeUserToken(postJSON,response)==false ){  return;  };
		
		console.log(postJSON);

		//验证用户名和动态令牌
		var whereStr = {username:postJSON.operatorName,accessToken:postJSON.accessToken};
		var fileName = postJSON.operatorName + "基站日志";

		console.log(whereStr);
		dbClient.selectFunc( mongoClient, DB_CONN_STR, "userInfo",  whereStr , function(result){
			//console.log(result);
			if(result.length>0)
			{
				//动态令牌有效性判断
				if( judgeTokenTime(result[0].tokenEndTime,response)==false ){ return; };
				if( result[0].hasOwnProperty('queryStationAction') == false || result[0].queryStationAction != "true" )
				{	
					var info = 	{ "error":  
						{  
							"msg": "你没有查询基站的权限!",  
							"code":"00004"  
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

				if( postJSON.hasOwnProperty('stationID') )
				{
					whereStr.stationID = postJSON.stationID;   
				}

				if( postJSON.hasOwnProperty('address') )
				{
					whereStr.stationAddress = postJSON.address;  
				}

				if( postJSON.hasOwnProperty('stationManagementProvince') )
				{
					whereStr.stationManagementProvince = postJSON.stationManagementProvince;  
				}

				if( postJSON.hasOwnProperty('stationManagementCity') )
				{
					whereStr.stationManagementCity = postJSON.stationManagementCity;  
				}


				if( postJSON.hasOwnProperty('stationManagementArea') )
				{
					whereStr.stationManagementArea = postJSON.stationManagementArea;  
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

								var startDate = new Date(result[i].taskStartTime * 1000).toISOString(); 
								var endDate = new Date(result[i].taskEndTime * 1000).toISOString();

								// var startDateTime = (startDate.getFullYear()) + "-" + (startDate.getMonth() + 1) + "-" +
								// (startDate.getDate()) + "   " + 
								//  (startDate.getHours()) + ":" + (startDate.getMinutes()) + ":" + (startDate.getSeconds());

								// var endDateTime  = (endDate.getFullYear()) + "-" + (endDate.getMonth() + 1) + "-" +(endDate.getDate()) + "   " + (endDate.getHours()) + ":" + (endDate.getMinutes()) + ":" + (endDate.getSeconds());

								conf.rows[i] = [result[i].stationID, result[i].stationAddress,result[i].applicantKeyID, result[i].taskID,
								 result[i].keyManagementProvince, result[i].keyManagementCity, result[i].keyManagementArea,
								 result[i].stationManagementProvince, result[i].stationManagementCity, result[i].stationManagementArea,
								 result[i].applicantName, result[i].applicantPhone, result[i].applyDescription,
								startDate
								, endDate ];
							}


							var result = nodeExcel.execute(conf);
							console.log('export Log successfully!');
							fs.writeFileSync('/usr/share/nginx/MBS_WebSourceCode/'+fileName+'.xlsx', result, 'binary');
							var info = 	{ "success":  
							{  
								"url": 'https://www.smartlock.top/'+fileName+'.xlsx',  
								"code":"25000"  
							}  };
							response.write( JSON.stringify(info) );
							response.end();
					}else{
						var info = 	{ "error":  
						{  
							"msg": "没有查询记录!",  
							"code":"25001"  
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
//---------------------结束--基站日志Excel表格下载接口--结束--------------------//



//---------------------开始--从csv表格导入数据接口--开始--------------------//
function importFromCSVForAll(response, postData)
{
	try
	{
		console.log( "Request handler 'importFromCSVForAll' was called." );
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

				delete postJSON.operatorName; 
				delete postJSON.accessToken; 

				var excelImport = require('./node-excel.js');
			    excelImport.importDataFromCSV(postJSON.filename,postJSON.collectionName,response);
			    console.log("import started");

			}else{
				var info = 	{ "error":  
					{  
						"msg": "用户名不存在或动态令牌已过期",  
						"code":"48000"  
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
//---------------------结束--从csv表格导入数据接口--结束--------------------//


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


//---------------------开始--手动备份接口--开始--------------------//
function userBackup(response, postData)
{
	try
	{
		console.log( "Request handler 'userBackup' was called." );
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

				delete postJSON.operatorName; 
				delete postJSON.accessToken; 

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
				var info = 	{ "success":  
					{  
						"msg": "数据备份成功",  
						"code":"47000"  
					}  };
				response.write( JSON.stringify(info) );
				response.end();

			}else{
				var info = 	{ "error":  
					{  
						"msg": "用户名不存在或动态令牌已过期",  
						"code":"48000"  
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
//---------------------结束--手动备份接口--结束--------------------//

//---------------------开始--模块导出接口声明--开始--------------------//
exports.addStation = addStation;
exports.importFromCSVForAll = importFromCSVForAll;
exports.updateStation = updateStation;
exports.deleteStation = deleteStation;
exports.selectStation = selectStation;
exports.downloadStation = downloadStation;
exports.queryStationLog = queryStationLog;
exports.downloadStationLog = downloadStationLog;
exports.selectAreaInfo = selectAreaInfo;
exports.importDataFromExcel = importDataFromExcel;
exports.userBackup = userBackup;
//---------------------结束--模块导出接口声明--结束--------------------//
