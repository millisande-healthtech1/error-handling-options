
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ErrorMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
   // Store the original send method
    const originalSend = res.send;
    
    // Override the send method
    res.send = function(data) {
      console.log('Response before sending...', data);
      // Call the original send method
      return originalSend.call(this, data);
    };
    next();
  }
}
