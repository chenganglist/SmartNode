var server = require("./server"); //https服务模块

var router = require("./router"); //路由配置模块

var userInfoHandlers = require("./userInfoHandlers");  //用户信息请求处理模块
var stationInfoHandlers = require("./stationInfoHandlers");  //基站信息请求处理模块
var keyInfoHandlers = require("./keyInfoHandlers");  //电子钥匙信息请求处理模块
var lockInfoHandlers = require("./lockInfoHandlers");  //锁具信息请求处理模块
var taskInfoHandlers = require("./taskInfoHandlers");  //工单任务信息请求处理模块
var companyInfoHandlers = require("./companyInfoHandlers");  //公司信息请求处理模块


//---------------------开始--对象handle：存储处理函数--开始--------------------//
var handle = {};
handle["/v0/"] = userInfoHandlers.login;
handle["/v0/login"] = userInfoHandlers.login;
handle["/v0/addUser"] = userInfoHandlers.addUser;
handle["/v0/queryUser"] = userInfoHandlers.selectUser;
handle["/v0/deleteUser"] = userInfoHandlers.deleteUser;
handle["/v0/updateUser"] = userInfoHandlers.updateUser;
handle["/v0/downloadUser"] = userInfoHandlers.downloadUser;
handle["/v0/personalConfig"] = userInfoHandlers.personalConfig;



handle["/v0/addCompany"] = companyInfoHandlers.addCompany;
handle["/v0/queryCompany"] = companyInfoHandlers.selectCompany;
handle["/v0/deleteCompany"] = companyInfoHandlers.deleteCompany;
handle["/v0/updateCompany"] = companyInfoHandlers.updateCompany;
handle["/v0/downloadCompany"] = companyInfoHandlers.downloadCompany;



handle["/v0/addStation"] = stationInfoHandlers.addStation;
handle["/v0/queryStation"] = stationInfoHandlers.selectStation;
handle["/v0/deleteStation"] = stationInfoHandlers.deleteStation;
handle["/v0/updateStation"] = stationInfoHandlers.updateStation;
handle["/v0/downloadStation"] = stationInfoHandlers.downloadStation;
handle["/v0/importDataFromExcel"] = stationInfoHandlers.importDataFromExcel;
handle["/v0/queryStationLog"] = stationInfoHandlers.queryStationLog;
handle["/v0/downloadStationLog"] = stationInfoHandlers.downloadStationLog;
handle["/v0/queryAreaInfo"] = stationInfoHandlers.selectAreaInfo;
handle["/v0/importFromCSVForAll"] = stationInfoHandlers.importFromCSVForAll;
handle["/v0/userBackup"] = stationInfoHandlers.userBackup;





handle["/v0/addKey"] = keyInfoHandlers.addKey;
handle["/v0/queryKey"] = keyInfoHandlers.selectKey;
handle["/v0/deleteKey"] = keyInfoHandlers.deleteKey;
handle["/v0/updateKey"] = keyInfoHandlers.updateKey;
handle["/v0/downloadKey"] = keyInfoHandlers.downloadKey;
handle["/v0/queryKeyLog"] = keyInfoHandlers.queryKeyLog;
handle["/v0/downloadKeyLog"] = keyInfoHandlers.downloadKeyLog;

//查询所有数据表的接口，通过指定数据表单实现
handle["/v0/queryAll"] = keyInfoHandlers.selectAll;
//修改所有数据表的接口，通过指定数据表单实现
handle["/v0/updateAll"] = keyInfoHandlers.updateAll;
//增加所有数据表的接口，通过指定数据表单实现
handle["/v0/addAll"] = keyInfoHandlers.addAll;
//删除所有数据表的接口，通过指定数据表单实现
handle["/v0/deleteAll"] = keyInfoHandlers.deleteAll;

handle["/v0/queryAllSpecial"] = keyInfoHandlers.selectAllSpecial;

handle["/v0/addLock"] = lockInfoHandlers.addLock;
handle["/v0/queryLock"] = lockInfoHandlers.selectLock;
handle["/v0/deleteLock"] = lockInfoHandlers.deleteLock;
handle["/v0/updateLock"] = lockInfoHandlers.updateLock;
handle["/v0/downloadLock"] = lockInfoHandlers.downloadLock;
handle["/v0/queryLockLog"] = lockInfoHandlers.queryLockLog;
handle["/v0/downloadLockLog"] = lockInfoHandlers.downloadLockLog;




handle["/v0/taskRequest"] = taskInfoHandlers.taskRequest;
handle["/v0/taskFetch"] = taskInfoHandlers.taskFetch;
handle["/v0/taskAuthenticate"] = taskInfoHandlers.taskAuthenticate;
handle["/v0/taskAuthFetch"] = taskInfoHandlers.taskAuthFetch;
handle["/v0/taskCommit"] = taskInfoHandlers.taskCommit;
handle["/v0/downloadTask"] = taskInfoHandlers.downloadTask;
handle["/v0/taskChange"] = taskInfoHandlers.taskChange;
handle["/v0/appTaskRecord"] = taskInfoHandlers.appTaskRecord;
handle["/v0/appTaskConsult"] = taskInfoHandlers.appTaskConsult;
handle["/v0/taskAnalyse"] = taskInfoHandlers.taskAnalyse;
handle["/v0/taskCalculate"] = taskInfoHandlers.taskCalculate;
//---------------------结束--对象handle：存储处理函数--结束--------------------//



//---------------------开始--后台启动入口--开始--------------------//
server.start(router.route,handle);
//---------------------结束--后台启动入口--结束--------------------//