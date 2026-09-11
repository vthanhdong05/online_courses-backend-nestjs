export interface ICoursePublishValidator {
  validate(courseId: string): Promise<void>;
}

export const COURSE_PUBLISH_VALIDATOR = 'COURSE_PUBLISH_VALIDATOR';
