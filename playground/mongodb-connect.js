const { MongoClient } = require('mongodb');

MongoClient.connect('mongodb://localhost:27017/TodoApp', (err, db) => {
  if (err) {
    return console.log('Unable to connect to MongoDB server.');
  }
  console.log('Connected to MongoDB server.');

  db.collection('Todos').insertOne({
    text: 'Another thing to do',
    completed: false
  }, (e, result) => {
    if (e) {
      return console.log('Unable to insert todo:', e);
    }
    console.log(JSON.stringify(result.ops, undefined, 2));
  });

  db.collection('Users').insertOne({
    name: 'Vianne',
    age: 1,
    location: 'Yogyakarta'
  }, (e, result) => {
    if (e) {
      return console.log('Unable to insert user:', e);
    }
    console.log(result.ops[0]._id.getTimestamp());
  });

  db.close();
});
