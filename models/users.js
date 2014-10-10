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

//exporting to make these available elsewhere
var Users = mongoose.model('Users', usersSchema);

module.exports = {Users:Users};