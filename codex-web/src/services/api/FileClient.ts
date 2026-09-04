import { CodexClient } from "./CodexClient";
export type UploadedFile = { id: string; name: string; size: number; status: "uploading" | "uploaded" | "processing" | "ready" | "failed" };
export class FileClient extends CodexClient {
  async upload(file: File): Promise<UploadedFile> { const body = new FormData(); body.append("file", file); const response = await fetch(`${this.baseUrl}/files`, { method: "POST", body, headers: { Accept: "application/json" } }); if (!response.ok) throw new Error(`Upload failed (${response.status})`); return response.json() as Promise<UploadedFile>; }
}
