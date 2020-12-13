// importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

//app config
const app = express();
const port = process.env.PORT || 9000; 

const pusher = new Pusher({
  appId: "1117662",
  key: "2306789abe9b134c5e52",
  secret: "83483f2acd8899dda9a1",
  cluster: "eu",
  useTLS: true
});


// middleware
app.use(express.json());
app.use(cors());

//DB
const connection_url = 'mongodb+srv://admin:i6gH1Um7LKZhidjB@cluster0.gua4o.mongodb.net/whatsappdb?retryWrites=true&w=majority';
mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const db = mongoose.connection;


db.once("open", () => {
    console.log("DB connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change", (change) => {
      console.log("A change occured", change);

        if(change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages','inserted',
            {
              name: messageDetails.name,
              message: messageDetails.message,
              timestamp: messageDetails.timestamp,
              received: messageDetails.received,
            });
        }else{
            console.log('Error Trigger Pusher')
        }
    });
});

// api routes
app.get("/", (req, res) => res.status(200).send("hello world"));

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
    const dbMessage = req.body;
    Messages.create(dbMessage, (err, data) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(201).send(data);
      }
    });
  });
//listen
app.listen(port, () => console.log(`Listing on localhost:${port}`));
