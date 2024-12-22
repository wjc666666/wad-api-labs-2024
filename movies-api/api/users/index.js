import express from 'express';
import User from './userModel';
import jwt from 'jsonwebtoken';

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
        if (!req.body.userName || !req.body.password) {
            return res.status(400).json({
                code: 400,
                msg: 'Username and password are required.', // [修改内容] 返回错误信息
            });
        }

        if (req.query.action === 'register') {
            const { userName, password } = req.body;

            if (!validatePassword(password)) {
                return res.status(400).json({
                    code: 400,
                    msg: 'Password must be at least 8 characters long and include at least one letter, one number, and one special character.',
                });
            }

            const existingUser = await User.findOne({ userName });
            if (existingUser) {
                return res.status(400).json({
                    code: 400,
                    msg: 'Username is already taken.',
                });
            }

            await User.create(req.body);
            res.status(201).json({
                code: 201,
                msg: 'Successful created new user.',
            });
        } else {
            const { userName, password } = req.body;

            const user = await User.findOne({ userName });
            if (!user) {
                return res.status(401).json({ code: 401, msg: 'Authentication failed' });
            }

            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({ code: 401, msg: 'Authentication failed. Wrong password.' });
            }

            const token = jwt.sign({ userName: user.userName }, process.env.SECRET);
            res.status(200).json({
                code: 200,
                msg: 'Authentication Successful',
                token: 'BEARER ' + token,
            });
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
        res.status(200).json({ code: 200, msg: 'User Updated Sucessfully' });
    } else {
        res.status(404).json({ code: 404, msg: 'Unable to Update User' });
    }
});

async function registerUser(req, res) {
    const { userName, password } = req.body;

    if (!validatePassword(password)) {
        return res.status(400).json({
            success: false,
            msg: 'Password must be at least 8 characters long and include at least one letter, one number, and one special character.',
        });
    }

    const existingUser = await User.findOne({ userName });
    if (existingUser) {
        return res.status(400).json({
            success: false,
            msg: 'Username is already taken.',
        });
    }

    await User.create(req.body);
    res.status(201).json({ success: true, msg: 'User successfully created.' });
}

async function authenticateUser(req, res) {
    const { userName, password } = req.body;

    const user = await User.findOne({ userName });
    if (!user) {
        return res.status(401).json({ success: false, msg: 'Authentication failed. User not found.' });
    }

    const isMatch = await user.comparePassword(password);
    if (isMatch) {
        const token = jwt.sign({ username: user.userName }, process.env.SECRET);
        res.status(200).json({ success: true, token: 'BEARER ' + token });
    } else {
        res.status(401).json({ success: false, msg: 'Wrong password.' });
    }
}

export default router;
