import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import bcrypt from 'bcrypt';
import Joi from 'joi';

const router = express.Router();

const joirule = Joi.object({
    name: Joi.string().min(1).max(50).required()
});

/** 캐릭터 생성 API **/
router.post('/postcharacter', authMiddleware, async (req, res, next) => {
    try {
        const { userId } = req.user;
        const validation = await joirule.validateAsync(req.body);
        const { name } = validation;

        const post = await prisma.Character.create({
            data: {
                userId: +userId,
                name
            }
        });

        return res.status(201).json({ data: post });
    } catch (error) {
        next(error);
    }
});

/** 캐릭터 조회 API **/
router.get('/postcharacter', async (req, res, next) => {
    try {
        const posts = await prisma.Character.findMany({
            select: {
                characterId: true,
                userId: true,
                name: true,
                hp: true,
                power: true,
                money: true
            }
        });

        return res.status(200).json({ data: posts });
    } catch (error) {
        next(error);
    }
});

/** 캐릭터 상세 조회 API **/
router.get('/postcharacter/:characterId', async (req, res, next) => {
    try {
        const { characterId } = req.params;
        const post = await prisma.Character.findFirst({
            where: {
                characterId: +characterId
            },
            select: {
                characterId: true,
                userId: true,
                name: true,
                hp: true,
                power: true,
                money: true
            }
        });

        return res.status(200).json({ data: post });
    } catch (error) {
        next(error);
    }
});

/** 캐릭터 이름 수정 API **/
router.put('/putcharacter/:characterId', async (req, res) => {
    try {
        const { name } = req.body;
        const { characterId } = req.params;
        const updateUser = await prisma.Character.update({
            where: {
                characterId: +characterId
            },
            data: {
                name: name
            }
        });
        res.json(updateUser);
    } catch (error) {
        next(error);
    }
});

/** 캐릭터 삭제 API **/
router.delete(
    '/characterdelete/:characterId',
    authMiddleware,
    async (req, res, next) => {
        try {
            const { characterId } = req.params;
            const { password } = req.body;
            const { userId } = req.user;
            const user = await prisma.users.findFirst({
                where: { userId: +userId }
            });
            const post = await prisma.Character.findFirst({
                where: { characterId: +characterId }
            });

            if (!post)
                return res
                    .status(404)
                    .json({ message: '캐릭터가 존재하지 않습니다.' });
            else if (!(await bcrypt.compare(password, user.password)))
                return res
                    .status(401)
                    .json({ message: '비밀번호가 일치하지 않습니다.' });
            await prisma.Character.delete({
                where: { characterId: +characterId }
            });

            return res.status(200).json({ data: '캐릭터가 삭제되었습니다.' });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
