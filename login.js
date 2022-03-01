let mysql = require('mysql');

let connection = mysql.createConnection({
  host: 'localhost',
  port: "3306",
  user: 'root',
  password: '',
  database: 'ricochet'
});

connection.connect(function(err) {
  if (err) {
    return console.error('error: ' + err.message);
  }

  console.log('Connected to the MySQL server.');
});