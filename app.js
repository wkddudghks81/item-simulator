import express from 'express';
import cookieParser from 'cookie-parser';
import UsersRouter from './routes/users.router.js';
import itemRouter from './routes/item.js';
import characterRouter from './routes/character.js';
import ErrorHandlerMiddleware from './middlewares/error-handler.middleware.js';

const app = express();
const PORT = 3000;

router.get('/', (req, res) => {
    return res.json({ message: 'Hi!' });
  });

app.use(cookieParser());
app.use(express.json());
app.use('/api', [UsersRouter, itemRouter, characterRouter]);
app.use(ErrorHandlerMiddleware);
app.listen(PORT, () => {
    console.log(PORT, '포트로 서버가 열렸어요!');
});
