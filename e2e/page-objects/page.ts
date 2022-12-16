const {HOST} = process.env;

/**
 * Main page object containing all methods, selectors and functionality
 * that is shared across all page objects
 */
export default class Page {
  /**
   * Opens a sub page of the page
   *
   * @param path path of the sub page (e.g. /path/to/page.html)
   */
  public open(path: string): Promise<string> {
    return browser.url(`${HOST}/${path}`);
  }

  /**
   * Gets the content of the clipboard.
   *
   * @returns a promise that resolves to the clipboard content.
   */
  public async getClipboard(): Promise<string> {
    return await browser.executeAsync(cb => navigator.clipboard.readText().then(cb, cb));
  }
}
