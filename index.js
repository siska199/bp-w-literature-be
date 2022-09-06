require("dotenv").config();
const express = require("express");
const cors = require("cors");
const router = require("./src/routes/routes");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin : process.env.BASE_URL_FE
    // origin: "https://literature199.vercel.app/",
  },
});

require("./src/socket")(io);

app.use(express.json());
app.use(cors());
app.use("/api199/v1", router);

const dir = path.join(__dirname);
app.use(express.static(dir));

const port = process.env.PORT || 3009;
server.listen(port, () => {
  console.log(`Server listen to port ${port}`);
});
