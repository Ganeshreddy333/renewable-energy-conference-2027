import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { basename, dirname } from 'path';
import type { Response } from 'express';
import { CloudinaryService } from './cloudinary.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post(':bucket/upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('bucket') bucket: string,
    @Body('path') path: string,
    @UploadedFile() file: any,
  ) {
    if (!file) return { error: 'No file uploaded' };
    if (!bucket) return { error: 'No bucket specified' };

    try {
      const relativePath = String(path || file.originalname).replace(/^\/+/, '');
      const relativeDirectory = dirname(relativePath);
      const folderPath = relativeDirectory === '.' ? bucket : `${bucket}/${relativeDirectory}`;
      const fileName = basename(relativePath);

      const result = await this.cloudinaryService.uploadFile(
        file.buffer,
        fileName,
        folderPath,
      );

      return {
        url: result.url,
        publicId: result.publicId,
        path: `${bucket}/${path || fileName}`,
      };
    } catch (error: any) {
      return { error: error?.message ?? String(error) };
    }
  }

  @Get('local/:bucket/*path')
  async downloadLocal(@Param('bucket') bucket: string, @Param() params: any, @Res() response: Response) {
    const publicId = Array.isArray(params.path) ? params.path.join('/') : params.path;
    try {
      const file = await this.cloudinaryService.getLocalFile(`${bucket}/${publicId}`);
      response.setHeader('Content-Disposition', `inline; filename="${basename(publicId)}"`);
      response.send(file);
    } catch {
      throw new NotFoundException('Stored file was not found. Configure Cloudinary to access files uploaded there.');
    }
  }

  @Get(':bucket/*path')
  async download(@Param('bucket') bucket: string, @Param() params: any) {
    const publicId = Array.isArray(params.path) ? params.path.join('/') : params.path;
    const url = await this.cloudinaryService.getUrl(`${bucket}/${publicId}`);
    return { url };
  }

  @Delete(':bucket/:publicId')
  async delete(@Param('bucket') bucket: string, @Param('publicId') publicId: string) {
    try {
      await this.cloudinaryService.deleteFile(`${bucket}/${publicId}`);
      return { message: 'File deleted successfully' };
    } catch (error: any) {
      return { error: error?.message ?? String(error) };
    }
  }
}
