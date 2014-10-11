var express = require('express');
var router = express.Router();

//mongoose addition
var mongoose = require('mongoose');
var Users = require("../models/users").Users;
var Posts = require("../models/posts").Posts;

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
    var user_name = req.session.user_name;
    res.render('post_new_post', {title: 'Post Another Post', user_name: user_name});
});

function newUser(reqBody){
    var user_name = reqBody.user_name;
    var password = reqBody.password;
    var name = reqBody.name;
    var newUser = {"user_name":user_name, "password": password, "name":name};
    return newUser
}

//+++++++++++++++++++++++++++USER AUTHENTICATION AND SIGN_UP++++++++++++++++++++++++++

//This function logs-in a user and the session user_name (used for authentication purposes)
router.post('/open_user_session', function(req, res){
    var username = req.body.user_name;
    var password = req.body.password; 
    Users.findOne({user_name: username}, function(err, doc){
        if (err){
            res.send("En error occured during your login")
        }
        else{
            //if a match was found
            if (doc !== null){ 
                console.log ("Got into here, did find user");
                //cross check passwords
                if(doc.password === password){
                    req.session.regenerate(
                         function(){
                        req.session.user_name = username;
                        ///go to new post page
                        res.render('post_new_post', {title : "signing in complete", user_name: username});
                    });
                }
            }
            else{
                console.log ("Did not find user with this login");
                res.redirect("/");  //go sign up properly
            }
        }
    });
});


/* POST to Add User Service, essentially equal to signing up */
router.post('/sign_up', function(req, res) {

    // Get our form values. These rely on the "name" attributes
    var name = req.body.name;
    var username = req.body.user_name;
    var password = req.body.password;

    console.log("user signing up. user_name = "+ username);

    Users.findOne({
        user_name : username
    }, function (err, doc) {
        if (err) {
            // If it failed, return error
            res.send("There was a problem finding your information in the database.");
        }
        else {
            //new approach
            if(doc===null){
                var user = new Users(newUser(req.body));
                user.save(function(err, doc){
                    if (err){
                        res.send("There was a problem adding the information to the database.");
                    }
                    else{
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
    var user_post = req.body.post;
    var user_name = req.session.user_name;

    //if the user authenticated himself to see this page
    if (user_name !== undefined){
        var newPost = new Posts({user_name:user_name, post:user_post });
        newPost.save(function(err, doc){
            if (err){
                res.send("There was a problem posting your post.");
            }
            var postId = newPost.id; //add post to the user's list of posts

            Users.update({user_name:user_name},{$push:{posts:postId}},{upsert:true}, function(err,doc){
                if (err){
                    res.send("There was a problem referencing your post to the user.");
                }
                    var path = "allposts/"+user_name;
                    res.location(path);
                    // And forward to success page!
                    res.redirect(path);
            });
        });

    } else{
        res.location("/");
        res.redirect("/");
    }
});

/* POST to see all posts sevice*/
router.get('/allposts/:user_name', function(req, res){
    var user_name = req.session.user_name;
    var current_user = req.params.user_name
    var path = "allposts";
    
    //show allt he posts in the database
    Posts.find({},{},function(e,docs){
        res.render(path, { 
            title: "allpoststoshow",
            result : docs, 
            user_name : current_user
        });
    });
});

/* POST to see all posts sevice*/
router.get('/allusers/:user_name', function(req, res){
    var user_name = req.session.user_name;
    var current_user = req.params.user_name
    var path = "allusers";

    if (user_name !== undefined){
        //finding myself, to get who I am subscribed to
        Users.findOne({user_name:user_name}).populate('following').exec(function(err, doc){
            if (err){
                res.send("could not find you!");
            }else{

                var myid = doc._id;
                var thoseISubscribeto = doc.following;
                console.log("Those I subscribe to "+thoseISubscribeto);
                //process those i subscribe to, to give only ID
                var idstoexclude = [myid];
                var numbersubscribing = thoseISubscribeto.length;
                console.log ("numbersubscribing   "+ numbersubscribing ); //correct number

                for (var i=0; i<numbersubscribing; i++) {
                    var current_user = thoseISubscribeto[i];
                    console.log("subscribed to inside loop:" +current_user.user_name);
                    idstoexclude.push(current_user._id);
                }
                console.log("exclude: " +idstoexclude);
                console.log ("End of exclude!!!!!!!!!!")
                //now find all users and exclude those I am subscribed to
                //"_id":{"$ne":{"$all":thoseISubscribeto}}
                //"_id": myid
                Users.find({"_id":{"$nin":idstoexclude}},{},function(e,docs){
                    if (e){
                        console.log(e);
                        res.send("cannot find all users")
                    }else{
                        console.log("docs start");
                        console.log(docs);
                        console.log("docs end");
                        console.log("Those I subscribe to "+thoseISubscribeto);
                        console.log("Those I subscribe END ");
                        res.render(path, { 
                            title: "alluserstoshow",
                            subscribe : docs, 
                            unsubscribe: thoseISubscribeto,
                            user_name : current_user
                        });
                    }
                }); //
            }
        });
    }else{
        res.location("/");
        res.redirect("/");
    }
});


router.post('/allusers/subscribe', function(req, res){
    var user_name = req.session.user_name;
    var current_user = req.body.user_name;
    var subscribeToid = req.body.id;
    console.log(subscribeToid);
    console.log(req.params);
    // find my id
    if (user_name !== undefined){
        Users.findOne({user_name:user_name}, function(err, doc){
            if (err){
                res.send("could not find you!");
            }else{
                console.log(doc);
                console.log(user_name);
                var current_user_id = doc._id;
                Users.update({user_name:user_name},{$push:{following:subscribeToid}},{upsert:true}, function(err,doc){
                if (err){
                    console.log(err);
                    console.log(current_user_id);
                    res.send("There was a problem subscribing to the user.");
                }else{
                    Users.update({_id:subscribeToid}, {$push:{followers:current_user_id}},{upsert:true}, function(err,doc){
                        if (err){
                            res.send("could not show who you are following");
                        }else{
                            //all worked out
                            var path = "/allposts/"+user_name;
                            res.location(path);
                            // And forward to success page!
                            res.redirect(path);
                        }
                    })

                }
            });

            }
        })
    }
    else{ //go back to sign-in page
        res.location("/");
        res.redirect("/");

    }
});


router.post('/allusers/unsubscribe', function(req, res){
    var user_name = req.session.user_name;
    var current_user = req.body.user_name;
    var subscribeToid = req.body.id;
    console.log(subscribeToid);
    console.log(req.params);
    // find my id
    if (user_name !== undefined){
        Users.findOne({user_name:user_name}, function(err, doc){
            if (err){
                res.send("could not find you!");
            }else{
                console.log(doc);
                console.log(user_name);
                var current_user_id = doc._id;
                Users.update({user_name:user_name},{$pull:{following:subscribeToid}},{upsert:true}, function(err,doc){
                if (err){
                    console.log(err);
                    console.log(current_user_id);
                    res.send("There was a problem subscribing to the user.");
                }else{
                    Users.update({_id:subscribeToid}, {$pull:{followers:current_user_id}},{upsert:true}, function(err,doc){
                        if (err){
                            res.send("could not show who you are following");
                        }else{
                            //all worked out
                            var path = "/allposts/"+user_name;
                            res.location(path);
                            // And forward to success page!
                            res.redirect(path);
                        }
                    })

                }
            });

            }
        })
    }
    else{ //go back to sign-in page
        res.location("/");
        res.redirect("/");

    }
});

module.exports = router;
