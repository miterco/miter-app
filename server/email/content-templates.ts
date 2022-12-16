import {promises as fs} from 'fs';
import path from 'path';
import serverRootDirectory from '../server-root';
import Mustache from 'mustache';

const _cachedTemplates: Record<string, string> = {};

const loadTemplate = async (templateName: string) =>
  await fs.readFile(path.join(serverRootDirectory, `templates/${templateName}.mustache`), 'utf8');

const getPartials = async (partialNames?: string[]) => {
  if (!partialNames) return undefined;
  const partials: Record<string, string> = {};
  for (let i = 0; i < partialNames.length; i++) {
    if (!_cachedTemplates[partialNames[i]]) _cachedTemplates[partialNames[i]] = await loadTemplate(partialNames[i]);
    partials[partialNames[i]] = _cachedTemplates[partialNames[i]];
  }
  return partials;
};

export const renderContentTemplate = async <T>(
  templateName: string,
  data: T,
  partialNames?: string[]
): Promise<string> => {
  if (!_cachedTemplates[templateName]) _cachedTemplates[templateName] = await loadTemplate(templateName);
  const partials = await getPartials(partialNames);
  return Mustache.render(_cachedTemplates[templateName], data, partials);
};
