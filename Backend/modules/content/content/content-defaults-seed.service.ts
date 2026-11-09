import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ContentDefaultsSeedService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaults();
  }


  //2 DANH SÁCH DỮ LIỆU MẶC ĐỊNH ĐƯỢC VIẾT TRONG CODE 
  private async seedDefaults() {

    //BƯỚC 1: KHAI BÁO DANH SÁCH TRONG CODE
    const defaultTags = ['Magic', 'War', 'Adventure', 'School Life', 'Slice of Life', 'Comedy', 'Drama', 'Romance', 'Fantasy', 'Sci-Fi'];
    const defaultGenres = ['Action', 'Fantasy', 'Romance', 'Isekai', 'Horror', 'Mystery', 'Thriller', 'Historical'];

    //BƯỚC 2: ĐƯA DANH SÁCH VÀO DATABASE

    // Khởi tạo các Tag mặc định: nếu đã tồn tại thì giữ nguyên, nếu chưa có thì tạo mới.
    for (const name of defaultTags) {
      await this.prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name }
      });
    }
    // Khởi tạo các Genre mặc định: nếu đã tồn tại thì giữ nguyên, nếu chưa có thì tạo mới.
    for (const name of defaultGenres) {
      await this.prisma.genre.upsert({
        where: { name },
        update: {},
        create: { name }
      });
    }
    console.log('Default Genres and Tags seeded successfully');
  }
}
