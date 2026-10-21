require("dotenv").config();
const app = require("./src/app");
const connectedDB = require("./src/database/db.js");
const connectedserver = require("./src/socket/socket.server.js");
const { createServer } = require("http");
const httpserver = createServer(app);

connectedDB();
connectedserver(httpserver);

httpserver.listen(process.env.PORT, () => {
  console.log("server is connected");
});
