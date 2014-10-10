var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var usersSchema = new Schema({
	user_name:String,
	name:String,
	password: String,
	posts: [{
				type:Schema.Types.ObjectId,
				ref:'Posts'
			}
			]
});

var postsSchema = new Schema({
	post: String,
	user_name: String		
});

//exporting to make these available elsewhere
var Users = mongoose.model('Users', usersSchema);
var Posts = mongoose.model('Posts', postsSchema);
//exports.Users = Users;
//exports.Posts = Posts;
module.exports = {Users:Users};
module.exports = {Posts:Posts};