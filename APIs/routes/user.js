const express = require('express');
const router = express.Router();
const user = require('../Controller/UserController');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verify = require('./verifyToken');

router.post('/register', [
    // validation data
    check('username').trim().isLength({ min: 3, max: 50 }),
    check('password').trim().isLength({ min: 6, max: 255 }),
    // check('confirmPassword').trim().isLength({ min: 6, max: 255 }).custom((value, { req }) => {
    //     if (value !== req.body.password) {
    //         throw new Error('Password confirmation is incorrect');
    //     }
    //     return true;
    // })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        user.findByUsername(req.body.username, async (err, result) => {
            if (err)
                return res.status(403).json({ error: err });
            if (result.length) {
                return res.status(403).json({ error: 'Username is already exists' });
            }
            else {
                // hash password
                const salt = await bcrypt.genSalt(10);
                req.body.password = await bcrypt.hash(req.body.password, salt);
                req.body.role = 0;
                user.addUser(req.body, function (err, result) {
                    if (err)
                        return res.status(403).json({ error: err });
                    else if (result) {
                        return res.status(200).json({ message: 'register success' });
                    }
                    else {
                        return res.status(400).json({ error: 'register failed' });
                    }
                });
            }
        });
    } catch (e) {
        res.status(400).send(e)
    }
});

router.post('/login', [
    check('username').trim().isLength({ min: 3, max: 50 }),
    check('password').trim().isLength({ min: 6, max: 255 }),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        user.findByUsername(req.body.username, async (err, result) => {
            if (err) return res.status(403).json({error: err});
            if (!result.length) {
                return res.status(400).json({ error: 'Username not found' });
            } else {
                const validPass = await bcrypt.compare(req.body.password, result[0].password);

                if (!validPass) {
                    return res.status(400).json({ message: 'Password invalid' });
                } else {
                    const token = jwt.sign({ _id: result[0].id, _username: result[0].username, _role: result[0].role }, process.env.TOKEN_SECRET, { expiresIn: '1d' });
                    return res.header('authToken', token).status(200).json({ authToken: token });
                }
            }
        })
    } catch (e) {
        res.status(400).send(e)
    }
});

router.get('/:id?', verify, async (req, res) => {
    if (req.user._role == null) return res.status(403).json({ message: 'role was null' });
    if (req.user._role.data == 1) {
        if (req.params.id) {
            if (req.params.id != req.user._id) return res.status(401).json({ message: 'token not match' });
            await user.getUserById(req.params.id, (err, rows) => {
                if (err) return res.status(403).json(err);
                else return res.status(200).json(rows);
            })
        } else {
            await user.getAllUser((err, rows) => {
                if (err) return res.status(403).json(err);
                else return res.status(200).json(rows);
            })
        }
    } else {
        if (req.params.id) {
            if (req.params.id != req.user._id) return res.status(401).json({ message: 'token not match' });
            await user.getUserById(req.params.id, (err, rows) => {
                if (err) return res.status(403).json(err);
                else return res.status(200).json(rows);
            })
        } else {
            res.status(403).json({ message: 'Access Denied' });
        }
    }
});


router.post('/changepassword/:id', [
    check('password').trim().isLength({ min: 6, max: 255 }),
], verify, async (req, res) => {
    if (req.params.id != req.user._id) return res.status(403).json({ message: 'token not match' });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
    user.updateUser(req.params.id, req.body, function (err, rows) {
        if (err) throw res.status(403).json(err);
        if (!rows) return res.status(403).json({ rows, message: 'Update user failed' });
        else return res.status(200).json({ message: 'Update user success' });
    })
});

router.delete('/:id', verify, async (req, res) => {
    if (req.user._role == null) return res.status(403).json({ message: 'Role was null' });
    if (req.user._role != 1) return res.status(403).json({ message: 'You do not have permission to delete users' });
    await user.getUserById(req.params.id, async (err, result) => {
        if (err) return res.status(403).json({ error: err });
        if (!result.length) return res.status(400).json({ message: 'Id not found' });
        if (result[0].role == 1) return res.status(403).json({ message: 'You cannot delete Administrator account' });
        else {
            await user.deleteUser(req.params.id, function (err, count) {
                if (err) throw res.json(err);
                if (count) return res.status(200).json({ message: 'Delete user success' });
            })
        }
    })
});

module.exports = router;