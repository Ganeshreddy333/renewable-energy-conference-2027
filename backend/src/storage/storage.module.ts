import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { CloudinaryService } from './cloudinary.service';

@Module({
  providers: [CloudinaryService],
  controllers: [StorageController],
  exports: [CloudinaryService],
})
export class StorageModule {}
