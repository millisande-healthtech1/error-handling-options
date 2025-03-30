import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { AppRepository, NoDataError } from './app.repository';

const wrapErrors = (thrown: Error | Error[], e: Error) => {
  if (Array.isArray(thrown)) {
    return thrown.splice(0, 0, e);
  }
  return [e]
}

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor(private readonly repository: AppRepository) {}
  
  getHello(): string {
    return 'Hello World!';
  }

  // Original example of the problem
  async show(id: string) {
    try {    
      return await this.repository.getById(id);
    } catch (error) {
      if (error instanceof NoDataError) {
        throw new HttpException("Message is that thing not found", HttpStatus.INTERNAL_SERVER_ERROR, {cause: error});
    }
  }
}

async wrappedShow(id: string) {
  try {    
    return await this.repository.getById(id);
  } catch (error) {
      const httpError = new HttpException("Message is that thing not found", HttpStatus.INTERNAL_SERVER_ERROR, {cause: error});
      throw wrapErrors(error, httpError);
  }
}
}
