import dbClient from '../../utils/db';

describe('Authentication Controller', () => {
  const testUser = {
    email: 'kaido@beast.com',
    password: 'hyakuju_no_kaido_wano',
  };
  let sessionToken = '';

  before(function (done) {
    this.timeout(8000);
    dbClient.usersCollection()
      .then((collection) => {
        collection.deleteMany({ email: testUser.email })
          .then(() => {
            request.post('/users')
              .send({
                email: testUser.email,
                password: testUser.password,
              })
              .expect(201)
              .end((error, response) => {
                if (error) {
                  return done(error);
                }
                expect(response.body.email).to.equal(testUser.email);
                expect(response.body.id).to.have.length.greaterThan(0);
                done();
              });
          })
          .catch((err) => done(err));
      }).catch((err) => done(err));
  });

  describe('Connect Endpoint - GET /connect', () => {
    it('Should fail without an Authorization header', function (done) {
      this.timeout(4000);
      request.get('/connect')
        .expect(401)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.body).to.deep.equal({ error: 'Unauthorized' });
          done();
        });
    });

    it('Should fail for non-registered user credentials', function (done) {
      this.timeout(4000);
      request.get('/connect')
        .auth('invalid@user.com', 'wrongpassword', { type: 'basic' })
        .expect(401)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.body).to.deep.equal({ error: 'Unauthorized' });
          done();
        });
    });

    it('Should reject a valid email with incorrect password', function (done) {
      this.timeout(4000);
      request.get('/connect')
        .auth(testUser.email, 'wrongpassword', { type: 'basic' })
        .expect(401)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.body).to.deep.equal({ error: 'Unauthorized' });
          done();
        });
    });

    it('Should reject invalid email with correct password', function (done) {
      this.timeout(4000);
      request.get('/connect')
        .auth('invalid@domain.com', testUser.password, { type: 'basic' })
        .expect(401)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.body).to.deep.equal({ error: 'Unauthorized' });
          done();
        });
    });

    it('Should authenticate an existing user with valid credentials', function (done) {
      this.timeout(4000);
      request.get('/connect')
        .auth(testUser.email, testUser.password, { type: 'basic' })
        .expect(200)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.body.token).to.exist;
          expect(res.body.token.length).to.be.greaterThan(0);
          sessionToken = res.body.token;
          done();
        });
    });
  });

  describe('Disconnect Endpoint - GET /disconnect', () => {
    it('Should fail without an X-Token header', function (done) {
      this.timeout(4000);
      request.get('/disconnect')
        .expect(401)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.body).to.deep.equal({ error: 'Unauthorized' });
          done();
        });
    });

    it('Should fail for a non-existent user', function (done) {
      this.timeout(4000);
      request.get('/disconnect')
        .set('X-Token', 'invalid_token')
        .expect(401)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.body).to.deep.equal({ error: 'Unauthorized' });
          done();
        });
    });

    it('Should succeed with a valid X-Token header', function (done) {
      request.get('/disconnect')
        .set('X-Token', sessionToken)
        .expect(204)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.body).to.deep.equal({});
          expect(res.text).to.equal('');
          expect(res.headers['content-type']).to.not.exist;
          expect(res.headers['content-length']).to.not.exist;
          done();
        });
    });
  });
});

