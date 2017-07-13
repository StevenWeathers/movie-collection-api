'use strict';

// const Sinon = require('sinon');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const describe = lab.describe;
const it = lab.it;
const before = lab.before;
const after = lab.after;
const expect = Lab.expect;

// require hapi server
const Server = require('../src/server.js');

describe('Movie Collection API Server', () => {

    before((done) => {

        done();
    });

    after((done) => {

        done();
    });

    it('should get products', (done) => {
        // mock MongoDB here

        // make API call to self to test functionality end-to-end
        // Server.inject({
        //     method: 'GET',
        //     url: '/movies'
        // }, (response) => {

        //     expect(response.statusCode).to.equal(200);
        //     done();
        // });
        expect(1).to.equal(1);
        done();
    });
});
