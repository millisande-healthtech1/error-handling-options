import { Injectable } from "@nestjs/common";
import { TemplatedError, logger } from "@millie/common";
import { VError } from "verror"
import { ExtendableError } from "ts-error";

export class NoDataError extends TemplatedError {
  id: string;
  constructor(id: string) {
    super("No data found for id {id}", id);
  }
}

export class NoDataExtendableError extends ExtendableError {}

@Injectable()
export class AppRepository {

  async getById(id: string) {
    const error = new NoDataError(id);
    logger.error("Layer 0 error: {error}", error)
      throw error
  }

  async  getByIdVerror(id: string) {
    const error = new VError('Had a problem with "%s" and "%s"', id, 'thing2')
    logger.error("Layer 0 error: {error}",error)
    throw error
  }

  async getByIdTsError(id: string) {
    const error = new NoDataExtendableError(`Had a problem with ${id}`);
    logger.error("Layer 0 error: {error}",error)
    throw error
  }
}