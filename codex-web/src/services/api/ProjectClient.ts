import type { FileNode } from "../../types/codex";
import { CodexClient } from "./CodexClient";
export class ProjectClient extends CodexClient {
  getTree(projectId: string, path = "") { return this.request<FileNode[]>(`/projects/${encodeURIComponent(projectId)}/tree?path=${encodeURIComponent(path)}`); }
  getFile(fileId: string) { return this.request<FileNode>(`/files/${encodeURIComponent(fileId)}`); }
}
