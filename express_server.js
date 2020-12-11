const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require("bcrypt");
const methodOverride = require('method-override');
const { lookUp, generateRandomString, urlsForUser, createURLAnalytics } = require("./helpers");
const app = express();
const PORT = 8080; // default port 8080


app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'session',
  keys: ['dsfghs']
}));
app.set('view engine', 'ejs');

 
// ************* Databases ***************************
const urlDatabase = {};


const users = {};

const analytics = {};


// ***************** GET REQUESTS *****************************
app.get("/", (req, res) => {
  const activeUser = req.session.user_id;
  if (activeUser === "undefined" || activeUser === undefined) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

// all urls rendered in table
app.get("/urls", (req, res) => {
  const activeUser = req.session.user_id;
  const activeUserURLs = urlsForUser(activeUser, urlDatabase);
  const templateVars = { urls: activeUserURLs, user: users[activeUser] };
  res.render('urls_index.ejs', templateVars);
});

// get form to add a new url
app.get("/urls/new", (req, res) => {
  const activeUser = req.session.user_id;
  if (!activeUser) {
    return res.redirect("/login");
  }
  const templateVars = { user: users[activeUser] };
  res.render("urls_new", templateVars);
});

// redirect short url
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  // if the url doesn't exist 
  if(!urlDatabase[shortURL]) {
    return res.status(404).send("Page not found")
  }
  // if not logged in
  let visitorID;
  if (!req.session.visitor_id) {
    visitorID = generateRandomString();
    req.session.visitor_id = visitorID;
  } else {
    visitorID = req.session.visitor_id;
  }
  // if it doesn't exist in our analytics database create new instance
  if (!analytics[shortURL]) {
    const urlAnalytics = createURLAnalytics(shortURL, visitorID);
    analytics[shortURL] = urlAnalytics;
  } else {
    // if it exisits
    const visitData = analytics[shortURL].visits;
    // check for new visitor
    if (!visitData.visitorIDs.includes(visitorID)) {
      visitData.uniqueVisitors++;
    }
    // update other values
    visitData.totalVisits++;
    visitData.timestamps.push(new Date(Date.now()).toString());
    visitData.visitorIDs.push(visitorID);
  }
  // redirect to long url
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

// specific url
app.get("/urls/:id", (req, res) => {
  const activeUser = req.session.user_id;
  const activeUserURLs = urlsForUser(activeUser, urlDatabase);
  const shortURL = req.params.id;
  // check user has this url in their personal db
  if (!activeUserURLs[shortURL]) {
    return res.status(401).send("You do not have permission to access this page");
  }
  const longURL = activeUserURLs[shortURL].longURL;
  const user = users[activeUser];
  const urlAnalytics = analytics[shortURL] || undefined;
  const templateVars = { shortURL, longURL, user, urlAnalytics};
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  const activeUser = req.session.user_id;
  if (activeUser) {
    return res.redirect("/urls");
  }
  const templateVars = { user: users[activeUser] };
  res.render("user_registration", templateVars);
});

app.get("/login", (req, res) => {
  const activeUser = req.session.user_id;
  if (activeUser) {
    return res.redirect("/urls");
  }
  const templateVars = { user: users[activeUser] };
  res.render("user_login", templateVars);
});

// ***************** POST REQUESTS *****************************

// create new url
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  const userID = req.session.user_id;
  // saves shortURL-longURL to urlDatabase
  const newURL = {
    longURL,
    userID
  };
  urlDatabase[shortURL] = newURL;
  res.redirect(`/urls/${shortURL}`);
});


// remove url from urlDatabase
app.delete("/urls/:id/delete", (req, res) => {
  const activeUser = req.session.user_id;
  const activeUserURLs = urlsForUser(activeUser, urlDatabase);
  const shortURL = req.params.id;
  // check for activeuser and if url belongs to active user
  if (!lookUp(activeUserURLs, activeUser)) {
    return res.status(401).send("You do not have permission to access this page");
  }
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// edit url in dataBase
app.put("/urls/:id", (req, res) => {
  const activeUser = req.session.user_id;
  const activeUserURLs = urlsForUser(activeUser, urlDatabase);
  const shortURL = req.params.id;
  // check url belongs to active user
  if (!lookUp(activeUserURLs, activeUser)) {
    return res.status(401).send("You do not have permission to access this page");
  }
  const newLongURL = req.body.longURL;
  urlDatabase[shortURL].longURL = newLongURL;
  res.redirect("/urls");
});

// logging in functionality / setting cookie
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userInfo = lookUp(users, email);

  if (!userInfo) {
    return res.status(403).send("User with that email does not exist");
  }

  if (!bcrypt.compareSync(password, userInfo.hashedPassword)) {
    return res.status(403).send("Password is incorrect");
  }

  req.session.user_id = userInfo.userId;
  res.redirect("/urls");
});

// logging out functionality / clear cookie
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("urls");
});

// add new user to user database and set id cookie
app.post("/register", (req, res) => {
  const userId = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email) {
    return res.status(404).send("Please enter email");
  }

  if (!password) {
    return res.status(404).send("Please enter password");
  }

  if (lookUp(users, email)) {
    return res.status(404).send("User already exists");
  }

  const newUser = {
    userId,
    email,
    hashedPassword
  };
  users[userId] = newUser;
  req.session.user_id = userId;
  res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});