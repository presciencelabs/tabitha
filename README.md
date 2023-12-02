# TaBiThA

## Development resources

https://github.com/mdn/curriculum

## Branching strategy (for developers)

All work occurs in branches as normal and will always merge into `main`.

Deployments will only occur for pushes to an individual sub-project's branch, e.g., `main-ontology` or `main-sources`.  The process would mean simply merging `main` into the appropriate branch(es) when ready for release.

> This approach is the result of Cloudflare's branch-only trigger for it's built-in, automated deployments.  If this proves not be a good solution, a custom deployment, presumably a Github Action, will need to constructed.
