import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
	@Controller()
	export class AppController {
     		@Get('/')
   		getHello() {
       			return '안녕하세요!';
      		}
	}
}
