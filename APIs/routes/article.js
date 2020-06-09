const express = require('express');
const router = express.Router();
const article = require('../Controller/ArticleController');
const user = require('../Controller/UserController');
const { check, validationResult } = require('express-validator');
const verify = require('./verifyToken');

router.get('/searchArticle/:search', async (req, res) => {
    await article.searchArticle(req.params.search, (err, rows) => {
        if (err) return res.status(403).json({ error: err });
        if (!rows.length) return res.status(404).json({ error: 'not found', rows });
        return res.status(200).json({ message: 'success', rows });
    })
})

router.get('/:id?', function (req, res) {
    if (req.params.id) {
        article.getArticleById(req.params.id, function (err, rows) {
            if (err) return res.status(403).json({ error: err });
            if (!rows.length) return res.status(400).json({ error: 'Id not found', rows });
            return res.status(200).json({ message: 'success', rows });
        })
    } else {
        article.getAllArticle(function (err, rows) {
            if (err) return res.status(403).json({ error: err });
            if (!rows.length) return res.status(400).json({ error: 'Not found any article', rows });
            return res.status(200).json({ message: 'success', rows });
        })
    }
});

router.post('/addArticle', [
    check('title').not().isEmpty().isLength({ max: 255 }),
    check('content').not().isEmpty().isLength({ max: 99999 })
], verify, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        await user.findByUsername(req.user._username, function (err, result) {
            if (err) return res.status(403).json({ error: err });
            else if (result) {
                req.body.user_id = result[0].user_id;
                // console.log(result[0].user_id);
            }
        });

        await article.getArticleByTitle(req.body.title, async (err, rows) => {
            if (err) return res.status(403).json({ error: err });
            if (rows.length) return res.status(403).json({ error: 'Title is already exists', rows });
            await article.addArticle(req.body, function (err, count) {
                if (err) return res.status(403).json({ error: err });
                if (!count) return res.status(403).json({ error: 'Insert article failed' });
                return res.status(200).json({ message: 'Insert article success', count });
            })
        })
    } catch (error) {
        res.status(400).send(error)
    }
});

router.delete('/:id', verify, async (req, res) => {
    await article.getArticleById(req.params.id, async (err, result) => {
        if (err) return res.status(403).json({ error: err });
        if (!result.length) return res.status(404).json({ error: 'Id Article not found' });
        if (req.user._role != 1 && req.user._username != result[0].username) return res.status(401).json({ error: 'You do not permit to delete this article.' });
        await article.deleteArticle(req.params.id, function (err, count) {
            if (err) return res.status(403).json({ error: err });
            if (!count) return res.status(500).json({ error: 'Delete article failed' });
            return res.status(200).json({ message: 'Delete article ' + result[0].title + 'success', count });
        })
    })
});

router.put('/:id', verify, async (req, res) => {
    if (!req.body.title && !req.body.content) return res.status(400).json({ error: 'Nothing to update' });
    article.getArticleById(req.params.id, async (err, result) => {
        if (err)
            return res.status(403).json({ error: err });
        if (!result.length)
            return res.status(404).json({ error: 'Id Article not found' });
        user.findByUsername(req.user._username, function (err, row) {
            if (err)
                return res.status(400).json({ error: err });
            if (!row.length)
                return res.status(404).json({ error: 'Not found any user' });
            if (result[0].user_id != row[0].user_id)
                return res.status(401).json({ error: 'You are not permitted to edit this article.' });
            else if (req.body.title == null)
                req.body.title = result[0].title;
            if (req.body.content == null)
                req.body.content = result[0].content;
            article.updateArticle(req.params.id, req.body, (err, rows) => {
                if (err)
                    return res.status(403).json({ error: err });
                if (!rows)
                    return res.status(500).json({ error: 'Update article failed' });
                return res.status(200).json({ message: 'Update article "' + result[0].title + '" success', rows });
            });
        });

    });
})

module.exports = router;