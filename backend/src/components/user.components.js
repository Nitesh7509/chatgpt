const userModel = require(".././models/usermodel")
const bcrypt = require("bcryptjs")


const register = async (req,res )=>{
const {email , name , password} = req.body
const user = await userModel.findOne({
  email: email.trim().toLowerCase()
});
if(user){
  return res.status(404).send({
    message:"user is already register"
  })  
}
const hashpassword =await bcrypt.hash(password , 10)

const users = await userModel.create({
    email,
    password:hashpassword,
    name
})
res.status(201).send({
    message:"user is register",
    users
})

}

module.exports ={register}