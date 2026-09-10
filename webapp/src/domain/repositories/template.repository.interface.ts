export interface ITemplateRepository {
  getByKey(key: string): Promise<string | null>;
}
