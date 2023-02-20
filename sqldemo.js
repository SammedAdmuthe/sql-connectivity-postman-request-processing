
var sql = require('mysql');
var http = require('http');
var url = require('url');


function creatConnection() {
    //Create SQL connection logic
    var connection = sql.createConnection({
        host: "localhost",
        user: "root",
        password: "your_password",
        database: "ecommerce"
    });
    return connection;
}

http.createServer(function (req, res) {

    var url = [];
    url = req.url.split("/"); // split thre url to get value of Id whose record we should get

    if (req.method === 'GET' && url[1] === 'customer') {        
        listProducts(req, res, url[2]);
    }
    else if (req.method === 'POST') {
        addProduct(req, res);
    }
    else if (req.method === 'PATCH' && url[1] === 'product') { //update the row in database
        addToCart(req, res, url[2]);
    }
    else {
        res.end("404: Page not found");
    }

}).listen(8080);

function listProducts (req, res, customer_id) {
    //your custom logic
    // req.on('end', function () {
        let resMsg = {};

        try {
            var connection = creatConnection(); // create database connection
            var ret = [];

            connection.connect(function (err) {

                if (err) throw err; // throws error in case if connection is corrupted/disconnected

                // Get list of all customers from cart where customer_id equals to id we send in get request url.
                var sql = "select * from cart where customer_id = " + customer_id;

                connection.query(sql, function (err, result) { //query SQL database
                    if (err) {
                        resMsg.code = 503;
                        resMsg.message = "Service Unavailable";
                        resMsg.body = "MySQL server error: CODE = "+ err.code + " SQL of the failed query: "+ err.sql+ " Textual description : "+ err.sqlMessage;
                    }
                    else {
                        ret.push(result);
                        res.end(JSON.stringify(ret)); //attach to results of select query to response object and send response back to postman.     
                    }    

                });
                connection.end();
            });
        }
        catch(ex) {
            resMsg.code = 500;
            resMsg.message = "Internal Server Error";
        }
    // });
}

function addProduct(req, res) {

        //your custom logic

        var body = '';
        let resMsg = {};
        //Append data/body which we send via Postman as and when it arrives.
        req.on('data', function (data) {
            body += data;
        });

        req.on('end', function () {
            try {
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
                    //If product exists? corner cases??
                    var sql = "insert into cart (customer_id,  name, quantity, product_id) values(?, ?, ?, ?)";
                    connection.query(sql, [parsed.customer_id, parsed.name, parsed.quantity, parsed.product_id], function (err, result) {
                        if (err) {
                            resMsg.code = 503;
                            resMsg.message = "Service Unavailable";
                            resMsg.body = "MySQL server error: CODE = "+ err.code + " SQL of the failed query: "+ err.sql+ " Textual description : "+ err.sqlMessage;
                        }
                    });
                    connection.end();
                });
                res.end();

            }
            catch (ex) {
                resMsg.code = 500;
                resMsg.message = "Internal Server Error";
            }
            
        });
}

function addToCart(req, res, product_id){
    //your custom logic

    var body = '';
    var url = [];
    url = req.url.split("/");
    var id = product_id;
    let resMsg = {};
    //Append data/body which we send via Postman as and when it arrives.
    req.on('data', function (data) {
        body += data;
    });

    req.on('end', function () {
        try {
            var parsed = JSON.parse(body); //parse received object from POSTMAN into JSON object so as to extract 
            //table attributes easily

            var connection = creatConnection(); // create database connection
            connection.connect(function (err) {
                if (err) throw err; // throws error in case if connection is corrupted/disconnected


                // Find the current quanity of particular product id in the cart.
                // Since we have to increment the quantity buy one çeach time we make PATCH API call write the following logic to get 
                // the task done

                connection.query("insert into cart values(?,?,1,?) on DUPLICATE KEY update quantity = quantity + 1", [id, parsed.name, parsed.product_id], function (err, result) {
                    if (err) {
                        resMsg.code = 503;
                        resMsg.message = "Service Unavailable";
                        resMsg.body = "MySQL server error: CODE = "+ err.code + " SQL of the failed query: "+ err.sql+ " Textual description : "+ err.sqlMessage;
                    }
                    connection.end();
                });
                res.end();
            });
        } catch(ex) {
            resMsg.code = 500;
            resMsg.message = "Internal Server Error";
        }


    });

}