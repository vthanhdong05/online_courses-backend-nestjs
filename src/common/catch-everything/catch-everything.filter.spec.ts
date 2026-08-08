import { HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiUtilService } from '../utils/api-util/api-util.service';
import { CatchEverythingFilter } from './catch-everything.filter';

describe('CatchEverythingFilter', () => {
  let filter: CatchEverythingFilter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatchEverythingFilter,
        ApiUtilService,
        { provide: HttpAdapterHost, useValue: { httpAdapter: {} } },
      ],
    }).compile();

    filter = module.get<CatchEverythingFilter>(CatchEverythingFilter);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });
});
