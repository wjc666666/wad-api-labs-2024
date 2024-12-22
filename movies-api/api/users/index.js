import express from 'express';
import User from './userModel';

const router = express.Router(); // eslint-disable-line

const validatePassword = (password) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    return regex.test(password);
};

// Get all users
router.get('/', async (req, res) => {
    const users = await User.find();
    res.status(200).json(users);
});

// register(Create)/Authenticate User
router.post('/', async (req, res) => {
    try {
        if (req.query.action === 'register') {  
            const { userName, password } = req.body;
            if (!userName || !password) {
                return res.status(400).json({
                    code: 400,
                    msg: 'Username and password are required.', // [修改内容] 返回错误信息
                });
            }

            if (!validatePassword(password)) {
                return res.status(400).json({
                    code: 400,
                    msg: 'Password must be at least 8 characters long and include at least one letter, one number, and one special character.',
                });
            }

            // if action is 'register' then save to DB
            await User(req.body).save();
            res.status(201).json({
                code: 201,
                msg: 'Successful created new user.',
            });
        }
        else {  
            // Must be an authenticate then!!! Query the DB and check if there's a match
            const { userName, password } = req.body;
            if (!userName || !password) {
                return res.status(400).json({
                    code: 400,
                    msg: 'Username and password are required.', 
                });
            }

            const user = await User.findOne(req.body);
            if (!user) {
                return res.status(401).json({ code: 401, msg: 'Authentication failed' });
            } else {
                return res.status(200).json({ code: 200, msg: "Authentication Successful", token: 'TEMPORARY_TOKEN' });
            }
        }
    } catch (error) {
        res.status(500).json({ code: 500, msg: 'Internal Server Error', error: error.message });
    }
});

// Update a user
router.put('/:id', async (req, res) => {
    if (req.body._id) delete req.body._id;
    const result = await User.updateOne({
        _id: req.params.id,
    }, req.body);
    if (result.matchedCount) {
        res.status(200).json({ code:200, msg: 'User Updated Sucessfully' });
    } else {
        res.status(404).json({ code: 404, msg: 'Unable to Update User' });
    }
});

export default router;
