# Mac - Initial Setup

1. [Download](https://code.visualstudio.com/Download) and install VSCode. (Or, use your editor/IDE of choice.)
2. Get the Miter codebase.
    1. **Employees**: Ensure you have access to our GitHub, then grab the `app` repo. We like [GitHub Desktop](https://desktop.github.com/) for easy GUI access to basic git & GitHub operations.
    2. **Interviewees**: You should have a Google Drive share or link from us, containing the whole codebase in a zip file. Unzip it someplace handy.
3. Open Terminal and `cd` into the root directory of the codebase.
4. If you haven't already, install the [Homebrew](https://brew.sh/) package manager (should take 5-6m).
5. `chmod u+x ./scripts/setup-mac`
6. Run `./scripts/setup-mac`. 
    1. This will install the various tools needed to run our codebase: the correct versions of PostgreSQL, Node.js, and npm. If you'd prefer to do this manually to fit into a preexisting configuration, feel free. 
        1. **We have not tested for the ways in which this might conflict with a preexisting environment so...yeah. In particular, you may need a Node version manager under those circumstances—though note that while we install Node 14, Node 16 seems to work as well.**
    2. You may be prompted for your password once or twice.
7. Open the codebase in VSCode or your favorite editor, then continue with the main instructions in the parent page. For subsequent command-line instructions, you can use Terminal or VSCode's built-in terminals.