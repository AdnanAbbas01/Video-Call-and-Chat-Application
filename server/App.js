const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const cors = require("cors");
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("<h1>Hello World</h1>");
});

io.on("connection", (socket) => {
  io.to(socket.id).emit("start", { id: socket.id });

  socket.on("callinguser", ({ from, to, signal, callerName }) => {
    io.to(to).emit("userCall", { from, to, signal, callerName });
  });

  socket.on("callanswer", ({ from, signal, name }) => {
    io.to(from).emit("callaccepted", { signal, name });
  });

  socket.on("callend", ({ id }) => {
    io.to(id).emit("endcall");
  });

  socket.on("sendmessage", ({ to, conversation, from }) => {
    io.to(to).emit("receivemessage", { conversation });
  });
});

server.listen(8000, () => {
  console.log("listening on *:8000");
});
