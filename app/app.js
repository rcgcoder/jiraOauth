var express = require('express'),
sys = require('sys'),
util = require('util'),
OAuth = require('./lib/oauth.js').OAuth,
fs = require('fs'),
express=require('express');
//stringify=require('json-stringify')
//;


var tokensInfo={};
var app = module.exports = express.createServer()


app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
app.use(express.logger());
app.use(express.cookieParser());
//app.use(express.session({secret: "ssshhhh!"}));


var configFile = "./config/config.js";
var config = require(configFile);

var privateKeyData = fs.readFileSync(config["consumerPrivateKeyFile"], "utf8");
console.log("Key:"+privateKeyData);
console.log("ConsumerKey:"+config["consumerKey"]);

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

app.get('/sessions/connect', function(request, response){
	console.log("Connect");
	var jiraInstance=request.query.jiraInstance;
	var callbackServer=request.query.callbackServer;
	var consumer=new OAuth(
					  jiraInstance+"/plugins/servlet/oauth/request-token",
					  jiraInstance+"/plugins/servlet/oauth/access-token",
					  config["consumerKey"],
					  "",
					  "1",
					  callbackServer+"/oauth/sessions/callback",
					  "RSA-SHA1",
					  null,
					  privateKeyData);
	consumer.getOAuthRequestToken(
		function(error, oauthToken, oauthTokenSecret, results) {
		console.log("Get Request Token");
		console.log(arguments);
    		if (error) {
			console.log("Error");
				console.log(error.data);
      			response.send('Error getting OAuth access token');
			}
    		else {
			console.log("OK");
//      		request.session.oauthRequestToken = oauthToken;
//      		request.session.oauthRequestTokenSecret = oauthTokenSecret;
			tokensInfo[oauthToken]={
					token:oauthToken,
					secret:oauthTokenSecret,
	//				instance:jiraInstance,
	//				callbackServer:callbackServer,
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
			    console.log("Response:".error);
			    if (error) { 
					console.log("Error");
			    		console.log(error.data);
			    		response.send("error getting access token");		
			    	}
    			    else {
				console.log("OK");
//    			request.session.oauthAccessToken = oauthAccessToken;
//      			request.session.oauthAccessTokenSecret = oauthAccessTokenSecret;
				tokensInfo[token].access=oauthAccessToken;
				tokensInfo[token].accessSecret=oauthAccessTokenSecret;				
				console.log(JSON.stringify(tokensInfo[token]));
				objAccess={access:}
				response.write(JSON.stringify(tokensInfo[token].access));
				response.end();
/*      				consumer.get("https://rcgcoder.atlassian.net/rest/api/2/search", 
						request.session.oauthAccessToken, 
						request.session.oauthAccessTokenSecret, 
						"application/json",
						function(error, data, resp){
							console.log(data);
        					data = JSON.parse(data);
        					response.write("I am looking at: "+data["key"]);
						response.end();
						}
					);
*/
			    }
			}
		)
	});
					

app.listen(parseInt(process.env.PORT || 8080));