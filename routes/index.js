var express = require('express');
var router = express.Router();

//++++++++++++++++++++++++++++++GETS FOR PAGE RENDERING++++++++++++++++++++++++++++++++++++++

/* GET home/welcome page. */
router.get('/', function(req, res) {
    res.render('welcomepage', { title: 'Welcome to Fritter' });
});

/*GET sign_up page!!*/ 
router.get('/sign_up', function(req, res){
    res.render('sign_up', {title: 'Welcome to the sign-up page'})
})

/*GET failure to sign-up page!!*/
router.get('/failure', function(req, res){
    res.render('failure', {title: 'Invalid username chosen'})
})

/* GET logging out page*/
router.get('/logout',function(req,res){
    req.session.destroy(function(){
        res.redirect('/'); //go back to homepage
    });
});

/* GET the confirmation page for postRemoval */
router.get('/update_post', function(req, res) {
    res.render('update_post', { title: 'Post Updated' })
});

/* GET the delete post page */
router.get('/delete_post', function(req, res) {
    res.render('update_post', { title: 'Post Deleted' })
});

/* GET the post new post page */
router.get('/post_new_post', function(req, res){
    res.render('post_new_post', {title: 'Post Another Post'})
});

//+++++++++++++++++++++++++++USER AUTHENTICATION AND SIGN_UP++++++++++++++++++++++++++

//This function logs-in a user and the session user_name (used for authentication purposes)
router.post('/open_user_session', function(req, res){
    var db = req.db;
    var username = req.body.user_name;
    var password = req.body.password; 
    var collection = db.get('users_collection');
    collection.findOne({user_name: username}
        , function(err, doc){
        if (err){
            res.send("En error occured during your login")
        }
        else{
            //if a match was found
            if (doc !== null){ 
                //cross check passwords
                if(doc.password === password){
                    req.session.regenerate(
                         function(){
                        req.session.user_name = username;
                        ///go to new post page
                        res.render('post_new_post', {title : "signing in complete"});
                    });
                }
            }
            else{
                res.redirect("/");  //go sign up properly
            }
        }
    });
});


/* POST to Add User Service, essentially equal to signing up */
router.post('/sign_up', function(req, res) {
    // Set our internal DB variable
    var db = req.db;

    // Get our form values. These rely on the "name" attributes
    var name = req.body.name;
    var username = req.body.user_name;
    var password = req.body.password;

    console.log("user signing up. user_name = "+ username);

    // Set our collection
    var collection = db.get('users_collection');

    collection.findOne({
        user_name : username
    }, function (err, doc) {
        if (err) {
            // If it failed, return error
            res.send("There was a problem finding your information in the database.");
        }
        else {
            //check if user login exists
            if (doc === null){
                collection.insert({
                    name : name,
                    user_name : username, 
                    password : password
                    }, function (err, doc) {
                        if (err) {
                        // If it failed, return error
                            res.send("There was a problem adding the information to the database.");
                        }
                        else {
                            // If it worked, set the header so that the address bar 
                            //doesn't still say /adduser
                            res.redirect("/");
                        }
                    });
            }
            else {
                //resets addressbar
                res.location("/failure");
                // And forward to success page!
                res.redirect("/failure");
            }
        }

    });
});


//++++++++++++++++++++++++++++++++++++++POSTS+++++++++++++++++++++++++++++++++++++++++++++++++++++++++

/* POST new post to the database */
router.post('/post_new_post', function(req, res){
    var db = req.db;
    var user_post = req.body.post;
    var user_name = req.session.user_name;
    var collection = db.get('posts');

    //if the user authenticated himself to see this page
    if (user_name !== undefined){
        collection.insert({
            user_name : user_name,  //user_name
            post : user_post        //post
            },
            function(err, doc) {
                if (err) {
                     // If it failed, return error
                    res.send("There was a problem posting your post.");
                }
                else{
                    //header
                    res.location("/allposts");
                    // And forward to success page
                    res.redirect("/allposts");
                }
            })
    } else{
        res.location("/");
        res.redirect("/");
    }
});

/* POST to see all posts sevice*/
router.get('/allposts', function(req, res){
    var db = req.db;
    var user_name = req.session.user_name;
    var collection = db.get('posts');
    
    //show allt he posts in the database
    collection.find({},{},function(e,docs){
        res.render('allposts', { 
            title: "allpoststoshow",
            result : docs
        });
    });
});

module.exports = router;
