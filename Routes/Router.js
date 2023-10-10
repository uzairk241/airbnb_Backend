const app = require("express")
const router = app.Router()
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const Place = require('../models/Place.js');
const Booking = require('../models/Booking.js');
const bcryptSalt = bcrypt.genSaltSync(10);
const mongoose = require("mongoose");


router.get('/test', (req,res) => {
    res.json('test ok');
  });
  
  router.post('/register', async (req,res) => {
    const {name,email,password} = req.body;
  
    try {
      const userDoc = await User.create({
        name,
        email,
        password:bcrypt.hashSync(password, bcryptSalt),
      });
      res.json(userDoc);
    } catch (e) {
      res.status(422).json(e);
    }
  
  });
  
  router.post('/login', async (req,res) => {
    const {email,password} = req.body;
    const userDoc = await User.findOne({email});
    if (userDoc) {
      const passOk = bcrypt.compareSync(password, userDoc.password);
      if (passOk) {
        jwt.sign({
          email:userDoc.email,
          id:userDoc._id
        }, process.env.jwtSecret, (err,token) => {
          if (err) throw err;
          res.status(200).cookie("token",token,{httpOnly:true}).json({userDoc});
        });
      } else {
        res.status(422).json('pass not ok');
      }
    } else {
      res.json('not found');
    }
  });
  
  router.get('/profile', (req,res) => {
    const {token} = req.cookies;
    if (token) {
      jwt.verify(token, process.env.jwtSecret, {}, async (err, userData) => {
        if (err) throw err;
        const {name,email,_id} = await User.findById(userData.id);
        res.json({name,email,_id});
      });
    } else {
      res.json(null);
    }
  });
  
  router.post('/logout', (req,res) => {
    res.cookie('token', '').json(true);
  });
  
  router.post('/upload', async (req,res) => {
    const uploadedFiles = [];
    console.log(req.body.photos)
    for (let i = 0; i < req.files.length; i++) {
    const result = await cloudinary.v2.uploader.upload(req.files[i].photos, {
      folder: "airbnbproperties",
    });
    uploadedFiles.push(result.secure_url)
    }
    res.status(200).json(uploadedFiles)
  });
  
  
  router.post('/places', async(req,res) => {
    const {token} = req.cookies;
    const {
      title,address,description,price,addedPhotos,
      perks,extraInfo,checkIn,checkOut,maxGuests,
    } = req.body;
  
    jwt.verify(token, process.env.jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      const placeDoc = await Place.create({
        owner:userData.id,price,
        title,address,photos:addedPhotos,description,
        perks,extraInfo,checkIn,checkOut,maxGuests,
      });
      res.json(placeDoc);
    });
  });
  
  router.get('/user-places', (req,res) => {
    const {token} = req.cookies;
    jwt.verify(token, process.env.jwtSecret, async (err, userData) => {
      res.json( await Place.find({owner:userData.id}) );
    });
  });
  
  router.get('/places/:id', async (req,res) => {
    mongoose.connect(process.env.MONGO_URL);
    const {id} = req.params;
    res.json(await Place.findById(id));
  });
  
  router.put('/places', async (req,res) => {
    const {token} = req.cookies;
    const {
      id, title,address,addedPhotos,description,
      perks,extraInfo,checkIn,checkOut,maxGuests,price,
    } = req.body;
    jwt.verify(token, process.env.jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      const placeDoc = await Place.findById(id);
      if (userData.id === placeDoc.owner.toString()) {
        placeDoc.set({
          title,address,photos:addedPhotos,description,
          perks,extraInfo,checkIn,checkOut,maxGuests,price,
        });
        await placeDoc.save();
        res.json('ok');
      }
    });
  });
  
  router.get('/places', async (req,res) => {
    res.json( await Place.find() );
  });
  
  router.post('/bookings', async (req, res) => {
    const userData = await jwt.verify(req.cookies.token,process.env.jwtSecret)
    if(userData.id){
      const {
        place,checkIn,checkOut,numberOfGuests,name,phone,price,
      } = req.body;
      Booking.create({
        place,checkIn,checkOut,numberOfGuests,name,phone,price,
        user:userData.id,
      }).then((doc) => {
        res.json(doc);
      }).catch((err) => {
        throw err;
      });
    }
    });
  
  
    
    router.get('/bookings', async (req,res) => {
    const userData = await jwt.verify(req.cookies.token,process.env.jwtSecret);
    if(userData){
      res.json( await Booking.find({user:userData.id}).populate('place') );
    }
  
  });
  
  
  router.post("/upload-by-link",async(req,res)=>{
    try {
      const {token} = req.cookies
      if(!token){
      res.status(404).json("please login to access the resource")
    }
    const decoded = await jwt.verify(token,process.env.jwtSecret)
    if(!decoded){
      res.status(404).json("please login to access the resource")
    }
    const {link} = req.body
    const result = await cloudinary.v2.uploader.upload(link, {
      folder: "airbnbproperties",
    });
    res.status(200).json(result.secure_url)
  
  } catch (error) {
    
  }})



module.exports = router