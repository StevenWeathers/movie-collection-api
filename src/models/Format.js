'use strict';

const Slugify = require('slugify');
const Mongoose = require('mongoose');

const schema = new Mongoose.Schema({
    title: String,
    slug: String
});

schema.index({ 'slug': 1 }, { unique: true });

const Format = Mongoose.model('Format', schema);

const format = {
    getFormats: (cb) => {

        const query = Format.find({});

        query.exec((err, formats) => {

            err ? cb(err) : cb(null, formats);
        });
    },
    getFormat: (_id, cb) => {

        Format.findOne({
            _id
        }, (err, formats) => {

            err ? cb(err) : cb(null, formats);
        });
    },
    createFormat: (data, cb) => {

        data.slug = Slugify(`${data.title}`).toLowerCase();

        const newFormat = new Format(data);

        newFormat.save((err, result) => {

            (err) ? cb(err) : cb(null, result);
        });
    },
    updateFormat: (_id, data, cb) => {

        data.slug = Slugify(`${data.title}`).toLowerCase();

        Format.updateOne({
            _id
        }, {
            $set: data
        }, (err, result) => {

            err ? cb(err) : cb(null, result.modifiedCount === 1 ? { _id } : {});
        });
    },
    deleteFormat: (_id, cb) => {

        Format.deleteOne({
            _id
        }, (err, result) => {

            err ? cb(err) : cb(null, result.deletedCount === 1 ? { _id } : {});
        });
    }
};

module.exports = format;
