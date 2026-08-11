import { Schema } from 'mongoose';

/**
 * Plugin dùng chung, được đăng ký toàn cục ở DatabaseModule (connectionFactory)
 * nên áp dụng cho MỌI schema đăng ký trên connection này, không cần khai báo lại.
 *
 * Tương đương phần $allModels trong prisma.service.ts của dự án ecommerce
 * (findFirst/findMany/count tự thêm điều kiện deletedAt: null),
 * nhưng dùng đúng cơ chế idiomatic của Mongoose: query middleware + static methods.
 */
export function auditSoftDeletePlugin(schema: Schema) {
  if (!schema.path('deletedAt')) {
    schema.add({ deletedAt: { type: Date, default: null } });
  }

  // Tự động lọc bản ghi đã xoá mềm cho mọi find/findOne/count/findOneAndUpdate,
  // trừ khi query đã tự chỉ định deletedAt (VD: muốn lấy cả bản ghi đã xoá).
  const excludeDeleted = function (this: any, next: () => void) {
    if (this.getFilter().deletedAt === undefined) {
      this.where({ deletedAt: null });
    }
    next();
  };
  schema.pre(/^find/, excludeDeleted);

  // Static method dùng chung cho mọi model, gọi thẳng từ Service, VD: this.userModel.softDeleteById(id)
  schema.statics.softDeleteById = function (id: string) {
    return this.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true },
    );
  };

  schema.statics.restoreById = function (id: string) {
    return this.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      { deletedAt: null },
      { new: true },
    );
  };
}
