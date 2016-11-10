var http = require('http');
var os = require('os');
var fs = require('fs');
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport('smtps://murder91%40gmail.com:Neversettle\@1234@smtp.gmail.com');

function memoryLoad()
{
	var total = os.totalmem();
	var load = os.totalmem() - os.freemem();
	var percentage = (load/total)*100;
	return percentage.toFixed(2);
}

function cpuLoadAll () {
	var loads = os.loadavg();
	var percentage = loads[0];
	percentage = percentage * 100;
	return percentage.toFixed(2);;
}
var i = true
setInterval( function () 
{
	
	//cpuAverage();
	//console.log(os.loadavg());
	var memLoad = memoryLoad();
	var cpuLoad = cpuLoadAll();
	console.log("Memory: ", memLoad);
	console.log("CPU: ", cpuLoad);
	if (memLoad > 70) {
		console.log("memory over!!!");
		if(i){
			var mailOptions = {
			from: 'totran123@gmail.com', // sender address
                	to: 'totran123@gmail.com', // list of receivers
                	subject: 'Alert: Memory usage high!!', // Subject line
                	text: 'The memory usage on one of your droplets is too high! Please review.', // plaintext body
                	html: '<b>High Memory</b>' // html bo
			};
			// send mail with defined transport object
                	transporter.sendMail(mailOptions, function(error, info){
                	if(error){
                        	return console.log(error);
                	}
                	console.log('Message sent: ' + info.response);
                	});
		
		//	window.open('mailto:totran123@gmail.com?subject=alert&body=alert');	
			i = false;
		}
	};
	if (cpuLoad >= 0) {
		console.log("cpu over utilized!!!");
		if(i){
			var mailOptions = {
			from: 'totran123@gmail.com', // sender address
                	to: 'totran123@gmail.com', // list of receivers
                	subject: 'Alert: CPU Utilization high!!', // Subject line
                	text: 'The cpu utilization on one of your droplets is too high! Please review.', // plaintext body
                	html: '<b>The cpu utilization on one of your droplets is too high! Please review.</b>' // html bo
			};
			// send mail with defined transport object
                	transporter.sendMail(mailOptions, function(error, info){
                	if(error){
                        	return console.log(error);
                	}
                	console.log('Message sent: ' + info.response);
                	});
		
		//	window.open('mailto:totran123@gmail.com?subject=alert&body=alert');	
			i = false;
		}
	};

}, 2000);
