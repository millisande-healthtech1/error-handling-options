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

  @Get('vErrorShow')
  vErrorShow(): Promise<void> {
    return this.appService.verrorShow('ID')
  } 

  @Get('tsErrorShow')
  tsErrorShow(): Promise<void> {
    return this.appService.tsErrorShow('ID')
  } 
}
