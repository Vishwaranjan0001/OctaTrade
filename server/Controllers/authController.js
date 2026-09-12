import { registerUser,createToken,getuserbyid} from "../services/authServices.js";
import { loginUser } from "../services/loginServices.js";




export async function register(req, res) {
  try {
    const user = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password
    };

    const result = await registerUser(user);

    return res.status(201).json({
      id: result._id,
      name: result.name,
      email: result.email
    });
  } catch (error) {
    console.error(error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email is already registered"
      });
    }

    return res.status(500).json({
      message: "Unable to register user"
    });
  }
}

export async function login(req, res) {
  try {
    const loginDetails = {
      email: req.body.email,
      password: req.body.password
    };

    const result = await loginUser(loginDetails);

    if (!result) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }
    const token=createToken(result._id.toString());
    return res.status(200).json({
      token:token,
      user:{
      id: result._id,
      name: result.name,
      email: result.email
      },
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      message: "Unable to log in"
    });
  }
}

export async function getCurrentUser(req,res){
    const result=await getuserbyid(req.userId);
    if(!result){
      return res.status(404).json({msg:"Not Found"});
    }
    return res.json({
      id: result._id,
      name: result.name,
      email: result.email
    });
}
