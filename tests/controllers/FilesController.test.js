import chai from 'chai';
import chaiHttp from 'chai-http';
import server from '../server'; // Adjust to the location of your server entry point
import dbClient from '../utils/db';

const { expect } = chai;
chai.use(chaiHttp);

describe('FilesController Tests', () => {
  let userToken = '';
  const testUser = {
    email: 'testuser@example.com',
    password: 'password123',
  };

  const testFile = {
    name: 'testFile.txt',
    type: 'file',
    data: Buffer.from('Hello World').toString('base64'),
  };

  before(async () => {
    await dbClient.usersCollection().deleteMany({ email: testUser.email });
    const res = await chai.request(server)
      .post('/users')
      .send(testUser);
    expect(res.status).to.equal(201);
    const loginRes = await chai.request(server)
      .post('/connect')
      .auth(testUser.email, testUser.password, { type: 'basic' });
    expect(loginRes.status).to.equal(200);
    userToken = loginRes.body.token;
  });

  after(async () => {
    await dbClient.usersCollection().deleteMany({ email: testUser.email });
    await dbClient.filesCollection().deleteMany({ name: testFile.name });
  });

  describe('POST /files', () => {
    it('should upload a file successfully', async () => {
      const res = await chai.request(server)
        .post('/files')
        .set('X-Token', userToken)
        .send(testFile);
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('id');
      expect(res.body).to.have.property('name', testFile.name);
    });

    it('should return an error for missing name', async () => {
      const res = await chai.request(server)
        .post('/files')
        .set('X-Token', userToken)
        .send({
          type: testFile.type,
          data: testFile.data,
        });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error', 'Missing name');
    });

    it('should return an error for invalid type', async () => {
      const res = await chai.request(server)
        .post('/files')
        .set('X-Token', userToken)
        .send({
          name: 'InvalidTypeFile',
          type: 'invalid_type',
          data: testFile.data,
        });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error', 'Missing type');
    });
  });

  describe('GET /files/:id', () => {
    let fileId;

    before(async () => {
      const res = await chai.request(server)
        .post('/files')
        .set('X-Token', userToken)
        .send(testFile);
      fileId = res.body.id;
    });

    it('should retrieve a file by ID', async () => {
      const res = await chai.request(server)
        .get(`/files/${fileId}`)
        .set('X-Token', userToken);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('id', fileId);
      expect(res.body).to.have.property('name', testFile.name);
    });

    it('should return 404 for non-existent file', async () => {
      const res = await chai.request(server)
        .get('/files/invalidId')
        .set('X-Token', userToken);
      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('error', 'Not found');
    });
  });

  describe('PUT /files/:id/publish', () => {
    let fileId;

    before(async () => {
      const res = await chai.request(server)
        .post('/files')
        .set('X-Token', userToken)
        .send(testFile);
      fileId = res.body.id;
    });

    it('should publish a file', async () => {
      const res = await chai.request(server)
        .put(`/files/${fileId}/publish`)
        .set('X-Token', userToken);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('isPublic', true);
    });
  });

  describe('PUT /files/:id/unpublish', () => {
    let fileId;

    before(async () => {
      const res = await chai.request(server)
        .post('/files')
        .set('X-Token', userToken)
        .send(testFile);
      fileId = res.body.id;
    });

    it('should unpublish a file', async () => {
      const res = await chai.request(server)
        .put(`/files/${fileId}/unpublish`)
        .set('X-Token', userToken);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('isPublic', false);
    });
  });
});

