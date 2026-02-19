import express, { Express, Request, Response, NextFunction } from 'express';

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
