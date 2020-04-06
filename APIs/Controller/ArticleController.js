'use strict';

const util = require('util');
const mysql = require('mysql');
const db = require('../db');

module.exports = {
    searchArticle: function (string, callback) {
        return db.query("SELECT * FROM articles WHERE title LIKE ? OR content LIKE ?", [string, string], callback);
    },
    getAllArticle: function (callback) {
        return db.query("Select * from articles", callback);
    },
    getArticleById: function (id, callback) {
        return db.query("select * from articles where article_id=?", [id], callback);
    },
    getArticleByTitle: function (title, callback) {
        return db.query("select * from articles where title = ?", [title], callback);
    },
    addArticle: function (article, callback) {
        return db.query("Insert into articles(title, content, user_id) values(?,?,?)", [article.title, article.content, article.user_id], callback);
    },
    deleteArticle: function (id, callback) {
        return db.query("delete from articles where article_id=?", [id], callback);
    },
    updateArticle: function (id, article, callback) {
        var datetime = new Date();
        return db.query("update articles set title = ?, content = ?, updated_at = ? where article_id = ?", [article.title, article.content, datetime, id], callback);
    }
};