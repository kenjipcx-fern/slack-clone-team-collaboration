import { Router, Request, Response } from 'express';

const router: Router = Router();

router.get('/test', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Test auth route works!',
    timestamp: new Date().toISOString(),
  });
});

export default router;
