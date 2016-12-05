var mysql = require('mysql');
var bodyParser = require('body-parser');
var fs = require("fs");
const util = require('util');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var pool = mysql.createPool({
  connectionLimit : 10,
  host     : 'localhost',
  user     : 'root',
  password : 'oelderink',
  database : 'meetspace'
});

var loginPage = fs.readFileSync(__dirname + "/webpage/login.html", "utf8");

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

module.exports = function(app){
	
	app.get('/login', function(req, res) {
		loginPage = fs.readFileSync(__dirname + "/webpage/login.html", "utf8");
		
		var formatted = loginPage;
		formatted = formatted.replace('!%PASSWORD%!', '');
		formatted = formatted.replace('!%EMAIL%!', '');
		
		formatted = formatted.replace('!%ERROR STATUS%!', '');
		
		res.send(formatted);
	});	
	
	app.post('/login', urlencodedParser, function(req, res) {
		
		var password = req.body.password;
		var email = req.body.email;
		var sessionId = guid();
		
		var sql = 'INSERT INTO session (email, sessionid) ';
		sql = sql + 'SELECT email,' + mysql.escape(sessionId) + ' FROM user WHERE email=' + mysql.escape(email) + ' AND password=' + mysql.escape(password) + ';';
	
		pool.getConnection(function(err, connection) {
			connection.query(sql, function(err, rows) {
				connection.release();

				console.log(JSON.stringify(rows));
				
				if (err) {
					console.error(err);
					var errAsString = err.toString();
					var errorMessage = 'Unknown error occured when created user.  Please try again.';
					
					var formatted = loginPage;
					formatted = formatted.replace('!%PASSWORD%!', password);
					formatted = formatted.replace('!%EMAIL%!', email);
					
					formatted = formatted.replace('!%ERROR STATUS%!',errorMessage);
					
					res.send(formatted);
				} else {
					if (rows.affectedRows > 0) {
						res.cookie('email' , email);
						res.cookie('sessionId' , sessionId);
						res.send('<html><body>successful? ' + 'hello' + '</body></html>');	
					} else {
						var formatted = loginPage;
						formatted = formatted.replace('!%PASSWORD%!', password);
						formatted = formatted.replace('!%EMAIL%!', email);
						
						formatted = formatted.replace('!%ERROR STATUS%!','Unknown user or password');
						
						res.send(formatted);
					}
				}
			});
		});
	});
}



