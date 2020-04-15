



var express = require("express");
var expressHandlebars = require("express-handlebars");
var mongoose = require("mongoose");


var axios = require("axios");
var cheerio = require("cheerio");


var db = require("./models");

var PORT =  process.env.PORT || 3000;


var app = express();

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";





app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));


mongoose.connect(MONGODB_URI, { useNewUrlParser: true });


app.get("/scrape", function(req, res) {
  
  axios.get("http://www.buzzfeed.com/").then(function(response) {
    
    var $ = cheerio.load(response.data);

    
    $("article h2").each(function(i, element) {
    
      var result = {};

      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

     
      db.Article.create(result)
        .then(function(dbArticle) {
          
          console.log(dbArticle);
        })
        .catch(function(err) {
     
          console.log(err);
        });
    });

    
    res.send("Scrape Complete");
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});


app.post("/articles/:id", function(req, res) {
  
  db.Note.create(req.body)
    .then(function(dbNote) {
     
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
     
      res.json(dbArticle);
    })
    .catch(function(err) {
  
      res.json(err);
    });
});


app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});