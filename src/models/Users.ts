const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String, unique: true,default:`${String(Math.random()* Date.now()).slice(0,5)}`, },
  password: { type: String, required:[true,'password must be provided']},
  firstName: { type: String ,required:[true,'first name must be provided']},
  lastName: { type: String ,required:[true,'last name must be provided']},
  about: {type:String},
  phone: { type: String },
  email: { type: String, unique: true,default:`default${String(Math.random()* Date.now())}@gmail.com`,required:[true,'email must be provided'] },
  gender: { type: String },
  nationality: { type: String },
  avatar:{type:String},
  birthDate: { type: String },
  isSuspended: { type: Boolean,default:false },
//   profileCreated:{type:Boolean,default:false},

},{timestamps:true});

const Users = mongoose.model("User", UserSchema);
module.exports = Users;