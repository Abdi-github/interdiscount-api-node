import { Response } from 'express';

interface IPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

class ApiResponse {
  static success<T>(res: Response, data: T, message = 'Success', statusCode = 200): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created<T>(res: Response, data: T, message = 'Created successfully'): Response {
    return ApiResponse.success(res, data, message, 201);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number,
    message = 'Success',
  ): Response {
    const totalPages = Math.ceil(total / limit);
    const pagination: IPagination = {
      page,
      limit,
      total,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1,
    };

    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
    });
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static error(
    res: Response,
    statusCode: number,
    _code: string,
    message: string,
    field?: string,
    details?: Record<string, unknown>,
  ): Response {
    return res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode,
        message,
        ...(field && { field }),
        ...(details && { details }),
      },
    });
  }
}

export default ApiResponse;
