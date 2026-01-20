import mongoose from "mongoose";

const connectDB = async () => {
  console.log(process.env.MONGODB_URI)
  try {
    family: 4,
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed", error);
    process.exit(1);
  }
};
 
export default connectDB;