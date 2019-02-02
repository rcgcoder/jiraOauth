var express = require('express'),
sys = require('sys'),
util = require('util'),
OAuth = require('./lib/oauth.js').OAuth,
fs = require('fs'),
crypto=require('crypto'),
//express=require('express'),
htmlToJson=require('html-to-json');
stringify=require('json-stringify');
//;

var tokensInfo={};
var app = module.exports = express.createServer()
var log=console.log;
var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
app.use(express.logger());
app.use(express.cookieParser());
//app.use(express.session({secret: "ssshhhh!"}));


var configFile = "./config/config.js";
var config = require(configFile);
console.log("consumerPrivateKeyFile:["+config["consumerPrivateKeyFile"]+"]");
var privateKeyData = fs.readFileSync(config["consumerPrivateKeyFile"], "utf8");
console.log("Key:"+privateKeyData);
console.log("ConsumerKey:"+config["consumerKey"]);

//console.log("Start Sign Test");
//var signTest=crypto.createSign("RSA-SHA1").update("Test String").sign("&H21LT5mQiTDpZKQRdJhxC4mudAfkdPJx", 'base64');
//console.log("Signed Test:"+signTest);

/*
app.dynamicHelpers({
  	session: function(request, response){
    	return request.session;
	}
});
*/


app.get('/', function(request, response){
  	response.send('Hello World');
});
app.get('/sessions/getGitHubLastCommitInfo', function(request, response){
	console.log("Getting GitHub Last Commit Info");
	var repo=request.query.repository;
	var user=request.query.user;
	var url="https://github.com/"+user+"/"+repo+"/commits/master";
	var promise = htmlToJson.request(url, {
	  'commits': ['.sha', function ($item) {
		return $item.attr('href');
	  }],
	  'dates': ['relative-time', function ($item) {
		return $item.attr('datetime');
	  }]
	}, function (err,result) {
		if (err!=null){
			console.log(err);
		}
	});	
	promise.done(function (result) {
		//Works as well 
//		console.log("Promise done:"+result);
		var arrSha=result.commits[0].split("/");
		var objResult={sha:arrSha[arrSha.length-1]
						,commit:{author:{date:result.dates[0]}}};
		console.log(objResult.sha);
		response.send(objResult);
		response.end();
	});
	
	
	/*
	var gResp=response;
	axios.get(url,{
      headers: { 'Content-Type': 'text' }
    }).then(response => {
//		console.log(response.data);
//		console.log(response.data.url);
//		console.log(response.data.explanation);
//		response.send('OK getting github info');
		parseString(response.data, function (err, result) {
			console.log(err);
			console.log(result);
			gResp.send("OK");
			gResp.end();
		});	
	  }).catch(error => {
		console.log(error);
		gResp.send('ERROR getting github info');
		gResp.end();
	  });
	  */
});

app.get('/sessions/connect', function(request, response){
	console.log("Connect");
	var jiraInstance=request.query.jiraInstance;
	log("jira instance:["+jiraInstance+"]");
	var callbackServer=request.query.callbackServer;
	log("callback server:["+callbackServer+"]");
	log("Config ConsumerKey:["+config["consumerKey"]+"]");
	log("privateKeyData:["+privateKeyData+"]");
	var consumer=new OAuth(
					  jiraInstance+"/plugins/servlet/oauth/request-token",
					  jiraInstance+"/plugins/servlet/oauth/access-token",
					  config["consumerKey"],
					  "",
					  "1",
					  callbackServer+"/oauth/sessions/callback",
					  "RSA-SHA1",
//					  "HMAC-SHA1",
					  null,
					  privateKeyData);
	consumer.getOAuthRequestToken(
		function(error, oauthToken, oauthTokenSecret, results) {
		console.log("Get Request Token");
		console.log(arguments);
    		if (error) {
			console.log("Error");
				console.log(error.data);
      			response.send('Error getting OAuth access token:'+error.data);
			}
    		else {
			console.log("OK");
//      		request.session.oauthRequestToken = oauthToken;
//      		request.session.oauthRequestTokenSecret = oauthTokenSecret;
			tokensInfo[oauthToken]={
					token:oauthToken,
					secret:oauthTokenSecret,
					instance:jiraInstance,
					callbackServer:callbackServer,
					consumer:consumer
		 			};
			console.log("token:"+oauthToken);
			console.log("secret:"+oauthTokenSecret);
			var sUrl=jiraInstance+"/plugins/servlet/oauth/authorize?oauth_token="+oauthToken;
			console.log(sUrl);
//      			response.redirect("https://rcgcoder.atlassian.net/plugins/servlet/oauth/authorize?oauth_token="+request.session.oauthRequestToken);
//			response.writeHead(301,{location:sUrl});
			response.write('{"redirect":"true","url":"'+sUrl+'"}');
			response.end();
			}
		}
	)
});
var callHttpMethod="GET";
function tracePet(request,response){
	var urlProxy = request.params.urlProxy;
	console.log("Proxying:"+urlProxy);
	var urlRest = request.params.urlRest;
	console.log("Proxying:"+urlProxy+" - "+urlRest);
	var accessToken=request.query.oauth_token;
	var consumerKey=request.query.oauth_consumerKey; 
	var body=request.body;
	console.log("--------------------");
	console.log("URL:"+request.originalUrl);
	console.log("---------------------");
	console.log("All Headers:"+JSON.stringify(request.headers));
	console.log("Header:Content-Type:"+JSON.stringify(request.headers["content-type"]));
	console.log("Header:authorization:"+JSON.stringify(request.headers["authorization"]));
	console.log("---------------------");
	console.log("Request:Authorization:"+request.get("authorization"));
	console.log("Request:Content-Type:"+request.get("Content-Type"));
	console.log(body);
	console.log("-----------------------------");
	console.log("Data:"+stringify(body));
	console.log("-----------------------------");
	var arrUrl=request.originalUrl.split("endproxy");
	var newUrl="https://"+urlProxy+arrUrl[1];
	
	console.log("New url:"+newUrl);
	var proxyrequest = require('request');
	var options = {
	  url: newUrl,
	  method: callHttpMethod,
	  headers: {
	    'Content-type': request.headers["content-type"],
		'Authorization':request.headers["authorization"]
//		'Authorization':"Bearer "+oauthAccessToken+"",
	  },
	  body: stringify(body)
	};
	console.log("-----------------------------");
	console.log("Call options:"+stringify(options));
	console.log("-----------------------------");
	var fncRequestcallback=function(error, cbResponse, body){
	    console.log("---- response headers ----");
	    console.log(cbResponse.headers);
	    var auxHeaders=cbResponse.headers
		var arrProperties=Object.getOwnPropertyNames(auxHeaders);
		for (var i=0;i<arrProperties.length;i++){
			var vPropName=arrProperties[i];
			if (vPropName!="set-cookie"){
				var vPropValue=auxHeaders[vPropName];
				//if (isMethod(vPropValue)){
					if (typeof vPropValue!=="undefined"){
					   response.setHeader(vPropName, vPropValue);
					}
				//}
			}
		}

		if (!error) {
//			    var info = (JSON.parse(body));
		        console.log("---- response body----");
			    console.log(body);
		  }
		  else {
			console.log("Error:"+error);
		    console.log(body);
		    console.log("ERROR:"+JSON.parse(error));
		  }
		response.write(body);
		response.end();
	};
	if (callHttpMethod=="POST"){
		proxyrequest.post(options, fncRequestcallback);
	} else if (callHttpMethod=="PUT"){
		proxyrequest.put(options, fncRequestcallback);
	} else { //if (callHttpMethod=="GET"){
		proxyrequest.get(options, fncRequestcallback);
	}
	
/*	console.log("Request:"+stringify(request));  
	console.log("-----------------------------");
*//*	console.log("Response:"+JSON.stringify(response));
	console.log("-----------------------------");
	*/
}

app.get('/proxy/:urlProxy/endproxy*',function(request,response){
	log("GET proxy");
	callHttpMethod="GET";
	tracePet(request,response);
});
app.post('/proxy/:urlProxy/endproxy*',function(request,response){
	log("POST proxy");
	callHttpMethod="POST";
	tracePet(request,response);
});
app.put('/proxy/:urlProxy/endproxy*',function(request,response){
	log("PUT proxy");
	callHttpMethod="PUT";
	tracePet(request,response);
});

app.get('/sessions/callback', function(request, response){
	console.log("Callbacking:" ); //+ JSON.stringify(request));
	var token=request.query.oauth_token;
	console.log("token:"+token);
	console.log("Tokens:"+JSON.stringify(tokensInfo));
	var tInfo=tokensInfo[token];
	console.log("Token info:"+JSON.stringify(tInfo));
	var secret=tInfo.secret;
	var verifier=request.query.oauth_verifier;
	var access="";
	var consumer=tInfo.consumer;
	console.log(" 	oauth_token:" + token);
	console.log("	request token:" + tokensInfo[token].token);
	console.log("	secret:" + tokensInfo[token].secret);
	console.log("	verifier:" + verifier);
	tokensInfo[token].verifier=verifier;
	consumer.getOAuthAccessToken (
			token, 
			secret, 
			verifier,
			function(error, oauthAccessToken, oauthAccessTokenSecret, results){			
				console.log(arguments);
			    console.log("Response:"+error);
			    if (error) { 
					console.log("Error");
			    		console.log(error.data);
			    		response.send("error getting access token:"+error);		
			    } else {
					console.log("OK");
	//    			request.session.oauthAccessToken = oauthAccessToken;
	//      			request.session.oauthAccessTokenSecret = oauthAccessTokenSecret;
					tInfo.access=oauthAccessToken;
					tInfo.accessSecret=oauthAccessTokenSecret;		
					console.log("Final Access:"+oauthAccessToken);
					console.log("Final Secret:"+oauthAccessTokenSecret);
					tokensInfo[oauthAccessToken]=tInfo;
					console.log("Final Tokens List:"+JSON.stringify(tokensInfo));

					response.write('{"isToken":"true","access":"'+oauthAccessToken+'","secret":"'+oauthAccessTokenSecret+'"}');
		/*			
					var request = require('request');
					var oAuthString= ' OAuth oauth_consumer_key="'+"OauthKey"+'",'+
										'oauth_token="' +oauthAccessToken+'",'+
										'oauth_version="'+"1.0"+'"';
					var options = {
					  url: 'https://rcgcoder.atlassian.net/rest/api/1.0/render',
					  method: "POST",
					  headers: {
					    'Content-type': 'application/json',
						'Authorization':oAuthString
//						'Authorization':"Bearer "+oauthAccessToken+"",
					  },
					  body: JSON.stringify({"rendererType":"atlassian-wiki-renderer","unrenderedMarkup":"*test*"})
					};
					console.log("oAuthString:"+oAuthString);

					function requestcallback(error, response, body) {
					  console.log("callback function");
					  console.log("-----------------------");
					  console.log("-----------------------");
					  console.log("-----------------------");
					  console.log(JSON.stringify(response));
					  console.log("-----------------------");
					  console.log("-----------------------");
					  console.log(JSON.stringify(body));
					  console.log("-----------------------");
					  console.log("-----------------------");
					  console.log("-----------------------");
					  
					  if (!error) {
//					    var info = (JSON.parse(body));
					    console.log(body);
					    console.log("status 200");

					  }
					  else {
					    console.log(body);
					    console.log("ERROR:"+JSON.parse(error));
					  }
					}

					request.post(options, requestcallback);
					options = {
							  url: 'https://cantabrana.no-ip.org/jfreports/proxy/rcgcoder.atlassian.net/endproxy/rest/api/1.0/render',
							  method: "POST",
							  headers: {
							    'Content-type': 'application/json',
								'Authorization':oAuthString
//								'Authorization':"Bearer "+oauthAccessToken+"",
					  		  },
							  body: JSON.stringify({"rendererType":"atlassian-wiki-renderer","unrenderedMarkup":"*test*"})
							};
					request.post(options, requestcallback);
*/					
					response.end();
					
					
	
			    }
			}
		)
	});
					
app.get('/atlassian/call', function(request, response){
	console.log("Callbacking:" ); //+ JSON.stringify(request));
	var token=request.query.oauth_token;
	console.log("token:"+token);
	console.log("Tokens:"+JSON.stringify(tokensInfo));
	var tInfo=tokensInfo[token];
	console.log("Token info:"+JSON.stringify(tInfo));
	var consumer=tInfo.consumer;
	console.log(" 	oauth_token:" + token);
	console.log("	request token:" + tokensInfo[token].token);
	console.log("	secret:" + tokensInfo[token].secret);
//    var url="https://paega2.atlassian.net/secure/attachment/41486/screenshot-1.png";
//    var method="GET";
//        var url="https://api.media.atlassian.com/file/6a3096f3-426d-4fdf-8565-be02722c97ba/binary?token=eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJjYjJhMzNlMi0wODViLTRjMGUtOWI3ZS1jNzU4Yjg3NGU0ZDQiLCJhY2Nlc3MiOnsidXJuOmZpbGVzdG9yZTpmaWxlOjZhMzA5NmYzLTQyNmQtNGZkZi04NTY1LWJlMDI3MjJjOTdiYSI6WyJyZWFkIl19LCJleHAiOjE1NDkwNTI3MjQsIm5iZiI6MTU0OTA1MjA2NH0.-77KqtNoEemUmWOiziYfRkjKSQs1M7HmiO9-mzghJhU&client=cb2a33e2-085b-4c0e-9b7e-c758b874e4d4&name=screenshot-1.png";
//    var content_type="application/octet-stream";
    
    var url=request.query.callUrl;
    var method=request.query.callMethod;
    var content_type=request.query.CallContentType;    
    console.log("Call Url:"+url);
    console.log("Call Method:"+method);
    console.log("Call Content Type:"+content_type);
//	var newHeaders=consumer.getCallHeaders( tInfo.access, tInfo.secret, method, url, null, "", content_type, function() {console.log("callback");} );
//	response.write(JSON.stringify(newHeaders));
//	response.end();

	consumer.get(
		url,
		//"https://paega2.atlassian.net/rest/api/2/search", 
		tInfo.access,//request.session.oauthAccessToken, 
		tInfo.secret,//request.session.oauthAccessTokenSecret, 
//		undefined,
		content_type,
		function(error, data, resp){
			console.log(data);
			//console.log("First byte:"+data.charCodeAt(0));
			//data = JSON.parse(data);
			//response.write("I am looking at: "+data["key"]);
			response.write(data);
			response.end();
		}
	);
    });
app.listen(parseInt(process.env.PORT || 8080));
