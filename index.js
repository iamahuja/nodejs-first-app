import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";



mongoose.connect("mongodb://localhost:27017",{
    dbName:"backend",
}).then(()=>console.log("database connected")).catch(()=>console.log("error"))

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
})

const User = mongoose.model('User', userSchema);

const app = express();

//Using Middlewares
app.use(express.static(path.join(path.resolve(),"public")));
app.use(express.urlencoded({ extended : true}));
app.use(cookieParser());


// Setting up view engine
app.set('view engine', 'ejs');


const isAuthenticated = async(req,res,next)=>{
const {token} = req.cookies;
    // console.log(req.cookies.token);
    // console.log(token);
    if(token){
        const decoded = jwt.verify(token,"gghghghghghghghh");
        // console.log(decoded);

        // if token exist,it saves the user information for foreve
          req.user= await User.findById(decoded.user_id)
      next(); 
    }
    else{

        res.render("login");
    }
}


app.get("/",isAuthenticated,(req,res)=>{
    console.log(req.user);
    res.render("logout",{name:req.user.name});
})

app.get("/register", (req,res)=>{
    res.render("register")
})

app.get("/login", (req,res)=>{
    res.render("login");
})



app.post("/register",async(req,res)=>{

    const {name, email,password} = req.body;

    const oldUser = await User.findOne({email});
    if(oldUser) return res.redirect("/login");

    // Encrypt user password
    const hashedPassword = await bcrypt.hash(password,10);

    // create user in database
    const user = await User.create({
        name,
        email,
        password:hashedPassword,
    })

    // Create token
     const token = jwt.sign({user_id: user._id},"gghghghghghghghh");
     res.cookie ("token", token,{
        httpOnly:true,
        expires:new Date(Date.now()+60*1000)
    });
    res.redirect("/");

})

app.post("/login",async(req,res)=>{

    // Get user input
    const {password, email} = req.body;

    //validate if user exist in our database
    let user = await User.findOne({email});

    if(!user) return res.redirect("/register");

    const passwordMatch = await bcrypt.compare(password,user.password);

    if(!passwordMatch) return res.render("login",{email,message: "Credentials are incorrect"});
    
    // Create token
    const token = jwt.sign({user_id: user._id},"gghghghghghghghh");
    res.cookie ("token", token,{
        httpOnly:true,
        expires:new Date(Date.now()+60*1000)
    });
    res.redirect("/")
});


app.get("/logout",(req,res)=>{
    res.cookie ("token",null,{
        expires:new Date(Date.now()),
    });
    res.redirect("/")
})


app.listen(5000, ()=>{
    console.log("Server is working at port 5000");
})