const express = require("express");
const methodOverride = require("method-override");
const bodyParser = require("body-parser");
const database = require("./config/database");
const systemConfig = require("./config/system");
const flash = require("express-flash");
const cookieParser = require("cookie-parser");
const session = require("express-session");


require("dotenv").config();

database.connect();

const routeAdmin = require("./routes/admin/index.route"); // Admin
const route = require("./routes/client/index.route"); // Client

const app = express();
const port = process.env.PORT;

app.set("views", "./views");
app.set("view engine", "pug");

// Flash
app.use(cookieParser("LHNASDASDAD"));
app.use(session({ cookie: { maxAge: 60000 } }));
app.use(flash());
// End Flash


app.use(express.static('public'));

// override with POST having ?_method=DELETE
app.use(methodOverride("_method"));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// Variables
app.locals.prefixAdmin = systemConfig.prefixAdmin;
// End Variables


// Routes
route(app);
routeAdmin(app);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
