const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require("bcrypt");
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

 const urlsForUser = (id) => {
  const activeUserURLs = {}
  for (const key in urlDatabase) {
    if (id === urlDatabase[key].userID) {
      activeUserURLs[key] = urlDatabase[key];
    } 
  }
  return activeUserURLs;
 }
 

// ************* Databases ***************************
const urlDatabase = {
  // b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  // i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

/*
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
*/

const users = { 
//   "userRandomID": {
//     id: "userRandomID", 
//     email: "user@example.com", 
//     password: "purple-monkey-dinosaur"
//   },
//  "user2RandomID": {
//     id: "user2RandomID", 
//     email: "user2@example.com", 
//     password: "dishwasher-funk"
//   }
}


// ***************** GET REQUESTS *****************************
app.get("/", (req, res) => {
  res.status(200).send("Hello!");
});

// all urls rendered in table
app.get("/urls", (req, res) => {
  const activeUser = req.cookies["user_id"];
  const activeUserURLs = urlsForUser(activeUser);
  
  const templateVars = { urls: activeUserURLs, user: users[activeUser] };

  res.render('urls_index.ejs', templateVars);
});
// get form to add a new url
app.get("/urls/new", (req, res) => {
  const activeUser = req.cookies["user_id"];
  const templateVars = { user: users[activeUser] };

  if(activeUser === "undefined" || activeUser === undefined) {
    return res.redirect("/login")
  }

  res.render("urls_new", templateVars);
});

// redirect short url
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// specific url
app.get("/urls/:id", (req, res) => {
  const activeUser = req.cookies["user_id"];
  const activeUserURLs = urlsForUser(activeUser);
  const shortURL = req.params.id;
  // check user has this url in their personal db
  if (!activeUserURLs[shortURL]) {
    return res.status(401).send("You do not have permission to access this page");
  }
  const longURL = activeUserURLs[shortURL].longURL;
  const user = users[activeUser];
  const templateVars = { shortURL, longURL, user};
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
  const userID = req.cookies["user_id"]
  // saves shortURL-longURL to urlDatabase
  const newURL = {
    longURL, 
    userID
  }
  urlDatabase[shortURL] = newURL;
  res.redirect(`/urls/${shortURL}`);
});


// remove url from urlDatabase
app.post("/urls/:id/delete", (req, res) => {
  const activeUser = req.cookies["user_id"];
  const activeUserURLs = urlsForUser(activeUser);
  const shortURL = req.params.id;
  // check url belongs to active user
  if(!lookUp(activeUserURLs, activeUser)) {
    return res.status(401).send("You do not have permission to access this page");
  }
  delete urlDatabase[shortURL];
  res.redirect("/urls");
})

// edit url in dataBase 
app.post("/urls/:id", (req, res) => {
  const activeUser = req.cookies["user_id"];
  const activeUserURLs = urlsForUser(activeUser);
  const shortURL = req.params.id;
  // check url belongs to active user
  if(!lookUp(activeUserURLs, activeUser)) {
    return res.status(401).send("You do not have permission to access this page");
  }

  const newLongURL = req.body.longURL;
  urlDatabase[shortURL].longURL = newLongURL;
  res.redirect("/urls");
})

// logging in functionality / setting cookie
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userInfo = lookUp(users, email)
  console.log(userInfo);

  if(!userInfo) {
    return res.status(403).send("User with that email does not exist");
  }

  if(!bcrypt.compareSync(password, userInfo.hashedPassword)) {
    return res.status(403).send("Password is incorrect");
  }

  res.cookie("user_id", userInfo.userId);
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
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email) {
    return res.status(404).send("Please enter email");
  }

  if(!password) {
    return res.status(404).send("Please enter password");
  }

  if(lookUp(users, email)) {
    return res.status(404).send("User already exists");
  }

  const newUser = {
    userId, 
    email,
    hashedPassword
  }
  users[userId] = newUser
  res.cookie("user_id", userId);
  console.log(users);
  res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});