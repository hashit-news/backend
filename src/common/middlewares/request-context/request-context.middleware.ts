import { AsyncLocalStorage } from 'async_hooks';
import { Request, Response, NextFunction } from 'express';

// disable import for this because for some reason cuid() doens't work with this
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cuid = require('cuid');

interface RequestContext {
  requestId?: string;
  correlationId?: string;
}

const globalStore = new AsyncLocalStorage<RequestContext>();

// Allows easy access to a request's context
export const ctx = (): RequestContext => {
  const context = globalStore.getStore();
  if (!context) {
    throw new Error('No context attached to the current req');
  }
  return context;
};

// Allows wrapping a request in a context
export const runWithCtx = (fx: (ctx: RequestContext) => Promise<unknown>, context: RequestContext = {}) => {
  globalStore.run(context, () => {
    return fx(ctx());
  });
};

export const withContext = (_req: Request, _res: Response, next: NextFunction) => {
  runWithCtx(async () => next(), {});
};

export const withRequestId = (req: Request, res: Response, next: NextFunction) => {
  const context = ctx();
  context.correlationId = req.headers['x-correlation-id'] as string;
  context.requestId = (req.headers['x-request-id'] as string) || (cuid() as string);
  req.id = context.requestId;
  (req as any).correlationId = context.correlationId;
  res.setHeader('x-request-id', context.requestId);
  return next();
};
