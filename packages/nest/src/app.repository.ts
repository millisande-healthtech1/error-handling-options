import { Injectable, Logger } from "@nestjs/common";
import { TemplatedError } from "@millie/common";
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
  private readonly logger = new Logger(AppRepository.name);

  async getById(id: string) {
    const error = new NoDataError(id);
    this.logger.error("Layer 0 error: {error}", error)
      throw error
  }

  async  getByIdVerror(id: string) {
    const error = new VError('Had a problem with "%s" and "%s"', id, 'thing2')
    this.logger.error("Layer 0 error: {error}",error)
    throw error
  }

  async getByIdTsError(id: string) {
    const error = new NoDataExtendableError(`Had a problem with ${id}`);
    this.logger.error("Layer 0 error: {error}",error)
    throw error
  }
}