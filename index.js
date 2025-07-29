const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const connectDB = require('./db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();



// ✅ Connect to MongoDB
connectDB();

app.set("trust proxy", 1);

// ✅ CORS setup - allow frontend to connect
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));



// ✅ Middleware
app.use(express.json());
app.use(cookieParser());
// app.use("/",(req,res,next)=>{
//   console.log(req.url,req.method,req.body,);
//   console.log();
//   next();
// });
// ✅ API Routes
app.use("/api", authRoutes);    // register, login, forgot-password, reset-password
app.use("/api", userRoutes);         // user profile, update, delete

// ✅ Test Route
app.get('/', (req, res) => {
  res.send("Hello Jee, Welcome to it-marketing");
});

// ✅ Start server
const PORT =process.env.PORT  || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
