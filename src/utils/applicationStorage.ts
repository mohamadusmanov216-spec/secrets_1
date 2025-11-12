import * as fs from 'fs';
import * as path from 'path';

const STORAGE_PATH = path.join(process.cwd(), 'data', 'applications.json');

interface UserApplication {
  chatId: string;
  step: number;
  answers: Record<string, string>;
  createdAt: string;
  messageIds?: number[];
}

interface ApplicationStorage {
  [chatId: string]: UserApplication;
}

function ensureStorageFile(): void {
  const dir = path.dirname(STORAGE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(STORAGE_PATH)) {
    fs.writeFileSync(STORAGE_PATH, '{}', 'utf8');
  }
}

function readStorage(): ApplicationStorage {
  ensureStorageFile();
  const data = fs.readFileSync(STORAGE_PATH, 'utf8');
  return JSON.parse(data) || {};
}

function writeStorage(data: ApplicationStorage): void {
  ensureStorageFile();
  fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export function getApplication(chatId: string): UserApplication | null {
  const storage = readStorage();
  return storage[chatId] || null;
}

export function setApplication(chatId: string, app: Omit<UserApplication, 'chatId'>): void {
  const storage = readStorage();
  storage[chatId] = { chatId, ...app };
  writeStorage(storage);
}

export function deleteApplication(chatId: string): void {
  const storage = readStorage();
  delete storage[chatId];
  writeStorage(storage);
}

export function hasApplication(chatId: string): boolean {
  const storage = readStorage();
  return chatId in storage;
}

export function getAllApplications(): ApplicationStorage {
  return readStorage();
}

export function clearAllApplications(): void {
  writeStorage({});
}
