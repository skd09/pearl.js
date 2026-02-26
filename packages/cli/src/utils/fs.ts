import fs from 'fs';
import path from 'path';

export function ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

export function writeFile(filePath: string, content: string): void {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, content, 'utf8');
}

export function fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
}

export function resolveAppPath(...segments: string[]): string {
    return path.resolve(process.cwd(), ...segments);
}