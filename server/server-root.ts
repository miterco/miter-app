/*
 * Super-simple module for referencing the root directory of the server
 * so stuff doesn't break when we move it around. Needs to live in the
 * directory it returns (i.e., top level of the server).
 */
const serverRootDirectory = __dirname;
export default serverRootDirectory;
