var httpsModule = require("https");
var fs = require('fs');
var url = require("url");
var formidable = require('formidable');
var util = require('util');
var uuid = require('node-uuid');

//---------------------开始--https启动监听，路由分配函数--开始--------------------//
function onRequest(request,response)
{
	var postData = "";
	var pathname = url.parse(request.url).pathname;
	console.log("Request for " + pathname + " started.");

	if( pathname.indexOf('/v1') < 0 )
	{
		var info = 	{ "error":  
		{  
			"msg": "请输入/v1/+当前html名字，作为上传POST路径!",  
			"code":"00003"  
		}  };
		response.write( JSON.stringify(info) );
		response.end();
		return;
	}

	pathname = pathname.replace("/v1/","");
	
    try
    {
		if( request.method.toLowerCase() == 'post' )
		{
			console.log(pathname + " start upload");

			//创建上传表单
			var form = new formidable.IncomingForm();
			//设置编辑
			form.encoding = 'utf-8';
			//设置上传目录
			form.uploadDir = "/usr/share/NodeJS/Node.js/upload/";
			form.keepExtensions = true;
			//文件大小
			form.maxFieldsSize = 1024 * 1024 * 1024;
			form.parse(request, function (err, fields, files) {
				if(err) {
					response.write(err);
					//response.end();
					return;
				}

				console.log(files);

				try
				{
					//移动的文件目录
					//var newPath = form.uploadDir + files.file.name;
					var newPath = form.uploadDir + pathname + '.csv';
					fs.renameSync(files.file.path, newPath);

					var exec = require('child_process').exec; 
					var cmdStr = 'iconv -f gbk -t UTF-8 ';
					var fileName = newPath;
					cmdStr = cmdStr + fileName + " > " + "utf-8.csv";
					exec(cmdStr, function callback(error, stdout, stderr) {
						console.log(stdout);
						cmdStr = "mv utf-8.csv " + fileName;
						exec(cmdStr);
					});

					// cmdStr = 'mv '+ files.file.name + ' 基站数据批量导入.xlsx';
					// exec(cmdStr);
					response.write('<html>');
					response.write('<head>');
					response.write(
					'<meta http-equiv=\"refresh\" content=\"0; url=https://www.smartlock.top/my_smartlock/html/'+
					pathname+
					'.html?result=success\">');
					response.write('</head>');
					response.write('</html>');
					response.end();
					return;
				}catch(e)
				{
					response.write('<html>');
					response.write('<head>');
					response.write(
					'<meta http-equiv=\"refresh\" content=\"0; url=https://www.smartlock.top/my_smartlock/html/'
					+pathname
					+'.html?result=failure\">');
					response.write('</head>');
					response.write('</html>');
					response.end();
					return;
				}

			});
		}
	}catch(e)
	{
			response.write('<html>');
			response.write('<head>');
			response.write(
			'<meta http-equiv=\"refresh\" content=\"0; url=https://www.smartlock.top/my_smartlock/html/'
			+pathname
			+'.html?result=failure\">');
			response.write('</head>');
			response.write('</html>');
			response.end();
			return;		
	}
}

var options = {
     key: fs.readFileSync('/etc/nginx/server.key'),
     cert: fs.readFileSync('/etc/nginx/server.crt')
};

var https = httpsModule.createServer(options, onRequest);

https.listen(8070, function(err){  
    console.log("https listening on port: 8070");
});
console.log("server has started");


//---------------------结束--https启动监听，路由分配函数--结束--------------------//

