import { SubmissionDTO } from '../infrastructure/types';
import Submission from './submission';

export default class SubmissionMapper {
    public static dtoToSubmission(dto: SubmissionDTO): Submission {
        return new Submission(dto);
    }
}
