
var sql = require('mysql');
var http = require('http');
var url = require('url');


function creatConnection() {
    //Create SQL connection logic
    var connection = sql.createConnection({
        host: "localhost",
        user: "root",
        password: "shantivilas@9",
        database: "ecommerce"
    });
    return connection;
}


http.createServer(function (req, res) {

    var url = [];
    url = req.url.split("/"); // split thre url to get value of Id whose record we should get
    if (req.method === 'GET' && url[1] === 'customer') {

        //your custom logic

        var connection = creatConnection(); // create database connection
        var ret = [];

        connection.connect(function (err) {

            if (err) throw err; // throws error in case if connection is corrupted/disconnected

            // Get list of all customers from cart where customer_id equals to id we send in get request url.
            var sql = "select * from cart where customer_id = " + url[2];

            connection.query(sql, function (err, result) { //query SQL database
                if (err) throw err;

                ret.push(result);
                res.end(JSON.stringify(ret)); //attach to results of select query to response object and send response back to postman. 

            });
            connection.end();
        });

    }
    else if (req.method === 'POST') {

        //your custom logic

        var body = '';

        //Append data/body which we send via Postman as and when it arrives.
        req.on('data', function (data) {
            body += data;
        });

        req.on('end', function () {
            var parsed = JSON.parse(body); //parse received object from POSTMAN into JSON object so as to extract 
                                           //table attributes easily
            //database connection logic.
            var connection = creatConnection(); // create database connection
            connection.connect(function (err) {

                if (err) throw err; // throws error in case if connection is corrupted/disconnected


                //Create table if the table doesnt already exist.
                connection.query("create table if not exists cart (customer_id int, name varchar(20), quantity int, product_id int)", function (err, result) { //query SQL database
                    if (err) throw err;
                });
                // insert logic - insert json parsed object into database.
                
                var sql = "insert into cart (customer_id,  name, quantity, product_id) values(?, ?, ?, ?)";
                connection.query(sql, [parsed.customer_id, parsed.name, parsed.quantity, parsed.product_id], function (err, result) {
                    if (err) throw err;
                });
                connection.end();
            });
            res.end();

        });
    }
    else if (req.method === 'PATCH' && url[1] === 'product') { //update the row in database

        //your custom logic

        var body = '';
        var url = [];
        url = req.url.split("/");
        var id = url[2];

        var connection = creatConnection(); // create database connection
        connection.connect(function (err) {

            var current_quantity = 0;
            if (err) throw err; // throws error in case if connection is corrupted/disconnected


            // Find the current quanity of particular product id in the cart.
            // Since we have to increment the quantity buy one çeach time we make PATCH API call write the following logic to get 
            // the task done

            connection.query("select quantity from cart where product_id = ?", [id], function (err, result) {
                var temp = JSON.parse(JSON.stringify(result));

                current_quantity = temp[0].quantity; // get current quantity

                var q = current_quantity + 1; // increment the quantity by one each time.

                // update the cart with new increased quantity.
                var sql = "update cart set quantity = ? where customer_id = ?";

                connection.query(sql, [q, id], function (err, result) {
                    if (err) throw err;
                });
                connection.end();
            });
            res.end();
        });

    }
    else {
        res.end("404: Page not found");
    }
}).listen(8080);
