import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
export async function loginUser({email,password}){
    const user=await User.findOne({
        email:email
    });
    if(!user){
        return null;
    }
    const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );
  if(!passwordMatches){
    return null;
  }
  return user;
}