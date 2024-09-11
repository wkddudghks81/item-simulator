import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authMiddleware from '../middlewares/auth.middleware.js';
import Joi from 'joi';

const router = express.Router();
const emailrule = Joi.object({
    email: Joi.string().min(1).max(50).required(),
    password: Joi.string().alphanum().min(6).max(50).required(),
    name: Joi.string().min(1).max(50).required(),
    age: Joi.number().min(1).max(150).required()
});

/** 사용자 회원가입 API **/
router.post('/sign-up', async (req, res, next) => {
    try {
        const validation = await emailrule.validateAsync(req.body);
        const { email, password, name, age } = validation;
        const isExistUser = await prisma.users.findFirst({
            where: {
                email
            }
        });

        if (isExistUser) {
            return res
                .status(409)
                .json({ message: '이미 존재하는 이메일입니다.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Users 테이블에 사용자를 추가합니다.
        const user = await prisma.users.create({
            data: {
                email,
                password: hashedPassword // 암호화된 비밀번호를 저장합니다.
            }
        });
        // UserInfos 테이블에 사용자 정보를 추가합니다.
        await prisma.userInfos.create({
            data: {
                userId: user.userId, // 생성한 유저의 userId를 바탕으로 사용자 정보를 생성합니다.
                name,
                age
            }
        });

        return res.status(201).json({ message: '회원가입이 완료되었습니다.' });
    } catch (error) {
        next(error);
    }
});

/** 사용자 로그인 API **/
router.post('/sign-in', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.users.findFirst({ where: { email } });

        if (!user)
            return res
                .status(401)
                .json({ message: '존재하지 않는 이메일입니다.' });
        // 입력받은 사용자의 비밀번호와 데이터베이스에 저장된 비밀번호를 비교합니다.
        else if (!(await bcrypt.compare(password, user.password)))
            return res
                .status(401)
                .json({ message: '비밀번호가 일치하지 않습니다.' });

        // 로그인에 성공하면, 사용자의 userId를 바탕으로 토큰을 생성합니다.
        const token = jwt.sign(
            {
                userId: user.userId
            },
            'custom-secret-key'
        );

        // authotization 쿠키에 Berer 토큰 형식으로 JWT를 저장합니다.
        res.cookie('authorization', `Bearer ${token}`);
        return res.status(200).json({ message: '로그인 성공' });
    } catch (error) {
        next(error);
    }
});

/** 사용자 조회 API **/
router.get('/users', authMiddleware, async (req, res, next) => {
    const { userId } = req.user;
    try {
        const user = await prisma.users.findFirst({
            where: { userId: +userId },
            select: {
                userId: true,
                email: true,
                password: true,
                userInfos: {
                    // 1:1 관계를 맺고있는 UserInfos 테이블을 조회합니다.
                    select: {
                        name: true,
                        age: true
                    }
                }
            }
        });

        return res.status(200).json({ data: user });
    } catch (error) {
        next(error);
    }
});

/** 사용자 수정 API **/
router.put('/usersput/:userId', async (req, res) => {
    try {
        const { name, age } = req.body;
        const { userId } = req.params;
        const updateUser = await prisma.users.update({
            where: { userId: +userId },
            data: {
                name,
                age
            }
        });
        res.json(updateUser);
    } catch (error) {
        next(error);
    }
});

/** 사용자 삭제 API **/
router.delete(
    '/usersdelete/:userId',
    authMiddleware,
    async (req, res, next) => {
        try {
            const { userId } = req.params;
            const { password } = req.body;
            const user = await prisma.users.findFirst({
                where: { userId: +userId }
            });
            const post = await prisma.users.findFirst({
                where: { userId: +userId }
            });

            if (!post)
                return res
                    .status(404)
                    .json({ message: '사용자가 존재하지 않습니다.' });
            else if (!(await bcrypt.compare(password, user.password)))
                return res
                    .status(401)
                    .json({ message: '비밀번호가 일치하지 않습니다.' });
            await prisma.users.delete({ where: { userId: +userId } });

            return res.status(200).json({ data: '사용자가 삭제되었습니다.' });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
