var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var logger = require("morgan");
var axios = require("axios");
var request = require("request");
var cheerio = require("cheerio");
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
var path = require("path");

var PORT = process.env.PORT || 3000;
var app = express();

//body-parser
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
    extended: false
}));

//static directory
app.use(express.static("public"));

//mongoose
mongoose.Promise = Promise;
mongoose.connect("mongodb://heroku_x3s4m8db:1d00vkd1ja4839t59mg6821sr@ds115866.mlab.com:15866/heroku_x3s4m8db", {
    useMongoClient: true
});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("Mongoose connected!");
});

// Set Handlebars.
var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({
    defaultLayout: "main",
    partialsDir: path.join(__dirname, "/views/layouts/partials")
}));
app.set("view engine", "handlebars");

// routes
app.get("/", function (req, res) {
    Article.find({
        "saved": false
    }, function (error, data) {
        var hbsObject = {
            article: data
        };
        console.log(hbsObject);
        res.render("home", hbsObject);
    });
});

app.get("/saved", function (req, res) {
    Article.find({
        "saved": true
    }).populate("notes").exec(function (error, articles) {
        var hbsObject = {
            article: articles
        };
        res.render("saved", hbsObject);
    });
});

//scrapper
app.get("/scrape", function (req, res) {
    request("https://www.nytimes.com/", function (error, response, html) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(html);
            $("article").each(function (i, element) {
                var result = {};
                result.title = $(this)
                    .children("h2")
                    .text();
                result.sub = $(this)
                    .children(".summary")
                    .text();
                result.link = $(this)
                    .children("h2")
                    .children("a")
                    .attr("href");
            });
            res.send("Scrape Complete");
        };
    });
});

//Send articles to database
app.get("/articles", function (req, res) {
    Article
        .find({})
        .then(function (err, dbArticle) {
            res.json(err, dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

//Get article by id
app.get("/articles/:id", function (req, res) {
    Article
        .findOne({
            "_id": req.params.id
        })
        .populate("note")
        .exec(function (err, dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

//Save user articles
app.post("/articles/save/:id", function (req, res) {
    Article
        .findOneAndUpdate({
            _id: req.params.id}, 
            { "saved": true})
        .exec(function (err, dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

// Create a new note
app.post("/notes/save/:id", function (req, res) {
    var newNote = new Note({
        body: req.body.text,
        article: req.params.id
        });
    newNote.save(function (error, note) {
        Article.findOneAndUpdate({
                "_id": req.params.id
                }, {
                $push: {
                "notes": note
                }
                })
                .exec(function (err, note) {
                     res.send(note);
                })
                .catch(function (err) {
                    res.json(err);
                });
    });
 });

 //delete user articles
app.post("/articles/delete/:id", function (req, res) {
            Article
                .findOneAndUpdate({
                    _id: req.params.id
                }, {
                    "saved": false,
                    "notes": []
                }).exec(function (err, dbArticle) {
                    res.send(dbArticle);
                })
                .catch(function (err) {
                    res.json(err);
                });
});

//Delete user notes
app.delete("/notes/delete/:note_id/:article_id", function (req, res) {
            db.Note.findOneAndRemove({
                "_id": req.params.note_id
            }, function (err) {
                Article.findOneAndUpdate({
                        "_id": req.params.article_id
                    }, {
                        $pull: {
                            "notes": req.params.note_id
                        }
                    }).exec(function (err) {
                        res.send("deleted");
                    })
                    .catch(function (err) {
                        res.json(err);
                    });
            });
        });

app.listen(PORT, function () {
    console.log("App running on port " + PORT)
});