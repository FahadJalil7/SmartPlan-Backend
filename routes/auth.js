const express = require("express");
const router = express.Router();
const { getDB } = require("../DB1");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();



const auth = (req,res,next) =>{
    const token = req.headers["auth-token"];
  if (!token){return res.status(401).json({ msg: "Authorization denied" })};
  try {
    const user = jwt.verify(token,process.env.SEC_TOKEN);
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
}


router.post("/register", async (req,res)=>{
    const {username,password} = req.body;
    const db = getDB();
    const users = db.collection("Users")
    const userExists = await users.findOne({username});
    if(userExists){ return res.status(400).json({msg:"A user with this username already exists"})}

    // Hash password
    const salt = await bcrypt.genSalt(5);
    const hashedPassword = await bcrypt.hash(password, salt);


    const newUser = { username, hashedPassword}
    const result = await users.insertOne(newUser)
    const userId = result.insertedId;

    // Create token
    const token = jwt.sign({ id: userId,username }, process.env.SEC_TOKEN, { expiresIn: "1h" });
    res.json({ token, user: { id: userId, username,} });
})

router.post("/login",async (req,res)=>{
    const {username,password} = req.body;
    const db = getDB();
    const users = db.collection("Users");
    const user = await users.findOne({username});
    if(!user){ return res.status(400).json({msg:"invalid credientials"})}
    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (isMatch) {
        const token = jwt.sign({ id: user._id, username }, process.env.SEC_TOKEN, { expiresIn: "1h" });
        res.status(200).json({ token, user: { id: user._id, username,} });
    } else {
        return res.status(400).json({msg:"invalid credientials"})
    }

})

router.get("/getPlan", auth, async (req, res) => {
    const db = getDB();
    const mealPlansCollection = db.collection("mealPlans");
  
    try {
      const mealPlans = await mealPlansCollection.findOne({ username: req.user.username });
      if (mealPlans === null){ return res.status(300).json({msg: "There is no exisiting saved mealplan"})}
      res.json(mealPlans);
    } catch (err) {
      res.status(400).json({ msg: "Server error" });
    }
});

router.post("/setPlan", auth, async (req, res) => {
    const { meals } = req.body;
    const db = getDB();
    const mealPlansCollection = db.collection("mealPlans");
  
    try {
    
      const newMealPlan = { username: req.user.username, meals, date: new Date() };

      const mealPlan = await mealPlansCollection.findOne({ username: req.user.username });
      
      await mealPlansCollection.updateOne({ username: req.user.username},{$set:newMealPlan},{upsert:true})  
      
      res.json({ msg: mealPlan?"Meal plan updated":"Mealplan created"});
    } catch (err) {
      res.status(400).json({ msg: "Server error" });
    }
});


// This route is for the cron-job.org setup. the render server goes to sleep so crone can make calls here to keep the server awake.
router.get("/keepAlive", async(req,res) =>{
  res.status(200).send('OK');
});


module.exports = router;