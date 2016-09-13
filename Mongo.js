//---------------------开始--批量update--开始--------------------//
var updateMultiData = function(db, collectionName, whereStr ,updateStr){   
  var collection = db.collection(collectionName);   //连接到表 
  collection.update( whereStr, updateStr, {w: 1, multi:true}, function(err, result) {    //更新数据
    if(err)
    {
	      //console.log(err);
	      db.close();
	      return;
    }	
    //console.log(result); 
    db.close();
    return;
  });
}

function updateMultiFunc( mongoClient,DB_CONN_STR,collectionName, whereStr ,updateStr)
{
	mongoClient.connect(DB_CONN_STR, function(err, db) {
	  //console.log("连接成功！");
	  updateMultiData(db, collectionName, whereStr ,updateStr, {multi:true});
	});
}
//---------------------结束--批量update---结束--------------------//


//---------------------开始--count查询函数--开始--------------------//
var countData = function(db, collectionName, queryFilter,callback) {   
  var collection = db.collection(collectionName);    //连接到表 
  collection.count(queryFilter, function(err, result) {    //插入数据
	    if(err)
	    {
	      callback(err);
	      db.close();
	      return;
	    }	 
	    callback(result);
	    db.close();
  });
}

function countFunc( mongoClient, DB_CONN_STR, collectionName,queryFilter,callback)
{
	mongoClient.connect(DB_CONN_STR, function(err, db) {
		//console.log("连接成功！");
		countData(db, collectionName, queryFilter,  callback);
	});
}
//---------------------结束--count查询函数--结束--------------------//


//---------------------开始--distinct查询函数--开始--------------------//
var distincData = function(db, collectionName, field, queryFilter,callback) {   
  var collection = db.collection(collectionName);    //连接到表 
  collection.distinct(field, queryFilter, function(err, result) {    //插入数据
	    if(err)
	    {
	      callback(err);
	      db.close();
	      return;
	    }	 
	    callback(result);
	    db.close();
  });
}

function distinctFunc( mongoClient, DB_CONN_STR, collectionName, field, queryFilter,callback)
{
	mongoClient.connect(DB_CONN_STR, function(err, db) {
		//console.log("连接成功！");
		distincData(db, collectionName, field, queryFilter, callback);
	});
}
//---------------------结束--distinct查询函数--结束--------------------//


//---------------------开始--批量导入数据，传入JSON数组--开始--------------------//
var insertMultiData = function(db, collectionName, dataArray , callback) {   
  var mlength = dataArray.length;
  var collection = db.collection(collectionName);    //连接到表 
  for(var i=0;i<mlength;i++)
  {
  	  collection.insert(data, function(err, result){});
  }
  db.close();
}

function insertMultiFunc( mongoClient, DB_CONN_STR, collectionName, dataArray, callback)
{
	mongoClient.connect(DB_CONN_STR, function(err, db) {
		//console.log("连接成功！");
		insertMultiData(db, collectionName, dataArray , callback);
	});
}
//---------------------结束--批量导入数据，传入JSON数组--结束--------------------//


//---------------------开始--数据插入函数--开始--------------------//
var insertData = function(db, collectionName, data , callback) {   
  var collection = db.collection(collectionName);    //连接到表 
  collection.insert(data, function(err, result) {    //插入数据
	    if(err)
	    {
	      callback(err);
	      db.close();
	      return;
	    }	 
	    callback(result);
      	db.close();
  });
}

function insertFunc( mongoClient, DB_CONN_STR, collectionName, data, callback)
{
	mongoClient.connect(DB_CONN_STR, function(err, db) {
		//console.log("连接成功！");
		insertData(db, collectionName, data , callback);
	});
}
//---------------------结束--数据插入函数--结束--------------------//







//---------------------开始--数据查询函数--开始--------------------//
var selectData = function(db, collectionName, whereStr , callback) {  
  //连接到表  
  var collection = db.collection(collectionName);
  collection.find(whereStr).toArray(function(err, result) {
	    if(err)
	    {
	      callback(err);
	      db.close();
	      return;
	    }     
	    callback(result);
	    db.close();
  });
}

function selectFunc( mongoClient,  DB_CONN_STR, collectionName,  whereStr,  callback)
{
	mongoClient.connect(DB_CONN_STR, function(err, db) {
		  //console.log("连接成功！");
		  selectData(db, collectionName,  whereStr,callback);
	});
}
//---------------------结束--数据查询函数--结束--------------------//






//---------------------开始--数据修改函数--开始--------------------//
var updateData = function(db, collectionName, whereStr ,updateStr, callback){   
  var collection = db.collection(collectionName);   //连接到表 
  collection.update( whereStr, updateStr, function(err, result) {    //更新数据
    if(err)
    {
	      callback("err");
	      db.close();
	      return;
    }	 
    callback(result);
    db.close();
  });
}

function updateFunc( mongoClient,DB_CONN_STR,collectionName, whereStr ,updateStr , callback)
{
	mongoClient.connect(DB_CONN_STR, function(err, db) {
	  //console.log("连接成功！");
	  updateData(db, collectionName, whereStr ,updateStr, callback);
	});
}
//---------------------结束--数据修改函数--结束--------------------//





//---------------------开始--数据删除函数--开始--------------------//
var delData = function(db, collectionName, whereStr , callback) {  
  var collection = db.collection(collectionName);    //连接到表  
  collection.remove(whereStr, function(err, result) {
    if(err)
    {
		callback(err);
		db.close();
		return;
    }     
    callback(result);
    db.close();
  });
}

function deleteFunc( mongoClient,DB_CONN_STR,collectionName, whereStr, callback )
{
	mongoClient.connect(DB_CONN_STR, function(err, db) {
	  //console.log("连接成功！");
	  delData(db, collectionName, whereStr,callback);
	});
}
//---------------------结束--数据删除函数--结束--------------------//






//---------------------开始--调用存储过程--开始--------------------//
var invokeProcData = function(db, callback) {  
  db.eval(proc, function(err, result) {   //存储过程调用
    if(err)
    {
      callback(err);
      db.close();
      return;
    }			 
    callback(result);
    db.close();
  });
}


function invokeProcFunc(mongoClient,DB_CONN_STR,callback)
{
	mongoClient.connect(DB_CONN_STR, function(err, db) {
	  //console.log("连接成功！");
	  invokeProcData(db,  callback);
	});

}
//---------------------结束--调用存储过程--结束--------------------//



//---------------------开始--模块导出接口声明--开始--------------------//
exports.insertFunc = insertFunc;
exports.selectFunc = selectFunc;
exports.updateFunc = updateFunc;
exports.deleteFunc = deleteFunc;
exports.distinctFunc = distinctFunc;
exports.countFunc = countFunc;
exports.invokeProcFunc = invokeProcFunc;
exports.updateMultiFunc = updateMultiFunc;
//---------------------结束--模块导出接口声明--结束--------------------//