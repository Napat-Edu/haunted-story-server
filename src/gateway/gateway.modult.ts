import { Module } from "@nestjs/common";
import { Gateway } from "./gateway";
import { HttpModule } from "@nestjs/axios";

@Module({
    imports: [Gateway],
})
export class GatewayModule { }