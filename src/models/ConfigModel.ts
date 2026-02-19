import { AppDataSource } from '../data-source';
import { BankConfig } from '../entities/Config';

const repo = () => AppDataSource.getRepository(BankConfig);

export async function getConfig(key: string): Promise<string | null> {
  const config = await repo().findOne({ where: { key } });
  return config?.value || null;
}

export async function setConfig(key: string, value: string, description?: string): Promise<void> {
  let config = await repo().findOne({ where: { key } });
  if (config) {
    config.value = value;
    if (description) config.description = description;
  } else {
    config = repo().create({ key, value, description: description || null });
  }
  await repo().save(config);
}

export async function getAllConfig(): Promise<Record<string, string>> {
  const configs = await repo().find();
  return configs.reduce((acc, c) => {
    acc[c.key] = c.value;
    return acc;
  }, {} as Record<string, string>);
}
