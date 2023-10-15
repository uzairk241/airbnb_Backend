const app = require("express")
const router = app.Router()
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const Place = require('../models/Place.js');
const cloudinary = require("cloudinary")
const Booking = require('../models/Booking.js');
const bcryptSalt = bcrypt.genSaltSync(10);
const jwtverify = require("../middleware/jwtverify.js");


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
          res.status(200).json({userDoc,token});
        });
      } else {
        res.status(422).json('pass not ok');
      }
    } else {
      res.json('not found');
    }
  });
  
  router.post('/profile', async (req, res) => {
    const {token} = req.body;
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
  
  
  router.post('/places', jwtverify,async(req,res) => {
    const id = req.user;
    const {
      title,address,description,price,addedPhotos,
      perks,extraInfo,checkIn,checkOut,maxGuests,
    } = req.body.placeData;
  
      const placeDoc = await Place.create({
        owner:id,price,
        title,address,photos:addedPhotos,description,
        perks,extraInfo,checkIn,checkOut,maxGuests,
      });
      res.status(200).json(placeDoc);
  });
  
  router.post('/user-places', jwtverify,async(req,res) => {
      const id = req.user;
      res.status(200).json(await Place.find({owner:id}));
  });
  
  router.post('/places/:id', jwtverify, async(req,res) => {
    const {id} = req.params;
    res.status(200).json(await Place.findById(id));
  });
  
  router.put('/places', jwtverify,async (req,res) => {
    const {
      id, title,address,addedPhotos,description,
      perks,extraInfo,checkIn,checkOut,maxGuests,price,
    } = req.body;
  
      const placeDoc = await Place.findById(id);
      if (req.user === placeDoc.owner.toString()) {
        placeDoc.set({
          title,address,photos:addedPhotos,description,
          perks,extraInfo,checkIn,checkOut,maxGuests,price,
        });
        await placeDoc.save();
        res.status(200).json('ok');
      }
  });
  
  router.get('/places', async (req,res) => {
    res.status(200).json(await Place.find());
  });
  
  router.post('/bookplace',jwtverify, async (req, res) => {
    const id = req.user
    if(id){
      const {
        place,checkIn,checkOut,numberOfGuests,name,phone,price,
      } = req.body;
      Booking.create({
        place,checkIn,checkOut,numberOfGuests,name,phone,price,
        user:id,
      }).then((doc) => {
        res.status(200).json(doc);
      }).catch((err) => {
        res.status(400).json(err)});
    }
    });
  
  
    
    router.post('/allbookings',jwtverify, async (req,res) => {
      const id = req.user
    if(id){
      res.status(200).json(await Booking.find({user:id}).populate('place') );
    }
  
  });
  
  
  router.post("/upload-by-link",jwtverify,async(req,res)=>{
    const id = req.user
    const {link} = req.body
    const result = await cloudinary.v2.uploader.upload(link, {
      folder: "airbnbproperties",
    });
    res.status(200).json(result.secure_url)
  })

module.exports = router