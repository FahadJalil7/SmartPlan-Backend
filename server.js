const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const recipeRoutes = require("./routes/recipes");
const Ai = require("./routes/AI");
const {connectDB} = require("./DB1");
const auth = require("./routes/auth");

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: ["https://smart-plan-frontend-seven.vercel.app","http://localhost:5175"] }));
app.use(express.json());

// Routes
app.use("/api/recipes", recipeRoutes);
app.use("/api/diet", Ai )
app.use("/api/auth",auth)

// Server
const PORT = process.env.PORT || 5000;
(async ()=>{
    try {
        await connectDB();
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 
    } catch (error) {
        console.log('couldnt start server:',error)
    }

})();

