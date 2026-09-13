import bcrypt from "bcryptjs";
import {User} from "../models/User.js";
import jwt from "jsonwebtoken";
import { createWallet } from "./walletServices.js";

export async function registerUser({name,email,password}){
    const passwordHash=await bcrypt.hash(password,12);
    const user=await User.create(
        {
            name: name,
            email: email,
            passwordHash: passwordHash
        }
    )
    await createWallet(user._id);
      return user;
}

export function createToken(userId) {
  const token = jwt.sign(
    { userId: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return token;
}

export async function getuserbyid(userId){
    try{
      const user=await User.findById(userId);
      if(!user){
        return null;
      }
      return user;
    }
    catch(err){
      return null;
    }
}
