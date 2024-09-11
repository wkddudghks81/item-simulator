import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import bcrypt from 'bcrypt';
import Joi from 'joi';

const joirule = Joi.object({
    name: Joi.string().min(1).max(50).required(),
    hp: Joi.number().min(0).max(150).required(),
    power: Joi.number().min(1).max(150).required(),
    price: Joi.number().min(1).max(1500).required()
});

const router = express.Router();

/** 아이템 생성 API **/
router.post('/postitem', authMiddleware, async (req, res, next) => {
    try {
        const { userId } = req.user;
        const validation = await joirule.validateAsync(req.body);
        const { name, hp, power, price } = validation;

        const post = await prisma.Item.create({
            data: {
                userId: +userId,
                name,
                hp,
                power,
                price
            }
        });

        return res.status(201).json({ data: post });
    } catch (error) {
        next(error);
    }
});

/** 아이템 조회 API **/
router.get('/postitem', async (req, res, next) => {
    try {
        const posts = await prisma.Item.findMany({
            select: {
                itemId: true,
                userId: true,
                name: true,
                hp: true,
                power: true,
                price: true
            }
        });

        return res.status(200).json({ data: posts });
    } catch (error) {
        next(error);
    }
});

/** 아이템 상세 조회 API **/
router.get('/postitem/:itemId', async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const post = await prisma.Item.findFirst({
            where: {
                itemId: +itemId
            },
            select: {
                itemId: true,
                userId: true,
                name: true,
                hp: true,
                power: true,
                price: true
            }
        });

        return res.status(200).json({ data: post });
    } catch (error) {
        next(error);
    }
});

/** 아이템 수정 API **/
router.put('/putitem/:itemId', async (req, res) => {
    try {
        const { name, hp, power, price } = req.body;
        const { itemId } = req.params;
        const updateUser = await prisma.Item.update({
            where: {
                itemId: +itemId
            },
            data: {
                name,
                hp,
                power,
                price
            }
        });
        res.json(updateUser);
    } catch (error) {
        next(error);
    }
});

/** 아이템 삭제 API **/
router.delete('/itemdelete/:itemId', authMiddleware, async (req, res, next) => {
    try {
        const { userId } = req.user;
        const { itemId } = req.params;
        const { password } = req.body;
        const user = await prisma.users.findFirst({
            where: { userId: +userId }
        });
        const post = await prisma.Item.findFirst({
            where: { itemId: +itemId }
        });

        if (!post)
            return res
                .status(404)
                .json({ message: '아이템이 존재하지 않습니다.' });
        else if (!(await bcrypt.compare(password, user.password)))
            return res
                .status(401)
                .json({ message: '비밀번호가 일치하지 않습니다.' });
        await prisma.Item.delete({ where: { itemId: +itemId } });

        return res.status(200).json({ data: '아이템이 삭제되었습니다.' });
    } catch (error) {
        next(error);
    }
});

export default router;
