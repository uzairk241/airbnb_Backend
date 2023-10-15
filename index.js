const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
const cloudinary = require("cloudinary")
const router = require('./Routes/Router');
require('dotenv').config();
const app = express();

app.use(cors({origin:"http://localhost:3000",credentials:true}));
app.use(express.json());
app.use(cookieParser());

app.use("/api",router)


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
mongoose
.connect(process.env.MONGO_URL)
.then((data) => {
  console.log(`Mongodb connected with server: ${data.connection.host}`);
});
app.listen(process.env.PORT);