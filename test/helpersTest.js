const { assert } = require('chai');

const { lookUp, urlsForUser } = require('../helpers.js');

const testUsers = {
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
};

const testDatabase = {
  i456: { longURL: "https://www.tsn.ca", userID: "user2RandomID" },
  i457: { longURL: "https://www.google.ca", userID: "user2RandomID" },
  i458: { longURL: "https://www.google.ca", userID: "ql421e" }
};

describe('lookUp', function() {
  it('should return a user with valid email', function() {
    const user = lookUp(testUsers, "user@example.com");
    const expectedOutput = "userRandomID";
    
    assert.isObject(user);
    assert.strictEqual(user.id, expectedOutput);
  });

  it('should return undefinded when we pass in an item that is not in our database', function() {
    const user = lookUp(testUsers, "randomUser@example.com");
    assert.isUndefined(user);
  })
});

describe('urlsForUser', function() {
  it('should return an object containing the users urls based on id', function() {
    const usersURLs = urlsForUser("user2RandomID", testDatabase) 
    const expectedOutput = {
    i456: { longURL: "https://www.tsn.ca", userID: "user2RandomID" },
    i457: { longURL: "https://www.google.ca", userID: "user2RandomID" }
    }
    assert.deepEqual(usersURLs, expectedOutput);
  });

  it('should return an empty object when there are no urls associated with that user', function() {
    const userURLs = urlsForUser("randomID", testDatabase);
    assert.deepEqual(userURLs, {});
  });
});