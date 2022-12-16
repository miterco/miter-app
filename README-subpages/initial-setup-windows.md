# Windows - Initial Setup with WSL

1. Run `cmd` as admin.
2. `wsl --install` to install Windows Subsystem for Linux (WSL).
    - There are a few steps here, and you'll need to create an account password specific to the subsystem (which you'll then need later).
    - If the `wsl` command is unavailable, ensure Windows is fully up to date.
    - **Don't forget to reboot after.**
3. [Download](https://code.visualstudio.com/Download) and install VSCode. (Or, use your editor/IDE of choice inside WSL.)
4. Install the [Remote Extension Pack](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack) for VSCode.
5. Get the Miter codebase and put it somewhere in your WSL home directory. That's `/home/your-username` in the WSL shell, and `\\wsl$\Ubuntu\home\your-username` from the Windows shell.
    1. **Employees**: Ensure you have access to our GitHub, then grab the `app` repo. We like [GitHub Desktop](https://desktop.github.com/) for easy GUI access to basic git & GitHub operations.
    2. **Interviewees**: You should have a Google Drive share or link from us, containing the whole codebase in a zip file.
6. Open a `wsl` terminal (Start menu, type "wsl").
7. `cd` into the root directory of our codebase.
8. `sudo chown -R <your WSL username> .`
9. `chmod u+x ./scripts/setup-linux-win`
10. Run `./scripts/setup-linux-win`. 
    1. This will install the various tools needed to run our codebase: the latest versions of PostgreSQL, Node.js, and npm. If you'd prefer to do this manually to fit into a preexisting configuration, feel free.
    2. **There will be some interactive prompts throughout the script.**
11. Edit `/etc/postgresql/13/main/pg_hba.conf` (as superuser) as follows:
    1. ⚠️ Back up your `pg_hba.conf` so you can restore the original values later.
    2. Comment out the first uncommented line (probably line 89), just under the comment, `Database administrative login by Unix domain socket`.
    3. For each remaining uncommented line, change the last entry (`peer` or `md5`) to `trust`. Should be 6 lines total.
    4. Save the file.
12. Restart your Postgres server: `sudo service postgresql restart`
13. From the root directory of our codebase, run `code .` to configure VSCode to work with WSL and open the project there.
14. That's the initial setup! Now continue with the main instructions in the parent page, bearing in mind that **any command-line work should happen in either the `wsl` terminal or a VSCode terminal**.