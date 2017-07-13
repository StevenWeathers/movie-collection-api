'use strict';

const Bcrypt = require('bcryptjs');
const Mongoose = require('mongoose');

const schema = new Mongoose.Schema({
    email: String,
    password: String
});

schema.index({ 'email': 1 }, { unique: true });

const User = Mongoose.model('User', schema);

const user = {
    getUsers: (cb) => {

        const query = User.find({}, { 'password': false });

        query.exec((err, users) => {

            err ? cb(err) : cb(null, users);
        });
    },
    getUser: (_id, cb) => {

        User.findOne({
            _id
        }, { 'password': false }, (err, users) => {

            err ? cb(err) : cb(null, users);
        });
    },
    createUser: (data, cb) => {

        Bcrypt.genSalt(10, (err, salt) => {

            if (!err) {
                Bcrypt.hash(user.password, salt, (err, hash) => {

                    if (!err) {
                        user.password = hash;

                        User.insertOne(data, (err, result) => {

                            if (!err) {

                                if (!err) {
                                    delete result.ops[0].password;
                                    cb(null, result.ops[0]);
                                }
                                else {
                                    cb(err);
                                }

                            }
                            else {
                                cb(err);
                            }
                        });
                    }
                    else {
                        cb(err);
                    }
                });
            }
            else {
                cb(err);
            }
        });
    },
    updateUser: (_id, data, cb) => {

        const salt = Bcrypt.genSaltSync(10);
        data.password = Bcrypt.hashSync(data.password, salt);

        User.updateOne({
            _id
        }, {
            $set: data
        }, (err, result) => {

            err ? cb(err) : cb(null, result.modifiedCount === 1 ? { _id } : {});
        });
    },
    deleteUser: (_id, cb) => {

        User.deleteOne({
            _id
        }, (err, result) => {

            err ? cb(err) : cb(null, result.deletedCount === 1 ? { _id } : {});
        });
    }
};

module.exports = user;
