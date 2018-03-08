var express = require('express'),
sys = require('sys'),
util = require('util'),
OAuth = require('oauth').OAuth,
fs = require('fs');

var app = module.exports = express.createServer()

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.session({secret: "ssshhhh!"}));
});

var configFile = process.env['HOME']+"/config.js";
var config = require(configFile);

var privateKeyData = fs.readFileSync(config["consumerPrivateKeyFile"], "utf8");

var consumer = 
  new OAuth("https://jdog.atlassian.com/plugins/servlet/oauth/request-token",
                  "https://jdog.atlassian.com/plugins/servlet/oauth/access-token",
                  config["consumerKey"],
                  "",
                  "1.0",
                  "http://localhost:8080/sessions/callback",
                  "RSA-SHA1",
				  null,
				  privateKeyData);




app.dynamicHelpers({
  	session: function(request, response){
    	return request.session;
	}
});

app.get('/', function(request, response){
  	response.send('Hello World');
});

app.get('/sessions/connect', function(request, response){
	consumer.getOAuthRequestToken(
		function(error, oauthToken, oauthTokenSecret, results) {
    		if (error) {
				console.log(error.data);
      			response.send('Error getting OAuth access token');
			}
    		else {
      			request.session.oauthRequestToken = oauthToken;
      			request.session.oauthRequestTokenSecret = oauthTokenSecret;
      			response.redirect("https://jdog.atlassian.com/plugins/servlet/oauth/authorize?oauth_token="+request.session.oauthRequestToken);
			}
		}
	)
});

app.get('/sessions/callback', function(request, response){
	consumer.getOAuthAccessToken (
			request.session.oauthRequestToken, 
			request.session.oauthRequestTokenSecret, 
			request.query.oauth_verifier,
			function(error, oauthAccessToken, oauthAccessTokenSecret, results){			
				if (error) { 
					console.log(error.data);
					response.send("error getting access token");		
				}
    			else {
      				request.session.oauthAccessToken = oauthAccessToken;
      				request.session.oauthAccessTokenSecret = oauthAccessTokenSecret;
      				consumer.get("https://jdog.atlassian.com/rest/api/latest/issue/JRADEV-8110.json", 
						request.session.oauthAccessToken, 
						request.session.oauthAccessTokenSecret, 
						"application/json",
						function(error, data, resp){
							console.log(data);
        					data = JSON.parse(data);
        					response.send("I am looking at: "+data["key"]);
						}
					);
				}
			}
		)
	});
					

app.listen(parseInt(process.env.PORT || 8080));