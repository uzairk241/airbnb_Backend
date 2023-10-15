const jwt = require('jsonwebtoken');

const jwtverify = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(200).json("null");
    }
    const decodeddata = await jwt.verify(token, process.env.jwtSecret);
    if (!decodeddata) {
      return res.status(200).json("null");
    }
    req.user = decodeddata.id;
    next();
  } catch (error) {
    res.status(400).json(error.message);
  }
};

module.exports = jwtverify;
