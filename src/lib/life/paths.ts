import "server-only";

import path from "node:path";

import { rendererConfig } from "@/rendererConfig";

export function getContentRoot() {
  return path.join(
    /*turbopackIgnore: true*/ process.cwd(),
    "content",
  );
}

export function getProjectRoot() {
  return /*turbopackIgnore: true*/ process.cwd();
}

export function resolveArchivePath(
  archivePath: string = rendererConfig.archivePath,
) {
  const contentRoot = getContentRoot();
  const normalized = archivePath.replaceAll("\\", "/").replace(/^\.\//, "");

  if (path.isAbsolute(archivePath)) {
    const relativeToContent = path.relative(contentRoot, archivePath);

    return resolveWithin(contentRoot, relativeToContent);
  }

  const contentRelativePath = normalized.startsWith("content/")
    ? normalized.slice("content/".length)
    : normalized;

  return resolveWithin(contentRoot, contentRelativePath);
}

export function resolveSystemPath(
  systemPath: string = rendererConfig.systemPath,
) {
  const projectRoot = getProjectRoot();
  const normalized = systemPath.replaceAll("\\", "/").replace(/^\.\//, "");

  if (path.isAbsolute(systemPath)) {
    return systemPath;
  }

  return resolveWithin(projectRoot, normalized);
}

export function resolveWithin(root: string, relativePath: string) {
  if (path.isAbsolute(relativePath)) {
    throw new Error("Absolute paths are not allowed.");
  }

  const resolvedRoot = path.resolve(root);
  const resolvedPath = path.resolve(resolvedRoot, relativePath);
  const relativeToRoot = path.relative(resolvedRoot, resolvedPath);

  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    throw new Error("Resolved path escapes the expected root.");
  }

  return resolvedPath;
}
