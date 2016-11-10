var http = require('http');
var os = require('os');
var fs = require('fs');
var nodemailer = require('nodemailer');
var cmd=require('node-cmd');
var httpProxy = require('http-proxy')

var sleep = require('sleep');
var needle = require("needle");
var os   = require("os");
var fs = require('fs');
var config = {};
config.token = "a9e1815cbd9fca7e49a988dca69f438251dcd12036d668df3075b9b293c3d773"
var client1 = redis.createClient(6379, '127.0.0.1', {})

var headers =
{
	'Content-Type':'application/json',
	Authorization: 'Bearer ' + config.token
};

var client =
{
	getDropletID: function( onResponse )
	{
		needle.get("https://api.digitalocean.com/v2/droplets/" + dropletID, {headers:headers}, onResponse)
	},

	createDroplet: function (dropletName, region, imageName, onResponse)
	{
		var data =
		{
			"name": dropletName,
			"region":region,
			"size":"512mb",
			"image":imageName,
			// Id to ssh_key already associated with account.
			//"ssh_keys":null,
			"ssh_keys":["1c:78:d6:ba:95:6d:bc:44:da:1a:1a:08:be:60:85:ff"],
			"backups":false,
			"ipv6":false,
			"user_data":null,
			"private_networking":null
		};

		console.log("Attempting to create: "+ JSON.stringify(data) );

		needle.post("https://api.digitalocean.com/v2/droplets", data, {headers:headers,json:true}, onResponse );
	}
};

// Create an droplet with the specified name, region, and image
// Obtaining the Droplet ID, then the droplet IP and automating the process of creating the inventory file
 var dropletID;
 var name = "dgohlya"+os.hostname();
 var region = "nyc1"; // Fill one in from #1
 var image = "ubuntu-14-04-x64"; // Fill one in from #2
function creatingDroplet() {
	 client.createDroplet(name, region, image, function(err, resp, body)
	 {
		console.log(body);
		// StatusCode 202 - Means server accepted request.
		if(!err && resp.statusCode == 202)
		{
			//console.log( JSON.stringify( body, null, 3 ) );

		//console.log(body.droplet.id);
		sleep.sleep(100);
		console.log("Droplet ID is :", JSON.stringify(body.droplet.id));
		dropletID = body.droplet.id;
		client.getDropletID(function(error, response)
		{
			var data = response.body;
			console.log(JSON.stringify(data.droplet.networks.v4[0].ip_address));

			fs.writeFile('inventory', "[digitalocean]" + "\n" + "node0 ansible_ssh_host="+data.droplet.networks.v4[0].ip_address + " ansible_ssh_user=root ansible_become=root ansible_ssh_key=/root/.ssh/id_rsa\n" , function (err) {
			if (err) return console.log(err);
			console.log("http://" + data.droplet.networks.v4[0].ip_address + ":3000");
			client1.lpush("serverList", "http://" + data.droplet.networks.v4[0].ip_address + ":3000");
				cmd.get(
					'./playbook.sh',
					function(data){
					    console.log('the current working dir is : ',data)
					}
				    );

				});
			});
		}

	 });
}

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
	if (memLoad > 20) {
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
			creatingDroplet();
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
