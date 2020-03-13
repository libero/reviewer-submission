import SemanticExtraction from '../services/models/semantic-extraction';

export interface SemanticExtractionRepository {
    create(dtoSemanticExtraction: SemanticExtraction): Promise<SemanticExtraction>;
}
