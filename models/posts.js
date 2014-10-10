var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postsSchema = new Schema({
	post: String,
	user_name: String		
});

//exporting to make these available elsewhere
var Posts = mongoose.model('Posts', postsSchema);
module.exports = {Posts:Posts};