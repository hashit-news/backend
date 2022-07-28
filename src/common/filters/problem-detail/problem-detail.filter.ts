import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorDetail } from './problem-detail.models';
import * as _ from 'underscore';
import { PROBLEM_CONTENT_TYPE, PROBLEM_TYPE_BASE_URL } from './constants';
import { isProduction } from '../../config/express.config';

interface ExceptionResponse {
  error?: string | ErrorDetail;
  message: string;
  type?: string;
  instance?: string;
  statusCode: number;
}

@Catch()
export class ProblemDetailFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException ? (exception.getResponse() as string | ExceptionResponse) : 'Unknown error';

    let title = exception instanceof Error ? exception.message : 'Unknown error';
    const type = `${PROBLEM_TYPE_BASE_URL}/${status}`;
    const detail = isProduction() ? undefined : exception instanceof Error ? exception.stack : undefined;
    const instance = request.path;
    let objectExtras = {};

    if (typeof errorResponse === 'string') {
      title = errorResponse;
    } else {
      if (typeof errorResponse.message === 'string') {
        title = errorResponse.message;
      } else {
        if (_.isArray(errorResponse.message)) {
          objectExtras = {
            errors: [...(errorResponse.message as any)],
          };
        } else if (_.isObject(errorResponse.message)) {
          objectExtras = {
            ...(errorResponse.message as any),
          };
        } else {
          objectExtras = {
            ...errorResponse,
          };
        }
      }

      if (typeof errorResponse.error === 'string') {
        title = errorResponse.error;
      } else {
        if (errorResponse.error) {
          objectExtras = {
            ...objectExtras,
            ...errorResponse.error,
          };
        }
      }
    }

    response
      .type(PROBLEM_CONTENT_TYPE)
      .status(status)
      .json({
        status,
        title,
        type,
        instance,
        detail,
        ...objectExtras,
      });
  }
}
