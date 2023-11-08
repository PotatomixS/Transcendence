import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
	getHello(): Object {
		return {title: "Hello from the API"};
	}
}


@Injectable()
export class ReceiveCode {
	constructor(private code: string) {}

	processData(): void {
	}
} 