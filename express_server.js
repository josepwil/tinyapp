const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080


app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set('view engine', 'ejs');


// ***************** Helper Functions *****************

// function to generate random string
const generateRandomString = () => {
  return Math.random().toString(36).slice(2, 8);
}

// function to look up item in database
const lookUp = (obj, item) => {
  for (const key in obj) {
    if (Object.values(obj[key]).includes(item)) {
      return obj[key];
    }
  }
	return false;
 }
 

// ************* Databases ***************************
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}


// ***************** GET REQUESTS *****************************
app.get("/", (req, res) => {
  res.send("Hello!");
});

// all urls rendered in table
app.get("/urls", (req, res) => {
  const activeUser = req.cookies["user_id"];
  const templateVars = { urls: urlDatabase, user: users[activeUser] };
  res.render('urls_index.ejs', templateVars);
});
// get form to add a new url
app.get("/urls/new", (req, res) => {
  const activeUser = req.cookies["user_id"];
  const templateVars = { user: users[activeUser] };
  res.render("urls_new", templateVars);
});

// redirect short url
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// specific url
app.get("/urls/:shortURL", (req, res) => {
  const activeUser = req.cookies["user_id"];
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[activeUser] };
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  const activeUser = req.cookies["user_id"];
  const templateVars = { user: users[activeUser] };
  res.render("user_registration", templateVars);
});

app.get("/login", (req, res) => {
  const activeUser = req.cookies["user_id"];
  const templateVars = { user: users[activeUser] };
  res.render("user_login", templateVars)
});

// ***************** POST REQUESTS *****************************

// create new url
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString(); 
  // saves shortURL-longURL to urlDatabase
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

// remove url from urlDatabase
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
})

// edit url in dataBase 
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const newLongURL = req.body.longURL;
  urlDatabase[shortURL] = newLongURL;
  res.redirect("/urls");
})

// logging in functionality / setting cookie
app.post("/login", (req, res) => {
  const username = req.body.username
  res.cookie("username", username);
  res.redirect("/urls");
})

// logging out functionality / clear cookie
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("urls");
})

// add new user to user database and set id cookie
app.post("/register", (req, res) => {
  const userId = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (!email) {
    return res.send("Please enter email", 404);
  }

  if(!password) {
    return res.send("Please enter password", 404);
  }

  if(lookUp(users, email)) {
    return res.send("User already exists", 404);
  }

  const newUser = {
    userId, 
    email,
    password
  }
  users[userId] = newUser
  res.cookie("user_id", userId);
  res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});