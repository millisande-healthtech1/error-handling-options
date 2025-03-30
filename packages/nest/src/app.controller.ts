import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('show')
  show(): Promise<void> {
    return this.appService.show('ID')
  } 

  @Get('wrapShow')
  wrapShow(): Promise<void> {
    return this.appService.wrappedShow('ID')
  } 
}
