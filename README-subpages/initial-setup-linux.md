# Linux - Initial Setup

<aside>
💡 This was created for Ubuntu 20.04.2; your mileage may vary.

</aside>

1. Install VSCode. (Or, use your editor/IDE of choice.)
    1. Microsoft recommends `sudo snap install --classic code`
2. Get the Miter codebase and put it somewhere convenient:
    1. **Employees**: Ensure you have access to our GitHub, then grab the `app` repo. We like [GitHub Desktop](https://desktop.github.com/) for easy GUI access to basic git & GitHub operations.
    2. **Interviewees**: You should have a Google Drive share or link from us, containing the whole codebase in a zip file. (Depending on how you unzip, you may want the folder *inside* the unzipped folder. It's the one with multiple subfolders.)
3. Open a Terminal and `cd` into the root directory of our codebase.
4. `chmod u+x ./scripts/setup-linux-win`
5. Run `./scripts/setup-linux-win`. This will install the various tools needed to run our codebase: the latest versions of PostgreSQL, Node.js, and npm. 
    1. **There will be some interactive prompts.**
    2. If you'd prefer to do this manually to fit into a preexisting configuration, feel free.
6. Close and reopen your Terminal to ensure the changes take effect. Then `cd` back to the root of our codebase.
7. Edit `/etc/postgresql/13/main/pg_hba.conf` (as superuser) as follows:
    1. ⚠️ Back up your `pg_hba.conf` so you can restore the original values later.
    2. Comment out the first uncommented line (probably line 89), just under the comment, `Database administrative login by Unix domain socket`.
    3. For each remaining uncommented line, change the last entry (`peer` or `md5`) to `trust`. Should be 6 lines total.
    4. Save the file.
8. Restart your Postgres server: `sudo service postgresql restart`
9. Now, open the Miter codebase in VSCode or your editor of choice.
10. That's the setup! To run it, continue with the main instructions on the previous (parent) page of this one.