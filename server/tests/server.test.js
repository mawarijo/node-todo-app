const expect = require('expect');
const request = require('supertest');
const { ObjectID } = require('mongodb');

const { app } = require('../server');
const { Todo } = require('../models/todo');
const { User } = require('../models/user');
const {
  dummyTodos,
  populateTodos,
  dummyUsers,
  populateUsers
} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', () => {
  it('should create a new todo', (done) => {
    const text = 'Test todo text';
    const { token } = dummyUsers[0].tokens[0];

    request(app)
      .post('/todos')
      .set('x-auth', token)
      .send({ text })
      .expect(200)
      .expect((res) => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find({ text })
          .then((todos) => {
            expect(todos.length).toBe(1);
            expect(todos[0].text).toBe(text);
            done();
          })
          .catch((e) => done(e));
      });
  });

  it('should not create a new todo with invalid data', (done) => {
    const { token } = dummyUsers[0].tokens[0];

    request(app)
      .post('/todos')
      .set('x-auth', token)
      .send({})
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find()
          .then((todos) => {
            expect(todos.length).toBe(2);
            done();
          })
          .catch((e) => done(e));
      });
  });
});

describe('GET /todos', () => {
  it('should get all todos', (done) => {
    const { token } = dummyUsers[0].tokens[0];

    request(app)
      .get('/todos')
      .set('x-auth', token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).toBe(1);
      })
      .end(done);
  });
});

describe('GET /todos/:id', () => {
  it('should return todo doc', (done) => {
    const { token } = dummyUsers[0].tokens[0];

    request(app)
      .get(`/todos/${dummyTodos[0]._id.toHexString()}`)
      .set('x-auth', token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(dummyTodos[0].text);
      })
      .end(done);
  });

  it('should not return todo doc created by other user', (done) => {
    const { token } = dummyUsers[0].tokens[0];

    request(app)
      .get(`/todos/${dummyTodos[1]._id.toHexString()}`)
      .set('x-auth', token)
      .expect(404)
      .end(done);
  });

  it('should return 404 if todo not found', (done) => {
    const hexId = new ObjectID().toHexString();
    const { token } = dummyUsers[0].tokens[0];

    request(app)
      .get(`/todos/${hexId}`)
      .set('x-auth', token)
      .expect(404)
      .end(done);
  });

  it('should return 404 for non-object IDs', (done) => {
    const { token } = dummyUsers[0].tokens[0];

    request(app)
      .get('/todos/123')
      .set('x-auth', token)
      .expect(404)
      .end(done);
  });
});

describe('DELETE /todos/:id', () => {
  it('should remove a todo', (done) => {
    const hexId = dummyTodos[1]._id.toHexString();
    const { token } = dummyUsers[1].tokens[0];

    request(app)
      .delete(`/todos/${hexId}`)
      .set('x-auth', token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(hexId);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.findById(hexId)
          .then((todo) => {
            expect(todo).toBeFalsy();
            done();
          }).catch((e) => done(e));
      });
  });

  it('should not remove a todo owned by other user', (done) => {
    const hexId = dummyTodos[0]._id.toHexString();
    const { token } = dummyUsers[1].tokens[0];

    request(app)
      .delete(`/todos/${hexId}`)
      .set('x-auth', token)
      .expect(404)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.findById(hexId)
          .then((todo) => {
            expect(todo).toExist();
            done();
          }).catch((e) => done(e));
      });
  });

  it('should return 404 if ID not found', (done) => {
    const { token } = dummyUsers[0].tokens[0];

    request(app)
      .delete(`/todos/${new ObjectID().toHexString()}`)
      .set('x-auth', token)
      .expect(404)
      .end(done);
  });

  it('should return 404 if ObjectID not valid', (done) => {
    const { token } = dummyUsers[0].tokens[0];

    request(app)
      .delete('/todos/123')
      .set('x-auth', token)
      .expect(404)
      .end(done);
  });
});

describe('PATCH /todos/:id', () => {
  it('should update the todo', (done) => {
    const hexId = dummyTodos[1]._id.toHexString();
    const updates = {
      text: 'Updated text',
      completed: true
    };
    const { token } = dummyUsers[1].tokens[0];

    request(app)
      .patch(`/todos/${hexId}`)
      .set('x-auth', token)
      .send(updates)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(updates.text);
        expect(res.body.todo.completed).toBe(updates.completed);
        expect(res.body.todo.completedAt).toBeA('number');
      })
      .end(done);
  });

  it('should not update todo of another user', (done) => {
    const hexId = dummyTodos[0]._id.toHexString();
    const updates = {
      text: 'Updated text',
      completed: true
    };
    const { token } = dummyUsers[1].tokens[0];

    request(app)
      .patch(`/todos/${hexId}`)
      .set('x-auth', token)
      .send(updates)
      .expect(404)
      .end(done);
  });

  it('should clear completedAt if todo is not done', (done) => {
    const hexId = dummyTodos[1]._id.toHexString();
    const { token } = dummyUsers[1].tokens[0];

    request(app)
      .patch(`/todos/${hexId}`)
      .set('x-auth', token)
      .send({ completed: false })
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.completed).toBe(false);
        expect(res.body.todo.completedAt).toBeFalsy();
      })
      .end(done);
  });
});

describe('GET /users/me', () => {
  it('should return user if authenticated', (done) => {
    const { token } = dummyUsers[0].tokens[0];
    request(app)
      .get('/users/me')
      .set('x-auth', token)
      .expect(200)
      .expect((res) => {
        expect(res.body._id).toBe(dummyUsers[0]._id.toHexString());
        expect(res.body.email).toBe(dummyUsers[0].email);
      })
      .end(done);
  });

  it('should return 401 if not authenticated', (done) => {
    request(app)
      .get('/users/me')
      .expect(401)
      .expect((res) => {
        expect(res.body).toEqual({});
      })
      .end(done);
  });
});

describe('POST /users', () => {
  it('should create a user', (done) => {
    const email = 'newUser@example.com';
    const password = 'newUserPass';

    request(app)
      .post('/users')
      .send({ email, password })
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).toExist();
        expect(res.body._id).toExist();
        expect(res.body.email).toBe(email);
      })
      .end((err) => {
        if (err) {
          return done(err);
        }

        User.findOne({ email })
          .then((user) => {
            expect(user).toExist();
            expect(user.password).toNotBe(password);
            done();
          }).catch((e) => done(e));
      });
  });

  it('should return validation errors if request invalid', (done) => {
    const email = '';
    const password = 'a';

    request(app)
      .post('/users')
      .send({ email, password })
      .expect(400)
      .end(done);
  });

  it('should not create user if email in use', (done) => {
    const { email, password } = dummyUsers[0];

    request(app)
      .post('/users')
      .send({ email, password })
      .expect(400)
      .end(done);
  });
});

describe('POST /users/login', () => {
  it('should log in user and return auth token', (done) => {
    const { email, password } = dummyUsers[1];

    request(app)
      .post('/users/login')
      .send({ email, password })
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).toExist();
      })
      .end((err, res) => {
        if (err) { return done(err); }

        User.findById(dummyUsers[1]._id)
          .then((user) => {
            expect(user.tokens[1]).toInclude({
              access: 'auth',
              token: res.headers['x-auth']
            });
            done();
          }).catch((e) => done(e));
      });
  });

  it('should return 401 for invalid user login', (done) => {
    const { email } = dummyUsers[1];
    const password = 'invalidPassword';

    request(app)
      .post('/users/login')
      .send({ email, password })
      .expect(400)
      .expect((res) => {
        expect(res.headers['x-auth']).toNotExist();
      })
      .end((err, res) => {
        if (err) { return done(err); }

        User.findById(dummyUsers[1]._id)
          .then((user) => {
            expect(user.tokens.length).toBe(1);
            done();
          }).catch((e) => done(e));
      });
  });
});

describe('DELETE /users/me/token', () => {
  it('should log out user and remove auth token', (done) => {
    const { token } = dummyUsers[0].tokens[0];

    request(app)
      .delete('/users/me/token')
      .set('x-auth', token)
      .expect(200)
      .end((err, res) => {
        if (err) { return done(err); }

        User.findById(dummyUsers[0]._id)
          .then((user) => {
            expect(user.tokens.length).toBe(0);
            done();
          }).catch((e) => done(e));
      });
  });
});
