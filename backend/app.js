require('dotenv').config();

const mongoose = require('mongoose');
const express=require('express');
const app=express();
const authController=require('./routes/auth');
const session = require('express-session');
const requireAuth = require('./middlewares/requireAuth');
const airtableController = require('./routes/airtable');
const formController = require("./routes/forms");
const cors = require('cors');
const cookieParser = require('cookie-parser');

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(cookieParser());

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_URL,   
    credentials: true,      
  })
);

app.use(session({
  resave:true,
  saveUninitialized: false,
  secret: process.env.SESSION_SECRET,
  expire: Date.now() + 3600000 
}));

mongoose.connect(process.env.MONGODB_URI).then(()=>{
  console.log("connected to db")
}).catch((err)=>{
  console.error("error occured while connecting to db", err);
});

app.use("/auth",authController)
app.use("/airtable",airtableController)
app.use("/forms", formController);

app.listen(process.env.PORT,()=>{
  console.log("app is listening on port:",process.env.PORT);
})