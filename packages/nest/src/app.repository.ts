import { Injectable, Logger } from "@nestjs/common";
import { TemplatedError } from "@millie/common";

export class NoDataError extends TemplatedError {
  id: string;
  constructor(id: string) {
    super("No data found for id {id}", id);
  }
}

@Injectable()
export class AppRepository {
  private readonly logger = new Logger(AppRepository.name);

  async getById(id: string) {
    const error = new NoDataError(id);
    this.logger.error("Bad error occurred: {error}", error)
      throw error
  }
}