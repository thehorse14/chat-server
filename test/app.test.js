const chai = require('chai');
const chaiHttp = require('chai-http');

const { expect } = chai;
const fs = require('fs');
const app = require('../index.js');

chai.use(chaiHttp);

const uploadRoute = '/api/users/upload';

describe('Chat Log Analyzer API', () => {
  it('should return an error when no files are uploaded', (done) => {
    chai
      .request(app)
      .post(uploadRoute)
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('error').equal('No files uploaded.');
        done();
      });
  });

  it('should return an error when invalid file type are uploaded', (done) => {
    chai
      .request(app)
      .post(uploadRoute)
      .attach('file', fs.readFileSync('./test/files/invalidFile.jpg'), './test/files/invalidFile.jpg')
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('error').equal('Only .txt files are allowed');
        done();
      });
  });

  it('should analyze uploaded chat log file correctly', (done) => {
    chai
      .request(app)
      .post(uploadRoute)
      .attach('file', fs.readFileSync('./test/files/normalFlow.txt'), './test/files/normalFlow.txt')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');

        const result = res.body.results[0];
        expect(result).to.have.property('fileName').equal('normalFlow.txt');
        expect(result).to.have.property('topUsers').to.be.an('array');

        const { topUsers } = result;
        expect(topUsers).to.have.lengthOf(3);
        expect(topUsers).to.deep.equal([
          {
            userName: 'user2',
            count: 23,
          },
          {
            userName: 'user3',
            count: 18,
          },
          {
            userName: 'user1',
            count: 15,
          },
        ]);

        done();
      });
  });

  it('should return 3 users when 2 users have the same word count', (done) => {
    chai
      .request(app)
      .post(uploadRoute)
      .attach('file', fs.readFileSync('./test/files/topTwoWithSameWordCount.txt'), './test/files/topTwoWithSameWordCount.txt')
      .field('k', 2)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');

        const result = res.body.results[0];
        expect(result).to.have.property('fileName').equal('topTwoWithSameWordCount.txt');
        expect(result).to.have.property('topUsers').to.be.an('array');

        const { topUsers } = result;
        expect(topUsers).to.have.lengthOf(3);
        expect(topUsers).to.deep.equal([
          {
            userName: 'user2',
            count: 23,
          },
          {
            userName: 'user1',
            count: 18,
          },
          {
            userName: 'user3',
            count: 18,
          },
        ]);

        done();
      });
  });

  it('should analyze uploaded chat log files with multiple files', (done) => {
    chai
      .request(app)
      .post(uploadRoute)
      .attach('file', fs.readFileSync('./test/files/multipleFile1.txt'), './test/files/multipleFile1.txt')
      .attach('file', fs.readFileSync('./test/files/multipleFile2.txt'), './test/files/multipleFile2.txt')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');

        const result1 = res.body.results[0];
        expect(result1).to.have.property('fileName').equal('multipleFile1.txt');
        expect(result1).to.have.property('topUsers').to.be.an('array');

        const topUsers1 = result1.topUsers;
        expect(topUsers1).to.have.lengthOf(5);
        expect(topUsers1).to.deep.equal([
          {
            userName: 'Brian',
            count: 19,
          },
          {
            userName: 'Tiathan',
            count: 16,
          },
          {
            userName: 'Jess',
            count: 9,
          },
          {
            userName: 'Daniel',
            count: 8,
          },
          {
            userName: 'Andy',
            count: 2,
          },
        ]);
        const result2 = res.body.results[1];
        expect(result2).to.have.property('fileName').equal('multipleFile2.txt');
        expect(result2).to.have.property('topUsers').to.be.an('array');

        const topUsers2 = result2.topUsers;
        expect(topUsers2).to.have.lengthOf(3);
        expect(topUsers2).to.deep.equal([
          {
            userName: 'Brian',
            count: 16,
          },
          {
            userName: 'Tiathan',
            count: 14,
          },
          {
            userName: 'Jess',
            count: 9,
          },
        ]);

        done();
      });
  });

  it('should return the specified number of top chatty users', (done) => {
    chai
      .request(app)
      .post(uploadRoute)
      .attach('file', fs.readFileSync('./test/files/specifiedNumberOfUser.txt'), './test/files/specifiedNumberOfUser.txt')
      .field('k', 3)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('results').to.be.an('array').with.lengthOf(1);

        const result = res.body.results[0];
        expect(result).to.have.property('fileName').equal('specifiedNumberOfUser.txt');
        expect(result).to.have.property('topUsers').to.be.an('array');

        const { topUsers } = result;
        expect(topUsers).to.have.lengthOf(3);
        expect(topUsers).to.deep.equal([
          {
            userName: 'Brian',
            count: 19,
          },
          {
            userName: 'Tiathan',
            count: 16,
          },
          {
            userName: 'Jess',
            count: 9,
          },
        ]);
        done();
      });
  });
});
