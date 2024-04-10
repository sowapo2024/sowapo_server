
const mongoose = require("mongoose")

const post = new mongoose.Schema({
    title:{
        type: String,
        required:[true,"Post must have a title"]
    },
    author:{
        type:String,
        // // required:[true,"Post must have an author"],
        // ref: "Admin"
    },
    description:{
        type: String,
        required:[true,"Post must have a descrption"]
    },
    mediaUrls:[{
        link:String,
        _id:mongoose.Schema.Types.ObjectId,
        type:{
            type:String,
            enum:["video","audio","image","application"]
        },
        file_extension: String
    }],
    audience:{
      type:String,
      enum:["agape","amplified","children","all", "papa","mama","pastor_dotun"],
      required:[true,"Post must have an audience"]
    },
    tag:{
        type:String,
    }
},{timestamps:true})

const Post =  mongoose.model("Post",post)

module.exports = Post
