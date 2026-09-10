export interface IConfigRepository {
  getValue<T>(key: string): Promise<T | null>;
  setValue<T>(key: string, value: T): Promise<void>;
}

export interface IUserRepository {
  findByPhoneNumber(phoneNumber: string): Promise<{
    id: string;
    phoneNumber: string;
    passwordHash: string;
    isActive: boolean;
  } | null>;
}

export interface ITransformerStationRepository {
  findAllActive(): Promise<Array<{ id: string; name: string; code: number }>>;
}
