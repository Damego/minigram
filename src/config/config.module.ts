import { Module, Global } from '@nestjs/common';
import { CustomConfigService } from './custom-config.service';

@Global()
@Module({
  providers: [CustomConfigService],
  exports: [CustomConfigService],
})
export class ConfigModule {}