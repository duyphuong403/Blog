const db = require('../db');

module.exports = {
    findByUsername: function (username, callback) {
        return db.query("select * from users where username = ?", [username], callback);
    },
    getAllUser: function (callback) {
        return db.query("Select id, username, role from users", callback);
    },
    getUserById: function (id, callback) {
        return db.query("select id, username, role from users where user_id=?", [id], callback);
    },
    addUser: function (User, callback) {
        return db.query("Insert into users(username, password, role, fullname, email) values(?,?,?,?,?)", [User.username, User.password, User.role, User.fullname, User.email], callback);
    },
    updateUser: function (id, User, callback) {
        var datetime = new Date();
        return db.query("Update users set password = ?, role=?, fullname = ?, updated_at = ? where user_id = ?", [User.password, datetime, id], callback);
    },
    deleteUser: function (id, callback) {
        return db.query("Delete from users where user_id = ? ", [id], callback);
    },
};