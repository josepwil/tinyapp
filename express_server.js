const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');

// function to generate random string
const generateRandomString = () => {
  return Math.random().toString(36).slice(2, 8);
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});
// all urls rendered in table
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase};
  res.render('urls_index.ejs', templateVars);
});
// get form to add a new url
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});
// post url data from form
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString(); 
  // saves shortURL-longURL to urlDatabase
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

// specific url
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});