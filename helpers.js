// function to look up an item in database
const lookUp = (database, item) => {
  for (const key in database) {
    if (Object.values(database[key]).includes(item)) {
      return database[key];
    }
  }
  return undefined;
};

// function to generate random string
const generateRandomString = () => {
  return Math.random().toString(36).slice(2, 8);
};


// function that creates new user specific database of urls
const urlsForUser = (id, urlDatabase) => {
  const activeUserURLs = {};
  for (const key in urlDatabase) {
    if (id === urlDatabase[key].userID) {
      activeUserURLs[key] = urlDatabase[key];
    }
  }
  return activeUserURLs;
};


module.exports = { lookUp, generateRandomString, urlsForUser };