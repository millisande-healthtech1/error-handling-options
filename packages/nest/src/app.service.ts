import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { AppRepository, NoDataError, NoDataExtendableError } from './app.repository';
import { logger } from '@millie/common';
import { VError } from "verror";
import { getErrorMessage } from './utils';

class WrappedNoDateExtendableError extends NoDataExtendableError {}

const wrapErrors = (thrown: Error | Error[], e: Error) => {
  if (Array.isArray(thrown)) {
    return thrown.splice(0, 0, e);
  }
  return [e]
}

@Injectable()
export class AppService {
  constructor(private readonly repository: AppRepository) {}
  
  getHello(): string {
    return 'Hello World!';
  }

  // Original example of the problem
  // Harry doesn't want to have to catch and then declare as a http exception
  async show(id: string) {
    try {    
      return await this.repository.getById(id);
    } catch (error) {
      if (error instanceof NoDataError) {
        throw new HttpException("Message is that thing not found", HttpStatus.INTERNAL_SERVER_ERROR, {cause: error});
    }
    logger.info("Fallen through")
    throw error;
  }
}

// second case, wrapping stuff in context easily
// there's a way to send stuff to dev sentry
// just need the sentry dsm in 1password SENTRY_DSN is the thing, pop it in env vars
async wrappedShow(id: string) {
  try {    
    return await this.repository.getById(id);
  } catch (error) {
      const httpError = new HttpException("Message is that thing not found", HttpStatus.INTERNAL_SERVER_ERROR, {cause: error});
      throw wrapErrors(error, httpError);
  }
}

async verrorShow(id: string) {
  try {
  try {    
    return await this.repository.getByIdVerror(id);
  } catch (error) {
      const wrappedError = new VError(error, "Failed to run verrorShow")
      logger.error("Layer 1 Bad error occurred: {error}", wrappedError)
      throw wrappedError;
  }
} catch (error2) {
  const wrappedError2 = new VError(error2, "This is wrapped again")
  logger.error("Layer 2 Bad error occurred: {error}", wrappedError2)
  throw wrappedError2;
}
}

async tsErrorShow(id: string) {
    try {    
      return await this.repository.getByIdTsError(id);
    } catch (error) {
      if (error instanceof NoDataExtendableError) {
        const wrappedError = new WrappedNoDateExtendableError(error.message);
        logger.error("Layer 1 Bad error occurred: {error}", error)
        throw wrappedError
      }
      logger.log("Fallen through");
      throw error
    }
}

async causeOnError(id: string) {
  try {    
    return await this.repository.getById(id);
  } catch (error) {
      const newError = new Error("Message is that thing not found", {cause: error});
      logger.error('this is the error', newError)
      logger.error(
        "Error whilst using attempt number {i} for regId {regId} {error}",
        6,
        'regId',
        getErrorMessage(newError),
      );
      throw new Error("call failed");
  }
}

async errorNoCause(id: string) {
  try {    
    return await this.repository.getById(id);
  } catch (error) {
      const newError = new Error("Message is that thing not found");
      logger.error('this is the error', newError)
      logger.error(
        "Error whilst using attempt number {i} for regId {regId} {error}",
        6,
        'regId',
        getErrorMessage(newError),
      );
      throw new Error("call failed");
  }
}

}
