import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InstructorsController } from './instructors.controller';
import { InstructorsService } from './instructors.service';
import { Instructor, InstructorSchema } from './schemas/instructor.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Instructor.name, schema: InstructorSchema }])],
  controllers: [InstructorsController],
  providers: [InstructorsService],
  exports: [InstructorsService, MongooseModule],
})
export class InstructorsModule {}
